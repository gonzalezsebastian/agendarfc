export class PlayerStatsResponseDto {
  playerId: string;
  total: number;
  disponibles: number;
  reservadas: number;
  canceladas: number;
  enRevision?: number;
}