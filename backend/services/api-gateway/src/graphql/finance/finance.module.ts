import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FinanceResolver } from './finance.resolver';
import { FinanceService } from './finance.service';

@Module({
  imports: [HttpModule],
  providers: [FinanceResolver, FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}