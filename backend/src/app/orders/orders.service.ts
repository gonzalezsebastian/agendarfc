// src/modules/orders/orders.service.ts
import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupabaseService } from 'src/database/supabase.service';
import { OrderStatus } from 'src/common/enum/order-status.enum';
import { Order } from './entities/orders.entity';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderStatusDto } from './dtos/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly db: SupabaseService,
  ) {}

  async create(dto: CreateOrderDto, requesterId: string): Promise<Order> {
    const userId = dto.userId || requesterId;

    // Verificar que el usuario existe
    const { data: user, error: userError } = await this.db
      .getClient()
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Si el requesterId no es el userId, verificar que sea admin
    if (userId !== requesterId) {
      const { data: requester } = await this.db
        .getClient()
        .from('profiles')
        .select('role')
        .eq('id', requesterId)
        .single();

      if (requester?.role !== 'admin') {
        throw new ForbiddenException('No tienes permisos para crear órdenes para otros usuarios');
      }
    }

    const { data, error } = await this.db
      .getClient()
      .from('orders')
      .insert({
        user_id: userId,
        service_type: dto.serviceType,
        amount: dto.amount,
        status: OrderStatus.PENDIENTE,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data as Order;
  }

  async findAll(requesterId: string, userId?: string): Promise<Order[]> {
    const { data: requester } = await this.db
      .getClient()
      .from('profiles')
      .select('role')
      .eq('id', requesterId)
      .single();

    const isAdmin = requester?.role === 'admin';

    let query = this.db
      .getClient()
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    // Si es admin y se especifica userId, filtrar por ese usuario
    if (isAdmin && userId) {
      query = query.eq('user_id', userId);
    } 
    // Si no es admin, solo puede ver sus propias órdenes
    else if (!isAdmin) {
      query = query.eq('user_id', requesterId);
    }
    // Si es admin y no se especifica userId, devuelve todas las órdenes

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data as Order[];
  }

  async findOne(id: string, requesterId: string): Promise<Order> {
    const { data: order, error } = await this.db
      .getClient()
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !order) {
      throw new NotFoundException('Orden no encontrada');
    }

    // Verificar permisos
    const { data: requester } = await this.db
      .getClient()
      .from('profiles')
      .select('role')
      .eq('id', requesterId)
      .single();

    const isAdmin = requester?.role === 'admin';
    const isOwner = order.user_id === requesterId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('No tienes permisos para ver esta orden');
    }

    return order as Order;
  }

  async updateStatus(dto: UpdateOrderStatusDto, requesterId: string): Promise<Order> {
    // Verificar que la orden existe
    const { data: order, error: orderError } = await this.db
      .getClient()
      .from('orders')
      .select('*')
      .eq('id', dto.orderId)
      .single();

    if (orderError || !order) {
      throw new NotFoundException('Orden no encontrada');
    }

    // Solo admins pueden actualizar el estado de las órdenes
    const { data: requester } = await this.db
      .getClient()
      .from('profiles')
      .select('role')
      .eq('id', requesterId)
      .single();

    if (requester?.role !== 'admin') {
      throw new ForbiddenException('Solo los administradores pueden actualizar el estado de las órdenes');
    }

    const { data, error } = await this.db
      .getClient()
      .from('orders')
      .update({ status: dto.status })
      .eq('id', dto.orderId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data as Order;
  }

  async getUserOrderStats(userId: string): Promise<{
    total: number;
    pendiente: number;
    pagado: number;
    rechazado: number;
    totalAmount: number;
  }> {
    const { data: orders, error } = await this.db
      .getClient()
      .from('orders')
      .select('status, amount')
      .eq('user_id', userId);

    if (error) {
      throw new BadRequestException(error.message);
    }

    const stats = {
      total: orders.length,
      pendiente: 0,
      pagado: 0,
      rechazado: 0,
      totalAmount: 0,
    };

    orders.forEach((order) => {
      if (order.status === OrderStatus.PENDIENTE) stats.pendiente++;
      if (order.status === OrderStatus.PAGADO) {
        stats.pagado++;
        stats.totalAmount += parseFloat(order.amount);
      }
      if (order.status === OrderStatus.RECHAZADO) stats.rechazado++;
    });

    return stats;
  }
}