import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommonModule } from './common.module';

@Module({
  imports: [
    CommonModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [SubscriptionController],
   providers: [SubscriptionService, StripeService, JwtAuthGuard],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}