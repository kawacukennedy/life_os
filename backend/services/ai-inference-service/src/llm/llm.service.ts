import { Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";

export interface LLMRequest {
  prompt: string;
  userId: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    try {
      const model = request.model || "gpt-3.5-turbo";
      const maxTokens = request.maxTokens || 1000;
      const temperature = request.temperature || 0.7;

      // Build messages with context
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

      if (request.context) {
        messages.push({
          role: "system",
          content: `You are LifeOS, an AI assistant for personal productivity and life management. Context: ${request.context}`,
        });
      } else {
        messages.push({
          role: "system",
          content: "You are LifeOS, an AI assistant for personal productivity and life management. Help users optimize their daily routines, manage tasks, and improve their wellbeing.",
        });
      }

      messages.push({
        role: "user",
        content: request.prompt,
      });

      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        user: request.userId, // For abuse monitoring
      });

      const choice = completion.choices[0];
      const usage = completion.usage;

      return {
        content: choice.message.content || "",
        usage: {
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
        },
        model: completion.model,
        finishReason: choice.finish_reason || "stop",
      };
    } catch (error) {
      this.logger.error("Failed to generate LLM completion", error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: texts,
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      this.logger.error("Failed to generate embeddings", error);
      throw error;
    }
  }

  async generateTaskSuggestions(userId: string, context: string): Promise<string[]> {
    const prompt = `Based on the following user context, suggest 3-5 actionable tasks or improvements for their productivity and wellbeing:

Context: ${context}

Please provide specific, actionable suggestions that are:
1. Realistic and achievable
2. Personalized to their situation
3. Focused on productivity, health, or work-life balance
4. Include specific timeframes or metrics where possible

Format each suggestion as a clear, concise action item.`;

    const response = await this.generateCompletion({
      prompt,
      userId,
      maxTokens: 500,
      temperature: 0.8,
    });

    // Parse the response into individual suggestions
    return response.content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 10);
  }

  async analyzeScheduleConflicts(scheduleData: string): Promise<{
    conflicts: string[];
    suggestions: string[];
  }> {
    const prompt = `Analyze the following schedule for conflicts and optimization opportunities:

${scheduleData}

Please identify:
1. Any scheduling conflicts or overlaps
2. Periods of high workload that might cause burnout
3. Opportunities to optimize time usage
4. Suggestions for better work-life balance

Format your response as:
CONFLICTS:
- List any conflicts

SUGGESTIONS:
- List optimization suggestions`;

    const response = await this.generateCompletion({
      prompt,
      userId: "system",
      maxTokens: 600,
      temperature: 0.3,
    });

    const content = response.content;
    const conflictsSection = content.split('CONFLICTS:')[1]?.split('SUGGESTIONS:')[0] || '';
    const suggestionsSection = content.split('SUGGESTIONS:')[1] || '';

    const conflicts = conflictsSection
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim());

    const suggestions = suggestionsSection
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim());

    return { conflicts, suggestions };
  }

  async generateHealthInsights(healthData: string): Promise<string[]> {
    const prompt = `Based on the following health and fitness data, provide personalized insights and recommendations:

${healthData}

Focus on:
1. Trends in activity levels, sleep quality, and vital signs
2. Areas for improvement
3. Specific, actionable recommendations
4. Positive reinforcement for good habits

Keep suggestions realistic and encouraging.`;

    const response = await this.generateCompletion({
      prompt,
      userId: "system",
      maxTokens: 400,
      temperature: 0.7,
    });

    return response.content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.trim());
  }

  async summarizeContent(content: string, maxLength: number = 200): Promise<string> {
    const prompt = `Please provide a concise summary of the following content in ${maxLength} characters or less:

${content}

Summary:`;

    const response = await this.generateCompletion({
      prompt,
      userId: "system",
      maxTokens: 100,
      temperature: 0.3,
    });

    return response.content.replace(/^Summary:\s*/i, '').trim();
  }
}