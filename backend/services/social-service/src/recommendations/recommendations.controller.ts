import { Controller, Get, Query, UseGuards, Request, Body, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RecommendationsService, UserProfile } from './recommendations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('recommendations')
@ApiBearerAuth()
@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post()
  @ApiOperation({ summary: 'Get personalized user recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved successfully' })
  async getRecommendations(
    @Request() req,
    @Body() body: {
      userProfile: UserProfile;
      allUsers: UserProfile[];
      limit?: number;
    },
  ) {
    const limit = body.limit || 10;
    return this.recommendationsService.getRecommendations(
      req.user.userId,
      body.userProfile,
      body.allUsers,
      limit,
    );
  }

  @Get('similar')
  @ApiOperation({ summary: 'Get similar users based on criteria' })
  @ApiResponse({ status: 200, description: 'Similar users retrieved successfully' })
  async getSimilarUsers(
    @Request() req,
    @Query('criteria') criteria: 'goals' | 'interests' | 'location' | 'lifestyle' = 'goals',
    @Body() body: { userProfile: UserProfile; allUsers: UserProfile[] },
  ) {
    return this.recommendationsService.getSimilarUsers(
      req.user.userId,
      body.userProfile,
      body.allUsers,
      criteria,
    );
  }

  @Post('goals')
  @ApiOperation({ summary: 'Get goal-based user recommendations' })
  @ApiResponse({ status: 200, description: 'Goal-based recommendations retrieved successfully' })
  async getGoalBasedRecommendations(
    @Request() req,
    @Body() body: { userGoals: string[]; allUsers: UserProfile[] },
  ) {
    return this.recommendationsService.getGoalBasedRecommendations(
      req.user.userId,
      body.userGoals,
      body.allUsers,
    );
  }

  @Post('activity')
  @ApiOperation({ summary: 'Get activity-based user recommendations' })
  @ApiResponse({ status: 200, description: 'Activity-based recommendations retrieved successfully' })
  async getActivityBasedRecommendations(
    @Request() req,
    @Body() body: { userActivities: string[]; allUsers: UserProfile[] },
  ) {
    return this.recommendationsService.getActivityBasedRecommendations(
      req.user.userId,
      body.userActivities,
      body.allUsers,
    );
  }
}