import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AIService {
  constructor(private readonly httpService: HttpService) {}

  async getSuggestions(userId: string, context: string, maxResults = 5) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${process.env.AI_SERVICE_URL || 'http://localhost:3009'}/ai/suggest`, {
          userId,
          context,
          maxResults,
        })
      );
      return response.data;
    } catch (error) {
      // Return fallback suggestions
      return {
        suggestions: [
          {
            id: 'fallback-1',
            type: 'health',
            confidence: 0.7,
            payload: JSON.stringify({
              action: 'drink_water',
              reason: 'Stay hydrated for better focus',
            }),
            createdAt: new Date(),
          },
        ],
        modelMeta: JSON.stringify({
          model: 'fallback',
          reason: 'AI service unavailable',
        }),
      };
    }
  }

  async optimizeSchedule(userId: string, tasks: any[], constraints: any = {}) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${process.env.AI_SERVICE_URL || 'http://localhost:3009'}/ai/optimize-schedule`, {
          userId,
          tasks,
          constraints,
        })
      );
      return response.data;
    } catch (error) {
      return {
        optimizedTasks: tasks,
        reasoning: 'Fallback: no optimization applied',
        modelMeta: JSON.stringify({
          model: 'fallback',
          reason: 'AI service unavailable',
        }),
      };
    }
  }

  async getPersonalizedRecommendations(userId: string, userData: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${process.env.AI_SERVICE_URL || 'http://localhost:3009'}/ai/recommendations`, {
          userId,
          userData,
        })
      );
      return response.data;
    } catch (error) {
      return {
        recommendations: [],
        modelMeta: JSON.stringify({
          model: 'fallback',
          reason: 'AI service unavailable',
        }),
      };
    }
  }
}