import { Injectable, Logger } from "@nestjs/common";
import { VectorDbService, VectorRecord } from "../vector-db/vector-db.service";
import { LlmService, LLMRequest } from "../llm/llm.service";
import { v4 as uuidv4 } from 'uuid';

export interface AISuggestion {
  id: string;
  type: 'task' | 'schedule' | 'health' | 'finance' | 'learning';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface AIContext {
  userId: string;
  recentActivities: string[];
  currentTasks: string[];
  healthData?: string;
  scheduleData?: string;
  financialData?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly vectorDbService: VectorDbService,
    private readonly llmService: LlmService,
  ) {}

  async generateSuggestions(context: AIContext, limit: number = 5): Promise<AISuggestion[]> {
    try {
      // Build context string for LLM
      const contextString = this.buildContextString(context);

      // Generate embeddings for context
      const [contextEmbedding] = await this.llmService.generateEmbeddings([contextString]);

      // Search for similar past contexts
      const similarContexts = await this.vectorDbService.searchVectors(
        contextEmbedding,
        context.userId,
        5,
        'type == "context"'
      );

      // Generate suggestions using LLM
      const suggestions = await this.generateContextualSuggestions(context, similarContexts);

      // Store this context for future learning
      await this.storeContext(context, contextEmbedding);

      return suggestions.slice(0, limit);
    } catch (error) {
      this.logger.error("Failed to generate AI suggestions", error);
      // Return fallback suggestions
      return this.getFallbackSuggestions(context);
    }
  }

  async processUserQuery(userId: string, query: string, context?: AIContext): Promise<string> {
    try {
      // Generate embedding for the query
      const [queryEmbedding] = await this.llmService.generateEmbeddings([query]);

      // Search for relevant context from user's history
      const relevantContext = await this.vectorDbService.searchVectors(
        queryEmbedding,
        userId,
        3
      );

      // Build enhanced context
      const enhancedContext = context ? this.buildContextString(context) : '';
      const historicalContext = relevantContext
        .map(r => r.metadata.content)
        .join('\n');

      const fullContext = `User context: ${enhancedContext}\nHistorical interactions: ${historicalContext}`;

      // Generate response
      const llmRequest: LLMRequest = {
        prompt: query,
        userId,
        context: fullContext,
        maxTokens: 800,
        temperature: 0.7,
      };

      const response = await this.llmService.generateCompletion(llmRequest);

      // Store the interaction for learning
      await this.storeInteraction(userId, query, response.content, queryEmbedding);

      return response.content;
    } catch (error) {
      this.logger.error("Failed to process user query", error);
      return "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
    }
  }

  async analyzeSchedule(userId: string, scheduleData: string): Promise<{
    conflicts: string[];
    optimizations: string[];
    suggestions: AISuggestion[];
  }> {
    try {
      const analysis = await this.llmService.analyzeScheduleConflicts(scheduleData);

      // Generate specific suggestions based on analysis
      const suggestions: AISuggestion[] = [];

      if (analysis.conflicts.length > 0) {
        suggestions.push({
          id: uuidv4(),
          type: 'schedule',
          title: 'Resolve Schedule Conflicts',
          description: `Found ${analysis.conflicts.length} scheduling conflicts that need attention.`,
          priority: 'high',
          actionable: true,
          confidence: 0.9,
          metadata: { conflicts: analysis.conflicts },
        });
      }

      analysis.suggestions.forEach(suggestion => {
        suggestions.push({
          id: uuidv4(),
          type: 'schedule',
          title: 'Schedule Optimization',
          description: suggestion,
          priority: 'medium',
          actionable: true,
          confidence: 0.8,
        });
      });

      return {
        conflicts: analysis.conflicts,
        optimizations: analysis.suggestions,
        suggestions,
      };
    } catch (error) {
      this.logger.error("Failed to analyze schedule", error);
      return {
        conflicts: [],
        optimizations: [],
        suggestions: [],
      };
    }
  }

  async generateHealthInsights(userId: string, healthData: string): Promise<AISuggestion[]> {
    try {
      const insights = await this.llmService.generateHealthInsights(healthData);

      return insights.map(insight => ({
        id: uuidv4(),
        type: 'health',
        title: 'Health Insight',
        description: insight,
        priority: 'medium',
        actionable: true,
        confidence: 0.8,
      }));
    } catch (error) {
      this.logger.error("Failed to generate health insights", error);
      return [];
    }
  }

  private buildContextString(context: AIContext): string {
    return `
User Activities: ${context.recentActivities.join(', ')}
Current Tasks: ${context.currentTasks.join(', ')}
${context.healthData ? `Health Data: ${context.healthData}` : ''}
${context.scheduleData ? `Schedule: ${context.scheduleData}` : ''}
${context.financialData ? `Financial Data: ${context.financialData}` : ''}
    `.trim();
  }

  private async generateContextualSuggestions(
    context: AIContext,
    similarContexts: VectorRecord[]
  ): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    // Task-related suggestions
    if (context.currentTasks.length > 0) {
      const taskSuggestions = await this.llmService.generateTaskSuggestions(
        context.userId,
        `Current tasks: ${context.currentTasks.join(', ')}`
      );

      taskSuggestions.forEach(suggestion => {
        suggestions.push({
          id: uuidv4(),
          type: 'task',
          title: 'Task Suggestion',
          description: suggestion,
          priority: 'medium',
          actionable: true,
          confidence: 0.7,
        });
      });
    }

    // Health suggestions
    if (context.healthData) {
      const healthInsights = await this.generateHealthInsights(context.userId, context.healthData);
      suggestions.push(...healthInsights);
    }

    // Schedule suggestions
    if (context.scheduleData) {
      const scheduleAnalysis = await this.analyzeSchedule(context.userId, context.scheduleData);
      suggestions.push(...scheduleAnalysis.suggestions);
    }

    return suggestions;
  }

  private async storeContext(context: AIContext, embedding: number[]): Promise<void> {
    try {
      const contextString = this.buildContextString(context);
      const record: VectorRecord = {
        id: uuidv4(),
        vector: embedding,
        metadata: {
          userId: context.userId,
          content: contextString,
          type: 'context',
          timestamp: new Date(),
          tags: ['context', 'user_state'],
        },
      };

      await this.vectorDbService.insertVectors([record]);
    } catch (error) {
      this.logger.error("Failed to store context", error);
    }
  }

  private async storeInteraction(
    userId: string,
    query: string,
    response: string,
    embedding: number[]
  ): Promise<void> {
    try {
      const interactionContent = `Query: ${query}\nResponse: ${response}`;
      const record: VectorRecord = {
        id: uuidv4(),
        vector: embedding,
        metadata: {
          userId,
          content: interactionContent,
          type: 'interaction',
          timestamp: new Date(),
          tags: ['interaction', 'conversation'],
        },
      };

      await this.vectorDbService.insertVectors([record]);
    } catch (error) {
      this.logger.error("Failed to store interaction", error);
    }
  }

  private getFallbackSuggestions(context: AIContext): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    if (context.currentTasks.length === 0) {
      suggestions.push({
        id: uuidv4(),
        type: 'task',
        title: 'Start Your Day',
        description: 'Create your first task to get organized and productive.',
        priority: 'high',
        actionable: true,
        confidence: 0.9,
      });
    }

    suggestions.push({
      id: uuidv4(),
      type: 'health',
      title: 'Daily Check-in',
      description: 'Take a moment to log your health metrics and wellbeing.',
      priority: 'medium',
      actionable: true,
      confidence: 0.8,
    });

    return suggestions;
  }
}