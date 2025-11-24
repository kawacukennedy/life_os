import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FitbitService } from './fitbit.service';
import { Vital } from '../vitals/vital.entity';
import { LoggerService } from '../auth/logger.service';
import { CacheService } from '../auth/cache.service';
import { BackgroundJobService } from '../auth/background-job.service';

describe('FitbitService', () => {
  let service: FitbitService;
  let vitalRepository: Repository<Vital>;
  let loggerService: LoggerService;
  let cacheService: CacheService;
  let backgroundJobService: BackgroundJobService;

  const mockUser = {
    id: 'user-uuid',
    fitbitTokens: {
      accessToken: 'fitbit-access-token',
      refreshToken: 'fitbit-refresh-token',
      expiryDate: Date.now() + 3600000,
    },
  };

  const mockVitalRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    getApiResponse: jest.fn(),
    setApiResponse: jest.fn(),
  };

  const mockBackgroundJobService = {
    addJob: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FitbitService,
        {
          provide: getRepositoryToken(Vital),
          useValue: mockVitalRepository,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: BackgroundJobService,
          useValue: mockBackgroundJobService,
        },
      ],
    }).compile();

    service = module.get<FitbitService>(FitbitService);
    vitalRepository = module.get<Repository<Vital>>(getRepositoryToken(Vital));
    loggerService = module.get<LoggerService>(LoggerService);
    cacheService = module.get<CacheService>(CacheService);
    backgroundJobService = module.get<BackgroundJobService>(BackgroundJobService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAuthUrl', () => {
    it('should generate Fitbit OAuth URL', async () => {
      const result = await service.getAuthUrl('user-123');

      expect(typeof result).toBe('string');
      expect(result).toContain('https://www.fitbit.com/oauth2/authorize');
      expect(result).toContain('scope=activity+heartrate+location+nutrition+profile+settings+sleep+social+weight');
      expect(result).toContain('state=user-123');
    });
  });

  describe('handleCallback', () => {
    it('should handle OAuth callback and store tokens', async () => {
      const mockTokens = {
        access_token: 'new-fitbit-access-token',
        refresh_token: 'new-fitbit-refresh-token',
        expires_in: 28800,
      };

      // Mock axios request
      const mockAxiosPost = jest.fn().mockResolvedValue({ data: mockTokens });
      jest.doMock('axios', () => ({ post: mockAxiosPost }));

      const result = await service.handleCallback('auth-code', 'user-uuid');

      expect(result).toEqual({ success: true });
      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://api.fitbit.com/oauth2/token',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      );
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Fitbit tokens stored successfully',
        expect.objectContaining({ userId: 'user-uuid' })
      );
    });

    it('should handle OAuth errors', async () => {
      const mockAxiosPost = jest.fn().mockRejectedValue(new Error('OAuth failed'));
      jest.doMock('axios', () => ({ post: mockAxiosPost }));

      await expect(service.handleCallback('invalid-code', 'user-uuid')).rejects.toThrow(
        'OAuth failed'
      );
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('getActivities', () => {
    it('should return cached activities if available', async () => {
      const cachedActivities = {
        activities: [{ dateTime: '2024-01-15', value: 8432 }],
      };
      mockCacheService.getApiResponse.mockResolvedValue(cachedActivities);

      const result = await service.getActivities('user-uuid', '2024-01-15');

      expect(result).toEqual(cachedActivities);
      expect(mockCacheService.getApiResponse).toHaveBeenCalledWith(
        'fitbit',
        'activities',
        'user-uuid'
      );
    });

    it('should fetch activities from Fitbit API when not cached', async () => {
      const apiResponse = {
        'activities-steps': [{ dateTime: '2024-01-15', value: '8432' }],
      };

      mockCacheService.getApiResponse.mockResolvedValue(null);

      const mockAxiosGet = jest.fn().mockResolvedValue({ data: apiResponse });
      jest.doMock('axios', () => ({ get: mockAxiosGet }));

      const result = await service.getActivities('user-uuid', '2024-01-15');

      expect(result).toEqual({
        activities: [{ dateTime: '2024-01-15', value: 8432 }],
      });
      expect(mockAxiosGet).toHaveBeenCalledWith(
        'https://api.fitbit.com/1/user/-/activities/steps/date/2024-01-15/2024-01-15.json',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer fitbit-access-token',
          }),
        })
      );
      expect(mockCacheService.setApiResponse).toHaveBeenCalledWith(
        'fitbit',
        'activities',
        'user-uuid',
        expect.any(Object)
      );
    });

    it('should handle date ranges', async () => {
      mockCacheService.getApiResponse.mockResolvedValue(null);

      const mockAxiosGet = jest.fn().mockResolvedValue({
        data: { 'activities-steps': [] },
      });
      jest.doMock('axios', () => ({ get: mockAxiosGet }));

      await service.getActivities('user-uuid', '2024-01-15', '2024-01-20');

      expect(mockAxiosGet).toHaveBeenCalledWith(
        'https://api.fitbit.com/1/user/-/activities/steps/date/2024-01-15/2024-01-20.json',
        expect.any(Object)
      );
    });
  });

  describe('getSleep', () => {
    it('should fetch sleep data from Fitbit API', async () => {
      const apiResponse = {
        sleep: [
          {
            dateOfSleep: '2024-01-15',
            duration: 28800000,
            efficiency: 92,
            stages: { deep: 4800000, light: 18000000, rem: 4800000, wake: 1200000 },
          },
        ],
      };

      mockCacheService.getApiResponse.mockResolvedValue(null);

      const mockAxiosGet = jest.fn().mockResolvedValue({ data: apiResponse });
      jest.doMock('axios', () => ({ get: mockAxiosGet }));

      const result = await service.getSleep('user-uuid', '2024-01-15');

      expect(result).toEqual({
        sleep: [
          {
            dateOfSleep: '2024-01-15',
            duration: 28800000,
            efficiency: 92,
            stages: { deep: 4800000, light: 18000000, rem: 4800000, wake: 1200000 },
          },
        ],
      });
      expect(mockAxiosGet).toHaveBeenCalledWith(
        'https://api.fitbit.com/1.2/user/-/sleep/date/2024-01-15.json',
        expect.any(Object)
      );
    });
  });

  describe('getHeartRate', () => {
    it('should fetch heart rate data from Fitbit API', async () => {
      const apiResponse = {
        'activities-heart': [
          {
            dateTime: '2024-01-15',
            value: {
              restingHeartRate: 62,
              heartRateZones: [
                { name: 'Fat Burn', min: 93, max: 123, minutes: 45 },
                { name: 'Cardio', min: 124, max: 149, minutes: 23 },
              ],
            },
          },
        ],
      };

      mockCacheService.getApiResponse.mockResolvedValue(null);

      const mockAxiosGet = jest.fn().mockResolvedValue({ data: apiResponse });
      jest.doMock('axios', () => ({ get: mockAxiosGet }));

      const result = await service.getHeartRate('user-uuid', '2024-01-15');

      expect(result).toEqual({
        heartRate: [
          {
            dateTime: '2024-01-15',
            restingHeartRate: 62,
            zones: {
              fatBurn: { min: 93, max: 123, minutes: 45 },
              cardio: { min: 124, max: 149, minutes: 23 },
            },
          },
        ],
      });
    });
  });

  describe('syncUserData', () => {
    it('should sync activities data and store as vitals', async () => {
      const activitiesData = {
        activities: [
          { dateTime: '2024-01-15', value: 8432 },
          { dateTime: '2024-01-16', value: 9210 },
        ],
      };

      const mockVital = { id: 'vital-1', userId: 'user-uuid', type: 'steps' };
      mockVitalRepository.create.mockReturnValue(mockVital);
      mockVitalRepository.save.mockResolvedValue(mockVital);

      await service.syncUserData('user-uuid', activitiesData, 'steps');

      expect(mockVitalRepository.create).toHaveBeenCalledTimes(2);
      expect(mockVitalRepository.save).toHaveBeenCalledTimes(2);
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Synced 2 steps records for user user-uuid',
        expect.any(Object)
      );
    });

    it('should handle sync errors gracefully', async () => {
      const activitiesData = {
        activities: [{ dateTime: '2024-01-15', value: 8432 }],
      };

      mockVitalRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(
        service.syncUserData('user-uuid', activitiesData, 'steps')
      ).rejects.toThrow('Database error');

      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh expired Fitbit token', async () => {
      const newTokens = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 28800,
      };

      const mockAxiosPost = jest.fn().mockResolvedValue({ data: newTokens });
      jest.doMock('axios', () => ({ post: mockAxiosPost }));

      await (service as any).refreshAccessToken('user-uuid');

      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://api.fitbit.com/oauth2/token',
        expect.any(URLSearchParams),
        expect.any(Object)
      );
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Fitbit token refreshed successfully',
        expect.objectContaining({ userId: 'user-uuid' })
      );
    });

    it('should handle token refresh errors', async () => {
      const mockAxiosPost = jest.fn().mockRejectedValue(new Error('Refresh failed'));
      jest.doMock('axios', () => ({ post: mockAxiosPost }));

      await expect((service as any).refreshAccessToken('user-uuid')).rejects.toThrow(
        'Refresh failed'
      );
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('getDashboardData', () => {
    it('should aggregate health data for dashboard', async () => {
      const mockVitals = [
        {
          type: 'steps',
          value: 8432,
          timestamp: new Date('2024-01-15T10:00:00Z'),
        },
        {
          type: 'sleep',
          value: 28800000,
          timestamp: new Date('2024-01-15T22:00:00Z'),
        },
        {
          type: 'heart_rate',
          value: 72,
          timestamp: new Date('2024-01-15T08:00:00Z'),
        },
      ];

      mockVitalRepository.find.mockResolvedValue(mockVitals);

      const result = await service.getDashboardData('user-uuid');

      expect(result).toEqual({
        today: {
          steps: 8432,
          sleepHours: 8,
          heartRate: 72,
        },
        week: {
          averageSteps: 8432,
          averageSleep: 8,
          averageHeartRate: 72,
        },
      });
    });

    it('should handle empty vital data', async () => {
      mockVitalRepository.find.mockResolvedValue([]);

      const result = await service.getDashboardData('user-uuid');

      expect(result).toEqual({
        today: {
          steps: 0,
          sleepHours: 0,
          heartRate: 0,
        },
        week: {
          averageSteps: 0,
          averageSleep: 0,
          averageHeartRate: 0,
        },
      });
    });
  });
});