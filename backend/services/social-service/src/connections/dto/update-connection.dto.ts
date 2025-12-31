import { IsOptional, IsEnum, IsArray, IsString } from 'class-validator';
import { ConnectionStatus, ConnectionType } from '../connection.entity';

export class UpdateConnectionDto {
  @IsOptional()
  @IsEnum(ConnectionStatus)
  status?: ConnectionStatus;

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