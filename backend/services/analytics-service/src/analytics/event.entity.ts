import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from "typeorm";

export enum EventType {
  USER_ACTION = "user_action",
  SYSTEM_EVENT = "system_event",
  BUSINESS_METRIC = "business_metric",
  ERROR = "error",
  PERFORMANCE = "performance"
}

@Entity("events")
@Index(["userId", "timestamp"])
@Index(["eventType", "timestamp"])
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: true })
  @Index()
  userId: string;

  @Column({ type: "uuid", nullable: true })
  sessionId: string;

  @Column({
    type: "enum",
    enum: EventType,
    default: EventType.USER_ACTION
  })
  eventType: EventType;

  @Column()
  @Index()
  eventName: string;

  @Column({ type: "jsonb" })
  properties: Record<string, any>;

  @Column({ type: "jsonb", nullable: true })
  context: Record<string, any>;

  @Column({ type: "varchar", length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  userAgent: string;

  @Column({ type: "timestamp" })
  @Index()
  timestamp: Date;

  @Column({ type: "varchar", length: 10, default: "UTC" })
  timezone: string;

  @CreateDateColumn()
  createdAt: Date;
}