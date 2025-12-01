import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Routine, TriggerType, ActionType } from './routine.entity';

@Injectable()
export class RoutinesService {
  constructor(
    @InjectRepository(Routine)
    private routineRepository: Repository<Routine>,
    private httpService: HttpService,
  ) {}

  async create(routineData: Partial<Routine>): Promise<Routine> {
    const routine = this.routineRepository.create(routineData);
    return this.routineRepository.save(routine);
  }

  async findAll(userId: string): Promise<Routine[]> {
    return this.routineRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Routine> {
    const routine = await this.routineRepository.findOne({ where: { id } });
    if (!routine) {
      throw new Error('Routine not found');
    }
    return routine;
  }

  async update(id: string, updateData: Partial<Routine>): Promise<Routine> {
    await this.routineRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.routineRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('Routine not found');
    }
  }

  async triggerRoutine(routineId: string, triggerData?: any): Promise<void> {
    const routine = await this.findOne(routineId);
    if (!routine.isActive) {
      return;
    }

    // Check if conditions are met
    if (await this.checkTriggerConditions(routine, triggerData)) {
      await this.executeAction(routine, triggerData);
      await this.routineRepository.update(routineId, {
        lastTriggeredAt: new Date(),
      });
    }
  }

  private async checkTriggerConditions(routine: Routine, triggerData?: any): Promise<boolean> {
    switch (routine.triggerType) {
      case TriggerType.HEALTH_SCORE_DROP:
        const healthScore = triggerData?.healthScore;
        const threshold = routine.triggerConditions.threshold || 70;
        return healthScore < threshold;

      case TriggerType.TASK_OVERDUE:
        return triggerData?.isOverdue === true;

      case TriggerType.EMAIL_RECEIVED:
        return triggerData?.sender === routine.triggerConditions.sender;

      case TriggerType.TIME_BASED:
        // Check if current time matches the schedule
        const now = new Date();
        const schedule = routine.triggerConditions.schedule;
        return this.matchesSchedule(now, schedule);

      default:
        return true;
    }
  }

  private matchesSchedule(now: Date, schedule: any): boolean {
    if (schedule.hour !== undefined && now.getHours() !== schedule.hour) return false;
    if (schedule.minute !== undefined && now.getMinutes() !== schedule.minute) return false;
    if (schedule.dayOfWeek !== undefined && now.getDay() !== schedule.dayOfWeek) return false;
    return true;
  }

  private async executeAction(routine: Routine, triggerData?: any): Promise<void> {
    switch (routine.actionType) {
      case ActionType.CREATE_TASK:
        await this.createTask(routine.userId, routine.actionConfig);
        break;

      case ActionType.SEND_NOTIFICATION:
        await this.sendNotification(routine.userId, routine.actionConfig);
        break;

      case ActionType.SCHEDULE_EVENT:
        await this.scheduleEvent(routine.userId, routine.actionConfig);
        break;

      default:
        console.log('Custom action executed for routine:', routine.id);
    }
  }

  private async createTask(userId: string, config: any): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${process.env.TASK_SERVICE_URL || 'http://localhost:3008'}/tasks`,
          {
            userId,
            ...config,
          },
        ),
      );
    } catch (error) {
      console.error('Failed to create task:', error.message);
    }
  }

  private async sendNotification(userId: string, config: any): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007'}/notifications`,
          {
            userId,
            ...config,
          },
        ),
      );
    } catch (error) {
      console.error('Failed to send notification:', error.message);
    }
  }

  private async scheduleEvent(userId: string, config: any): Promise<void> {
    // This would integrate with calendar service
    console.log('Scheduling event:', config);
  }

  async checkAllRoutinesForUser(userId: string, triggerType: TriggerType, triggerData?: any): Promise<void> {
    const routines = await this.routineRepository.find({
      where: { userId, triggerType, isActive: true },
    });

    for (const routine of routines) {
      await this.triggerRoutine(routine.id, triggerData);
    }
  }
}