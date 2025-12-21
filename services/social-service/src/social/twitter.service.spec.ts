import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { of, throwError } from 'rxjs';
import { TwitterService } from './twitter.service';
import { User } from '../../users/user.entity';

describe('TwitterService', () => {
  let service: TwitterService;
  let userRepository: Repository<User>;
  let httpService: HttpService;

  const mockUser = {
    id: 'user-123',
    twitterTokens: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    },
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwitterService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<TwitterService>(TwitterService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuthUrl', () => {
    it('should generate correct Twitter OAuth URL', () => {
      process.env.TWITTER_CLIENT_ID = 'test-client-id';
      process.env.TWITTER_REDIRECT_URI = 'http://localhost:3000/callback';

      const result = service.getAuthUrl('user-123');

      expect(result).toContain('https://twitter.com/i/oauth2/authorize');
      expect(result).toContain('response_type=code');
      expect(result).toContain('client_id=test-client-id');
      expect(result).toContain('state=user-123');
      expect(result).toContain('scope=tweet.read%20users.read%20follows.read%20like.read');
    });
  });

  describe('handleCallback', () => {
    it('should exchange code for token and update user', async () => {
      const mockTokenResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
      };

      mockHttpService.post.mockReturnValue(of({ data: mockTokenResponse }));
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(undefined);

      await service.handleCallback('auth-code', 'user-123');

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.twitter.com/2/oauth2/token',
        expect.objectContaining({
          code: 'auth-code',
          grant_type: 'authorization_code',
        }),
        expect.any(Object)
      );

      expect(mockUserRepository.update).toHaveBeenCalledWith('user-123', {
        twitterTokens: expect.objectContaining({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        }),
      });
    });

    it('should throw error on token exchange failure', async () => {
      mockHttpService.post.mockReturnValue(throwError(() => new Error('Token exchange failed')));

      await expect(service.handleCallback('auth-code', 'user-123')).rejects.toThrow('Token exchange failed');
    });
  });

  describe('getUserTweets', () => {
    it('should fetch user tweets successfully', async () => {
      const mockTweets = [
        { id: '1', text: 'Hello world!', created_at: '2023-01-01T00:00:00Z' },
      ];

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockHttpService.get.mockReturnValue(of({ data: { data: mockTweets } }));

      const result = await service.getUserTweets('user-123');

      expect(result).toEqual(mockTweets);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://api.twitter.com/2/users/me/tweets',
        expect.objectContaining({
          headers: { Authorization: 'Bearer mock-access-token' },
          params: expect.objectContaining({ max_results: 10 }),
        })
      );
    });

    it('should throw error if user not connected', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, twitterTokens: null });

      await expect(service.getUserTweets('user-123')).rejects.toThrow('User not connected to Twitter');
    });

    it('should refresh token if expired', async () => {
      const expiredUser = {
        ...mockUser,
        twitterTokens: { ...mockUser.twitterTokens, expiresAt: new Date(Date.now() - 1000) },
      };

      const mockRefreshResponse = {
        access_token: 'refreshed-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
      };

      mockUserRepository.findOne.mockResolvedValueOnce(expiredUser);
      mockHttpService.post.mockReturnValue(of({ data: mockRefreshResponse }));
      mockUserRepository.update.mockResolvedValue(undefined);
      mockUserRepository.findOne.mockResolvedValueOnce({
        ...expiredUser,
        twitterTokens: { ...expiredUser.twitterTokens, accessToken: 'refreshed-token' },
      });
      mockHttpService.get.mockReturnValue(of({ data: { data: [] } }));

      await service.getUserTweets('user-123');

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.twitter.com/2/oauth2/token',
        expect.objectContaining({ grant_type: 'refresh_token' }),
        expect.any(Object)
      );
    });
  });

  describe('getUserProfile', () => {
    it('should fetch user profile successfully', async () => {
      const mockProfile = {
        id: 'twitter-user-123',
        name: 'John Doe',
        username: 'johndoe',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockHttpService.get.mockReturnValue(of({ data: mockProfile }));

      const result = await service.getUserProfile('user-123');

      expect(result).toEqual(mockProfile);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://api.twitter.com/2/users/me',
        expect.objectContaining({
          headers: { Authorization: 'Bearer mock-access-token' },
        })
      );
    });
  });

  describe('searchTweets', () => {
    it('should search tweets without authentication', async () => {
      const mockSearchResults = {
        data: [{ id: '1', text: 'Search result' }],
      };

      mockHttpService.get.mockReturnValue(of(mockSearchResults));

      const result = await service.searchTweets('test query');

      expect(result).toEqual(mockSearchResults.data);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://api.twitter.com/2/tweets/search/recent',
        expect.objectContaining({
          params: expect.objectContaining({ query: 'test query' }),
        })
      );
    });
  });

  describe('getTrendingTopics', () => {
    it('should fetch trending topics', async () => {
      const mockTrends = {
        trends: [
          { name: '#TrendingTopic', tweet_volume: 1000 },
        ],
      };

      process.env.TWITTER_BEARER_TOKEN = 'bearer-token';
      mockHttpService.get.mockReturnValue(of({ data: [mockTrends] }));

      const result = await service.getTrendingTopics();

      expect(result).toEqual(mockTrends.trends);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://api.twitter.com/1.1/trends/place.json',
        expect.objectContaining({
          headers: { Authorization: 'Bearer bearer-token' },
        })
      );
    });
  });

  describe('disconnect', () => {
    it('should clear Twitter tokens', async () => {
      mockUserRepository.update.mockResolvedValue(undefined);

      await service.disconnect('user-123');

      expect(mockUserRepository.update).toHaveBeenCalledWith('user-123', {
        twitterTokens: null,
      });
    });
  });
});