export class AppointmentResponseDto {
  id: string;
  userId: string;
  availabilityId: string;
  status: 'confirmada' | 'cancelada';
  createdAt: string;
}

export class AppointmentDetailResponseDto extends AppointmentResponseDto {
  user?: {
    id: string;
    username: string;
    email: string;
    phone: string;
  };
  availability?: {
    id: string;
    playerId: string;
    startTime: string;
    endTime: string;
    status: string;
  };
}