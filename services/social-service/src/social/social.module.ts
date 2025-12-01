import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { Connection } from './connection.entity';
import { SharedGoal } from './shared-goal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Connection, SharedGoal]), HttpModule],
  providers: [SocialService],
  controllers: [SocialController],
  exports: [SocialService],
})
export class SocialModule {}