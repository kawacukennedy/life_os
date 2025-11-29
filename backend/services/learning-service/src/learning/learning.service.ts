import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../courses/course.entity';
import { Progress } from '../progress/progress.entity';

@Injectable()
export class LearningService {
  constructor(
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
  ) {}

  async getCourses(category?: string) {
    const query = this.coursesRepository
      .createQueryBuilder('course')
      .where('course.isActive = :isActive', { isActive: true });

    if (category) {
      query.andWhere('course.category = :category', { category });
    }

    return query.orderBy('course.createdAt', 'DESC').getMany();
  }

  async getUserProgress(userId: string) {
    return this.progressRepository
      .createQueryBuilder('progress')
      .leftJoinAndSelect('progress.course', 'course')
      .where('progress.userId = :userId', { userId })
      .orderBy('progress.updatedAt', 'DESC')
      .getMany();
  }

  async startCourse(userId: string, courseId: string) {
    const existingProgress = await this.progressRepository.findOne({
      where: { userId, courseId },
    });

    if (existingProgress) {
      return existingProgress;
    }

    const progress = this.progressRepository.create({
      userId,
      courseId,
      completedLessons: 0,
      progressPercent: 0,
      startedAt: new Date(),
      updatedAt: new Date(),
    });

    return this.progressRepository.save(progress);
  }

  async updateProgress(userId: string, courseId: string, lessonId: string, progressPercent: number) {
    const progress = await this.progressRepository.findOne({
      where: { userId, courseId },
    });

    if (!progress) {
      throw new Error('Progress not found');
    }

    progress.lastLessonId = lessonId;
    progress.progressPercent = progressPercent;
    progress.lastAccessedAt = new Date();
    progress.updatedAt = new Date();

    // Calculate completed lessons based on progress
    const course = await this.coursesRepository.findOne({ where: { id: courseId } });
    if (course) {
      progress.completedLessons = Math.floor((progressPercent / 100) * course.totalLessons);
    }

    return this.progressRepository.save(progress);
  }

  async getRecommendations(userId: string) {
    const userProgress = await this.getUserProgress(userId);
    const completedCourses = userProgress.filter(p => p.progressPercent >= 100);

    // Get micro-courses due for review
    const dueReviews = await this.getDueReviews(userId);

    if (dueReviews.length > 0) {
      return dueReviews.slice(0, 3);
    }

    if (completedCourses.length === 0) {
      // Recommend beginner micro-courses
      return this.coursesRepository
        .createQueryBuilder('course')
        .where('course.isMicroCourse = :isMicro', { isMicro: true })
        .andWhere('course.difficulty <= 2')
        .orderBy('course.createdAt', 'DESC')
        .limit(3)
        .getMany();
    }

    // Recommend personalized micro-courses based on completed ones
    const completedTags = new Set();
    for (const progress of completedCourses) {
      if (progress.course?.tags) {
        progress.course.tags.forEach(tag => completedTags.add(tag));
      }
    }

    const recommendations = await this.coursesRepository
      .createQueryBuilder('course')
      .where('course.isMicroCourse = :isMicro', { isMicro: true })
      .andWhere('course.tags && :tags', { tags: Array.from(completedTags) })
      .orderBy('course.difficulty', 'ASC')
      .limit(3)
      .getMany();

    return recommendations;
  }

  async getMicroCourses(tags?: string[], difficulty?: number, limit = 10) {
    const query = this.coursesRepository
      .createQueryBuilder('course')
      .where('course.isMicroCourse = :isMicro', { isMicro: true })
      .andWhere('course.isActive = :isActive', { isActive: true });

    if (tags && tags.length > 0) {
      query.andWhere('course.tags && :tags', { tags });
    }

    if (difficulty) {
      query.andWhere('course.difficulty <= :difficulty', { difficulty });
    }

    return query
      .orderBy('course.difficulty', 'ASC')
      .addOrderBy('course.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async createMicroCourse(courseData: Partial<Course>) {
    const course = this.coursesRepository.create({
      ...courseData,
      isMicroCourse: true,
      spacedRepetition: {
        intervals: [1, 3, 7, 14, 30], // days
        easiness: 2.5,
      },
    });
    return this.coursesRepository.save(course);
  }

  async getDueReviews(userId: string) {
    const now = new Date();
    return this.progressRepository
      .createQueryBuilder('progress')
      .leftJoinAndSelect('progress.course', 'course')
      .where('progress.userId = :userId', { userId })
      .andWhere('course.isMicroCourse = :isMicro', { isMicro: true })
      .andWhere('progress.nextReviewDate <= :now', { now })
      .orderBy('progress.nextReviewDate', 'ASC')
      .getMany();
  }

  async updateSpacedRepetition(userId: string, courseId: string, quality: number) {
    // quality: 0-5 (0=complete blackout, 5=perfect response)
    const progress = await this.progressRepository.findOne({
      where: { userId, courseId },
    });

    if (!progress) throw new Error('Progress not found');

    // Update easiness factor (EF)
    const EF = progress.easinessFactor;
    const newEF = Math.max(1.3, EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    progress.easinessFactor = newEF;
    progress.reviewCount += 1;

    // Calculate next interval
    let interval: number;
    if (progress.reviewCount === 1) {
      interval = 1;
    } else if (progress.reviewCount === 2) {
      interval = 6;
    } else {
      interval = Math.round(progress.intervalDays * newEF);
    }

    progress.intervalDays = interval;
    progress.nextReviewDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);

    return this.progressRepository.save(progress);
  }

  async getLearningPath(userId: string, goal: string) {
    // Generate personalized learning path based on goal
    const userProgress = await this.getUserProgress(userId);
    const completedIds = userProgress
      .filter(p => p.progressPercent >= 100)
      .map(p => p.courseId);

    // Simple path generation - in production, use ML
    const path = [];

    if (goal.includes('productivity')) {
      path.push(
        { courseId: 'time-management-basics', order: 1 },
        { courseId: 'focus-techniques', order: 2 },
        { courseId: 'habit-building', order: 3 },
      );
    } else if (goal.includes('health')) {
      path.push(
        { courseId: 'nutrition-basics', order: 1 },
        { courseId: 'exercise-fundamentals', order: 2 },
        { courseId: 'sleep-optimization', order: 3 },
      );
    }

    // Filter out completed courses
    return path.filter(step => !completedIds.includes(step.courseId));
  }

  async getLearningStats(userId: string) {
    const progress = await this.getUserProgress(userId);

    const totalCourses = progress.length;
    const completedCourses = progress.filter(p => p.progressPercent >= 100).length;
    const totalTimeSpent = progress.reduce((sum, p) => sum + (p.completedLessons * 15), 0); // Assume 15 min per lesson

    const averageProgress = totalCourses > 0
      ? progress.reduce((sum, p) => sum + Number(p.progressPercent), 0) / totalCourses
      : 0;

    return {
      totalCourses,
      completedCourses,
      totalTimeSpent,
      averageProgress: Math.round(averageProgress * 100) / 100,
    };
  }
}