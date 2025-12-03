import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SubscriptionResolver } from './subscription.resolver';
import { SubscriptionGraphQLService } from './subscription.service';

@Module({
  imports: [HttpModule],
  providers: [SubscriptionResolver, SubscriptionGraphQLService],
  exports: [SubscriptionGraphQLService],
})
export class SubscriptionModule {}