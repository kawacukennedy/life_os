import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class FitbitService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.fitbit.com',
      timeout: 10000,
    });
  }

  getAuthUrl(userId: string): string {
    const clientId = process.env.FITBIT_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.FITBIT_REDIRECT_URI || 'http://localhost:3002/health/fitbit/callback');
    const scope = encodeURIComponent('activity heartrate profile sleep weight');

    return `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${userId}`;
  }

  async exchangeCodeForToken(code: string): Promise<any> {
    const clientId = process.env.FITBIT_CLIENT_ID;
    const clientSecret = process.env.FITBIT_CLIENT_SECRET;
    const redirectUri = process.env.FITBIT_REDIRECT_URI || 'http://localhost:3002/health/fitbit/callback';

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
      const response = await axios.post('https://api.fitbit.com/oauth2/token', null, {
        params: {
          client_id: clientId,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code: code,
        },
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error exchanging Fitbit code for token:', error);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<any> {
    const clientId = process.env.FITBIT_CLIENT_ID;
    const clientSecret = process.env.FITBIT_CLIENT_SECRET;
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
      const response = await axios.post('https://api.fitbit.com/oauth2/token', null, {
        params: {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        },
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error refreshing Fitbit access token:', error);
      throw error;
    }
  }

  async getUserProfile(accessToken: string): Promise<any> {
    try {
      const response = await this.client.get('/1/user/-/profile.json', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Fitbit user profile:', error);
      throw error;
    }
  }

  async getActivityData(accessToken: string, date: string): Promise<any> {
    try {
      const response = await this.client.get(`/1/user/-/activities/date/${date}.json`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Fitbit activity data:', error);
      throw error;
    }
  }

  async getHeartRateData(accessToken: string, date: string): Promise<any> {
    try {
      const response = await this.client.get(`/1/user/-/activities/heart/date/${date}/1d.json`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Fitbit heart rate data:', error);
      throw error;
    }
  }

  async getSleepData(accessToken: string, date: string): Promise<any> {
    try {
      const response = await this.client.get(`/1.2/user/-/sleep/date/${date}.json`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Fitbit sleep data:', error);
      throw error;
    }
  }

  async getWeightData(accessToken: string, date: string): Promise<any> {
    try {
      const response = await this.client.get(`/1/user/-/body/log/weight/date/${date}.json`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Fitbit weight data:', error);
      throw error;
    }
  }

  // Helper method to sync all health data for a user
  async syncHealthData(accessToken: string, userId: string): Promise<any> {
    const today = new Date().toISOString().split('T')[0];

    try {
      const [activity, heartRate, sleep, weight] = await Promise.allSettled([
        this.getActivityData(accessToken, today),
        this.getHeartRateData(accessToken, today),
        this.getSleepData(accessToken, today),
        this.getWeightData(accessToken, today),
      ]);

      return {
        activity: activity.status === 'fulfilled' ? activity.value : null,
        heartRate: heartRate.status === 'fulfilled' ? heartRate.value : null,
        sleep: sleep.status === 'fulfilled' ? sleep.value : null,
        weight: weight.status === 'fulfilled' ? weight.value : null,
        syncedAt: new Date(),
      };
    } catch (error) {
      console.error('Error syncing Fitbit health data:', error);
      throw error;
    }
  }
}