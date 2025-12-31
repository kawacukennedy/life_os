import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
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

   @Post('optimize-schedule')
   async optimizeSchedule(@Body() body: { userId: string; tasks: any[]; constraints?: any }) {
     return this.aiService.optimizeSchedule(body.userId, body.tasks, body.constraints);
   }

    @Post('recommendations')
    async getRecommendations(@Body() body: { userId: string; userData: any }) {
      return this.aiService.generatePersonalizedRecommendations(body.userId, body.userData);
    }

    @Get('conversations/:userId')
    async getConversations(@Param('userId') userId: string) {
      return this.aiService.getConversations(userId);
    }

    @Get('conversations/detail/:conversationId')
    async getConversation(@Param('conversationId') conversationId: string) {
      return this.aiService.getConversation(conversationId);
    }

    @Delete('conversations/:conversationId/:userId')
    async deleteConversation(@Param('conversationId') conversationId: string, @Param('userId') userId: string) {
      await this.aiService.deleteConversation(conversationId, userId);
      return { success: true };
    }

    @Post('summarize')
    async summarize(@Body() body: { userId: string; content: string; type: string }) {
      return { summary: await this.aiService.summarize(body.userId, body.content, body.type) };
    }

    @Post('suggest-actions')
    async suggestActions(@Body() body: { userId: string; context: string; type: string }) {
      return { suggestions: await this.aiService.suggestActions(body.userId, body.context, body.type) };
    }

    @Post('proactive-suggestions')
    async getProactiveSuggestions(@Body() body: { userId: string; userData: any }) {
      return { suggestions: await this.aiService.generateProactiveSuggestions(body.userId, body.userData) };
    }

    @Post('categorize-transaction')
    async categorizeTransaction(@Body() body: { transaction: any }) {
      return this.aiService.categorizeTransaction(body.transaction);
    }
  }