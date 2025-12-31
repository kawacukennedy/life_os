import { Injectable, Logger } from "@nestjs/common";
import { ConnectionsService } from "../connections/connections.service";

export interface UserProfile {
  userId: string;
  goals?: string[];
  interests?: string[];
  location?: string;
  timezone?: string;
  fitnessLevel?: string;
  workType?: string;
  industry?: string;
}

export interface RecommendationResult {
  userId: string;
  score: number;
  reasons: string[];
  commonGoals: string[];
  commonInterests: string[];
  compatibilityScore: number;
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(private readonly connectionsService: ConnectionsService) {}

  async getRecommendations(
    userId: string,
    userProfile: UserProfile,
    allUsers: UserProfile[],
    limit: number = 10
  ): Promise<RecommendationResult[]> {
    try {
      // Get existing connections to exclude
      const existingConnections = await this.connectionsService.getAcceptedConnections(userId);
      const connectedUserIds = new Set(
        existingConnections.flatMap(conn =>
          conn.requesterId === userId ? [conn.addresseeId] : [conn.requesterId]
        )
      );

      // Filter out connected users and self
      const potentialMatches = allUsers.filter(user =>
        user.userId !== userId && !connectedUserIds.has(user.userId)
      );

      // Calculate compatibility scores
      const recommendations = await Promise.all(
        potentialMatches.map(async user => {
          const score = await this.calculateCompatibilityScore(userProfile, user);
          return {
            userId: user.userId,
            score,
            reasons: this.generateRecommendationReasons(userProfile, user),
            commonGoals: this.findCommonItems(userProfile.goals || [], user.goals || []),
            commonInterests: this.findCommonItems(userProfile.interests || [], user.interests || []),
            compatibilityScore: score,
          };
        })
      );

      // Sort by score and return top recommendations
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      this.logger.error(`Failed to get recommendations for ${userId}`, error);
      return [];
    }
  }

