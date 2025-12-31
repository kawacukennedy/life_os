import { Injectable, Logger } from "@nestjs/common";
import { MilvusClient } from "@zilliz/milvus2-sdk-node";

export interface VectorRecord {
  id: string;
  vector: number[];
  metadata: {
    userId: string;
    content: string;
    type: string;
    timestamp: Date;
    tags?: string[];
  };
}

@Injectable()
export class VectorDbService {
  private readonly logger = new Logger(VectorDbService.name);
  private milvusClient: MilvusClient;
  private readonly collectionName = "lifeos_embeddings";

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      this.milvusClient = new MilvusClient({
        address: process.env.MILVUS_HOST || "localhost:19530",
        username: process.env.MILVUS_USERNAME || "",
        password: process.env.MILVUS_PASSWORD || "",
      });

      await this.ensureCollection();
      this.logger.log("Vector DB client initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize Vector DB client", error);
      throw error;
    }
  }

  private async ensureCollection() {
    try {
      // Check if collection exists
      const collections = await this.milvusClient.listCollections();
      const exists = collections.collection_names.includes(this.collectionName);

      if (!exists) {
        // Create collection with schema
        await this.milvusClient.createCollection({
          collection_name: this.collectionName,
          fields: [
            {
              name: "id",
              data_type: "VarChar",
              max_length: 100,
              is_primary_key: true,
            },
            {
              name: "vector",
              data_type: "FloatVector",
              dim: 768, // Dimension for sentence-transformers
            },
            {
              name: "user_id",
              data_type: "VarChar",
              max_length: 100,
            },
            {
              name: "content",
              data_type: "VarChar",
              max_length: 2000,
            },
            {
              name: "type",
              data_type: "VarChar",
              max_length: 50,
            },
            {
              name: "timestamp",
              data_type: "Int64",
            },
            {
              name: "tags",
              data_type: "JSON",
            },
          ],
        });

        // Create index on vector field
        await this.milvusClient.createIndex({
          collection_name: this.collectionName,
          field_name: "vector",
          index_type: "IVF_FLAT",
          metric_type: "COSINE",
          params: { nlist: 1024 },
        });

        // Load collection
        await this.milvusClient.loadCollection({
          collection_name: this.collectionName,
        });

        this.logger.log(`Created and loaded collection: ${this.collectionName}`);
      }
    } catch (error) {
      this.logger.error("Failed to ensure collection exists", error);
      throw error;
    }
  }

  async insertVectors(records: VectorRecord[]): Promise<void> {
    try {
      const data = records.map(record => ({
        id: record.id,
        vector: record.vector,
        user_id: record.metadata.userId,
        content: record.metadata.content,
        type: record.metadata.type,
        timestamp: record.metadata.timestamp.getTime(),
        tags: record.metadata.tags || [],
      }));

      await this.milvusClient.insert({
        collection_name: this.collectionName,
        fields_data: data,
      });

      this.logger.log(`Inserted ${records.length} vectors`);
    } catch (error) {
      this.logger.error("Failed to insert vectors", error);
      throw error;
    }
  }

  async searchVectors(
    queryVector: number[],
    userId: string,
    limit: number = 10,
    filter?: string,
  ): Promise<VectorRecord[]> {
    try {
      let expr = `user_id == "${userId}"`;
      if (filter) {
        expr += ` && ${filter}`;
      }

      const searchParams = {
        collection_name: this.collectionName,
        vectors: [queryVector],
        search_params: {
          metric_type: "COSINE",
          params: { nprobe: 10 },
        },
        limit,
        output_fields: ["user_id", "content", "type", "timestamp", "tags"],
        expr,
      };

      const results = await this.milvusClient.search(searchParams);

      return results.results.map(result => ({
        id: result.id,
        vector: queryVector, // Note: search doesn't return the vector
        metadata: {
          userId: result.entity.user_id,
          content: result.entity.content,
          type: result.entity.type,
          timestamp: new Date(result.entity.timestamp),
          tags: result.entity.tags,
        },
      }));
    } catch (error) {
      this.logger.error("Failed to search vectors", error);
      throw error;
    }
  }

  async deleteVectors(ids: string[]): Promise<void> {
    try {
      await this.milvusClient.delete({
        collection_name: this.collectionName,
        expr: `id in [${ids.map(id => `"${id}"`).join(",")}]`,
      });

      this.logger.log(`Deleted ${ids.length} vectors`);
    } catch (error) {
      this.logger.error("Failed to delete vectors", error);
      throw error;
    }
  }

  async getUserVectors(userId: string, limit: number = 100): Promise<VectorRecord[]> {
    try {
      const queryResults = await this.milvusClient.query({
        collection_name: this.collectionName,
        expr: `user_id == "${userId}"`,
        output_fields: ["vector", "user_id", "content", "type", "timestamp", "tags"],
        limit,
      });

      return queryResults.data.map(result => ({
        id: result.id,
        vector: result.vector,
        metadata: {
          userId: result.user_id,
          content: result.content,
          type: result.type,
          timestamp: new Date(result.timestamp),
          tags: result.tags,
        },
      }));
    } catch (error) {
      this.logger.error("Failed to get user vectors", error);
      throw error;
    }
  }

  async updateVector(id: string, updates: Partial<VectorRecord>): Promise<void> {
    try {
      // For updates, we need to delete and re-insert
      await this.deleteVectors([id]);

      if (updates.vector && updates.metadata) {
        await this.insertVectors([{
          id,
          vector: updates.vector,
          metadata: updates.metadata,
        }]);
      }

      this.logger.log(`Updated vector: ${id}`);
    } catch (error) {
      this.logger.error("Failed to update vector", error);
      throw error;
    }
  }
}