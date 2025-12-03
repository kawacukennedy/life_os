import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationResolver } from './notification.resolver';
import { NotificationGraphQLService } from './notification.service';

@Module({
  imports: [HttpModule],
  providers: [NotificationResolver, NotificationGraphQLService],
  exports: [NotificationGraphQLService],
})
export class NotificationModule {}