  async getSimilarUsers(
    userId: string,
    userProfile: UserProfile,
    allUsers: UserProfile[],
    criteria: 'goals' | 'interests' | 'location' | 'lifestyle' = 'goals'
  ): Promise<RecommendationResult[]> {
    try {
      const filteredUsers = allUsers.filter(user => user.userId !== userId);

      const recommendations = filteredUsers.map(user => {
        let score = 0;
        const reasons: string[] = [];

        switch (criteria) {
          case 'goals':
            const commonGoals = this.findCommonItems(userProfile.goals || [], user.goals || []);
            score = commonGoals.length * 10;
            if (commonGoals.length > 0) {
              reasons.push(`Shares ${commonGoals.length} goals`);
            }
            break;

          case 'interests':
            const commonInterests = this.findCommonItems(userProfile.interests || [], user.interests || []);
            score = commonInterests.length * 8;
            if (commonInterests.length > 0) {
              reasons.push(`Shares ${commonInterests.length} interests`);
            }
            break;

          case 'location':
            if (userProfile.location && user.location === userProfile.location) {
              score = 15;
              reasons.push('Same location');
            }
            break;

          case 'lifestyle':
            let lifestyleScore = 0;
            if (userProfile.fitnessLevel && user.fitnessLevel === userProfile.fitnessLevel) {
              lifestyleScore += 5;
              reasons.push('Similar fitness levels');
            }
            if (userProfile.workType && user.workType === userProfile.workType) {
              lifestyleScore += 5;
              reasons.push('Similar work types');
            }
            if (userProfile.timezone && user.timezone === userProfile.timezone) {
              lifestyleScore += 3;
              reasons.push('Same timezone');
            }
            score = lifestyleScore;
            break;
        }

        return {
          userId: user.userId,
          score,
          reasons,
          commonGoals: this.findCommonItems(userProfile.goals || [], user.goals || []),
          commonInterests: this.findCommonItems(userProfile.interests || [], user.interests || []),
          compatibilityScore: score,
        };
      });

      return recommendations
        .filter(rec => rec.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

    } catch (error) {
      this.logger.error(`Failed to get similar users for ${userId}`, error);
      return [];
    }
  }

  async getGoalBasedRecommendations(
    userId: string,
    userGoals: string[],
    allUsers: UserProfile[]
  ): Promise<RecommendationResult[]> {
    try {
      const recommendations = allUsers
        .filter(user => user.userId !== userId)
        .map(user => {
          const commonGoals = this.findCommonItems(userGoals, user.goals || []);
          const score = commonGoals.length * 15; // Higher weight for goal matching

          return {
            userId: user.userId,
            score,
            reasons: commonGoals.length > 0 ? [`Shares goals: ${commonGoals.join(', ')}`] : [],
            commonGoals,
            commonInterests: [],
            compatibilityScore: score,
          };
        })
        .filter(rec => rec.score > 0)
        .sort((a, b) => b.score - a.score);

      return recommendations.slice(0, 15);
    } catch (error) {
      this.logger.error(`Failed to get goal-based recommendations for ${userId}`, error);
      return [];
    }
  }

  async getActivityBasedRecommendations(
    userId: string,
    userActivities: string[],
    allUsers: UserProfile[]
  ): Promise<RecommendationResult[]> {
    try {
      // This would typically analyze user activity patterns
      // For now, use interests as a proxy
      const recommendations = allUsers
        .filter(user => user.userId !== userId)
        .map(user => {
          const commonActivities = this.findCommonItems(userActivities, user.interests || []);
          const score = commonActivities.length * 8;

          return {
            userId: user.userId,
            score,
            reasons: commonActivities.length > 0 ? [`Similar activities: ${commonActivities.join(', ')}`] : [],
            commonGoals: [],
            commonInterests: commonActivities,
            compatibilityScore: score,
          };
        })
        .filter(rec => rec.score > 0)
        .sort((a, b) => b.score - a.score);

      return recommendations.slice(0, 15);
    } catch (error) {
      this.logger.error(`Failed to get activity-based recommendations for ${userId}`, error);
      return [];
    }
  }

  private async calculateCompatibilityScore(user1: UserProfile, user2: UserProfile): Promise<number> {
    let score = 0;

    // Goals matching (highest weight)
    const commonGoals = this.findCommonItems(user1.goals || [], user2.goals || []);
    score += commonGoals.length * 20;

    // Interests matching
    const commonInterests = this.findCommonItems(user1.interests || [], user2.interests || []);
    score += commonInterests.length * 15;

    // Location matching
    if (user1.location && user2.location && user1.location === user2.location) {
      score += 10;
    }

    // Timezone compatibility
    if (user1.timezone && user2.timezone) {
      const tz1 = parseInt(user1.timezone.replace('UTC', '').replace('+', ''));
      const tz2 = parseInt(user2.timezone.replace('UTC', '').replace('+', ''));
      const timeDiff = Math.abs(tz1 - tz2);

      if (timeDiff <= 3) score += 8; // Within 3 hours
      else if (timeDiff <= 6) score += 5; // Within 6 hours
    }

    // Fitness level compatibility
    if (user1.fitnessLevel && user2.fitnessLevel === user1.fitnessLevel) {
      score += 5;
    }

    // Work type compatibility
    if (user1.workType && user2.workType === user1.workType) {
      score += 5;
    }

    return Math.min(score, 100); // Cap at 100
  }

  private generateRecommendationReasons(user1: UserProfile, user2: UserProfile): string[] {
    const reasons: string[] = [];

    const commonGoals = this.findCommonItems(user1.goals || [], user2.goals || []);
    if (commonGoals.length > 0) {
      reasons.push(`Shares ${commonGoals.length} goals`);
    }

    const commonInterests = this.findCommonItems(user1.interests || [], user2.interests || []);
    if (commonInterests.length > 0) {
      reasons.push(`Shares ${commonInterests.length} interests`);
    }

    if (user1.location && user2.location === user1.location) {
      reasons.push('Same location');
    }

    if (user1.timezone && user2.timezone === user1.timezone) {
      reasons.push('Same timezone');
    }

    if (user1.fitnessLevel && user2.fitnessLevel === user1.fitnessLevel) {
      reasons.push('Similar fitness levels');
    }

    return reasons;
  }

  private findCommonItems(arr1: string[], arr2: string[]): string[] {
    return arr1.filter(item =>
      arr2.some(arr2Item =>
        arr2Item.toLowerCase().includes(item.toLowerCase()) ||
        item.toLowerCase().includes(arr2Item.toLowerCase())
      )
    );
  }
}