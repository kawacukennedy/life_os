import LeftNav from '@/components/LeftNav'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useKeyboardShortcuts()
  usePerformanceMonitor()

  return (
    <div className="flex">
      <LeftNav />
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  )
}