import { IsUUID, IsNumber, IsString, IsOptional, IsEnum, IsObject, Min } from "class-validator";
import { PaymentMethod } from "../payment.entity";

export class CreatePaymentDto {
  @IsUUID()
  subscriptionId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}