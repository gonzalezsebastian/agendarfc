import { IsEnum, IsUUID } from 'class-validator';
import { OrderStatus } from '../../../common/enum/order-status.enum';

export class UpdateOrderStatusDto {
  @IsUUID()
  orderId: string;

  @IsEnum(OrderStatus)
  status: OrderStatus;
}