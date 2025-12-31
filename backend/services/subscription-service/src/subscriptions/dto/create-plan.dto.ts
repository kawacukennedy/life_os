import { IsString, IsOptional, IsEnum, IsNumber, IsObject, Min, IsBoolean } from "class-validator";
import { PlanType, BillingInterval } from "../plan.entity";

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PlanType)
  type: PlanType;

  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(BillingInterval)
  billingInterval: BillingInterval;

  @IsOptional()
  @IsObject()
  features?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxUsers?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxProjects?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  storageLimitGb?: number;

  @IsOptional()
  @IsString()
  stripePriceId?: string;
}