import { Injectable, Logger } from '@nestjs/common';
import { DataWarehouseService } from './data-warehouse.service';
import { EventStoreService } from './event-store.service';
import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';

export interface TrainingConfig {
  modelType: 'user_behavior' | 'anomaly_detection' | 'recommendation';
  features: string[];
  target: string;
  trainingDataSize: number;
  epochs: number;
  batchSize: number;
}

export interface ModelMetadata {
  modelId: string;
  modelType: string;
  version: string;
  accuracy: number;
  createdAt: Date;
  features: string[];
  hyperparameters: Record<string, any>;
}

@Injectable()
export class MLTrainingService {
  private readonly logger = new Logger(MLTrainingService.name);
  private modelsPath = path.join(process.cwd(), 'models');

  constructor(
    private dataWarehouse: DataWarehouseService,
    private eventStore: EventStoreService,
  ) {
    // Ensure models directory exists
    if (!fs.existsSync(this.modelsPath)) {
      fs.mkdirSync(this.modelsPath, { recursive: true });
    }
  }

  async trainUserBehaviorModel(config: TrainingConfig): Promise<ModelMetadata> {
    this.logger.log('Starting user behavior model training');

    try {
      // Fetch training data from BigQuery
      const trainingData = await this.fetchTrainingData(config);

      // Preprocess data
      const { features, labels } = await this.preprocessData(trainingData, config);

      // Create and train model
      const model = this.createUserBehaviorModel(config);
      await this.trainModel(model, features, labels, config);

      // Evaluate model
      const accuracy = await this.evaluateModel(model, features, labels);

      // Save model
      const modelMetadata = await this.saveModel(model, config, accuracy);

      this.logger.log(`User behavior model trained with accuracy: ${accuracy}`);
      return modelMetadata;
    } catch (error) {
      this.logger.error('Failed to train user behavior model:', error);
      throw error;
    }
  }

  async trainAnomalyDetectionModel(config: TrainingConfig): Promise<ModelMetadata> {
    this.logger.log('Starting anomaly detection model training');

    try {
      // Fetch training data
      const trainingData = await this.fetchAnomalyTrainingData(config);

      // Create autoencoder model for anomaly detection
      const model = this.createAnomalyDetectionModel(config);
      await this.trainAnomalyModel(model, trainingData, config);

      // Evaluate model
      const reconstructionError = await this.evaluateAnomalyModel(model, trainingData);

      // Save model
      const modelMetadata = await this.saveModel(model, config, 1 - reconstructionError);

      this.logger.log(`Anomaly detection model trained with reconstruction error: ${reconstructionError}`);
      return modelMetadata;
    } catch (error) {
      this.logger.error('Failed to train anomaly detection model:', error);
      throw error;
    }
  }

  async trainRecommendationModel(config: TrainingConfig): Promise<ModelMetadata> {
    this.logger.log('Starting recommendation model training');

    try {
      // Fetch user-item interaction data
      const trainingData = await this.fetchRecommendationTrainingData(config);

      // Create collaborative filtering model
      const model = this.createRecommendationModel(config);
      await this.trainRecommendationModel(model, trainingData, config);

      // Evaluate model
      const ndcg = await this.evaluateRecommendationModel(model, trainingData);

      // Save model
      const modelMetadata = await this.saveModel(model, config, ndcg);

      this.logger.log(`Recommendation model trained with NDCG: ${ndcg}`);
      return modelMetadata;
    } catch (error) {
      this.logger.error('Failed to train recommendation model:', error);
      throw error;
    }
  }

  private async fetchTrainingData(config: TrainingConfig): Promise<any[]> {
    // Query BigQuery for training data
    const query = `
      SELECT
        user_id,
        tenant_id,
        DATE(timestamp) as date,
        COUNTIF(event_type = 'login_success') as login_count,
        COUNTIF(event_type = 'page_view') as page_views,
        COUNTIF(event_type LIKE 'feature_%') as feature_usage,
        AVG(CASE WHEN event_type = 'response_time' THEN CAST(properties.duration AS FLOAT64) END) as avg_response_time,
        COUNTIF(event_type = 'error') as error_count,
        CASE WHEN COUNTIF(event_type = 'login_success') > 0 THEN 1 ELSE 0 END as is_active
      FROM \`lifeos_analytics.events\`
      WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
      GROUP BY user_id, tenant_id, DATE(timestamp)
      ORDER BY date DESC
      LIMIT ${config.trainingDataSize}
    `;

    const rows = await this.dataWarehouse['executeQuery'](query);
    return rows;
  }

