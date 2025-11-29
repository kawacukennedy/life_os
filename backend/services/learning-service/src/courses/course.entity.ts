import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Progress } from '../progress/progress.entity';

@Entity()
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  category: string;

  @Column('int')
  totalLessons: number;

  @Column('int', { default: 0 })
  duration: number; // in minutes

  @Column({ default: true })
  isActive: boolean;

  // Micro-course fields
  @Column({ default: false })
  isMicroCourse: boolean;

  @Column('int', { default: 5 })
  estimatedTime: number; // in minutes

  @Column({ type: 'json', nullable: true })
  learningObjectives: string[];

  @Column({ type: 'json', nullable: true })
  prerequisites: string[];

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column('float', { default: 0 })
  difficulty: number; // 1-5 scale

  @Column({ type: 'json', nullable: true })
  spacedRepetition: {
    intervals: number[]; // days between reviews
    easiness: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Progress, progress => progress.course)
  progress: Progress[];
}