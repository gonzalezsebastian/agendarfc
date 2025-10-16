import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { SupabaseUserGuard } from 'src/auth/supabase-user.guard';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderStatusDto } from './dtos/update-order.dto';

@Controller('orders')
@UseGuards(SupabaseUserGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto, req.user.id);
  }

  @Get()
  async findAll(@Request() req, @Query('userId') userId?: string) {
    return this.ordersService.findAll(req.user.id, userId);
  }

  @Get('stats/:userId')
  async getUserStats(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.ordersService.getUserOrderStats(userId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.ordersService.findOne(id, req.user.id);
  }

  @Patch('status')
  async updateStatus(@Request() req, @Body() updateOrderStatusDto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(updateOrderStatusDto, req.user.id);
  }
}