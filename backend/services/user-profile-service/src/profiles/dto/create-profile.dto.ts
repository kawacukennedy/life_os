import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { PrivacyLevel, Theme, Language } from '../profile.entity';

export class CreateProfileDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  aiSuggestions?: boolean;

  @IsOptional()
  @IsBoolean()
  dataSharing?: boolean;

  @IsOptional()
  @IsBoolean()
  analyticsTracking?: boolean;

  @IsOptional()
  @IsEnum(PrivacyLevel)
  profilePrivacy?: PrivacyLevel;

  @IsOptional()
  @IsEnum(PrivacyLevel)
  activityPrivacy?: PrivacyLevel;
}