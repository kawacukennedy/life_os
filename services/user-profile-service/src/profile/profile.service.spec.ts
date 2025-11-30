import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './profile.entity';

describe('ProfileService', () => {
  let service: ProfileService;
  let repository: Repository<Profile>;

  const mockProfile: Profile = {
    userId: 'user-123',
    displayName: 'John Doe',
    bio: 'Software developer',
    avatarUrl: 'https://example.com/avatar.jpg',
    preferences: {
      theme: 'dark',
      language: 'en-US',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      privacy: {
        profileVisibility: 'public',
        dataSharing: true,
        analytics: true,
      },
    },
    metadata: {
      onboardingCompleted: true,
      lastActiveAt: new Date(),
      accountType: 'premium',
    },
    connectedIntegrations: {
      google: true,
      fitbit: false,
      plaid: true,
      twitter: false,
      linkedin: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: getRepositoryToken(Profile),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    repository = module.get<Repository<Profile>>(getRepositoryToken(Profile));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return a profile when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockProfile);

      const result = await service.getProfile('user-123');

      expect(result).toEqual(mockProfile);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { userId: 'user-123' } });
    });

    it('should throw NotFoundException when profile not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getProfile('user-123')).rejects.toThrow('Profile not found');
    });
  });

  describe('createProfile', () => {
    it('should create a new profile with default values', async () => {
      const newProfile = { ...mockProfile };
      mockRepository.create.mockReturnValue(newProfile);
      mockRepository.save.mockResolvedValue(newProfile);

      const result = await service.createProfile('user-123', { displayName: 'John Doe' });

      expect(result).toEqual(newProfile);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith(newProfile);
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updatedProfile = { ...mockProfile, displayName: 'Jane Doe' };
      mockRepository.findOne.mockResolvedValue(mockProfile);
      mockRepository.save.mockResolvedValue(updatedProfile);

      const result = await service.updateProfile('user-123', { displayName: 'Jane Doe' });

      expect(result).toEqual(updatedProfile);
      expect(mockRepository.save).toHaveBeenCalledWith(updatedProfile);
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const newPreferences = { theme: 'light' as const };
      const expectedProfile = {
        ...mockProfile,
        preferences: { ...mockProfile.preferences, ...newPreferences },
      };

      mockRepository.findOne.mockResolvedValue(mockProfile);
      mockRepository.save.mockResolvedValue(expectedProfile);

      const result = await service.updatePreferences('user-123', newPreferences);

      expect(result.preferences.theme).toBe('light');
    });
  });

  describe('updatePrivacySettings', () => {
    it('should update privacy settings', async () => {
      const newPrivacy = { profileVisibility: 'private' as const };
      const expectedProfile = {
        ...mockProfile,
        preferences: {
          ...mockProfile.preferences,
          privacy: { ...mockProfile.preferences.privacy, ...newPrivacy },
        },
      };

      mockRepository.findOne.mockResolvedValue(mockProfile);
      mockRepository.save.mockResolvedValue(expectedProfile);

      const result = await service.updatePrivacySettings('user-123', newPrivacy);

      expect(result.preferences.privacy.profileVisibility).toBe('private');
    });
  });

  describe('updateIntegrations', () => {
    it('should update connected integrations', async () => {
      const newIntegrations = { fitbit: true };
      const expectedProfile = {
        ...mockProfile,
        connectedIntegrations: { ...mockProfile.connectedIntegrations, ...newIntegrations },
      };

      mockRepository.findOne.mockResolvedValue(mockProfile);
      mockRepository.save.mockResolvedValue(expectedProfile);

      const result = await service.updateIntegrations('user-123', newIntegrations);

      expect(result.connectedIntegrations.fitbit).toBe(true);
    });
  });

  describe('deleteProfile', () => {
    it('should delete profile successfully', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await expect(service.deleteProfile('user-123')).resolves.not.toThrow();
      expect(mockRepository.delete).toHaveBeenCalledWith({ userId: 'user-123' });
    });

    it('should throw NotFoundException when profile not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.deleteProfile('user-123')).rejects.toThrow('Profile not found');
    });
  });

  describe('exportProfileData', () => {
    it('should export profile data in JSON format', async () => {
      mockRepository.findOne.mockResolvedValue(mockProfile);

      const result = await service.exportProfileData('user-123', 'json');

      expect(result).toHaveProperty('profile');
      expect(result).toHaveProperty('exportDate');
      expect(result).toHaveProperty('dataRetention');
      expect(result.gdprCompliant).toBe(true);
    });

    it('should export profile data in CSV format', async () => {
      mockRepository.findOne.mockResolvedValue(mockProfile);

      const result = await service.exportProfileData('user-123', 'csv');

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('contentType', 'text/csv');
      expect(result).toHaveProperty('filename');
    });
  });

  describe('anonymizeProfile', () => {
    it('should anonymize profile data', async () => {
      const anonymizedProfile = {
        ...mockProfile,
        displayName: 'Anonymous User',
        bio: null,
        avatarUrl: null,
        preferences: {
          ...mockProfile.preferences,
          privacy: {
            ...mockProfile.preferences.privacy,
            dataSharing: false,
            analytics: false,
          },
        },
      };

      mockRepository.findOne.mockResolvedValue(mockProfile);
      mockRepository.save.mockResolvedValue(anonymizedProfile);

      await service.anonymizeProfile('user-123');

      expect(mockRepository.save).toHaveBeenCalledWith(anonymizedProfile);
    });
  });

  describe('Role management', () => {
    it('should update user role', async () => {
      const roleUpdatedProfile = { ...mockProfile, role: 'admin' };
      mockRepository.update.mockResolvedValue(roleUpdatedProfile);

      const result = await service.updateRole('user-123', 'admin');

      expect(result.role).toBe('admin');
    });

    it('should get user role', async () => {
      mockRepository.findOne.mockResolvedValue(mockProfile);

      const role = await service.getRole('user-123');

      expect(role).toBe('premium');
    });

    it('should check permissions', async () => {
      mockRepository.findOne.mockResolvedValue(mockProfile);

      const hasPermission = await service.hasPermission('user-123', 'profile', 'read');

      expect(hasPermission).toBe(true);
    });
  });
});