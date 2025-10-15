import { IsUUID, IsOptional, IsIn } from 'class-validator';

export class ListAppointmentsQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  playerId?: string;

  @IsOptional()
  @IsIn(['confirmada', 'cancelada'])
  status?: 'confirmada' | 'cancelada';

  @IsOptional()
  from?: string;

  @IsOptional()
  to?: string;
}