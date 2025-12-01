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
import { Connection } from './connection.entity';
import { SharedGoal } from './shared-goal.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

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
}