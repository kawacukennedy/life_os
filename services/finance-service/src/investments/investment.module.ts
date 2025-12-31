import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InvestmentService } from './investment.service';

@Module({
  imports: [HttpModule],
  providers: [InvestmentService],
  exports: [InvestmentService],
})
export class InvestmentModule {}