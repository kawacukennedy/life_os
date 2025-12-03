import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PrivacyGraphQLService {
  constructor(private httpService: HttpService) {}

  async getPrivacySettings(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.USER_PROFILE_SERVICE_URL || 'http://localhost:3001'}/profile/${userId}/privacy-settings`)
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch privacy settings');
    }
  }

  async updatePrivacySettings(userId: string, settings: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.put(`${process.env.USER_PROFILE_SERVICE_URL || 'http://localhost:3001'}/profile/${userId}/privacy-settings`, settings)
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to update privacy settings');
    }
  }

  async requestDataExport(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${process.env.USER_PROFILE_SERVICE_URL || 'http://localhost:3001'}/profile/${userId}/data-export`)
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to request data export');
    }
  }

  async deleteAccount(userId: string, confirmation: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${process.env.USER_PROFILE_SERVICE_URL || 'http://localhost:3001'}/profile/${userId}/delete-account`, {
          confirmation
        })
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete account');
    }
  }
}