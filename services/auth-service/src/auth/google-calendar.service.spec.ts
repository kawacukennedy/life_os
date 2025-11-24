import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleCalendarService } from './google-calendar.service';
import { User } from '../users/user.entity';
import { LoggerService } from './logger.service';
import { CacheService } from './cache.service';
import { BackgroundJobService } from './background-job.service';

describe('GoogleCalendarService', () => {
  let service: GoogleCalendarService;
  let userRepository: Repository<User>;
  let loggerService: LoggerService;
  let cacheService: CacheService;
  let backgroundJobService: BackgroundJobService;

  const mockUser = {
    id: 'user-uuid',
    email: 'test@example.com',
    googleTokens: {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiryDate: Date.now() + 3600000,
    },
  };

  const mockUserRepository = {
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
        GoogleCalendarService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
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

    service = module.get<GoogleCalendarService>(GoogleCalendarService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    loggerService = module.get<LoggerService>(LoggerService);
    cacheService = module.get<CacheService>(CacheService);
    backgroundJobService = module.get<BackgroundJobService>(BackgroundJobService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAuthUrl', () => {
    it('should generate Google OAuth URL', async () => {
      const result = await service.getAuthUrl('user-123');

      expect(typeof result).toBe('string');
      expect(result).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(result).toContain('scope=https%3A//www.googleapis.com/auth/calendar');
      expect(result).toContain('access_type=offline');
      expect(result).toContain('state=user-123');
    });
  });

  describe('handleCallback', () => {
    it('should handle OAuth callback and store tokens', async () => {
      const mockTokens = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expiry_date: Date.now() + 3600000,
      };

      // Mock the OAuth2 client methods
      const mockGetToken = jest.fn().mockResolvedValue({ tokens: mockTokens });
      const mockSetCredentials = jest.fn();

      // Mock the googleapis OAuth2 constructor
      const mockOAuth2 = jest.fn().mockImplementation(() => ({
        generateAuthUrl: jest.fn().mockReturnValue('auth-url'),
        getToken: mockGetToken,
        setCredentials: mockSetCredentials,
      }));

      // Replace the OAuth2 constructor
      (service as any).oauth2Client = new mockOAuth2();

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await service.handleCallback('auth-code', 'user-uuid');

      expect(mockGetToken).toHaveBeenCalledWith('auth-code');
      expect(mockUserRepository.update).toHaveBeenCalledWith('user-uuid', {
        googleTokens: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiryDate: mockTokens.expiry_date,
        },
      });
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Google Calendar tokens stored successfully',
        expect.objectContaining({ userId: 'user-uuid' })
      );
    });

    it('should throw error for invalid authorization code', async () => {
      const mockGetToken = jest.fn().mockRejectedValue(new Error('Invalid code'));
      const mockOAuth2 = jest.fn().mockImplementation(() => ({
        getToken: mockGetToken,
      }));

      (service as any).oauth2Client = new mockOAuth2();

      await expect(service.handleCallback('invalid-code', 'user-uuid')).rejects.toThrow(
        'Invalid code'
      );
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('getCalendarEvents', () => {
    it('should return cached events if available', async () => {
      const cachedEvents = { items: [{ id: 'event-1', summary: 'Test Event' }] };
      mockCacheService.getApiResponse.mockResolvedValue(cachedEvents);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getCalendarEvents('user-uuid');

      expect(result).toEqual(cachedEvents);
      expect(mockCacheService.getApiResponse).toHaveBeenCalledWith(
        'google',
        'calendar',
        'user-uuid'
      );
    });

    it('should fetch events from Google API when not cached', async () => {
      const apiEvents = { items: [{ id: 'event-1', summary: 'API Event' }] };

      mockCacheService.getApiResponse.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Mock the calendar API
      const mockCalendarEventsList = jest.fn().mockResolvedValue({ data: apiEvents });
      const mockCalendar = {
        events: {
          list: mockCalendarEventsList,
        },
      };

      // Mock googleapis
      jest.doMock('googleapis', () => ({
        google: {
          calendar: jest.fn().mockReturnValue(mockCalendar),
        },
      }));

      const result = await service.getCalendarEvents('user-uuid');

      expect(result).toEqual(apiEvents);
      expect(mockCalendarEventsList).toHaveBeenCalledWith({
        calendarId: 'primary',
        timeMin: expect.any(String),
        timeMax: expect.any(String),
        singleEvents: true,
        orderBy: 'startTime',
      });
      expect(mockCacheService.setApiResponse).toHaveBeenCalledWith(
        'google',
        'calendar',
        'user-uuid',
        apiEvents
      );
    });

    it('should handle API errors gracefully', async () => {
      mockCacheService.getApiResponse.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Mock API error
      const mockCalendarEventsList = jest.fn().mockRejectedValue(new Error('API Error'));
      const mockCalendar = {
        events: {
          list: mockCalendarEventsList,
        },
      };

      jest.doMock('googleapis', () => ({
        google: {
          calendar: jest.fn().mockReturnValue(mockCalendar),
        },
      }));

      await expect(service.getCalendarEvents('user-uuid')).rejects.toThrow('API Error');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should throw error if user has no Google tokens', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, googleTokens: null });

      await expect(service.getCalendarEvents('user-uuid')).rejects.toThrow(
        'User has not connected Google Calendar'
      );
    });
  });

  describe('createCalendarEvent', () => {
    const eventData = {
      summary: 'New Meeting',
      start: { dateTime: '2024-01-15T10:00:00Z' },
      end: { dateTime: '2024-01-15T11:00:00Z' },
    };

    it('should create event successfully', async () => {
      const createdEvent = { id: 'new-event-id', ...eventData };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const mockCalendarEventsInsert = jest.fn().mockResolvedValue({ data: createdEvent });
      const mockCalendar = {
        events: {
          insert: mockCalendarEventsInsert,
        },
      };

      jest.doMock('googleapis', () => ({
        google: {
          calendar: jest.fn().mockReturnValue(mockCalendar),
        },
      }));

      const result = await service.createCalendarEvent('user-uuid', eventData);

      expect(result).toEqual(createdEvent);
      expect(mockCalendarEventsInsert).toHaveBeenCalledWith({
        calendarId: 'primary',
        requestBody: eventData,
      });
      expect(mockCacheService.delete).toHaveBeenCalledWith('thirdparty:google:user-uuid:calendar');
    });

    it('should handle creation errors', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const mockCalendarEventsInsert = jest.fn().mockRejectedValue(new Error('Creation failed'));
      const mockCalendar = {
        events: {
          insert: mockCalendarEventsInsert,
        },
      };

      jest.doMock('googleapis', () => ({
        google: {
          calendar: jest.fn().mockReturnValue(mockCalendar),
        },
      }));

      await expect(service.createCalendarEvent('user-uuid', eventData)).rejects.toThrow(
        'Creation failed'
      );
    });
  });

  describe('updateCalendarEvent', () => {
    const eventData = {
      summary: 'Updated Meeting',
      start: { dateTime: '2024-01-15T11:00:00Z' },
      end: { dateTime: '2024-01-15T12:00:00Z' },
    };

    it('should update event successfully', async () => {
      const updatedEvent = { id: 'event-id', ...eventData };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const mockCalendarEventsUpdate = jest.fn().mockResolvedValue({ data: updatedEvent });
      const mockCalendar = {
        events: {
          update: mockCalendarEventsUpdate,
        },
      };

      jest.doMock('googleapis', () => ({
        google: {
          calendar: jest.fn().mockReturnValue(mockCalendar),
        },
      }));

      const result = await service.updateCalendarEvent('user-uuid', 'event-id', eventData);

      expect(result).toEqual(updatedEvent);
      expect(mockCalendarEventsUpdate).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'event-id',
        requestBody: eventData,
      });
      expect(mockCacheService.delete).toHaveBeenCalledWith('thirdparty:google:user-uuid:calendar');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh expired token', async () => {
      const expiredUser = {
        ...mockUser,
        googleTokens: {
          ...mockUser.googleTokens,
          expiryDate: Date.now() - 1000, // Expired
        },
      };

      const newTokens = {
        access_token: 'new-access-token',
        expiry_date: Date.now() + 3600000,
      };

      mockUserRepository.findOne.mockResolvedValue(expiredUser);

      const mockRefreshToken = jest.fn().mockResolvedValue({
        credentials: { access_token: 'new-access-token', expiry_date: Date.now() + 3600000 },
      });
      const mockOAuth2 = jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn(),
        refreshAccessToken: mockRefreshToken,
      }));

      (service as any).oauth2Client = new mockOAuth2();

      await (service as any).refreshAccessToken('user-uuid');

      expect(mockRefreshToken).toHaveBeenCalled();
      expect(mockUserRepository.update).toHaveBeenCalledWith('user-uuid', {
        googleTokens: {
          ...expiredUser.googleTokens,
          accessToken: 'new-access-token',
          expiryDate: expect.any(Number),
        },
      });
    });

    it('should not refresh valid token', async () => {
      const validUser = {
        ...mockUser,
        googleTokens: {
          ...mockUser.googleTokens,
          expiryDate: Date.now() + 3600000, // Valid for 1 hour
        },
      };

      mockUserRepository.findOne.mockResolvedValue(validUser);

      await (service as any).refreshAccessToken('user-uuid');

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });
});