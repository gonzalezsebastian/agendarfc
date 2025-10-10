import { PlayerInfoDto } from "src/common/dto/player-info.dto";
import { AvailabilityStatus } from "src/common/enum/availability-status.enum";

export class AvailabilityResponseDto {
  id: string;
  player_id: string;
  start_time: string;
  end_time: string;
  status: AvailabilityStatus;
  created_at: string;
  player?: PlayerInfoDto;
}