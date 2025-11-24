import { useEffect, useState } from 'react'

interface QueuedAction {
  id: string
  type: string
  data: any
  timestamp: number
}

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(true)
  const [queue, setQueue] = useState<QueuedAction[]>([])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      processQueue()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setIsOnline(navigator.onLine)

    // Load queue from localStorage
    const savedQueue = localStorage.getItem('offlineQueue')
    if (savedQueue) {
      setQueue(JSON.parse(savedQueue))
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const addToQueue = (action: Omit<QueuedAction, 'id' | 'timestamp'>) => {
    const queuedAction: QueuedAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: Date.now(),
    }

    setQueue(prev => {
      const newQueue = [...prev, queuedAction]
      localStorage.setItem('offlineQueue', JSON.stringify(newQueue))
      return newQueue
    })
  }

  const processQueue = async () => {
    if (!isOnline || queue.length === 0) return

    const actionsToProcess = [...queue]

    for (const action of actionsToProcess) {
      try {
        // Process each action based on type
        switch (action.type) {
          case 'add-health-vital':
            await fetch('/api/health/vitals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(action.data),
            })
            break
          case 'add-transaction':
            await fetch('/api/finance/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(action.data),
            })
            break
          // Add more action types as needed
        }

        // Remove from queue on success
        setQueue(prev => {
          const newQueue = prev.filter(a => a.id !== action.id)
          localStorage.setItem('offlineQueue', JSON.stringify(newQueue))
          return newQueue
        })
      } catch (error) {
        console.error('Failed to process queued action:', error)
        // Keep in queue for retry
      }
    }
  }

  return { isOnline, queue, addToQueue, processQueue }
}