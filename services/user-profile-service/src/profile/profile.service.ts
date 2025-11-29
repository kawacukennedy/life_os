import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './profile.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  async getProfile(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async createProfile(userId: string, data: Partial<Profile>): Promise<Profile> {
    const profile = this.profileRepository.create({
      userId,
      preferences: {
        theme: 'light',
        language: 'en-US',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        privacy: {
          profileVisibility: 'private',
          dataSharing: false,
          analytics: true,
        },
      },
      metadata: {
        onboardingCompleted: false,
        lastActiveAt: new Date(),
        accountType: 'free',
      },
      connectedIntegrations: {
        google: false,
        fitbit: false,
        plaid: false,
        twitter: false,
        linkedin: false,
      },
      ...data,
    });
    return this.profileRepository.save(profile);
  }

  async updateProfile(userId: string, data: Partial<Profile>): Promise<Profile> {
    const profile = await this.getProfile(userId);
    Object.assign(profile, data);
    return this.profileRepository.save(profile);
  }

  async updatePreferences(userId: string, preferences: any): Promise<Profile> {
    const profile = await this.getProfile(userId);
    profile.preferences = { ...profile.preferences, ...preferences };
    return this.profileRepository.save(profile);
  }

  async updatePrivacySettings(userId: string, privacy: any): Promise<Profile> {
    const profile = await this.getProfile(userId);
    profile.preferences.privacy = { ...profile.preferences.privacy, ...privacy };
    return this.profileRepository.save(profile);
  }

  async updateIntegrations(userId: string, integrations: any): Promise<Profile> {
    const profile = await this.getProfile(userId);
    profile.connectedIntegrations = { ...profile.connectedIntegrations, ...integrations };
    return this.profileRepository.save(profile);
  }

  async deleteProfile(userId: string): Promise<void> {
    const result = await this.profileRepository.delete({ userId });
    if (result.affected === 0) {
      throw new NotFoundException('Profile not found');
    }
  }

  async exportProfileData(userId: string): Promise<any> {
    const profile = await this.getProfile(userId);
    return {
      profile,
      exportDate: new Date(),
      dataRetention: '7 years',
    };
  }

  async anonymizeProfile(userId: string): Promise<void> {
    const profile = await this.getProfile(userId);
    profile.displayName = 'Anonymous User';
    profile.bio = null;
    profile.avatarUrl = null;
    profile.preferences.privacy.dataSharing = false;
    profile.preferences.privacy.analytics = false;
    await this.profileRepository.save(profile);
  }
}