import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseModule } from '../database/supabase.module';
import { SupabaseUserGuard } from './supabase-user.guard';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SupabaseModule, ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, SupabaseUserGuard],
  exports: [AuthService, SupabaseUserGuard],
})
export class AuthModule {}