import { Injectable } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { LoggingService } from './logging.service';

export interface Recommendation {
  id: string;
  type: 'task' | 'health' | 'finance' | 'learning' | 'social';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  features: Record<string, any>;
}

export interface UserContext {
  userId: string;
  preferences: Record<string, any>;
  recentActivity: Activity[];
  currentState: {
    healthScore?: number;
    productivityScore?: number;
    financialHealth?: number;
    socialEngagement?: number;
  };
}

export interface Activity {
  type: string;
  timestamp: Date;
  data: Record<string, any>;
}

export interface RerankedRecommendations {
  recommendations: Recommendation[];
  ranking: RankingMetadata;
}

export interface RankingMetadata {
  algorithm: string;
  featuresUsed: string[];
  processingTime: number;
  confidence: number;
}

@Injectable()
export class RecommendationRerankerService {
  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly loggingService: LoggingService,
  ) {}

  async rerankRecommendations(
    recommendations: Recommendation[],
    userContext: UserContext,
    topK: number = 5
  ): Promise<RerankedRecommendations> {
    const startTime = Date.now();

    try {
      // Extract features for each recommendation
      const scoredRecommendations = await Promise.all(
        recommendations.map(rec => this.scoreRecommendation(rec, userContext))
      );

      // Sort by score (higher is better)
      scoredRecommendations.sort((a, b) => b.score - a.score);

      // Apply diversity and novelty filters
      const diverseRecommendations = this.applyDiversityFilter(scoredRecommendations, userContext);

      // Limit to top K
      const topRecommendations = diverseRecommendations.slice(0, topK);

      const processingTime = Date.now() - startTime;

      this.monitoringService.recordRecommendationReranking('rerank_recommendations', processingTime / 1000);
      this.loggingService.logRecommendationOperation('rerank_recommendations', 'success', processingTime / 1000);

      return {
        recommendations: topRecommendations.map(item => item.recommendation),
        ranking: {
          algorithm: 'learning_to_rank_with_diversity',
          featuresUsed: [
            'user_preferences',
            'recent_activity',
            'current_state',
            'temporal_relevance',
            'diversity_score',
            'novelty_score'
          ],
          processingTime,
          confidence: this.calculateOverallConfidence(topRecommendations)
        }
      };
    } catch (error) {
      this.monitoringService.recordRecommendationReranking('rerank_recommendations', (Date.now() - startTime) / 1000);
      this.loggingService.logError(error, 'rerankRecommendations');
      throw error;
    }
  }

  private async scoreRecommendation(
    recommendation: Recommendation,
    userContext: UserContext
  ): Promise<{ recommendation: Recommendation; score: number; features: Record<string, number> }> {
    const features: Record<string, number> = {};

    // Base score from original confidence
    features.baseConfidence = recommendation.confidence;

    // User preference alignment
    features.preferenceAlignment = this.calculatePreferenceAlignment(recommendation, userContext.preferences);

    // Temporal relevance
    features.temporalRelevance = this.calculateTemporalRelevance(recommendation, userContext);

    // Current state relevance
    features.stateRelevance = this.calculateStateRelevance(recommendation, userContext.currentState);

    // Recent activity correlation
    features.activityCorrelation = this.calculateActivityCorrelation(recommendation, userContext.recentActivity);

    // Urgency based on priority
    features.urgency = this.priorityToScore(recommendation.priority);

    // Contextual boost
    features.contextualBoost = this.calculateContextualBoost(recommendation, userContext);

    // Calculate final score using learned weights (simplified linear combination)
    const weights = {
      baseConfidence: 0.3,
      preferenceAlignment: 0.2,
      temporalRelevance: 0.15,
      stateRelevance: 0.15,
      activityCorrelation: 0.1,
      urgency: 0.05,
      contextualBoost: 0.05
    };

    const score = Object.entries(features).reduce((sum, [feature, value]) => {
      return sum + (value * weights[feature]);
    }, 0);

    return {
      recommendation,
      score: Math.max(0, Math.min(1, score)), // Normalize to [0,1]
      features
    };
  }

  private calculatePreferenceAlignment(recommendation: Recommendation, preferences: Record<string, any>): number {
    let alignment = 0.5; // Neutral baseline

    // Type preferences
    if (preferences.preferredTypes?.includes(recommendation.type)) {
      alignment += 0.3;
    } else if (preferences.avoidedTypes?.includes(recommendation.type)) {
      alignment -= 0.3;
    }

    // Priority preferences
    if (preferences.preferredPriority === recommendation.priority) {
      alignment += 0.2;
    }

    // Time preferences
    if (preferences.preferredTimes) {
      const now = new Date();
      const currentHour = now.getHours();
      const preferredHours = preferences.preferredTimes;

      if (preferredHours.includes(currentHour)) {
        alignment += 0.1;
      }
    }

    return Math.max(0, Math.min(1, alignment));
  }

  private calculateTemporalRelevance(recommendation: Recommendation, userContext: UserContext): number {
    const now = new Date();
    let relevance = 0.5;

    // Morning recommendations
    if (now.getHours() < 12) {
      if (recommendation.type === 'health' || recommendation.type === 'learning') {
        relevance += 0.2;
      }
    }

    // Evening recommendations
    if (now.getHours() >= 18) {
      if (recommendation.type === 'social' || recommendation.type === 'health') {
        relevance += 0.2;
      }
    }

    // Weekend vs weekday
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    if (isWeekend && recommendation.type === 'social') {
      relevance += 0.1;
    } else if (!isWeekend && recommendation.type === 'task') {
      relevance += 0.1;
    }

    // Recent activity patterns
    const recentTypes = userContext.recentActivity
      .slice(0, 10)
      .map(activity => activity.type);

    if (recentTypes.includes(recommendation.type)) {
      relevance += 0.1; // Continue current pattern
    } else {
      relevance -= 0.05; // Introduce variety
    }

    return Math.max(0, Math.min(1, relevance));
  }

  private calculateStateRelevance(recommendation: Recommendation, currentState: Record<string, any>): number {
    let relevance = 0.5;

    switch (recommendation.type) {
      case 'health':
        if (currentState.healthScore && currentState.healthScore < 70) {
          relevance += 0.3;
        }
        break;

      case 'task':
        if (currentState.productivityScore && currentState.productivityScore < 60) {
          relevance += 0.3;
        }
        break;

      case 'finance':
        if (currentState.financialHealth && currentState.financialHealth < 50) {
          relevance += 0.3;
        }
        break;

      case 'social':
        if (currentState.socialEngagement && currentState.socialEngagement < 40) {
          relevance += 0.3;
        }
        break;

      case 'learning':
        // Learning is always somewhat relevant
        relevance += 0.1;
        break;
    }

    return Math.max(0, Math.min(1, relevance));
  }

  private calculateActivityCorrelation(recommendation: Recommendation, recentActivity: Activity[]): number {
    let correlation = 0.5;

    // Look at recent activity patterns
    const recentTypes = recentActivity
      .slice(0, 5)
      .map(activity => activity.type);

    const typeFrequency = recentTypes.filter(type => type === recommendation.type).length;
    correlation += (typeFrequency / 5) * 0.2; // Boost if user has been active in this area

    // Time-based patterns
    const recentHours = recentActivity
      .slice(0, 10)
      .map(activity => activity.timestamp.getHours());

    const currentHour = new Date().getHours();
    const hourMatches = recentHours.filter(hour => Math.abs(hour - currentHour) <= 2).length;
    correlation += (hourMatches / 10) * 0.1;

    return Math.max(0, Math.min(1, correlation));
  }

  private priorityToScore(priority: string): number {
    switch (priority) {
      case 'high': return 1.0;
      case 'medium': return 0.7;
      case 'low': return 0.4;
      default: return 0.5;
    }
  }

  private calculateContextualBoost(recommendation: Recommendation, userContext: UserContext): number {
    let boost = 0;

    // Weather-based boosts (would integrate with weather API)
    // For now, use time-based approximation
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 10 && recommendation.type === 'health') {
      boost += 0.1; // Morning workout boost
    }

    // Goal alignment
    if (userContext.preferences.goals) {
      const goals = userContext.preferences.goals;
      if (goals.includes('fitness') && recommendation.type === 'health') {
        boost += 0.2;
      }
      if (goals.includes('productivity') && recommendation.type === 'task') {
        boost += 0.2;
      }
      if (goals.includes('learning') && recommendation.type === 'learning') {
        boost += 0.2;
      }
    }

    return Math.max(0, Math.min(1, boost));
  }

  private applyDiversityFilter(
    scoredRecommendations: Array<{ recommendation: Recommendation; score: number; features: Record<string, number> }>,
    userContext: UserContext
  ): Recommendation[] {
    const selected: Recommendation[] = [];
    const typeCounts: Record<string, number> = {};

    for (const item of scoredRecommendations) {
      const type = item.recommendation.type;

      // Diversity penalty for too many of same type
      const diversityPenalty = (typeCounts[type] || 0) * 0.1;
      const adjustedScore = item.score * (1 - diversityPenalty);

      if (adjustedScore > 0.3 || selected.length < 3) { // Minimum threshold or ensure at least 3 recommendations
        selected.push(item.recommendation);
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }

      if (selected.length >= 10) break; // Limit for processing
    }

    return selected;
  }

  private calculateOverallConfidence(
    topRecommendations: Array<{ recommendation: Recommendation; score: number; features: Record<string, number> }>
  ): number {
    if (topRecommendations.length === 0) return 0;

    const avgScore = topRecommendations.reduce((sum, item) => sum + item.score, 0) / topRecommendations.length;
    const avgConfidence = topRecommendations.reduce((sum, item) => sum + item.recommendation.confidence, 0) / topRecommendations.length;

    return (avgScore + avgConfidence) / 2;
  }

  async updateUserFeedback(
    userId: string,
    recommendationId: string,
    feedback: 'accepted' | 'dismissed' | 'snoozed',
    context?: Record<string, any>
  ): Promise<void> {
    // In a real implementation, this would update the learning model
    // For now, just log the feedback for future model training

    this.loggingService.logRecommendationFeedback(userId, recommendationId, feedback, context);

    // Could trigger model retraining or feature updates
    if (feedback === 'accepted') {
      // Increase weights for features that led to acceptance
    } else {
      // Decrease weights for features that led to dismissal
    }
  }
}