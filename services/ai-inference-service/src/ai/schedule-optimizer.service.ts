import { Injectable } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { LoggingService } from './logging.service';

export interface Task {
  id: string;
  title: string;
  duration: number; // in minutes
  priority: number; // 1-5, 5 being highest
  dueDate?: Date;
  preferredTimeSlots?: TimeSlot[];
  dependencies?: string[]; // task IDs that must be completed first
}

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface ScheduleConstraint {
  type: 'fixed' | 'flexible' | 'unavailable';
  start: Date;
  end: Date;
  priority?: number;
}

export interface OptimizedSchedule {
  tasks: ScheduledTask[];
  score: number;
  conflicts: ScheduleConflict[];
}

export interface ScheduledTask {
  taskId: string;
  startTime: Date;
  endTime: Date;
  confidence: number;
}

export interface ScheduleConflict {
  type: 'overlap' | 'constraint_violation' | 'dependency_unmet';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

@Injectable()
export class ScheduleOptimizerService {
  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly loggingService: LoggingService,
  ) {}

  async optimizeSchedule(
    tasks: Task[],
    constraints: ScheduleConstraint[],
    userPreferences: UserSchedulePreferences,
    timeBudgetMs: number = 5000
  ): Promise<OptimizedSchedule> {
    const startTime = Date.now();

    try {
      // Initial greedy placement
      let schedule = this.greedySchedule(tasks, constraints, userPreferences);

      // Local search optimization
      schedule = this.localSearchOptimization(schedule, constraints, userPreferences, timeBudgetMs);

      // Optional ILP finalization (simplified for now)
      if (timeBudgetMs > 2000) {
        schedule = this.constraintSatisfactionOptimization(schedule, constraints, userPreferences);
      }

      const executionTime = Date.now() - startTime;
      this.monitoringService.recordScheduleOptimization('optimize_schedule', executionTime / 1000);
      this.loggingService.logScheduleOperation('optimize_schedule', 'success', executionTime / 1000);

      return schedule;
    } catch (error) {
      this.monitoringService.recordScheduleOptimization('optimize_schedule', (Date.now() - startTime) / 1000);
      this.loggingService.logError(error, 'optimizeSchedule');
      throw error;
    }
  }

