import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  availabilityId: string;
}