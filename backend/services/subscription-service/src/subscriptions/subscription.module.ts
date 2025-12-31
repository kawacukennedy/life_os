import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PassportModule } from "@nestjs/passport";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionService } from "./subscription.service";
import { Subscription } from "./subscription.entity";
import { Plan } from "./plan.entity";
import { Payment } from "./payment.entity";
import { JwtStrategy } from "../auth/jwt.strategy";

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Plan, Payment]),
    PassportModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, JwtStrategy],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}