import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Connection, ConnectionStatus } from './connection.entity';
import { SharedGoal, GoalStatus } from './shared-goal.entity';

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(Connection)
    private connectionRepository: Repository<Connection>,
    @InjectRepository(SharedGoal)
    private sharedGoalRepository: Repository<SharedGoal>,
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
}