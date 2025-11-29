import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Profile {
  @PrimaryColumn()
  userId: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ type: 'json', nullable: true })
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'private' | 'friends';
      dataSharing: boolean;
      analytics: boolean;
    };
  };

  @Column({ type: 'json', nullable: true })
  metadata: {
    onboardingCompleted: boolean;
    lastActiveAt: Date;
    accountType: 'free' | 'premium' | 'enterprise';
    subscriptionId?: string;
  };

  @Column({ type: 'json', nullable: true })
  connectedIntegrations: {
    google: boolean;
    fitbit: boolean;
    plaid: boolean;
    twitter: boolean;
    linkedin: boolean;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}