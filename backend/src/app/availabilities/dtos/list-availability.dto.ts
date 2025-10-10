import { IsUUID, IsEnum, IsOptional, IsDateString} from 'class-validator';
import { AvailabilityStatus } from 'src/common/enum/availability-status.enum';

export class ListAvailabilitiesQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'ID de jugador inválido' })
  playerId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Formato de fecha "from" inválido. Use formato ISO 8601' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Formato de fecha "to" inválido. Use formato ISO 8601' })
  to?: string;

  @IsOptional()
  @IsEnum(AvailabilityStatus, {
    message: `Estado debe ser uno de: ${Object.values(AvailabilityStatus).join(', ')}`
  })
  status?: AvailabilityStatus;
}