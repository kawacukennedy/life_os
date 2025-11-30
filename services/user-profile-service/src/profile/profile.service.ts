import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ProfileService {
  private prisma = new PrismaClient();

  async getProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async createProfile(userId: string, data: any) {
    return this.prisma.profile.create({
      data: {
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
      },
    });
  }

  async updateProfile(userId: string, data: any) {
    return this.prisma.profile.update({
      where: { userId },
      data,
    });
  }

  async updatePreferences(userId: string, preferences: any) {
    const profile = await this.getProfile(userId);
    return this.prisma.profile.update({
      where: { userId },
      data: {
        preferences: { ...profile.preferences, ...preferences },
      },
    });
  }

  async updatePrivacySettings(userId: string, privacy: any) {
    const profile = await this.getProfile(userId);
    const updatedPreferences = {
      ...profile.preferences,
      privacy: { ...profile.preferences.privacy, ...privacy },
    };
    return this.prisma.profile.update({
      where: { userId },
      data: {
        preferences: updatedPreferences,
      },
    });
  }

  async updateIntegrations(userId: string, integrations: any) {
    const profile = await this.getProfile(userId);
    return this.prisma.profile.update({
      where: { userId },
      data: {
        connectedIntegrations: { ...profile.connectedIntegrations, ...integrations },
      },
    });
  }

  async deleteProfile(userId: string): Promise<void> {
    try {
      await this.prisma.profile.delete({
        where: { userId },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Profile not found');
      }
      throw error;
    }
  }

  async exportProfileData(userId: string) {
    const profile = await this.getProfile(userId);
    return {
      profile,
      exportDate: new Date(),
      dataRetention: '7 years',
    };
  }

  async anonymizeProfile(userId: string): Promise<void> {
    const profile = await this.getProfile(userId);
    const updatedPreferences = {
      ...profile.preferences,
      privacy: {
        ...profile.preferences.privacy,
        dataSharing: false,
        analytics: false,
      },
    };
    await this.prisma.profile.update({
      where: { userId },
      data: {
        displayName: 'Anonymous User',
        bio: null,
        avatarUrl: null,
        preferences: updatedPreferences,
      },
    });
  }
}