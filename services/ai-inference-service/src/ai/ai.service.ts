import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { VectorService } from './vector.service';
import { MonitoringService } from './monitoring.service';
import { LoggingService } from './logging.service';
import { Conversation } from './conversation.entity';
import { Message, MessageRole } from './message.entity';

@Injectable()
export class AIService {
  private openai: OpenAI;

  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private readonly vectorService: VectorService,
    private readonly monitoringService: MonitoringService,
    private readonly loggingService: LoggingService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateSuggestions(userId: string, context: string, maxResults = 5) {
    const startTime = Date.now();
    try {
      const prompt = `Based on the user's context: "${context}", provide ${maxResults} personalized suggestions for improving productivity, health, or daily life. Format as JSON array with id, type, confidence, and payload.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      });

      const duration = (Date.now() - startTime) / 1000;
      this.monitoringService.recordAiInference('suggestions', 'gpt-3.5-turbo', duration, true);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const suggestions = JSON.parse(content);

      this.loggingService.logAiInference('generate_suggestions', 'gpt-3.5-turbo', duration, true, userId);

      return {
        suggestions: suggestions.map((s, index) => ({
          id: `suggestion-${Date.now()}-${index}`,
          type: s.type || 'general',
          confidence: s.confidence || 0.8,
          payload: JSON.stringify(s.payload || s),
          createdAt: new Date(),
        })),
        modelMeta: JSON.stringify({
          model: 'gpt-3.5-turbo',
          tokens_used: response.usage?.total_tokens || 0,
        }),
      };
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.monitoringService.recordAiInference('suggestions', 'gpt-3.5-turbo', duration, false);
      this.loggingService.logError(error, 'generateSuggestions', userId);
      // Fallback to rule-based suggestions
      return this.getFallbackSuggestions(userId, context, maxResults);
    }
  }

  async chat(userId: string, message: string, conversationId?: string) {
    const startTime = Date.now();
    try {
      let conversation: Conversation;

      if (conversationId) {
        conversation = await this.conversationRepository.findOne({
          where: { id: conversationId, userId },
          relations: ['messages'],
        });
        if (!conversation) {
          throw new Error('Conversation not found');
        }
      } else {
        // Create new conversation
        conversation = this.conversationRepository.create({
          userId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        });
        await this.conversationRepository.save(conversation);
      }

      // Add user message to conversation
      const userMessage = this.messageRepository.create({
        conversationId: conversation.id,
        role: MessageRole.USER,
        content: message,
      });
      await this.messageRepository.save(userMessage);

      // Get conversation history (last 10 messages for context)
      const recentMessages = await this.messageRepository.find({
        where: { conversationId: conversation.id },
        order: { createdAt: 'ASC' },
        take: 10,
      });

      // Build messages array for OpenAI
      const messages = [
        {
          role: 'system',
          content: 'You are LifeOS, an AI personal assistant for productivity and wellbeing. Help the user optimize their daily life, health, finances, and learning. Be helpful, concise, and proactive. Maintain context from the conversation history.',
        },
        ...recentMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 300,
        temperature: 0.7,
      });

      const duration = (Date.now() - startTime) / 1000;
      this.monitoringService.recordAiInference('chat', 'gpt-3.5-turbo', duration, true);

      const reply = response.choices[0]?.message?.content || 'I apologize, but I cannot respond right now.';

      // Add assistant message to conversation
      const assistantMessage = this.messageRepository.create({
        conversationId: conversation.id,
        role: MessageRole.ASSISTANT,
        content: reply,
      });
      await this.messageRepository.save(assistantMessage);

      // Update conversation title if it's the first exchange
      if (conversation.messages.length === 0) {
        conversation.title = `${message.substring(0, 30)}...`;
        await this.conversationRepository.save(conversation);
      }

      this.loggingService.logAiInference('chat', 'gpt-3.5-turbo', duration, true, userId);

      return {
        message: reply,
        conversationId: conversation.id,
        timestamp: new Date(),
      };
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.monitoringService.recordAiInference('chat', 'gpt-3.5-turbo', duration, false);
      this.loggingService.logError(error, 'chat', userId);
      return {
        message: 'I apologize, but I cannot respond right now. Please try again later.',
        conversationId: conversationId || `conv-${Date.now()}`,
        timestamp: new Date(),
      };
    }
  }

      const systemPrompt = `You are LifeOS, an AI personal assistant for productivity and wellbeing. Help the user optimize their daily life, health, finances, and learning. Be helpful, concise, and proactive. ${contextPrompt}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const duration = (Date.now() - startTime) / 1000;
      this.monitoringService.recordAiInference('chat', 'gpt-3.5-turbo', duration, true);

      const reply = response.choices[0]?.message?.content || 'I apologize, but I cannot respond right now.';

      // Store conversation with embedding
      const convId = conversationId || `conv-${Date.now()}`;
      const storeStartTime = Date.now();
      await this.vectorService.storeEmbedding(convId, embedding, {
        userId,
        lastMessage: message,
        lastResponse: reply,
      });
      this.monitoringService.recordVectorSearch('store_embedding', (Date.now() - storeStartTime) / 1000);

      this.loggingService.logAiInference('chat', 'gpt-3.5-turbo', duration, true, userId);

      return {
        message: reply,
        conversationId: convId,
        timestamp: new Date(),
      };
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.monitoringService.recordAiInference('chat', 'gpt-3.5-turbo', duration, false);
      this.loggingService.logError(error, 'chat', userId);
      return {
        message: 'I apologize, but I cannot respond right now. Please try again later.',
        conversationId: conversationId || `conv-${Date.now()}`,
        timestamp: new Date(),
      };
    }
  }

