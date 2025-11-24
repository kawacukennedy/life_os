# Learning Service

Course management and learning progress tracking service for LifeOS, providing educational content delivery and progress analytics.

## Features

- **Course Management**: Create and manage learning courses
- **Progress Tracking**: Detailed progress analytics and completion tracking
- **Content Delivery**: Structured learning modules and lessons
- **User Progress**: Individual learning paths and achievements
- **Analytics**: Learning insights and performance metrics
- **Gamification**: Badges, streaks, and learning milestones

## API Endpoints

### Courses
```http
GET /learning/courses
Authorization: Bearer <jwt-token>
# Returns available courses

GET /learning/courses/:courseId
Authorization: Bearer <jwt-token>
# Returns course details and content

POST /learning/courses
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Introduction to Personal Finance",
  "description": "Learn the basics of managing money",
  "category": "Finance",
  "difficulty": "beginner",
  "estimatedHours": 5,
  "modules": [...]
}
```

### Progress Tracking
```http
GET /learning/progress
Authorization: Bearer <jwt-token>
# Returns user's learning progress across all courses

GET /learning/progress/:courseId
Authorization: Bearer <jwt-token>
# Returns progress for specific course

POST /learning/progress
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "courseId": "course-123",
  "moduleId": "module-456",
  "lessonId": "lesson-789",
  "progress": 100,
  "timeSpent": 1800,
  "completed": true
}
```

### Analytics
```http
GET /learning/analytics
Authorization: Bearer <jwt-token>
# Returns learning analytics and insights

GET /learning/analytics/streaks
Authorization: Bearer <jwt-token>
# Returns learning streak information
```

## Database Schema

### Course Entity
```typescript
@Entity()
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  category: string;

  @Column()
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  @Column()
  estimatedHours: number;

  @Column({ type: 'json' })
  modules: {
    id: string;
    title: string;
    description: string;
    order: number;
    lessons: {
      id: string;
      title: string;
      content: string;
      type: 'video' | 'text' | 'quiz' | 'assignment';
      duration?: number;
      order: number;
    }[];
  }[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Progress Entity
```typescript
@Entity()
export class Progress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column()
  courseId: string;

  @Column({ nullable: true })
  moduleId: string;

  @Column({ nullable: true })
  lessonId: string;

  @Column({ default: 0 })
  progress: number; // 0-100

  @Column({ default: 0 })
  timeSpent: number; // seconds

  @Column({ default: false })
  completed: boolean;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ type: 'json', nullable: true })
  quizResults: any;

  @Column({ type: 'json', nullable: true })
  notes: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## Learning Content Structure

### Course Organization
```
Course
├── Module 1
│   ├── Lesson 1.1 (Video)
│   ├── Lesson 1.2 (Text)
│   ├── Quiz 1.1
│   └── Assignment 1.1
├── Module 2
│   ├── Lesson 2.1 (Interactive)
│   └── Project 2.1
└── Final Assessment
```

### Content Types
- **Video Lessons**: Embedded videos with transcripts
- **Text Content**: Rich text with images and formatting
- **Interactive Quizzes**: Multiple choice, true/false, fill-in-blank
- **Assignments**: Practical exercises and projects
- **Assessments**: Comprehensive course evaluations

## Progress Tracking

### Progress Metrics
- **Completion Percentage**: Overall course progress
- **Time Spent**: Total learning time per course/module
- **Quiz Scores**: Performance on assessments
- **Streak Tracking**: Consecutive learning days
- **Achievement Badges**: Milestones and accomplishments

### Analytics Features
- **Learning Patterns**: Study time distribution
- **Performance Trends**: Progress over time
- **Weak Areas**: Topics needing improvement
- **Recommendations**: Personalized learning suggestions

## API Response Examples

### Course List
```json
{
  "courses": [
    {
      "id": "course-123",
      "title": "Personal Finance Fundamentals",
      "description": "Master the basics of financial planning",
      "category": "Finance",
      "difficulty": "beginner",
      "estimatedHours": 8,
      "thumbnailUrl": "https://...",
      "progress": {
        "percentage": 65,
        "timeSpent": 18000,
        "completedModules": 3,
        "totalModules": 5
      }
    }
  ]
}
```

### Progress Details
```json
{
  "courseId": "course-123",
  "overallProgress": 65,
  "timeSpent": 18000,
  "startedAt": "2024-01-01T00:00:00Z",
  "estimatedCompletion": "2024-01-20T00:00:00Z",
  "modules": [
    {
      "id": "module-1",
      "title": "Budgeting Basics",
      "progress": 100,
      "timeSpent": 3600,
      "completed": true,
      "lessons": [
        {
          "id": "lesson-1",
          "title": "Understanding Income",
          "progress": 100,
          "completed": true,
          "timeSpent": 900
        }
      ]
    }
  ]
}
```

### Learning Analytics
```json
{
  "totalCourses": 5,
  "completedCourses": 2,
  "totalTimeSpent": 72000,
  "currentStreak": 7,
  "longestStreak": 14,
  "averageDailyTime": 3600,
  "preferredStudyTime": "evening",
  "strongestCategories": ["Finance", "Health"],
  "weakestCategories": ["Investing"],
  "achievements": [
    {
      "id": "first-course",
      "title": "First Course Completed",
      "earnedAt": "2024-01-10T00:00:00Z"
    }
  ]
}
```

## Gamification Features

### Achievement System
- **Course Completion**: Badges for finishing courses
- **Streak Milestones**: Weekly/monthly learning streaks
- **Time Investment**: Hours spent learning badges
- **Performance**: Quiz score achievements
- **Consistency**: Regular learning habits

### Progress Visualization
- **Progress Bars**: Visual completion indicators
- **Heat Maps**: Learning activity calendars
- **Charts**: Progress trends and analytics
- **Leaderboards**: Comparative performance (optional)

## Background Jobs

### Progress Synchronization
- **Queue**: `sync`
- **Processor**: `ProgressSyncProcessor`
- **Tasks**: Update streaks, calculate analytics, award achievements

## Development

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=lifeos

# JWT
JWT_SECRET=your-jwt-secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
LEARNING_SERVICE_URL=http://localhost:3004

# Environment
NODE_ENV=development
```

## Architecture

```
Learning Service
├── Controllers
│   └── LearningController
├── Services
│   └── LearningService
├── Entities
│   ├── Course
│   └── Progress
├── Processors
│   └── ProgressSyncProcessor
└── DTOs
    ├── CourseDto
    ├── ProgressDto
    └── AnalyticsDto
```