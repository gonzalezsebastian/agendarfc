import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { SupabaseModule } from 'src/database/supabase.module';
import { AppointmentsController } from './appointment.controller';
import { AppointmentsService } from './appointment.service';

@Module({
  imports: [
    SupabaseModule,
    AuthModule
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService]
})
export class AppointmentsModule {}