  private getFallbackSuggestions(userId: string, context: string, maxResults: number) {
    const fallbackSuggestions = [
      {
        id: 'fallback-1',
        type: 'health',
        confidence: 0.7,
        payload: JSON.stringify({
          action: 'drink_water',
          reason: 'Stay hydrated for better focus',
        }),
        createdAt: new Date(),
      },
      {
        id: 'fallback-2',
        type: 'productivity',
        confidence: 0.6,
        payload: JSON.stringify({
          action: 'take_break',
          reason: 'Prevent burnout with regular breaks',
        }),
        createdAt: new Date(),
      },
    ];

    return {
      suggestions: fallbackSuggestions.slice(0, maxResults),
      modelMeta: JSON.stringify({
        model: 'fallback',
        reason: 'OpenAI unavailable',
      }),
    };
  }

  async optimizeSchedule(userId: string, tasks: any[], constraints: any = {}) {
    const startTime = Date.now();
    try {
      // Enhanced prompt with constraint satisfaction approach
      const prompt = `You are a constraint satisfaction solver for schedule optimization. Given:
Tasks: ${JSON.stringify(tasks)}
Constraints: ${JSON.stringify(constraints)}

Apply these optimization rules:
1. Priority ordering: High > Medium > Low
2. Time constraints: Respect due dates, duration limits
3. Energy levels: Schedule demanding tasks during peak energy times
4. Dependencies: Ensure dependent tasks are sequenced properly
5. Breaks: Insert short breaks between tasks
6. Commute time: Account for travel between locations
7. Daily limits: Don't exceed reasonable daily capacity

Use a hybrid approach:
- First, apply heuristic rules for initial placement
- Then, use local search to optimize within constraints
- Consider time budget of 500ms for computation

Return JSON with:
{
  "optimized_tasks": [array of tasks with assigned time slots],
  "reasoning": "explanation of optimization decisions",
  "constraints_satisfied": [list of satisfied constraints],
  "tradeoffs": [any compromises made]
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        temperature: 0.2, // Lower temperature for more deterministic results
      });

      const duration = (Date.now() - startTime) / 1000;
      this.monitoringService.recordAiInference('optimize_schedule', 'gpt-4', duration, true);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const optimizedSchedule = JSON.parse(content);

      this.loggingService.logAiInference('optimize_schedule', 'gpt-4', duration, true, userId);

      return {
        optimizedTasks: optimizedSchedule.optimized_tasks || [],
        reasoning: optimizedSchedule.reasoning || 'Optimized using constraint satisfaction',
        constraintsSatisfied: optimizedSchedule.constraints_satisfied || [],
        tradeoffs: optimizedSchedule.tradeoffs || [],
        modelMeta: JSON.stringify({
          model: 'gpt-4',
          tokens_used: response.usage?.total_tokens || 0,
          approach: 'constraint_satisfaction',
        }),
      };
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.monitoringService.recordAiInference('optimize_schedule', 'gpt-4', duration, false);
      this.loggingService.logError(error, 'optimizeSchedule', userId);
      // Fallback to simple priority-based sorting
      return this.fallbackScheduleOptimization(tasks, constraints);
    }
  }

  async generatePersonalizedRecommendations(userId: string, userData: any) {
    const startTime = Date.now();
    try {
      const prompt = `Based on user data: ${JSON.stringify(userData)}, generate personalized recommendations for health, productivity, learning, and finance. Consider user's goals, habits, and current status. Return as JSON array with category, priority, and actionable advice.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.5,
      });

