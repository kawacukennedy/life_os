import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface OfflineQueueItem {
  id: string;
  type: 'mutation' | 'query';
  operation: string;
  variables: any;
  timestamp: number;
  retryCount: number;
}

export class OfflineStorage {
  private static QUEUE_KEY = '@lifeos_offline_queue';
  private static CACHE_KEY_PREFIX = '@lifeos_cache_';
  private static MAX_RETRY_COUNT = 3;

  static async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  static async addToQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const queue = await this.getQueue();
      const queueItem: OfflineQueueItem = {
        ...item,
        id: Date.now().toString(),
        timestamp: Date.now(),
        retryCount: 0,
      };
      queue.push(queueItem);
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to add item to offline queue:', error);
    }
  }

  static async getQueue(): Promise<OfflineQueueItem[]> {
    try {
      const queueJson = await AsyncStorage.getItem(this.QUEUE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Failed to get offline queue:', error);
      return [];
    }
  }

  static async removeFromQueue(itemId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filteredQueue = queue.filter(item => item.id !== itemId);
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(filteredQueue));
    } catch (error) {
      console.error('Failed to remove item from offline queue:', error);
    }
  }

  static async incrementRetryCount(itemId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const itemIndex = queue.findIndex(item => item.id === itemId);
      if (itemIndex !== -1) {
        queue[itemIndex].retryCount += 1;
        await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('Failed to increment retry count:', error);
    }
  }

  static async getFailedItems(): Promise<OfflineQueueItem[]> {
    const queue = await this.getQueue();
    return queue.filter(item => item.retryCount >= this.MAX_RETRY_COUNT);
  }

  static async clearFailedItems(): Promise<void> {
    try {
      const queue = await this.getQueue();
      const activeQueue = queue.filter(item => item.retryCount < this.MAX_RETRY_COUNT);
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(activeQueue));
    } catch (error) {
      console.error('Failed to clear failed items:', error);
    }
  }

  static async cacheData(key: string, data: any, ttl: number = 3600000): Promise<void> {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(`${this.CACHE_KEY_PREFIX}${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  static async getCachedData(key: string): Promise<any | null> {
    try {
      const cacheJson = await AsyncStorage.getItem(`${this.CACHE_KEY_PREFIX}${key}`);
      if (!cacheJson) return null;

      const cacheItem = JSON.parse(cacheJson);
      const now = Date.now();

      if (now - cacheItem.timestamp > cacheItem.ttl) {
        await this.removeCachedData(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  static async removeCachedData(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.CACHE_KEY_PREFIX}${key}`);
    } catch (error) {
      console.error('Failed to remove cached data:', error);
    }
  }

  static async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  static async getStorageStats(): Promise<{
    queueSize: number;
    cacheSize: number;
    failedItems: number;
  }> {
    try {
      const queue = await this.getQueue();
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      const failedItems = queue.filter(item => item.retryCount >= this.MAX_RETRY_COUNT);

      return {
        queueSize: queue.length,
        cacheSize: cacheKeys.length,
        failedItems: failedItems.length,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { queueSize: 0, cacheSize: 0, failedItems: 0 };
    }
  }
}