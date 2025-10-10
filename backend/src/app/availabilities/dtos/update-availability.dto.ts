import { IsNotEmpty, IsUUID, IsEnum} from 'class-validator';
import { AvailabilityStatus } from 'src/common/enum/availability-status.enum';

export class UpdateAvailabilityStatusDto {
  @IsNotEmpty({ message: 'El ID de la disponibilidad es requerido' })
  @IsUUID('4', { message: 'ID de disponibilidad inválido' })
  id: string;

  @IsNotEmpty({ message: 'El estado es requerido' })
  @IsEnum(AvailabilityStatus, {
    message: `Estado debe ser uno de: ${Object.values(AvailabilityStatus).join(', ')}`
  })
  status: AvailabilityStatus;
}