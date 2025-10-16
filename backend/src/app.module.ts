import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SupabaseModule } from './database/supabase.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityModule } from './app/availabilities/availability.module';
import { AvailabilityController } from './app/availabilities/availability.controller';
import { AvailabilityService } from './app/availabilities/availability.service';
import { SupabaseService } from './database/supabase.service';
import { AppointmentsModule } from './app/appointments/appointment.module';
import { ProfileModule } from './app/profiles/profile.module';
import { AppointmentsController } from './app/appointments/appointment.controller';
import { ProfileController } from './app/profiles/profile.controller';
import { AppointmentsService } from './app/appointments/appointment.service';
import { ProfileService } from './app/profiles/profile.service';
import { OrdersModule } from './app/orders/orders.module';
import { OrdersController } from './app/orders/orders.controller';
import { OrdersService } from './app/orders/orders.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        entities: ['dist/app_modules/**/*.entity{.ts,.js}'],
        migrations: ['dist/migrations/*{.ts,.js}'],
        synchronize: false,
        poolSize: 20,
      })
    }),
    SupabaseModule,
    AppointmentsModule,
    AvailabilityModule,
    OrdersModule,
    ProfileModule,
    AuthModule,
  ],
  controllers: [AppController, AppointmentsController, AvailabilityController, OrdersController, ProfileController],
  providers: [AppService, SupabaseService, AppointmentsService, AvailabilityService, OrdersService, ProfileService],
})
export class AppModule {}