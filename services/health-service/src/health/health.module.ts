import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { HealthService } from './health.service';
import { FitbitService } from './fitbit.service';
import { AppleHealthService } from './apple-health.service';
import { HealthAnomalyDetectorService } from './health-anomaly-detector.service';
import { NutritionModule } from '../nutrition/nutrition.module';
import { CacheService } from '../auth/cache.service';
import { BackgroundJobService } from '../auth/background-job.service';
import { EmailProcessor } from '../auth/email.processor';
import { NotificationProcessor } from '../auth/notification.processor';
import { HealthController } from './health.controller';
import { Vital } from '../vitals/vital.entity';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  imports: [
    NutritionModule,
    TypeOrmModule.forFeature([Vital]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '15m' },
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    CacheModule.register({
      ttl: 300000, // 5 minutes
      max: 1000,
    }),
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'notification' },
      { name: 'sync' },
    ),
  ],
  controllers: [HealthController],
   providers: [
     HealthService,
     FitbitService,
     AppleHealthService,
     HealthAnomalyDetectorService,
     CacheService,
     BackgroundJobService,
     EmailProcessor,
     NotificationProcessor,
     JwtStrategy,
   ],
  exports: [HealthService, CacheService, BackgroundJobService],
})
export class HealthModule {}