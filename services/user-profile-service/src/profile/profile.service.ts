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

  async exportProfileData(userId: string, format: 'json' | 'csv' = 'json') {
    const profile = await this.getProfile(userId);

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = [
        ['Field', 'Value'],
        ['User ID', profile.userId],
        ['Display Name', profile.displayName || ''],
        ['Bio', profile.bio || ''],
        ['Role', profile.role],
        ['Created At', profile.createdAt.toISOString()],
        ['Updated At', profile.updatedAt.toISOString()],
      ];

      // Add preferences as flattened rows
      if (profile.preferences) {
        Object.entries(profile.preferences).forEach(([key, value]) => {
          csvData.push([`Preference: ${key}`, JSON.stringify(value)]);
        });
      }

      return {
        data: csvData.map(row => row.join(',')).join('\n'),
        contentType: 'text/csv',
        filename: `profile-${userId}.csv`,
        exportDate: new Date(),
        dataRetention: '7 years',
      };
    }

    return {
      profile,
      exportDate: new Date(),
      dataRetention: '7 years',
      gdprCompliant: true,
    };
  }

  async importProfileData(userId: string, importData: any) {
    // Validate import data structure
    if (!importData.profile) {
      throw new Error('Invalid import data format');
    }

    const { displayName, bio, avatarUrl, preferences, connectedIntegrations } = importData.profile;

    return this.prisma.profile.update({
      where: { userId },
      data: {
        displayName,
        bio,
        avatarUrl,
        preferences,
        connectedIntegrations,
      },
    });
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

  async updateRole(userId: string, role: string) {
    const validRoles = ['end_user', 'admin', 'enterprise_admin', 'support_agent'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }
    return this.prisma.profile.update({
      where: { userId },
      data: { role },
    });
  }

  async getRole(userId: string): Promise<string> {
    const profile = await this.getProfile(userId);
    return profile.role;
  }

  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const role = await this.getRole(userId);
    const permissions = this.getPermissionsForRole(role);
    return permissions[resource]?.includes(action) || false;
  }

  private getPermissionsForRole(role: string) {
    const permissionMatrix = {
      end_user: {
        profile: ['read', 'update'],
        tasks: ['read', 'create', 'update', 'delete'],
        subscriptions: ['read', 'update'],
        integrations: ['read', 'create', 'delete'],
        ai_suggestions: ['create', 'read'],
      },
      admin: {
        profile: ['read'],
        tasks: ['read'],
        subscriptions: ['read', 'update'],
        integrations: ['read', 'delete'],
        ai_suggestions: ['read', 'manage'],
      },
      enterprise_admin: {
        profile: ['read', 'update'],
        tasks: ['read', 'create', 'update', 'delete'],
        subscriptions: ['read', 'update'],
        integrations: ['read', 'create', 'delete'],
        ai_suggestions: ['create', 'read', 'manage'],
      },
      support_agent: {
        profile: ['read'],
        tasks: ['read'],
        subscriptions: ['read'],
        integrations: ['read'],
        ai_suggestions: ['read'],
      },
    };
    return permissionMatrix[role] || {};
  }
}