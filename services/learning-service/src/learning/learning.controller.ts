import { Controller, Get, Post, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LearningService } from './learning.service';

@Controller('learning')
@UseGuards(JwtAuthGuard)
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Get('courses')
  async getCourses(@Query('category') category?: string) {
    return this.learningService.getCourses(category);
  }

  @Get('progress')
  async getUserProgress(@Query('userId') userId: string) {
    return this.learningService.getUserProgress(userId);
  }

  @Post('courses/:courseId/start')
  async startCourse(
    @Param('courseId') courseId: string,
    @Body('userId') userId: string,
  ) {
    return this.learningService.startCourse(userId, courseId);
  }

  @Patch('progress')
  async updateProgress(
    @Body() body: {
      userId: string;
      courseId: string;
      lessonId: string;
      progressPercent: number;
    },
  ) {
    return this.learningService.updateProgress(
      body.userId,
      body.courseId,
      body.lessonId,
      body.progressPercent,
    );
  }

  @Get('recommendations')
  async getRecommendations(@Query('userId') userId: string) {
    return this.learningService.getRecommendations(userId);
  }

  @Get('stats')
  async getLearningStats(@Query('userId') userId: string) {
    return this.learningService.getLearningStats(userId);
  }

  @Get('progress-summary')
  async getLearningProgress(@Query('userId') userId: string) {
    return this.learningService.getLearningProgress(userId);
  }

  @Get('recommendations-summary')
  async getLearningRecommendations(@Query('userId') userId: string) {
    return this.learningService.getLearningRecommendations(userId);
  }
}