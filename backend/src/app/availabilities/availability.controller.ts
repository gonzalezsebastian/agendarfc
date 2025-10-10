import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete,
  Body, 
  Query, 
  Param,
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  ParseUUIDPipe
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { SupabaseUserGuard } from 'src/auth/supabase-user.guard';
import { ListAvailabilitiesQueryDto } from './dtos/list-availability.dto';
import { CreateAvailabilityDto } from './dtos/create-availability.dto';
import { UpdateAvailabilityStatusDto } from './dtos/update-availability.dto';
@Controller('availabilities')
export class AvailabilityController {
  constructor(private readonly service: AvailabilityService) {}

  @Get()
  async list(
    @Query(new ValidationPipe({ transform: true })) query: ListAvailabilitiesQueryDto
  ) {
    return this.service.list({
      playerId: query.playerId,
      from: query.from,
      to: query.to,
      status: query.status
    });
  }

  @Get('player/:playerId/stats')
  async getPlayerStats(@Param('playerId', ParseUUIDPipe) playerId: string) {
    return this.service.getPlayerStats(playerId);
  }

  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getById(id);
  }

  @UseGuards(SupabaseUserGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Body(ValidationPipe) dto: CreateAvailabilityDto
  ) {
    return this.service.create({
      playerId: req.user.id,
      start: dto.start,
      end: dto.end
    });
  }

  @UseGuards(SupabaseUserGuard)
  @Patch('status')
  @HttpCode(HttpStatus.OK)
  async setStatus(
    @Request() req,
    @Body(ValidationPipe) dto: UpdateAvailabilityStatusDto
  ) {
    return this.service.setStatus({
      requesterId: req.user.id,
      id: dto.id,
      status: dto.status
    });
  }

  @UseGuards(SupabaseUserGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.service.delete(id, req.user.id);
  }
}