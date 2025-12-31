import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ConnectionType } from '../connection.entity';

export class CreateConnectionDto {
  @IsString()
  addresseeId: string;

  @IsOptional()
  @IsEnum(ConnectionType)
  type?: ConnectionType;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sharedGoals?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sharedInterests?: string[];
}