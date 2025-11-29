import { Controller, Post, Body } from '@nestjs/common';
import { AIService } from './ai.service';

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('suggest')
  async getSuggestions(@Body() body: { userId: string; context: string; maxResults?: number }) {
    return this.aiService.generateSuggestions(body.userId, body.context, body.maxResults);
  }

  @Post('chat')
  async chat(@Body() body: { userId: string; message: string; conversationId?: string }) {
    return this.aiService.chat(body.userId, body.message, body.conversationId);
  }
}