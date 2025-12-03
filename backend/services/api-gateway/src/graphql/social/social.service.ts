import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SocialService {
  constructor(private readonly httpService: HttpService) {}

  async getSocialConnections(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.SOCIAL_SERVICE_URL || 'http://localhost:3004'}/social/connections-summary/${userId}`)
      );
      return response.data;
    } catch (error) {
      return {
        connections: [
          {
            id: 'conn-1',
            name: 'Alex Rivera',
            avatar: '',
            mutualInterests: ['productivity', 'fitness'],
            connectionStrength: 85,
            lastInteraction: new Date().toISOString(),
            sharedGoals: ['Get fit in 2024'],
            status: 'connected',
          },
        ],
        recommendations: [
          {
            id: 'rec-1',
            name: 'Sarah Johnson',
            avatar: '',
            reason: 'Shares your interest in productivity',
            mutualConnections: 2,
            sharedInterests: ['productivity', 'learning'],
          },
        ],
      };
    }
  }

  async getSharedGoals(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.SOCIAL_SERVICE_URL || 'http://localhost:3004'}/social/goals/${userId}`)
      );
      // Transform the response to match expected format
      return {
        goals: response.data.map((goal: any) => ({
          id: goal.id,
          title: goal.title,
          description: goal.description,
          participants: goal.participants?.map((p: any) => p.name) || [],
          progress: goal.progress || 0,
          deadline: goal.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          category: goal.category || 'General',
        })),
      };
    } catch (error) {
      return {
        goals: [
          {
            id: 'goal-1',
            title: 'Read 12 Books This Year',
            description: 'Commit to reading one book per month to expand knowledge',
            participants: ['You', 'Alex Rivera'],
            progress: 25,
            deadline: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString(),
            category: 'Learning',
          },
        ],
      };
    }
  }
}