import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningModule } from './learning/learning.module';
import { Course } from './courses/course.entity';
import { Progress } from './progress/progress.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'lifeos',
      entities: [Course, Progress],
      migrations: ['src/migrations/*.ts'],
      synchronize: false,
    }),
    LearningModule,
  ],
})
export class AppModule {}