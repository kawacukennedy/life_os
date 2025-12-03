import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LearningService {
  constructor(private readonly httpService: HttpService) {}

  async getLearningProgress(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.LEARNING_SERVICE_URL || 'http://localhost:3005'}/learning/progress-summary?userId=${userId}`)
      );
      return response.data;
    } catch (error) {
      return {
        userId,
        totalCourses: 0,
        completedCourses: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        averageProgress: 0,
        courses: [],
        recentAchievements: [],
      };
    }
  }

  async getLearningRecommendations(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.LEARNING_SERVICE_URL || 'http://localhost:3005'}/learning/recommendations-summary?userId=${userId}`)
      );
      return response.data;
    } catch (error) {
      return {
        recommendations: [],
      };
    }
  }
}