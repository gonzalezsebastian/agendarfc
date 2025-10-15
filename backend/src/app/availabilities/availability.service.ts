import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AvailabilityStatus } from 'src/common/enum/availability-status.enum';
import { SupabaseService } from 'src/database/supabase.service';
import { ListAvailabilitiesQueryDto } from './dtos/list-availability.dto';
import { AvailabilityResponseDto } from './dtos/availability-response.dto';
import { CreateAvailabilityDto } from './dtos/create-availability.dto';
import { UpdateAvailabilityStatusDto } from './dtos/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(private readonly db: SupabaseService) {}

  async list(query: ListAvailabilitiesQueryDto): Promise<AvailabilityResponseDto[]> {
  const { playerId, from, to, status } = query;
    let q = this.db.getClient()
      .from('availabilities')
      .select('*, player:profiles!availabilities_player_id_fkey(id, username, email, phone)')
      .order('start_time', { ascending: true });
    
    if (playerId) q = q.eq('player_id', playerId);
    if (from) q = q.gte('start_time', from);
    if (to) q = q.lte('end_time', to);
    if (status) q = q.eq('status', status);
    
    const { data, error } = await q;
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async create(playerId: string, dto: CreateAvailabilityDto) {
  const { start, end } = dto;
    const { data: profile, error: profileError } = await this.db.getClient()
      .from('profiles')
      .select('role')
      .eq('id', playerId)
      .single();

    if (profileError || !profile) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (profile.role !== 'player') {
      throw new ForbiddenException('Solo los jugadores pueden crear disponibilidades');
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Formato de fecha inválido');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('La hora de inicio debe ser anterior a la hora de fin');
    }

    const { data: overlapping, error: overlapError } = await this.db.getClient()
      .from('availabilities')
      .select('id, start_time, end_time')
      .eq('player_id', playerId)
      .or(`and(start_time.lt.${end},end_time.gt.${start})`);

    if (overlapError) {
      throw new BadRequestException('Error al validar solapamiento: ' + overlapError.message);
    }

    if (overlapping && overlapping.length > 0) {
      throw new BadRequestException(
        'Esta disponibilidad se solapa con otra existente. ' +
        `Conflicto con horario: ${new Date(overlapping[0].start_time).toLocaleString()} - ${new Date(overlapping[0].end_time).toLocaleString()}`
      );
    }

    const { data, error } = await this.db.getClient()
      .from('availabilities')
      .insert({ 
        player_id: playerId, 
        start_time: start, 
        end_time: end, 
        status: 'disponible' 
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async setStatus(requesterId: string, dto: UpdateAvailabilityStatusDto) {
  const { id, status } = dto;
    // Obtener la disponibilidad
    const { data: slot, error: e1 } = await this.db.getClient()
      .from('availabilities')
      .select('player_id, status')
      .eq('id', id)
      .single();

    if (e1 || !slot) {
      throw new NotFoundException('Disponibilidad no encontrada');
    }

    // Verificar permisos
    const { data: requester } = await this.db.getClient()
      .from('profiles')
      .select('role')
      .eq('id', requesterId)
      .single();

    const isOwner = slot.player_id === requesterId;
    const isAdmin = requester?.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('No tienes permiso para modificar esta disponibilidad');
    }

    // Validar transiciones de estado permitidas
    if (slot.status === AvailabilityStatus.RESERVADO && status === AvailabilityStatus.DISPONIBLE && !isAdmin) {
      throw new ForbiddenException('No puedes cambiar una disponibilidad reservada a disponible. Contacta al administrador.');
    }

    // Actualizar estado
    const { data, error } = await this.db.getClient()
      .from('availabilities')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  /**
   * Obtiene una disponibilidad por ID
   */
  async getById(id: string): Promise<AvailabilityResponseDto> {
    const { data, error } = await this.db.getClient()
      .from('availabilities')
      .select('*, player:profiles!availabilities_player_id_fkey(id, username, email, phone)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Disponibilidad no encontrada');
    }

    return data;
  }

  /**
   * Elimina una disponibilidad (solo si está disponible y no tiene citas)
   */
  async delete(id: string, requesterId: string) {
    // Verificar que la disponibilidad existe y pertenece al usuario
    const { data: slot, error: e1 } = await this.db.getClient()
      .from('availabilities')
      .select('player_id, status')
      .eq('id', id)
      .single();

    if (e1 || !slot) {
      throw new NotFoundException('Disponibilidad no encontrada');
    }

    // Verificar permisos
    const { data: requester } = await this.db.getClient()
      .from('profiles')
      .select('role')
      .eq('id', requesterId)
      .single();

    const isOwner = slot.player_id === requesterId;
    const isAdmin = requester?.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('No tienes permiso para eliminar esta disponibilidad');
    }

    // Verificar que no esté reservada
    if (slot.status === 'reservado') {
      throw new BadRequestException('No se puede eliminar una disponibilidad reservada');
    }

    // Verificar que no tenga citas asociadas
    const { data: appointments } = await this.db.getClient()
      .from('appointments')
      .select('id')
      .eq('availability_id', id)
      .limit(1);

    if (appointments && appointments.length > 0) {
      throw new BadRequestException('No se puede eliminar una disponibilidad con citas asociadas');
    }

    // Eliminar
    const { error } = await this.db.getClient()
      .from('availabilities')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);

    return { message: 'Disponibilidad eliminada exitosamente' };
  }

  /**
   * Obtiene estadísticas de disponibilidades de un jugador
   */
  async getPlayerStats(playerId: string) {
    const { data: stats, error } = await this.db.getClient()
      .rpc('get_player_availability_stats', { p_player_id: playerId });

    if (error) {
      const { data: availabilities } = await this.db.getClient()
        .from('availabilities')
        .select('status')
        .eq('player_id', playerId);

      if (!availabilities) return null;

      const total = availabilities.length;
      const disponibles = availabilities.filter(a => a.status === 'disponible').length;
      const reservadas = availabilities.filter(a => a.status === 'reservado').length;
      const canceladas = availabilities.filter(a => a.status === 'cancelado').length;

      return {
        total,
        disponibles,
        reservadas,
        canceladas
      };
    }

    return stats;
  }
}