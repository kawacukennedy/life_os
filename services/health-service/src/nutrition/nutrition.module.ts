import { Module } from '@nestjs/common';
import { NutritionService } from './nutrition.service';

@Module({
  providers: [NutritionService],
  exports: [NutritionService],
})
export class NutritionModule {}