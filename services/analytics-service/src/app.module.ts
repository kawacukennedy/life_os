import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { AnalyticsModule } from './analytics/analytics.module';
import { EventStoreModule } from './event-store/event-store.module';
import { ErrorHandlingMiddleware } from './common/error-handling.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'lifeos_analytics',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 1000,
    }),
    CacheModule.register({
      ttl: 300, // 5 minutes default
      max: 100, // maximum number of items in cache
    }),
    AnalyticsModule,
    EventStoreModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ErrorHandlingMiddleware).forRoutes('*');
  }
}