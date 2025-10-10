import { IsNotEmpty, IsDateString} from 'class-validator';

export class CreateAvailabilityDto {
  @IsNotEmpty({ message: 'La fecha de inicio es requerida' })
  @IsDateString({}, { message: 'Formato de fecha de inicio inválido. Use formato ISO 8601' })
  start: string;

  @IsNotEmpty({ message: 'La fecha de fin es requerida' })
  @IsDateString({}, { message: 'Formato de fecha de fin inválido. Use formato ISO 8601' })
  end: string;
}