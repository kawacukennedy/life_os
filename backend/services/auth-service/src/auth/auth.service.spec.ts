import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';
import { LoggerService } from './logger.service';
import { CacheService } from './cache.service';
import { BackgroundJobService } from './background-job.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let loggerService: LoggerService;
  let cacheService: CacheService;
  let backgroundJobService: BackgroundJobService;

  const mockUser = {
    id: 'user-uuid',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    fullName: 'Test User',
    timezone: 'UTC',
    isActive: true,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
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
  };

  const mockBackgroundJobService = {
    addJob: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
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

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    loggerService = module.get<LoggerService>(LoggerService);
    cacheService = module.get<CacheService>(CacheService);
    backgroundJobService = module.get<BackgroundJobService>(BackgroundJobService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data without password when credentials are valid', async () => {
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        timezone: mockUser.timezone,
        isActive: mockUser.isActive,
        role: mockUser.role,
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
    });

    it('should return null when user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens with user data', async () => {
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login(mockUser);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockUser,
      });
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('register', () => {
    it('should create and return new user', async () => {
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password');

      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
        timezone: 'UTC',
      };

      const createdUser = { ...mockUser, ...userData, passwordHash: 'hashed-password' };
      mockUserRepository.create.mockReturnValue(createdUser);
      mockUserRepository.save.mockResolvedValue(createdUser);

      const result = await service.register(userData);

      expect(result).toEqual({
        id: mockUser.id,
        email: userData.email,
        fullName: userData.fullName,
        timezone: userData.timezone,
        isActive: mockUser.isActive,
        role: mockUser.role,
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...userData,
        passwordHash: 'hashed-password',
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(createdUser);
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard data with mock tiles and suggestions', async () => {
      const result = await service.getDashboard('user-uuid');

      expect(result).toEqual({
        tiles: [
          { id: 'health', type: 'health', data: { score: 78 } },
          { id: 'finance', type: 'finance', data: { balance: 12345 } },
          { id: 'learning', type: 'learning', data: { progress: 32 } },
          { id: 'notifications', type: 'notifications', data: { count: 3 } },
        ],
        suggestions: [
          'Consider rescheduling your budget review.',
          'Great job on your workout!',
          'Log your meals for better tracking.',
          'Complete your daily learning goal.',
        ],
      });
    });
  });
});