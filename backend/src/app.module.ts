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
    AvailabilityModule,
    AuthModule,
  ],
  controllers: [AppController, AvailabilityController],
  providers: [AppService, SupabaseService, AvailabilityService],
})
export class AppModule {}