  private async fetchAnomalyTrainingData(config: TrainingConfig): Promise<any[]> {
    const query = `
      SELECT
        user_id,
        tenant_id,
        ARRAY_AGG(STRUCT(event_type, properties, timestamp)) as event_sequence
      FROM \`lifeos_analytics.events\`
      WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
        AND user_id IS NOT NULL
      GROUP BY user_id, tenant_id
      HAVING COUNT(*) >= 10
      LIMIT ${config.trainingDataSize}
    `;

    const rows = await this.dataWarehouse['executeQuery'](query);
    return rows;
  }

  private async fetchRecommendationTrainingData(config: TrainingConfig): Promise<any[]> {
    const query = `
      SELECT
        user_id,
        event_type as item_id,
        COUNT(*) as interaction_count,
        MAX(timestamp) as last_interaction
      FROM \`lifeos_analytics.events\`
      WHERE event_type LIKE 'feature_%'
        AND DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
      GROUP BY user_id, event_type
    `;

    const rows = await this.dataWarehouse['executeQuery'](query);
    return rows;
  }

  private async preprocessData(data: any[], config: TrainingConfig): Promise<{ features: tf.Tensor; labels: tf.Tensor }> {
    // Convert data to tensors
    const featureData = data.map(row => [
      row.login_count || 0,
      row.page_views || 0,
      row.feature_usage || 0,
      row.avg_response_time || 0,
      row.error_count || 0,
    ]);

    const labelData = data.map(row => row.is_active || 0);

    const features = tf.tensor2d(featureData);
    const labels = tf.tensor1d(labelData, 'int32');

    return { features, labels };
  }

