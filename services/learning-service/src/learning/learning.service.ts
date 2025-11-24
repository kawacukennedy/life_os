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
    // Simple recommendation logic - in real app, this would use ML
    const userProgress = await this.getUserProgress(userId);
    const completedCourses = userProgress.filter(p => p.progressPercent >= 100);

    if (completedCourses.length === 0) {
      // Recommend beginner courses
      return this.coursesRepository
        .createQueryBuilder('course')
        .where('course.category = :category', { category: 'beginner' })
        .limit(3)
        .getMany();
    }

    // Recommend advanced courses
    return this.coursesRepository
      .createQueryBuilder('course')
      .where('course.category = :category', { category: 'advanced' })
      .limit(3)
      .getMany();
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