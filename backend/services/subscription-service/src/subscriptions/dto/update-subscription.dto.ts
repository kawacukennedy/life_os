import { IsOptional, IsEnum, IsObject } from "class-validator";
import { SubscriptionStatus } from "../subscription.entity";

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}