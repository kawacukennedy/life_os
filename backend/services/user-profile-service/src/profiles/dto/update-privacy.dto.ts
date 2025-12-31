import { IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';
import { PrivacyLevel } from '../profile.entity';

export class UpdatePrivacyDto {
  @IsOptional()
  @IsEnum(PrivacyLevel)
  profilePrivacy?: PrivacyLevel;

  @IsOptional()
  @IsEnum(PrivacyLevel)
  activityPrivacy?: PrivacyLevel;

  @IsOptional()
  @IsBoolean()
  dataSharing?: boolean;

  @IsOptional()
  @IsBoolean()
  analyticsTracking?: boolean;

  @IsOptional()
  @IsObject()
  privacySettings?: any;
}