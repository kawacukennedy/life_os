import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { RoutinesService } from './routines.service';
import { Routine } from './routine.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('routines')
@UseGuards(JwtAuthGuard)
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post()
  create(@Body() createRoutineDto: Partial<Routine>): Promise<Routine> {
    return this.routinesService.create(createRoutineDto);
  }

  @Get()
  findAll(@Body('userId') userId: string): Promise<Routine[]> {
    return this.routinesService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Routine> {
    return this.routinesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoutineDto: Partial<Routine>): Promise<Routine> {
    return this.routinesService.update(id, updateRoutineDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.routinesService.remove(id);
  }

  @Post(':id/trigger')
  triggerRoutine(@Param('id') id: string, @Body() triggerData?: any): Promise<void> {
    return this.routinesService.triggerRoutine(id, triggerData);
  }

  @Post('check/:userId/:triggerType')
  checkRoutinesForUser(
    @Param('userId') userId: string,
    @Param('triggerType') triggerType: string,
    @Body() triggerData?: any,
  ): Promise<void> {
    return this.routinesService.checkAllRoutinesForUser(userId, triggerType as any, triggerData);
  }
}