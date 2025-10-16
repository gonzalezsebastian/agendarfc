import { IsEnum, IsNumber, IsPositive, IsUUID, IsOptional } from 'class-validator';
import { ServiceTypeEnum } from 'src/common/enum/service-type.enum';

export class CreateOrderDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsEnum(ServiceTypeEnum)
  serviceType: ServiceTypeEnum;

  @IsNumber()
  @IsPositive()
  amount: number;
}