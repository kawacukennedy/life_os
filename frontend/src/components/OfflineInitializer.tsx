'use client'

import { useEffect } from 'react'
import { offlineQueue } from '@/lib/offline'

export default function OfflineInitializer() {
  useEffect(() => {
    offlineQueue.init().catch(console.error)
  }, [])

  return null
}