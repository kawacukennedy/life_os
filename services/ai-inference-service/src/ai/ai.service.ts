import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateSuggestions(userId: string, context: string, maxResults = 5) {
    try {
      const prompt = `Based on the user's context: "${context}", provide ${maxResults} personalized suggestions for improving productivity, health, or daily life. Format as JSON array with id, type, confidence, and payload.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const suggestions = JSON.parse(content);

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
      console.error('AI suggestion error:', error);
      // Fallback to rule-based suggestions
      return this.getFallbackSuggestions(userId, context, maxResults);
    }
  }

  async chat(userId: string, message: string, conversationId?: string) {
    try {
      const systemPrompt = `You are LifeOS, an AI personal assistant for productivity and wellbeing. Help the user optimize their daily life, health, finances, and learning. Be helpful, concise, and proactive.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const reply = response.choices[0]?.message?.content || 'I apologize, but I cannot respond right now.';

      return {
        message: reply,
        conversationId: conversationId || `conv-${Date.now()}`,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('AI chat error:', error);
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
}