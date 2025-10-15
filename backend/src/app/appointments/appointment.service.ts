import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from 'src/database/supabase.service';
import { ListAppointmentsQueryDto } from './dtos/list-appointments.dto';
import { AppointmentDetailResponseDto, AppointmentResponseDto } from './dtos/appointment-response.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly db: SupabaseService) {}

  async list(query: ListAppointmentsQueryDto): Promise<AppointmentDetailResponseDto[]> {
    let q = this.db.getClient()
      .from('appointments')
      .select(`
        *,
        user:profiles!appointments_user_id_fkey(id, username, email, phone),
        availability:availabilities(id, player_id, start_time, end_time, status)
      `)
      .order('created_at', { ascending: false });

    if (query.userId) q = q.eq('user_id', query.userId);
    if (query.status) q = q.eq('status', query.status);
    if (query.playerId) {
      q = q.eq('availability.player_id', query.playerId);
    }

    const { data, error } = await q;
    if (error) throw new BadRequestException(error.message);

    return data.map(this.mapToDetailResponse);
  }

  async getUserAppointments(userId: string): Promise<AppointmentDetailResponseDto[]> {
    const { data, error } = await this.db.getClient()
      .from('appointments')
      .select(`
        *,
        user:profiles!appointments_user_id_fkey(id, username, email, phone),
        availability:availabilities(id, player_id, start_time, end_time, status)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);

    return data.map(this.mapToDetailResponse);
  }

  async getById(id: string): Promise<AppointmentDetailResponseDto> {
    const { data, error } = await this.db.getClient()
      .from('appointments')
      .select(`
        *,
        user:profiles!appointments_user_id_fkey(id, username, email, phone),
        availability:availabilities(id, player_id, start_time, end_time, status)
      `)
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Appointment not found');

    return this.mapToDetailResponse(data);
  }

  async create({ userId, availabilityId }: { userId: string; availabilityId: string }): Promise<AppointmentResponseDto> {
    const { data: availability, error: availError } = await this.db.getClient()
      .from('availabilities')
      .select('id, player_id, status')
      .eq('id', availabilityId)
      .single();

    if (availError || !availability) {
      throw new NotFoundException('Availability not found');
    }

    if (availability.status !== 'disponible') {
      throw new BadRequestException('Availability is not available');
    }

    if (availability.player_id === userId) {
      throw new BadRequestException('Cannot book your own availability');
    }

    const { data: appointment, error: createError } = await this.db.getClient()
      .from('appointments')
      .insert({
        user_id: userId,
        availability_id: availabilityId,
        status: 'confirmada',
      })
      .select()
      .single();

    if (createError) throw new BadRequestException(createError.message);

    const { error: updateError } = await this.db.getClient()
      .from('availabilities')
      .update({ status: 'reservado' })
      .eq('id', availabilityId);

    if (updateError) throw new BadRequestException(updateError.message);

    return this.mapToResponse(appointment);
  }

  async cancel({ appointmentId, requesterId }: { appointmentId: string; requesterId: string }): Promise<AppointmentResponseDto> {
    const { data: appointment, error: fetchError } = await this.db.getClient()
      .from('appointments')
      .select('id, user_id, availability_id, status')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === 'cancelada') {
      throw new BadRequestException('Appointment is already cancelled');
    }

    const { data: requester } = await this.db.getClient()
      .from('profiles')
      .select('role')
      .eq('id', requesterId)
      .single();

    const { data: availability } = await this.db.getClient()
      .from('availabilities')
      .select('player_id')
      .eq('id', appointment.availability_id)
      .single();

    const isOwner = appointment.user_id === requesterId;
    const isPlayer = availability?.player_id === requesterId;
    const isAdmin = requester?.role === 'admin';

    if (!isOwner && !isPlayer && !isAdmin) {
      throw new ForbiddenException('Not allowed to cancel this appointment');
    }

    const { data: updated, error: updateError } = await this.db.getClient()
      .from('appointments')
      .update({ status: 'cancelada' })
      .eq('id', appointmentId)
      .select()
      .single();

    if (updateError) throw new BadRequestException(updateError.message);

    const { error: availUpdateError } = await this.db.getClient()
      .from('availabilities')
      .update({ status: 'disponible' })
      .eq('id', appointment.availability_id);

    if (availUpdateError) throw new BadRequestException(availUpdateError.message);

    return this.mapToResponse(updated);
  }

  private mapToResponse(data: any): AppointmentResponseDto {
    return {
      id: data.id,
      userId: data.user_id,
      availabilityId: data.availability_id,
      status: data.status,
      createdAt: data.created_at,
    };
  }

  private mapToDetailResponse(data: any): AppointmentDetailResponseDto {
    return {
      id: data.id,
      userId: data.user_id,
      availabilityId: data.availability_id,
      status: data.status,
      createdAt: data.created_at,
      user: data.user ? {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        phone: data.user.phone,
      } : undefined,
      availability: data.availability ? {
        id: data.availability.id,
        playerId: data.availability.player_id,
        startTime: data.availability.start_time,
        endTime: data.availability.end_time,
        status: data.availability.status,
      } : undefined,
    };
  }
}