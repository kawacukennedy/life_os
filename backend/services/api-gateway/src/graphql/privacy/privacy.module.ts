import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrivacyResolver } from './privacy.resolver';
import { PrivacyGraphQLService } from './privacy.service';

@Module({
  imports: [HttpModule],
  providers: [PrivacyResolver, PrivacyGraphQLService],
  exports: [PrivacyGraphQLService],
})
export class PrivacyModule {}