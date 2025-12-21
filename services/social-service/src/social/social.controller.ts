import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SocialService } from './social.service';
import { TwitterService } from './twitter.service';
import { LinkedInService } from './linkedin.service';
import { Connection } from './connection.entity';
import { SharedGoal } from './shared-goal.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(
    private readonly socialService: SocialService,
    private readonly twitterService: TwitterService,
    private readonly linkedinService: LinkedInService,
  ) {}

  // Connection endpoints
  @Post('connections/request')
  sendConnectionRequest(
    @Body() body: { requesterId: string; addresseeId: string; message?: string },
  ): Promise<Connection> {
    return this.socialService.sendConnectionRequest(body.requesterId, body.addresseeId, body.message);
  }

  @Post('connections/:id/accept')
  acceptConnection(@Param('id') id: string, @Body('userId') userId: string): Promise<Connection> {
    return this.socialService.acceptConnection(id, userId);
  }

  @Get('connections/:userId')
  getConnections(@Param('userId') userId: string): Promise<Connection[]> {
    return this.socialService.getConnections(userId);
  }

  @Get('connections-summary/:userId')
  getSocialConnections(@Param('userId') userId: string) {
    return this.socialService.getSocialConnections(userId);
  }

  @Get('connections/pending/:userId')
  getPendingRequests(@Param('userId') userId: string): Promise<Connection[]> {
    return this.socialService.getPendingRequests(userId);
  }

  // Shared Goal endpoints
  @Post('goals')
  createSharedGoal(@Body() createGoalDto: Partial<SharedGoal>): Promise<SharedGoal> {
    return this.socialService.createSharedGoal(createGoalDto);
  }

  @Post('goals/:id/join')
  joinSharedGoal(@Param('id') id: string, @Body('userId') userId: string): Promise<SharedGoal> {
    return this.socialService.joinSharedGoal(id, userId);
  }

  @Patch('goals/:id/progress')
  updateGoalProgress(
    @Param('id') id: string,
    @Body() body: { userId: string; progress: any },
  ): Promise<SharedGoal> {
    return this.socialService.updateGoalProgress(id, body.userId, body.progress);
  }

  @Get('goals/:userId')
  getSharedGoals(@Param('userId') userId: string): Promise<SharedGoal[]> {
    return this.socialService.getSharedGoals(userId);
  }

  @Get('goals/public/all')
  getPublicGoals(): Promise<SharedGoal[]> {
    return this.socialService.getPublicGoals();
  }

  @Get('goals/type/:type')
  getGoalsByType(@Param('type') type: string, @Query('userId') userId?: string): Promise<SharedGoal[]> {
    return this.socialService.getGoalsByType(type, userId);
  }

  @Post('goals/:id/complete')
  completeGoal(@Param('id') id: string, @Body('userId') userId: string): Promise<SharedGoal> {
    return this.socialService.completeGoal(id, userId);
  }

  // Recommendation endpoints
  @Get('recommendations/connections/:userId')
  getRecommendedConnections(@Param('userId') userId: string, @Query('profile') profile: any): Promise<any[]> {
    return this.socialService.getRecommendedConnections(userId, profile);
  }

  @Get('recommendations/goals/:userId')
  getRecommendedGoals(@Param('userId') userId: string, @Query('profile') profile: any): Promise<SharedGoal[]> {
    return this.socialService.getRecommendedGoals(userId, profile);
  }

  @Get('recommendations/similar-users/:userId')
  getSimilarUsers(@Param('userId') userId: string, @Query('profile') profile: any): Promise<any[]> {
    return this.socialService.getSimilarUsers(userId, profile);
  }

  // Twitter integration endpoints
  @Get('twitter/auth-url/:userId')
  getTwitterAuthUrl(@Param('userId') userId: string): Promise<string> {
    return this.twitterService.getAuthUrl(userId);
  }

  @Post('twitter/callback')
  handleTwitterCallback(@Body() body: { code: string; state: string }): Promise<void> {
    return this.twitterService.handleCallback(body.code, body.state);
  }

  @Get('twitter/tweets/:userId')
  getUserTweets(@Param('userId') userId: string, @Query('maxResults') maxResults?: number): Promise<any[]> {
    return this.twitterService.getUserTweets(userId, maxResults);
  }

  @Get('twitter/profile/:userId')
  getTwitterProfile(@Param('userId') userId: string): Promise<any> {
    return this.twitterService.getUserProfile(userId);
  }

  @Get('twitter/search')
  searchTweets(@Query('query') query: string): Promise<any[]> {
    return this.twitterService.searchTweets(query);
  }

  @Get('twitter/trending')
  getTrendingTopics(): Promise<any[]> {
    return this.twitterService.getTrendingTopics();
  }

  @Delete('twitter/disconnect/:userId')
  disconnectTwitter(@Param('userId') userId: string): Promise<void> {
    return this.twitterService.disconnect(userId);
  }

  // LinkedIn integration endpoints
  @Get('linkedin/auth-url/:userId')
  getLinkedInAuthUrl(@Param('userId') userId: string): Promise<string> {
    return this.linkedinService.getAuthUrl(userId);
  }

  @Post('linkedin/callback')
  handleLinkedInCallback(@Body() body: { code: string; state: string }): Promise<void> {
    return this.linkedinService.handleCallback(body.code, body.state);
  }

  @Get('linkedin/profile/:userId')
  getLinkedInProfile(@Param('userId') userId: string): Promise<any> {
    return this.linkedinService.getUserProfile(userId);
  }

  @Get('linkedin/connections/:userId')
  getLinkedInConnections(@Param('userId') userId: string): Promise<any[]> {
    return this.linkedinService.getUserConnections(userId);
  }

  @Post('linkedin/share/:userId')
  shareOnLinkedIn(
    @Param('userId') userId: string,
    @Body() body: { content: string; visibility?: string }
  ): Promise<any> {
    return this.linkedinService.shareContent(userId, body.content, body.visibility);
  }

  @Get('linkedin/search/people')
  searchLinkedInPeople(@Query('query') query: string): Promise<any[]> {
    return this.linkedinService.searchPeople(query);
  }

  @Get('linkedin/company/:companyId/updates')
  getCompanyUpdates(@Param('companyId') companyId: string): Promise<any[]> {
    return this.linkedinService.getCompanyUpdates(companyId);
  }

  @Post('linkedin/enrich-profile/:userId')
  enrichUserProfile(@Param('userId') userId: string): Promise<any> {
    return this.linkedinService.enrichUserProfile(userId);
  }

  @Delete('linkedin/disconnect/:userId')
  disconnectLinkedIn(@Param('userId') userId: string): Promise<void> {
    return this.linkedinService.disconnect(userId);
  }
}