import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Connection, ConnectionStatus } from './connection.entity';
import { SharedGoal, GoalStatus } from './shared-goal.entity';

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(Connection)
    private connectionRepository: Repository<Connection>,
    @InjectRepository(SharedGoal)
    private sharedGoalRepository: Repository<SharedGoal>,
    private httpService: HttpService,
  ) {}

  // Connection methods
  async sendConnectionRequest(requesterId: string, addresseeId: string, message?: string): Promise<Connection> {
    const existingConnection = await this.connectionRepository.findOne({
      where: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    });

    if (existingConnection) {
      throw new Error('Connection already exists');
    }

    const connection = this.connectionRepository.create({
      requesterId,
      addresseeId,
      message,
    });

    return this.connectionRepository.save(connection);
  }

  async acceptConnection(connectionId: string, userId: string): Promise<Connection> {
    const connection = await this.connectionRepository.findOne({
      where: { id: connectionId, addresseeId: userId },
    });

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    connection.status = ConnectionStatus.ACCEPTED;
    return this.connectionRepository.save(connection);
  }

  async getConnections(userId: string): Promise<Connection[]> {
    return this.connectionRepository.find({
      where: [
        { requesterId: userId, status: ConnectionStatus.ACCEPTED },
        { addresseeId: userId, status: ConnectionStatus.ACCEPTED },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingRequests(userId: string): Promise<Connection[]> {
    return this.connectionRepository.find({
      where: { addresseeId: userId, status: ConnectionStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  // Shared Goal methods
  async createSharedGoal(goalData: Partial<SharedGoal>): Promise<SharedGoal> {
    const goal = this.sharedGoalRepository.create({
      ...goalData,
      participantIds: [goalData.creatorId!],
      progress: {},
    });
    return this.sharedGoalRepository.save(goal);
  }

  async joinSharedGoal(goalId: string, userId: string): Promise<SharedGoal> {
    const goal = await this.sharedGoalRepository.findOne({ where: { id: goalId } });
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (!goal.participantIds.includes(userId)) {
      goal.participantIds.push(userId);
      goal.progress = { ...goal.progress, [userId]: { joinedAt: new Date() } };
    }

    return this.sharedGoalRepository.save(goal);
  }

  async updateGoalProgress(goalId: string, userId: string, progress: any): Promise<SharedGoal> {
    const goal = await this.sharedGoalRepository.findOne({ where: { id: goalId } });
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (!goal.participantIds.includes(userId)) {
      throw new Error('User is not a participant in this goal');
    }

    goal.progress = {
      ...goal.progress,
      [userId]: {
        ...goal.progress[userId],
        ...progress,
        updatedAt: new Date(),
      },
    };

    return this.sharedGoalRepository.save(goal);
  }

  async getSharedGoals(userId: string): Promise<SharedGoal[]> {
    return this.sharedGoalRepository
      .createQueryBuilder('goal')
      .where('goal.creatorId = :userId OR :userId = ANY(goal.participantIds)', { userId })
      .orderBy('goal.createdAt', 'DESC')
      .getMany();
  }

  async getPublicGoals(): Promise<SharedGoal[]> {
    return this.sharedGoalRepository.find({
      where: { isPublic: true, status: GoalStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  async getGoalsByType(type: string, userId?: string): Promise<SharedGoal[]> {
    const query = this.sharedGoalRepository
      .createQueryBuilder('goal')
      .where('goal.type = :type', { type })
      .andWhere('goal.status = :status', { status: GoalStatus.ACTIVE });

    if (userId) {
      query.andWhere('(goal.creatorId = :userId OR :userId = ANY(goal.participantIds) OR goal.isPublic = true)', { userId });
    } else {
      query.andWhere('goal.isPublic = true');
    }

    return query.orderBy('goal.createdAt', 'DESC').getMany();
  }

  async completeGoal(goalId: string, userId: string): Promise<SharedGoal> {
    const goal = await this.sharedGoalRepository.findOne({ where: { id: goalId } });
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (goal.creatorId === userId) {
      goal.status = GoalStatus.COMPLETED;
    } else {
      // Mark individual progress as completed
      goal.progress = {
        ...goal.progress,
        [userId]: {
          ...goal.progress[userId],
          completedAt: new Date(),
        },
      };
    }

    return this.sharedGoalRepository.save(goal);
  }

  async getRecommendedConnections(userId: string, userProfile: any): Promise<any[]> {
    try {
      // Get potential connections (users not already connected)
      const existingConnections = await this.getConnections(userId);
      const connectedUserIds = existingConnections.map(conn =>
        conn.requesterId === userId ? conn.addresseeId : conn.requesterId
      );

      // This would need a way to get other users' profiles
      // For now, return mock recommendations
      const recommendations = [
        {
          userId: 'mock-user-1',
          name: 'Sarah Johnson',
          reason: 'Shares similar health goals',
          similarity: 0.85,
        },
        {
          userId: 'mock-user-2',
          name: 'Mike Chen',
          reason: 'Similar productivity patterns',
          similarity: 0.72,
        },
      ];

      return recommendations.filter(rec => !connectedUserIds.includes(rec.userId));
    } catch (error) {
      console.error('Failed to get recommended connections:', error);
      return [];
    }
  }

  async getRecommendedGoals(userId: string, userProfile: any): Promise<SharedGoal[]> {
    try {
      // Get user's current goals and interests
      const userGoals = await this.getSharedGoals(userId);
      const userGoalTypes = [...new Set(userGoals.map(g => g.type))];

      // Find public goals that match user's interests but they haven't joined
      const publicGoals = await this.getPublicGoals();
      const recommendedGoals = publicGoals.filter(goal =>
        userGoalTypes.includes(goal.type) && !goal.participantIds.includes(userId)
      );

      // Sort by relevance (number of participants, recency)
      return recommendedGoals
        .sort((a, b) => {
          const aScore = a.participantIds.length + (Date.now() - a.createdAt.getTime()) / (1000 * 60 * 60 * 24); // days since creation
          const bScore = b.participantIds.length + (Date.now() - b.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return bScore - aScore;
        })
        .slice(0, 5);
    } catch (error) {
      console.error('Failed to get recommended goals:', error);
      return [];
    }
  }

  async getSimilarUsers(userId: string, userProfile: any): Promise<any[]> {
    try {
      // Use AI to find similar users based on profile data
      const aiResponse = await firstValueFrom(
        this.httpService.post(
          `${process.env.AI_SERVICE_URL || 'http://localhost:3006'}/ai/find-similar-users`,
          {
            userId,
            userProfile,
            maxResults: 10,
          },
        ),
      );

      return aiResponse.data.similarUsers || [];
    } catch (error) {
      console.error('Failed to get similar users:', error);
      return [];
    }
  }
}