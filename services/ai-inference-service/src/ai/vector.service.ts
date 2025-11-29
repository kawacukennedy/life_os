import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class VectorService implements OnModuleInit {
  private redisClient: RedisClientType;

  async onModuleInit() {
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    await this.redisClient.connect();

    // Create vector index if it doesn't exist
    try {
      await this.redisClient.ft.create('idx:conversations', {
        '$.embedding': {
          type: 'VECTOR',
          algorithm: 'FLAT',
          distance_metric: 'COSINE',
          dim: 1536, // OpenAI ada-002 dimension
          float32_type: 'FLOAT32',
        },
      }, {
        on: 'JSON',
        prefix: 'conversation:',
      });
    } catch (error) {
      // Index might already exist
      console.log('Vector index already exists or error:', error.message);
    }
  }

  async storeEmbedding(conversationId: string, embedding: number[], metadata: any) {
    const key = `conversation:${conversationId}`;
    await this.redisClient.json.set(key, '.', {
      embedding,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  async searchSimilar(embedding: number[], limit = 5) {
    try {
      const results = await this.redisClient.ft.search('idx:conversations', '*=>[KNN 5 @embedding $vec AS score]', {
        PARAMS: {
          vec: Buffer.from(new Float32Array(embedding).buffer),
        },
        RETURN: ['$.metadata', '$.timestamp', 'score'],
        DIALECT: 2,
      });

      return results.documents.map(doc => ({
        id: doc.id,
        score: doc.value.score,
        metadata: doc.value['$.metadata'],
        timestamp: doc.value['$.timestamp'],
      }));
    } catch (error) {
      console.error('Vector search error:', error);
      return [];
    }
  }

  async getConversationHistory(userId: string, limit = 10) {
    // Simple implementation - in production, use proper indexing
    const keys = await this.redisClient.keys(`conversation:*`);
    const conversations = [];

    for (const key of keys.slice(0, limit)) {
      const data = await this.redisClient.json.get(key);
      if (data && data.metadata?.userId === userId) {
        conversations.push({
          id: key.split(':')[1],
          ...data,
        });
      }
    }

    return conversations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async onModuleDestroy() {
    await this.redisClient.disconnect();
  }
}