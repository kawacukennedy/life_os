import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Vital {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  metricType: string; // heart_rate, steps, sleep, etc.

  @Column('decimal')
  value: number;

  @Column()
  unit: string;

  @CreateDateColumn()
  recordedAt: Date;
}