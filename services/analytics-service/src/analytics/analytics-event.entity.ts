import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn } from 'typeorm';

@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'event_type' })
  @Index()
  eventType: string;

  @Column({ type: 'jsonb' })
  properties: any;

  @Column({ name: 'session_id', nullable: true })
  sessionId?: string;

  @Column({ name: 'device_info', type: 'jsonb', nullable: true })
  deviceInfo?: any;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @CreateDateColumn({ name: 'timestamp' })
  @Index()
  timestamp: Date;
}