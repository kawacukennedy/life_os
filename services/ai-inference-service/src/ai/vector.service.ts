import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { MilvusClient } from '@milvus/milvus2-sdk-node';

@Injectable()
export class VectorService implements OnModuleInit, OnModuleDestroy {
  private redisClient: RedisClientType;
  private milvusClient: MilvusClient;
  private useMilvus = process.env.USE_MILVUS === 'true';

  async onModuleInit() {
    // Initialize Redis
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    await this.redisClient.connect();

    // Initialize Milvus if enabled
    if (this.useMilvus) {
      this.milvusClient = new MilvusClient({
        address: process.env.MILVUS_ADDRESS || 'localhost:19530',
      });

      try {
        // Create collection if it doesn't exist
        const collectionName = 'conversations';
        const hasCollection = await this.milvusClient.hasCollection({ collection_name: collectionName });

        if (!hasCollection.value) {
          await this.milvusClient.createCollection({
            collection_name: collectionName,
            fields: [
              {
                name: 'id',
                description: 'ID field',
                data_type: 'INT64',
                is_primary_key: true,
                auto_id: true,
              },
              {
                name: 'conversation_id',
                description: 'Conversation ID',
                data_type: 'VARCHAR',
                max_length: 255,
              },
              {
                name: 'embedding',
                description: 'Vector embedding',
                data_type: 'FLOAT_VECTOR',
                dim: 1536,
              },
              {
                name: 'metadata',
                description: 'Metadata JSON',
                data_type: 'JSON',
              },
              {
                name: 'timestamp',
                description: 'Timestamp',
                data_type: 'VARCHAR',
                max_length: 50,
              },
            ],
          });

          // Create index
          await this.milvusClient.createIndex({
            collection_name: collectionName,
            field_name: 'embedding',
            index_type: 'FLAT',
            metric_type: 'COSINE',
          });

          // Load collection
          await this.milvusClient.loadCollection({
            collection_name: collectionName,
          });
        }
      } catch (error) {
        console.error('Milvus initialization error:', error);
        this.useMilvus = false; // Fallback to Redis
      }
    }

    // Create Redis vector index as fallback
    try {
      await this.redisClient.ft.create('idx:conversations', {
        '$.embedding': {
          type: 'VECTOR',
          algorithm: 'FLAT',
          distance_metric: 'COSINE',
          dim: 1536,
          float32_type: 'FLOAT32',
        },
      }, {
        on: 'JSON',
        prefix: 'conversation:',
      });
    } catch (error) {
      console.log('Redis vector index already exists or error:', error.message);
    }
  }

  async storeEmbedding(conversationId: string, embedding: number[], metadata: any) {
    const timestamp = new Date().toISOString();

    if (this.useMilvus) {
      try {
        await this.milvusClient.insert({
          collection_name: 'conversations',
          fields_data: [
            {
              conversation_id: conversationId,
              embedding,
              metadata,
              timestamp,
            },
          ],
        });
        return;
      } catch (error) {
        console.error('Milvus insert error, falling back to Redis:', error);
      }
    }

    // Fallback to Redis
    const key = `conversation:${conversationId}`;
    await this.redisClient.json.set(key, '.', {
      embedding,
      metadata,
      timestamp,
    });
  }

  async searchSimilar(embedding: number[], limit = 5) {
    if (this.useMilvus) {
      try {
        const searchResults = await this.milvusClient.search({
          collection_name: 'conversations',
          vectors: [embedding],
          search_params: {
            anns_field: 'embedding',
            topk: limit.toString(),
            metric_type: 'COSINE',
            params: JSON.stringify({ nprobe: 10 }),
          },
          output_fields: ['conversation_id', 'metadata', 'timestamp'],
        });

        return searchResults.results.map(result => ({
          id: result.conversation_id,
          score: result.score,
          metadata: result.metadata,
          timestamp: result.timestamp,
        }));
      } catch (error) {
        console.error('Milvus search error, falling back to Redis:', error);
      }
    }

    // Fallback to Redis
    try {
      const results = await this.redisClient.ft.search('idx:conversations', `*=>[KNN ${limit} @embedding $vec AS score]`, {
        PARAMS: {
          vec: Buffer.from(new Float32Array(embedding).buffer),
        },
        RETURN: ['$.metadata', '$.timestamp', 'score'],
        DIALECT: 2,
      });

      return results.documents.map(doc => ({
        id: doc.id.split(':')[1], // Remove prefix
        score: parseFloat(doc.value.score),
        metadata: doc.value['$.metadata'],
        timestamp: doc.value['$.timestamp'],
      }));
    } catch (error) {
      console.error('Vector search error:', error);
      return [];
    }
  }

  async getConversationHistory(userId: string, limit = 10) {
    if (this.useMilvus) {
      try {
        // Query by metadata filter
        const queryResults = await this.milvusClient.query({
          collection_name: 'conversations',
          filter: `metadata['userId'] == "${userId}"`,
          output_fields: ['conversation_id', 'metadata', 'timestamp', 'embedding'],
          limit,
        });

        return queryResults.data.map(item => ({
          id: item.conversation_id,
          metadata: item.metadata,
          timestamp: item.timestamp,
          embedding: item.embedding,
        })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      } catch (error) {
        console.error('Milvus query error, falling back to Redis:', error);
      }
    }

    // Fallback to Redis
    const keys = await this.redisClient.keys(`conversation:*`);
    const conversations = [];

    for (const key of keys.slice(0, limit * 2)) { // Get more to filter
      const data = await this.redisClient.json.get(key);
      if (data && data.metadata?.userId === userId) {
        conversations.push({
          id: key.split(':')[1],
          ...data,
        });
      }
    }

    return conversations
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.disconnect();
    }
    if (this.milvusClient) {
      // Milvus client doesn't have explicit disconnect method
    }
  }
}