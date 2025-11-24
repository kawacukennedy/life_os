import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheService } from './cache.service';
import { LoggerService } from './logger.service';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: Cache;
  let loggerService: LoggerService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    loggerService = module.get<LoggerService>(LoggerService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return cached value when key exists', async () => {
      const mockValue = { data: 'test' };
      mockCacheManager.get.mockResolvedValue(mockValue);

      const result = await service.get('test-key');

      expect(result).toEqual(mockValue);
      expect(mockCacheManager.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.get('nonexistent-key');

      expect(result).toBeNull();
      expect(mockCacheManager.get).toHaveBeenCalledWith('nonexistent-key');
    });

    it('should handle cache errors gracefully', async () => {
      mockCacheManager.get.mockRejectedValue(new Error('Cache error'));

      const result = await service.get('test-key');

      expect(result).toBeNull();
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('should set value with default TTL', async () => {
      const value = { data: 'test' };

      await service.set('test-key', value);

      expect(mockCacheManager.set).toHaveBeenCalledWith('test-key', value, 300000); // 5 minutes
    });

    it('should set value with custom TTL', async () => {
      const value = { data: 'test' };
      const ttl = 60000; // 1 minute

      await service.set('test-key', value, ttl);

      expect(mockCacheManager.set).toHaveBeenCalledWith('test-key', value, ttl);
    });

    it('should handle cache errors gracefully', async () => {
      mockCacheManager.set.mockRejectedValue(new Error('Cache error'));

      await expect(service.set('test-key', { data: 'test' })).resolves.not.toThrow();
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete key from cache', async () => {
      mockCacheManager.del.mockResolvedValue(1);

      await service.delete('test-key');

      expect(mockCacheManager.del).toHaveBeenCalledWith('test-key');
    });

    it('should handle cache errors gracefully', async () => {
      mockCacheManager.del.mockRejectedValue(new Error('Cache error'));

      await expect(service.delete('test-key')).resolves.not.toThrow();
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile from cache', async () => {
      const userProfile = { id: '1', email: 'test@example.com' };
      mockCacheManager.get.mockResolvedValue(userProfile);

      const result = await service.getUserProfile('user-1');

      expect(result).toEqual(userProfile);
      expect(mockCacheManager.get).toHaveBeenCalledWith('user:user-1:profile');
    });
  });

  describe('setUserProfile', () => {
    it('should set user profile in cache', async () => {
      const userProfile = { id: '1', email: 'test@example.com' };

      await service.setUserProfile('user-1', userProfile);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'user:user-1:profile',
        userProfile,
        300000
      );
    });
  });

  describe('invalidateUserCache', () => {
    it('should invalidate all user-related cache keys', async () => {
      mockCacheManager.del.mockResolvedValue(1);

      await service.invalidateUserCache('user-1');

      expect(mockCacheManager.del).toHaveBeenCalledWith('user:user-1:profile');
    });

    it('should handle cache deletion errors gracefully', async () => {
      mockCacheManager.del.mockRejectedValue(new Error('Cache error'));

      await expect(service.invalidateUserCache('user-1')).resolves.not.toThrow();
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('getApiResponse', () => {
    it('should return API response from cache', async () => {
      const apiResponse = { data: 'cached response' };
      mockCacheManager.get.mockResolvedValue(apiResponse);

      const result = await service.getApiResponse('google', 'calendar', 'user-1');

      expect(result).toEqual(apiResponse);
      expect(mockCacheManager.get).toHaveBeenCalledWith('thirdparty:google:user-1:calendar');
    });
  });

  describe('setApiResponse', () => {
    it('should set API response in cache with appropriate TTL', async () => {
      const apiResponse = { data: 'api response' };

      await service.setApiResponse('google', 'calendar', 'user-1', apiResponse);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'thirdparty:google:user-1:calendar',
        apiResponse,
        300000 // 5 minutes for Google APIs
      );
    });

    it('should use different TTL for different providers', async () => {
      const apiResponse = { data: 'api response' };

      await service.setApiResponse('fitbit', 'activities', 'user-1', apiResponse);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'thirdparty:fitbit:user-1:activities',
        apiResponse,
        3600000 // 1 hour for Fitbit
      );
    });
  });

  describe('clear', () => {
    it('should clear all cache', async () => {
      mockCacheManager.reset.mockResolvedValue(undefined);

      await service.clear();

      expect(mockCacheManager.reset).toHaveBeenCalled();
    });

    it('should handle cache clear errors gracefully', async () => {
      mockCacheManager.reset.mockRejectedValue(new Error('Cache error'));

      await expect(service.clear()).resolves.not.toThrow();
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });
});