import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProfileModule } from './profile/profile.module';
import { CommonModule } from './common/common.module';
import { SecurityMiddleware } from './common/security.middleware';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CommonModule,
    ProfileModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityMiddleware).forRoutes('*');
  }
}