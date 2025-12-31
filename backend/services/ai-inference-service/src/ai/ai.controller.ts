import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService, AISuggestion, AIContext } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('suggest')
  @ApiOperation({ summary: 'Generate AI-powered suggestions' })
  @ApiResponse({ status: 200, description: 'Suggestions generated successfully', type: [Object] })
  async generateSuggestions(
    @Request() req,
    @Body() body: {
      context?: AIContext;
      limit?: number;
    },
  ) {
    const context: AIContext = body.context || {
      userId: req.user.userId,
      recentActivities: [],
      currentTasks: [],
    };

    // Ensure userId matches authenticated user
    context.userId = req.user.userId;

    const limit = body.limit || 5;
    return this.aiService.generateSuggestions(context, limit);
  }

  @Post('query')
  @ApiOperation({ summary: 'Process natural language query' })
  @ApiResponse({ status: 200, description: 'Query processed successfully' })
  async processQuery(
    @Request() req,
    @Body() body: {
      query: string;
      context?: AIContext;
    },
  ) {
    if (!body.query) {
      throw new BadRequestException('Query is required');
    }

    return this.aiService.processUserQuery(req.user.userId, body.query, body.context);
  }

  @Post('analyze-schedule')
  @ApiOperation({ summary: 'Analyze schedule for conflicts and optimizations' })
  @ApiResponse({ status: 200, description: 'Schedule analyzed successfully' })
  async analyzeSchedule(
    @Request() req,
    @Body() body: { scheduleData: string },
  ) {
    if (!body.scheduleData) {
      throw new BadRequestException('Schedule data is required');
    }

    return this.aiService.analyzeSchedule(req.user.userId, body.scheduleData);
  }

  @Post('health-insights')
  @ApiOperation({ summary: 'Generate health insights from data' })
  @ApiResponse({ status: 200, description: 'Health insights generated successfully', type: [Object] })
  async generateHealthInsights(
    @Request() req,
    @Body() body: { healthData: string },
  ) {
    if (!body.healthData) {
      throw new BadRequestException('Health data is required');
    }

    return this.aiService.generateHealthInsights(req.user.userId, body.healthData);
  }

  @Get('embeddings/search')
  @ApiOperation({ summary: 'Search user embeddings' })
  @ApiResponse({ status: 200, description: 'Embeddings searched successfully' })
  async searchEmbeddings(
    @Request() req,
    @Query('query') query: string,
    @Query('limit') limit?: string,
  ) {
    if (!query) {
      throw new BadRequestException('Query parameter is required');
    }

    // This would require implementing embedding search in the service
    // For now, return a placeholder response
    return {
      message: 'Embedding search functionality',
      query,
      limit: limit ? parseInt(limit) : 10,
    };
  }
}