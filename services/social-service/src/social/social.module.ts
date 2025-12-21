import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { TwitterService } from './twitter.service';
import { Connection } from './connection.entity';
import { SharedGoal } from './shared-goal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Connection, SharedGoal]), HttpModule],
  providers: [SocialService, TwitterService],
  controllers: [SocialController],
  exports: [SocialService, TwitterService],
})
export class SocialModule {}