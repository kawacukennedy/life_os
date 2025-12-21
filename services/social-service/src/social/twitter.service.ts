import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { User } from '../../users/user.entity';

@Injectable()
export class TwitterService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private httpService: HttpService,
  ) {}

  async getAuthUrl(userId: string): Promise<string> {
    // Twitter OAuth 2.0 implementation
    const clientId = process.env.TWITTER_CLIENT_ID;
    const redirectUri = process.env.TWITTER_REDIRECT_URI || 'http://localhost:3000/auth/twitter/callback';

    const scopes = ['tweet.read', 'users.read', 'follows.read', 'like.read'];

    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes.join(' '))}&state=${userId}&code_challenge=challenge&code_challenge_method=plain`;

    return authUrl;
  }

  async handleCallback(code: string, state: string): Promise<void> {
    try {
      const tokenResponse = await this.exchangeCodeForToken(code);
      const userId = state;

      // Store Twitter tokens
      await this.usersRepository.update(userId, {
        twitterTokens: {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
        },
      });
    } catch (error) {
      console.error('Twitter OAuth callback error:', error);
      throw error;
    }
  }

  private async exchangeCodeForToken(code: string): Promise<any> {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const redirectUri = process.env.TWITTER_REDIRECT_URI || 'http://localhost:3000/auth/twitter/callback';

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await firstValueFrom(
      this.httpService.post('https://api.twitter.com/2/oauth2/token', {
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: 'challenge', // In production, use proper PKCE
      }, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    );

    return response.data;
  }

  async getUserTweets(userId: string, maxResults = 10): Promise<any[]> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user?.twitterTokens) {
      throw new Error('User not connected to Twitter');
    }

    // Check if token needs refresh
    if (this.isTokenExpired(user.twitterTokens.expiresAt)) {
      await this.refreshAccessToken(userId);
    }

    const updatedUser = await this.usersRepository.findOne({ where: { id: userId } });

    try {
      const response = await firstValueFrom(
        this.httpService.get('https://api.twitter.com/2/users/me/tweets', {
          headers: {
            'Authorization': `Bearer ${updatedUser.twitterTokens.accessToken}`,
          },
          params: {
            max_results: maxResults,
            'tweet.fields': 'created_at,public_metrics,context_annotations',
          },
        })
      );

      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching tweets:', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user?.twitterTokens) {
      throw new Error('User not connected to Twitter');
    }

    const response = await firstValueFrom(
      this.httpService.get('https://api.twitter.com/2/users/me', {
        headers: {
          'Authorization': `Bearer ${user.twitterTokens.accessToken}`,
        },
        params: {
          'user.fields': 'description,location,public_metrics,verified',
        },
      })
    );

    return response.data.data;
  }

  async searchTweets(query: string, userId?: string): Promise<any[]> {
    // Public search doesn't require authentication
    const response = await firstValueFrom(
      this.httpService.get('https://api.twitter.com/2/tweets/search/recent', {
        params: {
          query,
          max_results: 10,
          'tweet.fields': 'created_at,author_id,public_metrics',
          'user.fields': 'username,name',
          expansions: 'author_id',
        },
      })
    );

    return response.data.data || [];
  }

  async getTrendingTopics(): Promise<any[]> {
    // Get trending topics (requires Bearer token from app)
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;

    const response = await firstValueFrom(
      this.httpService.get('https://api.twitter.com/1.1/trends/place.json', {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
        },
        params: {
          id: 1, // Worldwide
        },
      })
    );

    return response.data[0]?.trends || [];
  }

  async disconnect(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      twitterTokens: null,
    });
  }

  private async refreshAccessToken(userId: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user?.twitterTokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
      const response = await firstValueFrom(
        this.httpService.post('https://api.twitter.com/2/oauth2/token', {
          refresh_token: user.twitterTokens.refreshToken,
          grant_type: 'refresh_token',
      }, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }));

      await this.usersRepository.update(userId, {
        twitterTokens: {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token || user.twitterTokens.refreshToken,
          expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
        },
      });
    } catch (error) {
      console.error('Error refreshing Twitter token:', error);
      throw error;
    }
  }

  private isTokenExpired(expiresAt: Date): boolean {
    return new Date() >= new Date(expiresAt.getTime() - 5 * 60 * 1000); // 5 minutes buffer
  }
}