      const duration = (Date.now() - startTime) / 1000;
      this.monitoringService.recordAiInference('generate_recommendations', 'gpt-4', duration, true);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const recommendations = JSON.parse(content);

      this.loggingService.logAiInference('generate_recommendations', 'gpt-4', duration, true, userId);

      return {
        recommendations: recommendations.map((rec, index) => ({
          id: `rec-${Date.now()}-${index}`,
          category: rec.category,
          priority: rec.priority || 'medium',
          advice: rec.advice,
          actionable: rec.actionable || true,
          createdAt: new Date(),
        })),
        modelMeta: JSON.stringify({
          model: 'gpt-4',
          tokens_used: response.usage?.total_tokens || 0,
        }),
      };
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.monitoringService.recordAiInference('generate_recommendations', 'gpt-4', duration, false);
      this.loggingService.logError(error, 'generatePersonalizedRecommendations', userId);
      return this.fallbackRecommendations(userData);
    }
  }

  private fallbackScheduleOptimization(tasks: any[], constraints: any) {
    // Simple priority-based optimization
    const sortedTasks = tasks.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return {
      optimizedTasks: sortedTasks.map((task, index) => ({
        ...task,
        suggestedTime: `Slot ${index + 1}`,
      })),
      reasoning: 'Sorted by priority (fallback)',
      modelMeta: JSON.stringify({
        model: 'fallback',
        reason: 'OpenAI unavailable',
      }),
    };
  }

  private fallbackRecommendations(userData: any) {
    const fallbackRecs = [
      {
        id: 'fallback-rec-1',
        category: 'health',
        priority: 'high',
        advice: 'Remember to stay hydrated throughout the day',
        actionable: true,
        createdAt: new Date(),
      },
      {
        id: 'fallback-rec-2',
        category: 'productivity',
        priority: 'medium',
        advice: 'Take short breaks between tasks to maintain focus',
        actionable: true,
        createdAt: new Date(),
      },
    ];

    return {
      recommendations: fallbackRecs,
      modelMeta: JSON.stringify({
        model: 'fallback',
        reason: 'OpenAI unavailable',
      }),
    };
  }

  private async getEmbedding(text: string): Promise<number[]> {
    const startTime = Date.now();
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      const duration = (Date.now() - startTime) / 1000;
      this.monitoringService.recordAiInference('get_embedding', 'text-embedding-ada-002', duration, true);

      return response.data[0].embedding;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.monitoringService.recordAiInference('get_embedding', 'text-embedding-ada-002', duration, false);
      this.loggingService.logError(error, 'getEmbedding');
      // Return zero vector as fallback
      return new Array(1536).fill(0);
    }
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { userId },
      relations: ['messages'],
      order: { updatedAt: 'DESC' },
    });
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    return this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['messages'],
      order: { createdAt: 'ASC' },
    });
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, userId },
    });
    if (conversation) {
      await this.conversationRepository.remove(conversation);
    }
  }

  async summarize(userId: string, content: string, type: string): Promise<string> {
    const startTime = Date.now();
    try {
      const prompt = `Summarize the following ${type}: "${content}". Provide a concise summary in 2-3 sentences.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.3,
      });

      const duration = (Date.now() - startTime) / 1000;
      this.monitoringService.recordAiInference('summarize', 'gpt-3.5-turbo', duration, true);

      return response.choices[0]?.message?.content || 'Summary not available';
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.monitoringService.recordAiInference('summarize', 'gpt-3.5-turbo', duration, false);
      return `Summary of ${type}: ${content.substring(0, 100)}...`;
    }
  }

  async suggestActions(userId: string, context: string, type: string): Promise<any[]> {
    const startTime = Date.now();
    try {
      const prompt = `Based on the following ${type} context: "${context}", suggest 3-5 actionable next steps or quick actions the user could take. Return as JSON array with type and description fields.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.5,
      });

      const duration = (Date.now() - startTime) / 1000;
      this.monitoringService.recordAiInference('suggest_actions', 'gpt-3.5-turbo', duration, true);

      const content = response.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
      return [
        { type: 'view', description: 'Review the content' },
        { type: 'share', description: 'Share with others' },
        { type: 'archive', description: 'Save for later' },
      ];
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.monitoringService.recordAiInference('suggest_actions', 'gpt-3.5-turbo', duration, false);
      return [
        { type: 'view', description: 'Review the content' },
        { type: 'share', description: 'Share with others' },
        { type: 'archive', description: 'Save for later' },
      ];
    }
  }

  async generateProactiveSuggestions(userId: string, userData: any): Promise<any[]> {
    const startTime = Date.now();
    try {
      const prompt = `Analyze the user's data and patterns: ${JSON.stringify(userData)}. Identify opportunities for proactive suggestions that would help the user. Consider:
      - Health patterns (sleep, activity, vitals)
      - Productivity patterns (task completion, time management)
      - Financial patterns (spending, savings goals)
      - Learning patterns (progress, goals)
      - Calendar patterns (scheduling, meetings)

      Return 3-5 proactive suggestions as JSON array with type, title, description, and urgency (low/medium/high). Focus on actionable insights.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.4,
      });

      const duration = (Date.now() - startTime) / 1000;
      this.monitoringService.recordAiInference('proactive_suggestions', 'gpt-4', duration, true);

      const content = response.choices[0]?.message?.content;
      if (content) {
        const suggestions = JSON.parse(content);
        return suggestions.map((s, index) => ({
          id: `proactive-${Date.now()}-${index}`,
          type: s.type,
          title: s.title,
          description: s.description,
          urgency: s.urgency || 'medium',
          createdAt: new Date(),
        }));
      }

      return this.fallbackProactiveSuggestions(userData);
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.monitoringService.recordAiInference('proactive_suggestions', 'gpt-4', duration, false);
      this.loggingService.logError(error, 'generateProactiveSuggestions', userId);
      return this.fallbackProactiveSuggestions(userData);
    }
  }

  private fallbackProactiveSuggestions(userData: any): any[] {
    const suggestions = [
      {
        id: 'fallback-proactive-1',
        type: 'health',
        title: 'Health Check Reminder',
        description: 'It\'s been a few days since your last health sync. Consider updating your vitals.',
        urgency: 'low',
        createdAt: new Date(),
      },
      {
        id: 'fallback-proactive-2',
        type: 'productivity',
        title: 'Task Review',
        description: 'You have several pending tasks. Consider prioritizing them for today.',
        urgency: 'medium',
        createdAt: new Date(),
      },
    ];

    return suggestions;
  }
}