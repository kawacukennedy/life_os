import { useEffect } from 'react'
import { useOfflineQueue } from '@/hooks/useOfflineQueue'
import { useScreenReader } from '@/hooks/useScreenReader'

export default function OfflineIndicator() {
  const { isOnline, queueLength } = useOfflineQueue()
  const { announce } = useScreenReader()

  useEffect(() => {
    if (!isOnline) {
      announce('You are now offline. Actions will be synced when connection is restored.', 'assertive')
    } else if (queueLength > 0) {
      announce(`${queueLength} offline actions have been synced.`, 'polite')
    }
  }, [isOnline, queueLength, announce])

  if (isOnline && queueLength === 0) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm font-medium ${
        isOnline ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
      }`}
      role="status"
      aria-live="polite"
    >
      {isOnline ? (
        queueLength > 0 ? (
          <span>{queueLength} offline actions synced</span>
        ) : null
      ) : (
        <span>You're offline. Actions will be synced when connection is restored.</span>
      )}
    </div>
  )
}