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

  async getLearningProgress(userId: string) {
    const progressRecords = await this.getUserProgress(userId);
    const courses = await this.getCourses();

    // Calculate stats
    const totalCourses = progressRecords.length;
    const completedCourses = progressRecords.filter(p => p.progressPercent === 100).length;
    const totalTimeSpent = progressRecords.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    const averageProgress = totalCourses > 0
      ? progressRecords.reduce((sum, p) => sum + p.progressPercent, 0) / totalCourses
      : 0;

    // Calculate current streak (simplified - would need daily tracking)
    const currentStreak = Math.min(7, completedCourses); // Mock streak

    // Map courses with progress
    const coursesWithProgress = courses.map(course => {
      const progress = progressRecords.find(p => p.courseId === course.id);
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        progress: progress?.progressPercent || 0,
        totalModules: course.totalModules || 10,
        completedModules: progress?.completedLessons || 0,
        estimatedTime: course.estimatedTime || 60,
        category: course.category,
        difficulty: course.difficulty,
        lastAccessedAt: progress?.updatedAt?.toISOString() || course.createdAt.toISOString(),
      };
    });

    // Mock achievements
    const recentAchievements = [
      {
        id: 'first-course',
        title: 'First Steps',
        description: 'Completed your first course',
        earnedAt: new Date().toISOString(),
        type: 'milestone',
      },
    ];

    return {
      userId,
      totalCourses,
      completedCourses,
      totalTimeSpent,
      currentStreak,
      averageProgress,
      courses: coursesWithProgress,
      recentAchievements,
    };
  }

  async getLearningRecommendations(userId: string) {
    const progress = await this.getLearningProgress(userId);
    const recommendations = [];

    // Generate recommendations based on progress
    if (progress.averageProgress < 50) {
      recommendations.push({
        id: 'beginner-fundamentals',
        title: 'Learning Fundamentals',
        description: 'Build a strong foundation with core concepts',
        category: 'Fundamentals',
        difficulty: 'beginner',
        estimatedTime: 45,
        reason: 'Based on your current progress level',
        priority: 'high',
      });
    }

    if (progress.completedCourses === 0) {
      recommendations.push({
        id: 'getting-started',
        title: 'Getting Started Guide',
        description: 'Learn the basics and get comfortable with the platform',
        category: 'Onboarding',
        difficulty: 'beginner',
        estimatedTime: 30,
        reason: 'Perfect for new learners',
        priority: 'high',
      });
    }

    // Add some general recommendations
    recommendations.push({
      id: 'advanced-techniques',
      title: 'Advanced Techniques',
      description: 'Master advanced concepts and best practices',
      category: 'Advanced',
      difficulty: 'advanced',
      estimatedTime: 90,
      reason: 'Challenge yourself with advanced topics',
      priority: 'medium',
    });

    return { recommendations };
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