import { ApolloClient } from '@apollo/client';
import { OfflineStorage, OfflineQueueItem } from './offlineStorage';

export class OfflineSyncManager {
  private client: ApolloClient<any>;
  private isProcessing = false;

  constructor(client: ApolloClient<any>) {
    this.client = client;
    this.startPeriodicSync();
  }

  private startPeriodicSync() {
    // Sync every 30 seconds when online
    setInterval(async () => {
      if (await OfflineStorage.isOnline() && !this.isProcessing) {
        await this.processQueue();
      }
    }, 30000);
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    try {
      const queue = await OfflineStorage.getQueue();
      const pendingItems = queue.filter(item => item.retryCount < 3);

      for (const item of pendingItems) {
        try {
          if (item.type === 'mutation') {
            await this.client.mutate({
              mutation: item.operation,
              variables: item.variables,
            });
          } else {
            await this.client.query({
              query: item.operation,
              variables: item.variables,
            });
          }
          await OfflineStorage.removeFromQueue(item.id);
        } catch (error) {
          console.error('Failed to sync item:', item.id, error);
          await OfflineStorage.incrementRetryCount(item.id);
        }
      }
    } catch (error) {
      console.error('Error processing offline queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async addToQueue(operation: string, variables: any, type: 'mutation' | 'query' = 'mutation'): Promise<void> {
    const isOnline = await OfflineStorage.isOnline();

    if (isOnline) {
      // Try to execute immediately
      try {
        if (type === 'mutation') {
          await this.client.mutate({
            mutation: operation,
            variables,
          });
        } else {
          await this.client.query({
            query: operation,
            variables,
          });
        }
      } catch (error) {
        // If it fails, add to queue for retry
        await OfflineStorage.addToQueue({ type, operation, variables });
      }
    } else {
      // Add to queue for later sync
      await OfflineStorage.addToQueue({ type, operation, variables });
    }
  }

  async getOfflineData(query: any, variables: any, cacheKey: string): Promise<any> {
    const isOnline = await OfflineStorage.isOnline();

    if (isOnline) {
      try {
        const result = await this.client.query({
          query,
          variables,
          fetchPolicy: 'network-only',
        });

        // Cache the result
        await OfflineStorage.cacheData(cacheKey, result.data, 3600000); // 1 hour TTL
        return result.data;
      } catch (error) {
        // Try to get from cache
        const cachedData = await OfflineStorage.getCachedData(cacheKey);
        if (cachedData) {
          return cachedData;
        }
        throw error;
      }
    } else {
      // Get from cache
      const cachedData = await OfflineStorage.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      throw new Error('No cached data available and offline');
    }
  }

  async forceSync(): Promise<void> {
    if (await OfflineStorage.isOnline()) {
      await this.processQueue();
    }
  }

  async getSyncStatus(): Promise<{
    isOnline: boolean;
    queueSize: number;
    cacheSize: number;
    failedItems: number;
  }> {
    const isOnline = await OfflineStorage.isOnline();
    const stats = await OfflineStorage.getStorageStats();

    return {
      isOnline,
      ...stats,
    };
  }
}