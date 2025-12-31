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

  // Real-time subscription methods
  async createSubscription(accessToken: string, subscriptionId: string, collectionPath: string): Promise<any> {
    try {
      const response = await this.client.post('/1/user/-/apiSubscriptions.json', null, {
        params: {
          subscriptionId,
          collectionPath,
        },
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating Fitbit subscription:', error);
      throw error;
    }
  }

  async deleteSubscription(accessToken: string, subscriptionId: string, collectionPath: string): Promise<any> {
    try {
      const response = await this.client.delete('/1/user/-/apiSubscriptions.json', {
        params: {
          subscriptionId,
          collectionPath,
        },
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting Fitbit subscription:', error);
      throw error;
    }
  }

  async getSubscriptions(accessToken: string): Promise<any> {
    try {
      const response = await this.client.get('/1/user/-/apiSubscriptions.json', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Fitbit subscriptions:', error);
      throw error;
    }
  }

  // Webhook handling for real-time updates
  async handleWebhook(body: any, headers: any): Promise<void> {
    // Verify webhook signature if needed (Fitbit doesn't provide signature verification in basic tier)
    const events = body;

    for (const event of events) {
      const { collectionType, date, ownerId, subscriptionId } = event;

      console.log(`Fitbit webhook received: ${collectionType} for user ${ownerId} on ${date}`);

      // Trigger data sync for the affected user and date
      // This would typically emit an event or call a service method to sync data
      // For now, we'll just log it
      switch (collectionType) {
        case 'activities':
          console.log('Activity data updated, triggering sync...');
          break;
        case 'body':
          console.log('Body data updated, triggering sync...');
          break;
        case 'sleep':
          console.log('Sleep data updated, triggering sync...');
          break;
        default:
          console.log(`Unknown collection type: ${collectionType}`);
      }
    }
  }

  // Enhanced sync method with real-time capabilities
  async syncHealthData(accessToken: string, userId: string, date?: string): Promise<any> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    try {
      const [activity, heartRate, sleep, weight] = await Promise.allSettled([
        this.getActivityData(accessToken, targetDate),
        this.getHeartRateData(accessToken, targetDate),
        this.getSleepData(accessToken, targetDate),
        this.getWeightData(accessToken, targetDate),
      ]);

      return {
        activity: activity.status === 'fulfilled' ? activity.value : null,
        heartRate: heartRate.status === 'fulfilled' ? heartRate.value : null,
        sleep: sleep.status === 'fulfilled' ? sleep.value : null,
        weight: weight.status === 'fulfilled' ? weight.value : null,
        syncedAt: new Date(),
        date: targetDate,
      };
    } catch (error) {
      console.error('Error syncing Fitbit health data:', error);
      throw error;
    }
  }

  // Setup real-time subscriptions for a user
  async setupRealTimeSubscriptions(accessToken: string, userId: string): Promise<any> {
    const subscriptions = [
      { id: `${userId}-activities`, path: 'activities' },
      { id: `${userId}-body`, path: 'body' },
      { id: `${userId}-sleep`, path: 'sleep' },
    ];

    const results = [];

    for (const sub of subscriptions) {
      try {
        const result = await this.createSubscription(accessToken, sub.id, sub.path);
        results.push({ subscription: sub, result, success: true });
      } catch (error) {
        console.error(`Failed to create subscription ${sub.id}:`, error);
        results.push({ subscription: sub, error, success: false });
      }
    }

    return results;
  }
}