import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { LearningService } from './learning.service';
import { CacheService } from '../auth/cache.service';
import { BackgroundJobService } from '../auth/background-job.service';
import { EmailProcessor } from '../auth/email.processor';
import { NotificationProcessor } from '../auth/notification.processor';
import { LearningController } from './learning.controller';
import { Course } from '../courses/course.entity';
import { Progress } from '../progress/progress.entity';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, Progress]),
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
  controllers: [LearningController],
  providers: [
    LearningService,
    CacheService,
    BackgroundJobService,
    EmailProcessor,
    NotificationProcessor,
    JwtStrategy,
  ],
  exports: [LearningService, CacheService, BackgroundJobService],
})
export class LearningModule {}