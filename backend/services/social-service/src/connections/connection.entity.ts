import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";

export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  BLOCKED = 'blocked',
  MUTED = 'muted',
}

export enum ConnectionType {
  FRIEND = 'friend',
  COLLEAGUE = 'colleague',
  MENTOR = 'mentor',
  MENTEE = 'mentee',
  FAMILY = 'family',
  ACQUAINTANCE = 'acquaintance',
}

@Entity('connections')
@Index(['requesterId', 'addresseeId'], { unique: true })
@Index(['requesterId', 'status'])
@Index(['addresseeId', 'status'])
export class Connection {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  @Index()
  requesterId: string; // User who sent the request

  @Column()
  @Index()
  addresseeId: string; // User who received the request

  @Column({
    type: 'enum',
    enum: ConnectionStatus,
    default: ConnectionStatus.PENDING,
  })
  status: ConnectionStatus;

  @Column({
    type: 'enum',
    enum: ConnectionType,
    default: ConnectionType.ACQUAINTANCE,
  })
  type: ConnectionType;

  @Column({ type: 'text', nullable: true })
  message: string; // Optional message with connection request

  @Column({ type: 'json', nullable: true })
  sharedGoals: string[]; // Goals that both users have in common

  @Column({ type: 'json', nullable: true })
  sharedInterests: string[]; // Interests that both users have in common

  @Column({ default: false })
  isMutual: boolean; // True if both users have accepted

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  blockedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}