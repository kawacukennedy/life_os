'use client'

import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'
import OfflineIndicator from '@/components/OfflineIndicator'

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize performance monitoring
  usePerformanceMonitor()

  return (
    <>
      <OfflineIndicator />
      {children}
    </>
  )
}