import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";

export enum DashboardType {
  USER = "user",
  SYSTEM = "system",
  PUBLIC = "public"
}

export enum WidgetType {
  CHART = "chart",
  METRIC = "metric",
  TABLE = "table",
  MAP = "map"
}

@Entity("dashboards")
export class Dashboard {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  userId: string;

  @Column()
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({
    type: "enum",
    enum: DashboardType,
    default: DashboardType.USER
  })
  type: DashboardType;

  @Column({ type: "jsonb" })
  config: {
    widgets: Array<{
      id: string;
      type: WidgetType;
      title: string;
      position: { x: number; y: number; w: number; h: number };
      config: Record<string, any>;
    }>;
    layout: string;
    filters: Record<string, any>;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "jsonb", nullable: true })
  permissions: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}