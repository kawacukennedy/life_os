import { IsUUID, IsOptional, IsObject } from "class-validator";

export class CreateSubscriptionDto {
  @IsUUID()
  planId: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}