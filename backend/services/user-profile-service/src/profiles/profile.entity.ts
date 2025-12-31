import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum PrivacyLevel {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private',
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export enum Language {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  IT = 'it',
  PT = 'pt',
  RU = 'ru',
  ZH = 'zh',
  JA = 'ja',
  KO = 'ko',
}

@Entity('user_profiles')
export class UserProfile {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  timezone: string;

  @Column({ nullable: true })
  location: string;

  @Column({
    type: 'enum',
    enum: Language,
    default: Language.EN,
  })
  language: Language;

  @Column({
    type: 'enum',
    enum: Theme,
    default: Theme.SYSTEM,
  })
  theme: Theme;

  @Column({ default: true })
  emailNotifications: boolean;

  @Column({ default: true })
  pushNotifications: boolean;

  @Column({ default: false })
  smsNotifications: boolean;

  @Column({ default: true })
  aiSuggestions: boolean;

  @Column({ default: false })
  dataSharing: boolean;

  @Column({ default: true })
  analyticsTracking: boolean;

  @Column({
    type: 'enum',
    enum: PrivacyLevel,
    default: PrivacyLevel.PRIVATE,
  })
  profilePrivacy: PrivacyLevel;

  @Column({
    type: 'enum',
    enum: PrivacyLevel,
    default: PrivacyLevel.PRIVATE,
  })
  activityPrivacy: PrivacyLevel;

  @Column({ type: 'json', nullable: true })
  customPreferences: {
    dashboardLayout?: string[];
    defaultView?: string;
    workingHours?: {
      start: string;
      end: string;
      days: string[];
    };
    goals?: {
      dailySteps?: number;
      weeklyWorkouts?: number;
      monthlySavings?: number;
    };
    integrations?: {
      autoSync?: boolean;
      preferredApps?: string[];
    };
  };

  @Column({ type: 'json', nullable: true })
  notificationSettings: {
    taskReminders?: boolean;
    healthAlerts?: boolean;
    financeAlerts?: boolean;
    learningReminders?: boolean;
    socialUpdates?: boolean;
    quietHours?: {
      start: string;
      end: string;
    };
  };

  @Column({ type: 'json', nullable: true })
  privacySettings: {
    dataRetentionDays?: number;
    exportData?: boolean;
    deleteData?: boolean;
    thirdPartySharing?: boolean;
    aiTrainingOptOut?: boolean;
    cookies?: {
      necessary: boolean;
      analytics: boolean;
      marketing: boolean;
    };
  };

  @Column({ default: false })
  onboardingCompleted: boolean;

  @Column({ type: 'json', nullable: true })
  onboardingProgress: {
    step: number;
    completedSteps: string[];
    preferences: Record<string, any>;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}