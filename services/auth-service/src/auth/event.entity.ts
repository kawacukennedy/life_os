import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('events')
@Index(['aggregateId', 'aggregateType'])
@Index(['eventType'])
@Index(['metadata'])
export class EventEntity {
  @PrimaryColumn('uuid')
  eventId: string;

  @Column()
  eventType: string;

  @Column()
  aggregateId: string;

  @Column()
  aggregateType: string;

  @Column({ type: 'jsonb' })
  eventData: any;

  @Column({ type: 'jsonb' })
  metadata: {
    timestamp: Date;
    userId?: string;
    correlationId?: string;
    causationId?: string;
    version: number;
  };

  @CreateDateColumn()
  createdAt: Date;
}