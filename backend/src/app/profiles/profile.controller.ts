import { Controller, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { SupabaseUserGuard } from 'src/auth/supabase-user.guard';
import { PlayerStatsResponseDto } from './dtos/player-stats-response.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @Get()
  async list(@Query('role') role?: string) {
    return this.service.list({ role });
  }

  @Get('players')
  async listPlayers() {
    return this.service.listPlayers();
  }

  @Get('players/stats')
  async getPlayerStats(
    @Query('playerId') playerId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ): Promise<PlayerStatsResponseDto[]> {
    return this.service.getPlayerStats({ playerId, from, to });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @UseGuards(SupabaseUserGuard)
  @Get('me/profile')
  async getMyProfile(@Request() req) {
    return this.service.findOne(req.user.id);
  }

  @UseGuards(SupabaseUserGuard)
  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto
  ) {
    return this.service.update({
      requesterId: req.user.id,
      profileId: id,
      data: dto
    });
  }
}