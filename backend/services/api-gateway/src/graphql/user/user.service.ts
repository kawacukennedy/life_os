import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UserService {
  constructor(private readonly httpService: HttpService) {}

  async getUserProfile(userId: string) {
    try {
      // Call user-profile-service
      const profileResponse = await firstValueFrom(
        this.httpService.get(`${process.env.USER_PROFILE_SERVICE_URL || 'http://localhost:3007'}/profile/${userId}`)
      );

      // Call auth-service for user details
      const userResponse = await firstValueFrom(
        this.httpService.get(`${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}/auth/user/${userId}`)
      );

      return {
        user: userResponse.data,
        profile: profileResponse.data,
        connectedIntegrations: profileResponse.data.connectedIntegrations || [],
      };
    } catch (error) {
      throw new Error('Failed to fetch user profile');
    }
  }

  async updateUser(userId: string, updates: any) {
    try {
      // Call auth-service to update user
      const response = await firstValueFrom(
        this.httpService.put(`${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}/auth/user/${userId}`, updates)
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to update user');
    }
  }

  async updateUserProfile(userId: string, profileData: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.put(`${process.env.USER_PROFILE_SERVICE_URL || 'http://localhost:3007'}/profile/${userId}`, profileData)
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to update user profile');
    }
  }
}