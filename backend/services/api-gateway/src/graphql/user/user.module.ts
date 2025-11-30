import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';

@Module({
  imports: [HttpModule],
  providers: [UserResolver, UserService],
  exports: [UserService],
})
export class UserModule {}