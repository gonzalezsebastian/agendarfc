import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from 'src/database/supabase.service';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { PlayerStatsResponseDto } from './dtos/player-stats-response.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly db: SupabaseService) {}

  async list({ role }: { role?: string }) {
    let q = this.db.getClient().from('profiles').select('*').order('created_at', { ascending: false });
    if (role) q = q.eq('role', role);
    const { data, error } = await q;
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async listPlayers() {
    const { data, error } = await this.db.getClient()
      .from('profiles')
      .select('*')
      .eq('role', 'player')
      .order('username', { ascending: true });
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.db.getClient()
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new NotFoundException('Profile not found');
    return data;
  }

  async update({ 
    requesterId, 
    profileId, 
    data 
  }: { 
    requesterId: string; 
    profileId: string; 
    data: UpdateProfileDto 
  }) {
    // Verificar permisos
    const { data: requester } = await this.db.getClient()
      .from('profiles')
      .select('role')
      .eq('id', requesterId)
      .single();

    const isOwner = requesterId === profileId;
    const isAdmin = requester?.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Not allowed to update this profile');
    }

    // Solo admin puede cambiar el role
    if (data.role && !isAdmin) {
      throw new ForbiddenException('Only admins can change roles');
    }

    const { data: updated, error } = await this.db.getClient()
      .from('profiles')
      .update(data)
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return updated;
  }

  async getPlayerStats({ 
    playerId, 
    from, 
    to 
  }: { 
    playerId?: string; 
    from?: string; 
    to?: string 
  }): Promise<PlayerStatsResponseDto[]> {
    // Construir query base
    let q = this.db.getClient()
      .from('availabilities')
      .select('player_id, status');

    if (playerId) q = q.eq('player_id', playerId);
    if (from) q = q.gte('start_time', from);
    if (to) q = q.lte('end_time', to);

    const { data: availabilities, error } = await q;
    if (error) throw new BadRequestException(error.message);

    // Agrupar y contar por player_id y status
    const statsMap = new Map<string, PlayerStatsResponseDto>();

    for (const avail of availabilities || []) {
      const pid = avail.player_id;
      if (!pid) continue;

      if (!statsMap.has(pid)) {
        statsMap.set(pid, {
          playerId: pid,
          total: 0,
          disponibles: 0,
          reservadas: 0,
          canceladas: 0,
          enRevision: 0
        });
      }

      const stats = statsMap.get(pid)!;
      stats.total++;

      switch (avail.status) {
        case 'disponible':
          stats.disponibles++;
          break;
        case 'reservado':
          stats.reservadas++;
          break;
        case 'cancelado':
          stats.canceladas++;
          break;
        default:
          stats.enRevision = (stats.enRevision || 0) + 1;
      }
    }

    // Si se solicitó un playerId específico pero no hay datos, retornar stats vacías
    if (playerId && !statsMap.has(playerId)) {
      return [{
        playerId,
        total: 0,
        disponibles: 0,
        reservadas: 0,
        canceladas: 0,
        enRevision: 0
      }];
    }

    return Array.from(statsMap.values());
  }
}