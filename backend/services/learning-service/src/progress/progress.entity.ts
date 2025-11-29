import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Course } from '../courses/course.entity';

@Entity()
export class Progress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  courseId: string;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column('int', { default: 0 })
  completedLessons: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  progressPercent: number;

  @Column({ nullable: true })
  lastLessonId: string;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt: Date;

  @CreateDateColumn()
  startedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Spaced repetition fields
  @Column('int', { default: 0 })
  reviewCount: number;

  @Column('float', { default: 2.5 })
  easinessFactor: number;

  @Column({ type: 'timestamp', nullable: true })
  nextReviewDate: Date;

  @Column('int', { default: 1 })
  intervalDays: number;
}