import { useOfflineQueue } from '@/hooks/useOfflineQueue'

export default function OfflineIndicator() {
  const { isOnline, queue } = useOfflineQueue()

  if (isOnline && queue.length === 0) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm font-medium ${
      isOnline ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
    }`}>
      {isOnline ? (
        queue.length > 0 ? (
          <span>{queue.length} offline actions synced</span>
        ) : null
      ) : (
        <span>You're offline. Actions will be synced when connection is restored.</span>
      )}
    </div>
  )
}