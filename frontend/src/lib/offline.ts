// IndexedDB setup for offline support
const DB_NAME = 'LifeOS'
const DB_VERSION = 1

interface OfflineData {
  id: string
  type: string
  data: any
  timestamp: number
  synced: boolean
}

class OfflineDB {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains('offlineData')) {
          const offlineStore = db.createObjectStore('offlineData', { keyPath: 'id' })
          offlineStore.createIndex('type', 'type', { unique: false })
          offlineStore.createIndex('synced', 'synced', { unique: false })
          offlineStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains('cachedData')) {
          const cacheStore = db.createObjectStore('cachedData', { keyPath: 'key' })
          cacheStore.createIndex('type', 'type', { unique: false })
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async storeOfflineData(type: string, data: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readwrite')
      const store = transaction.objectStore('offlineData')

      const offlineData: OfflineData = {
        id: `${type}_${Date.now()}_${Math.random()}`,
        type,
        data,
        timestamp: Date.now(),
        synced: false,
      }

      const request = store.add(offlineData)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getOfflineData(): Promise<OfflineData[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readonly')
      const store = transaction.objectStore('offlineData')
      const index = store.index('synced')
      const request = index.getAll(false) // Get unsynced data

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async markSynced(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readwrite')
      const store = transaction.objectStore('offlineData')
      const request = store.get(id)

      request.onsuccess = () => {
        const data = request.result
        if (data) {
          data.synced = true
          const updateRequest = store.put(data)
          updateRequest.onsuccess = () => resolve()
          updateRequest.onerror = () => reject(updateRequest.error)
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async cacheData(key: string, type: string, data: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedData'], 'readwrite')
      const store = transaction.objectStore('cachedData')

      const cacheData = {
        key,
        type,
        data,
        timestamp: Date.now(),
      }

      const request = store.put(cacheData)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedData'], 'readonly')
      const store = transaction.objectStore('cachedData')
      const request = store.get(key)

      request.onsuccess = () => {
        const result = request.result
        if (result) {
          // Check if cache is still valid (24 hours)
          const age = Date.now() - result.timestamp
          if (age < 24 * 60 * 60 * 1000) {
            resolve(result.data)
          } else {
            // Cache expired, delete it
            const deleteRequest = store.delete(key)
            deleteRequest.onsuccess = () => resolve(null)
            deleteRequest.onerror = () => resolve(null)
          }
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async clearOldCache(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedData'], 'readwrite')
      const store = transaction.objectStore('cachedData')
      const index = store.index('timestamp')
      const range = IDBKeyRange.upperBound(Date.now() - 24 * 60 * 60 * 1000)
      const request = index.openCursor(range)

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }
}

export const offlineDB = new OfflineDB()

// Offline queue with IndexedDB
export class OfflineQueue {
  private static instance: OfflineQueue
  private isOnline = true
  private listeners: ((online: boolean) => void)[] = []

  static getInstance(): OfflineQueue {
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue()
    }
    return OfflineQueue.instance
  }

  async init(): Promise<void> {
    await offlineDB.init()

    this.isOnline = navigator.onLine

    window.addEventListener('online', () => {
      this.isOnline = true
      this.notifyListeners()
      this.processQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.notifyListeners()
    })

    // Process queue on init if online
    if (this.isOnline) {
      this.processQueue()
    }

    // Clear old cache periodically
    setInterval(() => offlineDB.clearOldCache(), 60 * 60 * 1000) // Every hour
  }

  onStatusChange(listener: (online: boolean) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.isOnline))
  }

  getStatus(): boolean {
    return this.isOnline
  }

  async addToQueue(type: string, data: any): Promise<void> {
    await offlineDB.storeOfflineData(type, data)

    if (this.isOnline) {
      this.processQueue()
    }
  }

  private async processQueue(): Promise<void> {
    try {
      const unsyncedData = await offlineDB.getOfflineData()

      for (const item of unsyncedData) {
        try {
          await this.processAction(item)
          await offlineDB.markSynced(item.id)
        } catch (error) {
          console.error('Failed to sync offline action:', error)
          // Keep in queue for retry
        }
      }
    } catch (error) {
      console.error('Error processing offline queue:', error)
    }
  }

  private async processAction(item: OfflineData): Promise<void> {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
    const token = localStorage.getItem('token')

    switch (item.type) {
      case 'health-vital':
        await fetch(`${API_BASE}/api/health/vitals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(item.data),
        })
        break

      case 'finance-transaction':
        await fetch(`${API_BASE}/api/finance/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(item.data),
        })
        break

      case 'learning-progress':
        await fetch(`${API_BASE}/api/learning/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(item.data),
        })
        break

      default:
        console.warn('Unknown offline action type:', item.type)
    }
  }

  async cacheApiResponse(key: string, type: string, data: any): Promise<void> {
    await offlineDB.cacheData(key, type, data)
  }

  async getCachedApiResponse(key: string): Promise<any | null> {
    return offlineDB.getCachedData(key)
  }
}

export const offlineQueue = OfflineQueue.getInstance()