import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

export enum GoalType {
  HEALTH = 'health',
  PRODUCTIVITY = 'productivity',
  LEARNING = 'learning',
  FINANCIAL = 'financial',
  PERSONAL = 'personal',
}

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

@Entity()
export class SharedGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  creatorId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: GoalType,
  })
  type: GoalType;

  @Column({
    type: 'enum',
    enum: GoalStatus,
    default: GoalStatus.ACTIVE,
  })
  status: GoalStatus;

  @Column({ type: 'json', nullable: true })
  target: any; // e.g., { steps: 10000, period: 'daily' }

  @Column({ type: 'date', nullable: true })
  deadline: Date;

  @Column({ default: false })
  isPublic: boolean;

  @Column('simple-array')
  participantIds: string[];

  @Column({ type: 'json', nullable: true })
  progress: any; // Track progress for each participant

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}