  private createUserBehaviorModel(config: TrainingConfig): tf.Sequential {
    const model = tf.sequential();

    model.add(tf.layers.dense({ inputShape: [config.features.length], units: 64, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  private createAnomalyDetectionModel(config: TrainingConfig): tf.Sequential {
    const model = tf.sequential();

    // Encoder
    model.add(tf.layers.dense({ inputShape: [config.features.length], units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));

    // Decoder
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: config.features.length, activation: 'linear' }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
    });

    return model;
  }

  private createRecommendationModel(config: TrainingConfig): tf.Sequential {
    const model = tf.sequential();

    model.add(tf.layers.embedding({ inputDim: 1000, outputDim: 50, inputLength: 1 }));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  private async trainModel(model: tf.Sequential, features: tf.Tensor, labels: tf.Tensor, config: TrainingConfig): Promise<void> {
    await model.fit(features, labels, {
      epochs: config.epochs,
      batchSize: config.batchSize,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          this.logger.log(`Epoch ${epoch + 1}: loss = ${logs?.loss}, accuracy = ${logs?.acc}`);
        },
      },
    });
  }

  private async trainAnomalyModel(model: tf.Sequential, data: any[], config: TrainingConfig): Promise<void> {
    // Convert data to tensors for autoencoder training
    const tensorData = tf.tensor2d(data.map(row => [
      row.event_sequence?.length || 0,
      row.interaction_count || 0,
    ]));

    await model.fit(tensorData, tensorData, {
      epochs: config.epochs,
      batchSize: config.batchSize,
      validationSplit: 0.2,
    });
  }

  private async trainRecommendationModel(model: tf.Sequential, data: any[], config: TrainingConfig): Promise<void> {
    // Prepare user-item interaction data
    const userIds = [...new Set(data.map(row => row.user_id))];
    const itemIds = [...new Set(data.map(row => row.item_id))];

    const userIndex = Object.fromEntries(userIds.map((id, index) => [id, index]));
    const itemIndex = Object.fromEntries(itemIds.map((id, index) => [id, index]));

    const features = data.map(row => [userIndex[row.user_id], itemIndex[row.item_id]]);
    const labels = data.map(row => row.interaction_count > 0 ? 1 : 0);

    const featureTensor = tf.tensor2d(features);
    const labelTensor = tf.tensor1d(labels, 'int32');

    await model.fit(featureTensor, labelTensor, {
      epochs: config.epochs,
      batchSize: config.batchSize,
      validationSplit: 0.2,
    });
  }

  private async evaluateModel(model: tf.Sequential, features: tf.Tensor, labels: tf.Tensor): Promise<number> {
    const result = await model.evaluate(features, labels) as tf.Scalar[];
    return result[1].dataSync()[0]; // accuracy
  }

  private async evaluateAnomalyModel(model: tf.Sequential, data: any[]): Promise<number> {
    const tensorData = tf.tensor2d(data.map(row => [
      row.event_sequence?.length || 0,
      row.interaction_count || 0,
    ]));

    const reconstructed = model.predict(tensorData) as tf.Tensor;
    const mse = tf.metrics.meanSquaredError(tensorData, reconstructed);
    return mse.dataSync()[0];
  }

  private async evaluateRecommendationModel(model: tf.Sequential, data: any[]): Promise<number> {
    // Simplified NDCG calculation
    const predictions = model.predict(tf.tensor2d(data.map(() => [0, 0]))) as tf.Tensor;
    const predArray = predictions.dataSync();

    // Calculate NDCG@5 (simplified)
    let ndcg = 0;
    const k = 5;
    for (let i = 0; i < Math.min(k, predArray.length); i++) {
      ndcg += predArray[i] / Math.log2(i + 2);
    }

    return ndcg / Math.min(k, predArray.length);
  }

  private async saveModel(model: tf.Sequential, config: TrainingConfig, accuracy: number): Promise<ModelMetadata> {
    const modelId = `model_${config.modelType}_${Date.now()}`;
    const modelPath = path.join(this.modelsPath, modelId);

    await model.save(`file://${modelPath}`);

    const metadata: ModelMetadata = {
      modelId,
      modelType: config.modelType,
      version: '1.0.0',
      accuracy,
      createdAt: new Date(),
      features: config.features,
      hyperparameters: {
        epochs: config.epochs,
        batchSize: config.batchSize,
      },
    };

    // Save metadata
    fs.writeFileSync(
      path.join(modelPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    return metadata;
  }

  async loadModel(modelId: string): Promise<tf.LayersModel> {
    const modelPath = path.join(this.modelsPath, modelId);
    return await tf.loadLayersModel(`file://${modelPath}/model.json`);
  }

  async getModelMetadata(modelId: string): Promise<ModelMetadata> {
    const modelPath = path.join(this.modelsPath, modelId);
    const metadataPath = path.join(modelPath, 'metadata.json');

    const metadata = fs.readFileSync(metadataPath, 'utf-8');
    return JSON.parse(metadata);
  }

  async listModels(): Promise<ModelMetadata[]> {
    const models: ModelMetadata[] = [];

    const modelDirs = fs.readdirSync(this.modelsPath);
    for (const dir of modelDirs) {
      try {
        const metadata = await this.getModelMetadata(dir);
        models.push(metadata);
      } catch (error) {
        this.logger.warn(`Failed to load metadata for model ${dir}:`, error);
      }
    }

    return models;
  }

  async scheduleTrainingPipeline(): Promise<void> {
    // Schedule daily model retraining
    const cron = require('node-cron');

    cron.schedule('0 2 * * *', async () => {
      this.logger.log('Starting scheduled model training');

      try {
        // Train user behavior model
        await this.trainUserBehaviorModel({
          modelType: 'user_behavior',
          features: ['login_count', 'page_views', 'feature_usage', 'avg_response_time', 'error_count'],
          target: 'is_active',
          trainingDataSize: 10000,
          epochs: 50,
          batchSize: 32,
        });

        // Train anomaly detection model
        await this.trainAnomalyDetectionModel({
          modelType: 'anomaly_detection',
          features: ['event_sequence_length', 'interaction_count'],
          target: 'is_anomaly',
          trainingDataSize: 5000,
          epochs: 30,
          batchSize: 64,
        });

        // Train recommendation model
        await this.trainRecommendationModel({
          modelType: 'recommendation',
          features: ['user_id', 'item_id'],
          target: 'interaction_score',
          trainingDataSize: 20000,
          epochs: 40,
          batchSize: 128,
        });

        this.logger.log('Scheduled model training completed');
      } catch (error) {
        this.logger.error('Scheduled model training failed:', error);
      }
    });
  }
}