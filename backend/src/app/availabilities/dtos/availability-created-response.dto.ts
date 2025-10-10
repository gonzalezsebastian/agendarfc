import { AvailabilityStatus } from "src/common/enum/availability-status.enum";

export class AvailabilityCreatedResponseDto {
  id: string;
  player_id: string;
  start_time: string;
  end_time: string;
  status: AvailabilityStatus;
  created_at: string;
  message: string;
}