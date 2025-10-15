import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from "@nestjs/common";
import { SupabaseUserGuard } from "src/auth/supabase-user.guard";
import { ListAppointmentsQueryDto } from "./dtos/list-appointments.dto";
import { AppointmentDetailResponseDto, AppointmentResponseDto } from "./dtos/appointment-response.dto";
import { CreateAppointmentDto } from "./dtos/create-appointment.dto";
import { CancelAppointmentDto } from "./dtos/cancel-appointment.dto";
import { AppointmentsService } from "./appointment.service";


@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Get()
  async list(@Query() query: ListAppointmentsQueryDto): Promise<AppointmentDetailResponseDto[]> {
    return this.service.list(query);
  }

  @Get('my-appointments')
  @UseGuards(SupabaseUserGuard)
  async getMyAppointments(@Request() req): Promise<AppointmentDetailResponseDto[]> {
    return this.service.getUserAppointments(req.user.id);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<AppointmentDetailResponseDto> {
    return this.service.getById(id);
  }

  @Post()
  @UseGuards(SupabaseUserGuard)
  async create(@Request() req, @Body() dto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
    return this.service.create({
      userId: req.user.id,
      availabilityId: dto.availabilityId,
    });
  }

  @Patch('cancel')
  @UseGuards(SupabaseUserGuard)
  async cancel(@Request() req, @Body() dto: CancelAppointmentDto): Promise<AppointmentResponseDto> {
    return this.service.cancel({
      appointmentId: dto.id,
      requesterId: req.user.id,
    });
  }
}