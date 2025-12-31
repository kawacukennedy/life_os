import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

export enum MetricType {
  COUNTER = "counter",
  GAUGE = "gauge",
  HISTOGRAM = "histogram",
  SUMMARY = "summary"
}

export enum MetricGranularity {
  MINUTE = "minute",
  HOUR = "hour",
  DAY = "day",
  WEEK = "week",
  MONTH = "month"
}

@Entity("metrics")
@Index(["name", "timestamp", "granularity"])
@Index(["category", "timestamp"])
export class Metric {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  @Index()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: "enum",
    enum: MetricType,
    default: MetricType.COUNTER
  })
  type: MetricType;

  @Column({
    type: "enum",
    enum: MetricGranularity,
    default: MetricGranularity.HOUR
  })
  granularity: MetricGranularity;

  @Column()
  category: string;

  @Column({ type: "decimal", precision: 20, scale: 6 })
  value: number;

  @Column({ type: "jsonb", nullable: true })
  tags: Record<string, string>;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any>;

  @Column({ type: "timestamp" })
  @Index()
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}