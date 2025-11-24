import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { NotificationService } from './notification.service';
import { CacheService } from '../auth/cache.service';
import { BackgroundJobService } from '../auth/background-job.service';
import { EmailProcessor } from '../auth/email.processor';
import { NotificationProcessor } from '../auth/notification.processor';
import { NotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';
import { Notification } from './notification.entity';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
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
  controllers: [NotificationController],
  providers: [
    NotificationService,
    CacheService,
    BackgroundJobService,
    EmailProcessor,
    NotificationProcessor,
    NotificationGateway,
    JwtStrategy,
  ],
  exports: [NotificationService, NotificationGateway, CacheService, BackgroundJobService],
})
export class NotificationModule {}
