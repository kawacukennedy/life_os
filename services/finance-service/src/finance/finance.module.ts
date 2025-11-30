import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { FinanceService } from './finance.service';
import { PlaidService } from './plaid.service';
import { CacheService } from '../auth/cache.service';
import { BackgroundJobService } from '../auth/background-job.service';
import { EmailProcessor } from '../auth/email.processor';
import { NotificationProcessor } from '../auth/notification.processor';
import { FinanceController } from './finance.controller';
import { Transaction } from '../transactions/transaction.entity';
import { JwtStrategy } from '../auth/jwt.strategy';
import { CommonModule } from './common.module';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([Transaction]),
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
  controllers: [FinanceController],
  providers: [
    FinanceService,
    PlaidService,
    CacheService,
    BackgroundJobService,
    EmailProcessor,
    NotificationProcessor,
    JwtStrategy,
  ],
  exports: [FinanceService, CacheService, BackgroundJobService],
})
export class FinanceModule {}