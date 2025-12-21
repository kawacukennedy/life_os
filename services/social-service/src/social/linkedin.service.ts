import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { User } from '../../users/user.entity';

@Injectable()
export class LinkedInService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private httpService: HttpService,
  ) {}

  async getAuthUrl(userId: string): Promise<string> {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/auth/linkedin/callback';

    const scopes = ['r_liteprofile', 'r_emailaddress', 'w_member_social'];

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes.join(' '))}&state=${userId}`;

    return authUrl;
  }

  async handleCallback(code: string, state: string): Promise<void> {
    try {
      const tokenResponse = await this.exchangeCodeForToken(code);
      const userId = state;

      // Store LinkedIn tokens
      await this.usersRepository.update(userId, {
        linkedinTokens: {
          accessToken: tokenResponse.access_token,
          expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
        },
      });
    } catch (error) {
      console.error('LinkedIn OAuth callback error:', error);
      throw error;
    }
  }

  private async exchangeCodeForToken(code: string): Promise<any> {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/auth/linkedin/callback';

    const response = await firstValueFrom(
      this.httpService.post('https://www.linkedin.com/oauth/v2/accessToken', {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    );

    return response.data;
  }

  async getUserProfile(userId: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user?.linkedinTokens) {
      throw new Error('User not connected to LinkedIn');
    }

    // Check if token needs refresh
    if (this.isTokenExpired(user.linkedinTokens.expiresAt)) {
      throw new Error('LinkedIn token expired - needs reauthorization');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get('https://api.linkedin.com/v2/people/~', {
          headers: {
            'Authorization': `Bearer ${user.linkedinTokens.accessToken}`,
          },
          params: {
            projection: '(id,firstName,lastName,headline,summary,industryName,experience,education,skills)',
          },
        })
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching LinkedIn profile:', error);
      throw error;
    }
  }

  async getUserConnections(userId: string): Promise<any[]> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user?.linkedinTokens) {
      throw new Error('User not connected to LinkedIn');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get('https://api.linkedin.com/v2/connections', {
          headers: {
            'Authorization': `Bearer ${user.linkedinTokens.accessToken}`,
          },
          params: {
            count: 50,
            projection: '(elements*(to~(id,firstName,lastName,headline)))',
          },
        })
      );

      return response.data.elements || [];
    } catch (error) {
      console.error('Error fetching LinkedIn connections:', error);
      throw error;
    }
  }

  async shareContent(userId: string, content: string, visibility = 'PUBLIC'): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user?.linkedinTokens) {
      throw new Error('User not connected to LinkedIn');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post('https://api.linkedin.com/v2/ugcPosts', {
          author: `urn:li:person:${user.linkedinProfileId}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: content,
              },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': visibility,
          },
        }, {
          headers: {
            'Authorization': `Bearer ${user.linkedinTokens.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        })
      );

      return response.data;
    } catch (error) {
      console.error('Error sharing content on LinkedIn:', error);
      throw error;
    }
  }

  async searchPeople(query: string, userId?: string): Promise<any[]> {
    // LinkedIn People Search API requires special access
    // This is a simplified implementation
    const bearerToken = process.env.LINKEDIN_BEARER_TOKEN;

    if (!bearerToken) {
      throw new Error('LinkedIn bearer token not configured');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get('https://api.linkedin.com/v2/people-search', {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
          },
          params: {
            keywords: query,
            count: 10,
          },
        })
      );

      return response.data.elements || [];
    } catch (error) {
      console.error('Error searching LinkedIn people:', error);
      throw error;
    }
  }

  async getCompanyUpdates(companyId: string): Promise<any[]> {
    const bearerToken = process.env.LINKEDIN_BEARER_TOKEN;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://api.linkedin.com/v2/companies/${companyId}/updates`, {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
          },
          params: {
            count: 20,
          },
        })
      );

      return response.data.elements || [];
    } catch (error) {
      console.error('Error fetching company updates:', error);
      throw error;
    }
  }

  async disconnect(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      linkedinTokens: null,
      linkedinProfileId: null,
    });
  }

  private isTokenExpired(expiresAt: Date): boolean {
    return new Date() >= new Date(expiresAt.getTime() - 5 * 60 * 1000); // 5 minutes buffer
  }

  async enrichUserProfile(userId: string): Promise<any> {
    const linkedinProfile = await this.getUserProfile(userId);
    const connections = await this.getUserConnections(userId);

    // Extract professional information
    const enrichedData = {
      professionalTitle: linkedinProfile.headline,
      industry: linkedinProfile.industryName,
      summary: linkedinProfile.summary,
      experience: linkedinProfile.experience?.values || [],
      education: linkedinProfile.education?.values || [],
      skills: linkedinProfile.skills?.values || [],
      networkSize: connections.length,
      topCompanies: this.extractTopCompanies(linkedinProfile.experience?.values || []),
    };

    // Update user profile with LinkedIn data
    await this.usersRepository.update(userId, {
      linkedinProfileId: linkedinProfile.id,
      professionalTitle: enrichedData.professionalTitle,
      industry: enrichedData.industry,
      professionalSummary: enrichedData.summary,
      skills: enrichedData.skills,
      networkSize: enrichedData.networkSize,
    });

    return enrichedData;
  }

  private extractTopCompanies(experience: any[]): string[] {
    const companyCounts = {};

    experience.forEach(exp => {
      const company = exp.companyName;
      if (company) {
        companyCounts[company] = (companyCounts[company] || 0) + 1;
      }
    });

    return Object.entries(companyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([company]) => company);
  }
}