import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TriggerType {
  HEALTH_SCORE_DROP = 'health_score_drop',
  TASK_OVERDUE = 'task_overdue',
  EMAIL_RECEIVED = 'email_received',
  TIME_BASED = 'time_based',
  CUSTOM = 'custom',
}

export enum ActionType {
  CREATE_TASK = 'create_task',
  SEND_NOTIFICATION = 'send_notification',
  SCHEDULE_EVENT = 'schedule_event',
  UPDATE_PROFILE = 'update_profile',
  CUSTOM = 'custom',
}

@Entity()
export class Routine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TriggerType,
  })
  triggerType: TriggerType;

  @Column({ type: 'json' })
  triggerConditions: any; // e.g., { threshold: 70 } for health score

  @Column({
    type: 'enum',
    enum: ActionType,
  })
  actionType: ActionType;

  @Column({ type: 'json' })
  actionConfig: any; // e.g., { title: 'Schedule workout', duration: 60 }

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastTriggeredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}