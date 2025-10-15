import { IsUUID, IsNotEmpty } from 'class-validator';

export class CancelAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;
}