  private greedySchedule(
    tasks: Task[],
    constraints: ScheduleConstraint[],
    preferences: UserSchedulePreferences
  ): OptimizedSchedule {
    const scheduledTasks: ScheduledTask[] = [];
    const conflicts: ScheduleConflict[] = [];

    // Sort tasks by priority and due date
    const sortedTasks = [...tasks].sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
      return 0;
    });

    const now = new Date();
    let currentTime = new Date(now);

    for (const task of sortedTasks) {
      const bestSlot = this.findBestTimeSlot(
        task,
        currentTime,
        constraints,
        preferences,
        scheduledTasks
      );

      if (bestSlot) {
        scheduledTasks.push({
          taskId: task.id,
          startTime: bestSlot.start,
          endTime: bestSlot.end,
          confidence: this.calculateConfidence(task, bestSlot, constraints)
        });
        currentTime = new Date(Math.max(currentTime.getTime(), bestSlot.end.getTime()));
      } else {
        conflicts.push({
          type: 'constraint_violation',
          description: `Unable to schedule task: ${task.title}`,
          severity: 'high'
        });
      }
    }

    return {
      tasks: scheduledTasks,
      score: this.calculateScheduleScore(scheduledTasks, conflicts),
      conflicts
    };
  }

  private findBestTimeSlot(
    task: Task,
    after: Date,
    constraints: ScheduleConstraint[],
    preferences: UserSchedulePreferences,
    existingTasks: ScheduledTask[]
  ): TimeSlot | null {
    const searchDays = 7; // Look ahead 7 days
    const timeSlots: TimeSlot[] = [];

    for (let day = 0; day < searchDays; day++) {
      const date = new Date(after);
      date.setDate(date.getDate() + day);
      date.setHours(0, 0, 0, 0);

      // Generate possible time slots for this day
      const daySlots = this.generateTimeSlotsForDay(date, preferences, task.duration);
      timeSlots.push(...daySlots);
    }

    // Filter and score slots
    const validSlots = timeSlots
      .filter(slot => this.isSlotValid(slot, constraints, existingTasks))
      .map(slot => ({
        slot,
        score: this.scoreTimeSlot(slot, task, preferences)
      }))
      .sort((a, b) => b.score - a.score);

    return validSlots.length > 0 ? validSlots[0].slot : null;
  }

  private generateTimeSlotsForDay(date: Date, preferences: UserSchedulePreferences, duration: number): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const workStart = preferences.workStartHour || 9;
    const workEnd = preferences.workEndHour || 17;
    const slotDuration = 30; // 30-minute slots

    for (let hour = workStart; hour < workEnd; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const start = new Date(date);
        start.setHours(hour, minute, 0, 0);

        const end = new Date(start);
        end.setMinutes(end.getMinutes() + duration);

        if (end.getHours() < workEnd || (end.getHours() === workEnd && end.getMinutes() === 0)) {
          slots.push({ start, end });
        }
      }
    }

    return slots;
  }

  private isSlotValid(slot: TimeSlot, constraints: ScheduleConstraint[], existingTasks: ScheduledTask[]): boolean {
    // Check constraints
    for (const constraint of constraints) {
      if (this.timesOverlap(slot.start, slot.end, constraint.start, constraint.end)) {
        if (constraint.type === 'unavailable') return false;
        if (constraint.type === 'fixed' && constraint.priority && constraint.priority > 5) return false;
      }
    }

    // Check existing tasks
    for (const existing of existingTasks) {
      if (this.timesOverlap(slot.start, slot.end, existing.startTime, existing.endTime)) {
        return false;
      }
    }

    return true;
  }

  private scoreTimeSlot(slot: TimeSlot, task: Task, preferences: UserSchedulePreferences): number {
    let score = 0;

    // Prefer preferred time slots
    if (task.preferredTimeSlots) {
      for (const preferred of task.preferredTimeSlots) {
        if (this.timesOverlap(slot.start, slot.end, preferred.start, preferred.end)) {
          score += 20;
        }
      }
    }

    // Prefer work hours
    const hour = slot.start.getHours();
    if (hour >= 9 && hour <= 17) score += 10;

    // Avoid lunch hours
    if (hour >= 12 && hour <= 13) score -= 5;

    // Prefer earlier in the day for high priority tasks
    if (task.priority >= 4) {
      score += (24 - hour) * 2;
    }

    // Consider due dates
    if (task.dueDate) {
      const daysUntilDue = Math.ceil((task.dueDate.getTime() - slot.start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue > 0) {
        score += Math.max(0, 10 - daysUntilDue);
      } else {
        score -= 20; // Overdue penalty
      }
    }

    return score;
  }

  private localSearchOptimization(
    schedule: OptimizedSchedule,
    constraints: ScheduleConstraint[],
    preferences: UserSchedulePreferences,
    timeBudgetMs: number
  ): OptimizedSchedule {
    const startTime = Date.now();
    let bestSchedule = { ...schedule };
    let improved = true;
    let iterations = 0;

    while (improved && (Date.now() - startTime) < timeBudgetMs && iterations < 100) {
      improved = false;
      iterations++;

      // Try swapping adjacent tasks
      for (let i = 0; i < bestSchedule.tasks.length - 1; i++) {
        const newSchedule = this.trySwapTasks(bestSchedule, i, i + 1, constraints);
        if (newSchedule.score > bestSchedule.score) {
          bestSchedule = newSchedule;
          improved = true;
        }
      }

      // Try moving tasks to better slots
      for (let i = 0; i < bestSchedule.tasks.length; i++) {
        const newSchedule = this.tryMoveTaskToBetterSlot(bestSchedule, i, constraints, preferences);
        if (newSchedule.score > bestSchedule.score) {
          bestSchedule = newSchedule;
          improved = true;
        }
      }
    }

    return bestSchedule;
  }

  private trySwapTasks(
    schedule: OptimizedSchedule,
    index1: number,
    index2: number,
    constraints: ScheduleConstraint[]
  ): OptimizedSchedule {
    const newTasks = [...schedule.tasks];
    [newTasks[index1], newTasks[index2]] = [newTasks[index2], newTasks[index1]];

    // Recalculate conflicts and score
    const conflicts = this.detectConflicts(newTasks, constraints);
    const score = this.calculateScheduleScore(newTasks, conflicts);

    return {
      tasks: newTasks,
      score,
      conflicts
    };
  }

  private tryMoveTaskToBetterSlot(
    schedule: OptimizedSchedule,
    taskIndex: number,
    constraints: ScheduleConstraint[],
    preferences: UserSchedulePreferences
  ): OptimizedSchedule {
    const task = schedule.tasks[taskIndex];
    const taskData = this.findTaskById(task.taskId, []); // Need to pass tasks array

    if (!taskData) return schedule;

    // Find a better slot for this task
    const betterSlot = this.findBestTimeSlot(
      taskData,
      new Date(),
      constraints,
      preferences,
      schedule.tasks.filter((_, i) => i !== taskIndex)
    );

    if (!betterSlot) return schedule;

    const newTasks = [...schedule.tasks];
    newTasks[taskIndex] = {
      ...task,
      startTime: betterSlot.start,
      endTime: betterSlot.end,
      confidence: this.calculateConfidence(taskData, betterSlot, constraints)
    };

    const conflicts = this.detectConflicts(newTasks, constraints);
    const score = this.calculateScheduleScore(newTasks, conflicts);

    return {
      tasks: newTasks,
      score,
      conflicts
    };
  }

  private constraintSatisfactionOptimization(
    schedule: OptimizedSchedule,
    constraints: ScheduleConstraint[],
    preferences: UserSchedulePreferences
  ): OptimizedSchedule {
    // Simplified constraint satisfaction - ensure no overlaps and respect hard constraints
    const sortedTasks = [...schedule.tasks].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    const optimizedTasks: ScheduledTask[] = [];
    const conflicts: ScheduleConflict[] = [];

    for (const task of sortedTasks) {
      let slot = { start: task.startTime, end: task.endTime };

      // Adjust for conflicts
      while (!this.isSlotValid(slot, constraints, optimizedTasks)) {
        // Move to next available slot
        slot.start = new Date(slot.start.getTime() + 30 * 60 * 1000); // 30 minutes later
        slot.end = new Date(slot.start.getTime() + (task.endTime.getTime() - task.startTime.getTime()));
      }

      optimizedTasks.push({
        ...task,
        startTime: slot.start,
        endTime: slot.end
      });
    }

    return {
      tasks: optimizedTasks,
      score: this.calculateScheduleScore(optimizedTasks, conflicts),
      conflicts
    };
  }

  private detectConflicts(tasks: ScheduledTask[], constraints: ScheduleConstraint[]): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];

    // Check for overlaps
    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        if (this.timesOverlap(tasks[i].startTime, tasks[i].endTime, tasks[j].startTime, tasks[j].endTime)) {
          conflicts.push({
            type: 'overlap',
            description: `Tasks ${tasks[i].taskId} and ${tasks[j].taskId} overlap`,
            severity: 'high'
          });
        }
      }
    }

    // Check constraint violations
    for (const task of tasks) {
      for (const constraint of constraints) {
        if (constraint.type === 'unavailable' &&
            this.timesOverlap(task.startTime, task.endTime, constraint.start, constraint.end)) {
          conflicts.push({
            type: 'constraint_violation',
            description: `Task ${task.taskId} violates unavailable time constraint`,
            severity: 'high'
          });
        }
      }
    }

    return conflicts;
  }

  private calculateScheduleScore(tasks: ScheduledTask[], conflicts: ScheduleConflict[]): number {
    let score = tasks.length * 10; // Base score for scheduling tasks

    // Penalty for conflicts
    score -= conflicts.length * 20;

    // Bonus for high confidence placements
    score += tasks.reduce((sum, task) => sum + task.confidence, 0);

    return Math.max(0, score);
  }

  private calculateConfidence(task: Task, slot: TimeSlot, constraints: ScheduleConstraint[]): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence for preferred time slots
    if (task.preferredTimeSlots?.some(preferred =>
      this.timesOverlap(slot.start, slot.end, preferred.start, preferred.end)
    )) {
      confidence += 0.3;
    }

    // Lower confidence if close to constraints
    for (const constraint of constraints) {
      if (this.timesOverlap(slot.start, slot.end, constraint.start, constraint.end)) {
        confidence -= 0.2;
      }
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private timesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && end1 > start2;
  }

  private findTaskById(taskId: string, tasks: Task[]): Task | undefined {
    return tasks.find(t => t.id === taskId);
  }
}

interface UserSchedulePreferences {
  workStartHour: number;
  workEndHour: number;
  preferredWorkDays: number[]; // 0-6, Sunday = 0
  breakDuration: number; // minutes
  maxWorkHoursPerDay: number;
}