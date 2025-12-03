import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SocialResolver } from './social.resolver';
import { SocialService } from './social.service';

@Module({
  imports: [HttpModule],
  providers: [SocialResolver, SocialService],
  exports: [SocialService],
})
export class SocialModule {}