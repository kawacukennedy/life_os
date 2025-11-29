import { useEffect, useState } from 'react'
import { offlineQueue } from '@/lib/offline'

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(true)
  const [queueLength, setQueueLength] = useState(0)

  useEffect(() => {
    const initOffline = async () => {
      await offlineQueue.init()
      setIsOnline(offlineQueue.getStatus())
    }

    initOffline()

    const unsubscribe = offlineQueue.onStatusChange((online) => {
      setIsOnline(online)
    })

    return unsubscribe
  }, [])

  const addToQueue = async (type: string, data: any) => {
    await offlineQueue.addToQueue(type, data)
    // Update queue length (in a real implementation, you'd get this from the DB)
    setQueueLength(prev => prev + 1)
  }

  return { isOnline, queueLength, addToQueue }
}