import { lazy, Suspense } from 'react'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'
import AuthGuard from '@/components/AuthGuard'

const LeftNav = lazy(() => import('@/components/LeftNav'))

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useKeyboardShortcuts()
  usePerformanceMonitor()

  return (
    <AuthGuard requireAuth={true}>
      <div className="flex">
        <Suspense fallback={<div className="w-64 bg-gray-100 animate-pulse" />}>
          <LeftNav />
        </Suspense>
        <main id="main-content" className="flex-1">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}