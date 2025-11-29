'use client'

import { useEffect, useState, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { DashboardSkeleton } from '@/components/ui/CardSkeleton'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { useToast } from '@/contexts/ToastContext'
import { useAnalytics } from '@/lib/analytics'
import { HealthAPI, HealthSummary } from '@/lib/api/health'
import { FinanceAPI, FinanceSummary } from '@/lib/api/finance'
import { LearningAPI, LearningStats } from '@/lib/api/learning'
import { NotificationsAPI } from '@/lib/api/notifications'
import { AuthAPI, AggregatedDashboard } from '@/lib/api/auth'

const AIAssistant = lazy(() => import('@/components/AIAssistant'))
const CalendarEventsComponent = lazy(() => import('@/components/CalendarEvents'))
const AIRecommendations = lazy(() => import('@/components/AIRecommendations'))
const DashboardSkeleton = lazy(() => import('@/components/ui/CardSkeleton').then(mod => ({ default: mod.DashboardSkeleton })))

interface DashboardTile {
  id: string
  type: string
  title: string
  value: string | number
  change?: string
  icon: string
  color: string
}

export default function DashboardPage() {
  const [tiles, setTiles] = useState<DashboardTile[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { addToast } = useToast()
  const { trackError, trackFeatureUsage } = useAnalytics()

  const userId = localStorage.getItem('userId') || 'user123'
  const { socket } = useWebSocket(userId)

  // Mobile swipe gestures
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture(
    () => router.push('/app/health'), // Swipe left -> Health
    () => router.push('/app/finance'), // Swipe right -> Finance
    () => router.push('/app/learn'), // Swipe up -> Learn
    () => router.push('/app/analytics') // Swipe down -> Analytics
  )

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    if (socket) {
      socket.on('health-update', (data) => {
        console.log('Real-time health update:', data)
        // Refresh health data
        loadDashboardData()
      })

      socket.on('finance-update', (data) => {
        console.log('Real-time finance update:', data)
        // Refresh finance data
        loadDashboardData()
      })

      socket.on('learning-update', (data) => {
        console.log('Real-time learning update:', data)
        // Refresh learning data
        loadDashboardData()
      })

      return () => {
        socket.off('health-update')
        socket.off('finance-update')
        socket.off('learning-update')
      }
    }
  }, [socket])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'g h': () => router.push('/app/health'),
    'g f': () => router.push('/app/finance'),
    'g l': () => router.push('/app/learn'),
    'g n': () => router.push('/app/notifications'),
    'g s': () => router.push('/app/settings'),
    'r': () => loadDashboardData(),
  })

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Try to use aggregated dashboard API first
      try {
        const aggregatedData = await AuthAPI.getAggregatedDashboard()

        // Create dashboard tiles from aggregated data
        const dashboardTiles: DashboardTile[] = [
          {
            id: 'health',
            type: 'health',
            title: 'Health Score',
            value: `${Math.round((aggregatedData.health.averageHeartRate / 80) * 100)}/100`,
            icon: '💚',
            color: 'bg-accent-green',
          },
          {
            id: 'finance',
            type: 'finance',
            title: 'Balance',
            value: `$${aggregatedData.finance.totalBalance.toLocaleString()}`,
            icon: '💰',
            color: 'bg-accent-yellow',
          },
          {
            id: 'learning',
            type: 'learning',
            title: 'Learning Progress',
            value: `${Math.round(aggregatedData.learning.averageProgress)}%`,
            icon: '📚',
            color: 'bg-blue-500',
          },
          {
            id: 'notifications',
            type: 'notifications',
            title: 'Notifications',
            value: aggregatedData.notifications.unreadCount,
            icon: '🔔',
            color: 'bg-primary-start',
          },
        ]

        setTiles(dashboardTiles)
        setSuggestions(aggregatedData.suggestions.slice(0, 3))
        return
      } catch (aggregatedErr) {
        console.log('Aggregated dashboard not available, falling back to individual APIs:', aggregatedErr)
      }

      // Fallback to individual service calls
      const userId = localStorage.getItem('userId') || 'user123'

      // Load data from all services in parallel
      const [healthSummary, financeSummary, learningStats, unreadCount] = await Promise.allSettled([
        HealthAPI.getHealthSummary(userId),
        FinanceAPI.getFinanceSummary(userId),
        LearningAPI.getLearningStats(userId),
        NotificationsAPI.getUnreadCount(userId),
      ])

      // Create dashboard tiles
      const dashboardTiles: DashboardTile[] = []

      // Health tile
      if (healthSummary.status === 'fulfilled') {
        const health = healthSummary.value
        dashboardTiles.push({
          id: 'health',
          type: 'health',
          title: 'Health Score',
          value: `${Math.round((health.averageHeartRate / 80) * 100)}/100`, // Simple health score calculation
          icon: '💚',
          color: 'bg-accent-green',
        })
      }

      // Finance tile
      if (financeSummary.status === 'fulfilled') {
        const finance = financeSummary.value
        dashboardTiles.push({
          id: 'finance',
          type: 'finance',
          title: 'Balance',
          value: `$${finance.totalBalance.toLocaleString()}`,
          icon: '💰',
          color: 'bg-accent-yellow',
        })
      }

      // Learning tile
      if (learningStats.status === 'fulfilled') {
        const learning = learningStats.value
        dashboardTiles.push({
          id: 'learning',
          type: 'learning',
          title: 'Learning Progress',
          value: `${Math.round(learning.averageProgress)}%`,
          icon: '📚',
          color: 'bg-blue-500',
        })
      }

      // Tasks/Notifications tile
      if (unreadCount.status === 'fulfilled') {
        dashboardTiles.push({
          id: 'notifications',
          type: 'notifications',
          title: 'Notifications',
          value: unreadCount.value,
          icon: '🔔',
          color: 'bg-primary-start',
        })
      }

      setTiles(dashboardTiles)

      // Generate AI suggestions based on data
      const suggestionsList: string[] = []
      if (healthSummary.status === 'fulfilled') {
        const health = healthSummary.value
        if (health.averageHeartRate > 75) {
          suggestionsList.push('Consider scheduling a doctor visit - your heart rate is elevated')
        }
        if (health.totalSteps < 7000) {
          suggestionsList.push('Try to reach 8,000 steps today for better health')
        }
      }

      if (financeSummary.status === 'fulfilled') {
        const finance = financeSummary.value
        if (finance.monthlyExpenses > finance.monthlyIncome * 0.8) {
          suggestionsList.push('Your expenses are 80% of income - consider budgeting adjustments')
        }
      }

      if (learningStats.status === 'fulfilled') {
        const learning = learningStats.value
        if (learning.averageProgress < 50) {
          suggestionsList.push('Focus on completing your learning courses this week')
        }
      }

      // Default suggestions if no specific ones
      if (suggestionsList.length === 0) {
        suggestionsList.push(
          'Great job staying on track with your goals!',
          'Consider adding a new learning course to expand your skills',
          'Remember to take breaks and maintain work-life balance'
        )
      }

      setSuggestions(suggestionsList.slice(0, 3))

      // Track successful dashboard load
      trackFeatureUsage('dashboard', 'load_success')

      // Show success feedback for first load
      if (!tiles.length) {
        addToast({
          title: 'Dashboard Updated',
          description: 'Your personalized dashboard is ready!',
          variant: 'success',
          duration: 3000
        })
      }

    } catch (err) {
      const errorMessage = 'Failed to load dashboard data. Some features may be unavailable.'
      setError(errorMessage)
      console.error('Error loading dashboard data:', err)

      // Track error for analytics
      trackError(err instanceof Error ? err : new Error(errorMessage), 'dashboard_load')

      // Show user-friendly error toast
      addToast({
        title: 'Dashboard Error',
        description: 'Unable to load some dashboard data. Please check your connections.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <Button>Add Task</Button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <DashboardSkeleton />
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadDashboardData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <Button>Add Task</Button>
          </div>
        </div>
      </header>
      <main
        id="main-content"
        className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pb-20 md:pb-6"
        role="main"
        aria-label="Dashboard content"
        onTouchStart={(e) => onTouchStart(e.nativeEvent)}
        onTouchMove={(e) => onTouchMove(e.nativeEvent)}
        onTouchEnd={onTouchEnd}
      >
        <div className="px-4 py-6 sm:px-0">
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            role="region"
            aria-label="Dashboard metrics"
          >
            {tiles.map((tile, index) => (
              <div
                key={tile.id}
                className="bg-white overflow-hidden shadow rounded-lg focus-within:ring-2 focus-within:ring-primary-start focus-within:ring-offset-2"
                tabIndex={0}
                role="article"
                aria-labelledby={`tile-title-${tile.id}`}
                aria-describedby={`tile-value-${tile.id}`}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-8 h-8 ${tile.color} rounded-md flex items-center justify-center`}
                        role="img"
                        aria-label={`${tile.title} icon`}
                      >
                        <span className="text-white text-lg" aria-hidden="true">
                          {tile.icon}
                        </span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt
                          id={`tile-title-${tile.id}`}
                          className="text-sm font-medium text-gray-500 truncate"
                        >
                          {tile.title}
                        </dt>
                        <dd
                          id={`tile-value-${tile.id}`}
                          className="text-lg font-medium text-gray-900"
                        >
                          {tile.value}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-white shadow rounded-lg p-6">
                 <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Agenda</h3>
                 <Suspense fallback={<div className="animate-pulse space-y-3">
                   {[...Array(3)].map((_, i) => (
                     <div key={i} className="h-12 bg-gray-200 rounded"></div>
                   ))}
                 </div>}>
                   <CalendarEventsComponent onAuthRequired={() => {
                     // Handle calendar auth required
                     console.log('Calendar auth required')
                   }} />
                 </Suspense>
               </div>

               <Suspense fallback={<div className="bg-white shadow rounded-lg p-6 h-96 flex items-center justify-center">Loading AI Recommendations...</div>}>
                 <AIRecommendations userId={userId} maxItems={5} />
               </Suspense>
            </div>

            <Suspense fallback={<div className="bg-white shadow rounded-lg p-6 h-96 flex items-center justify-center">Loading AI Assistant...</div>}>
              <AIAssistant />
            </Suspense>
          </div>

          {/* Mobile Quick Actions */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
            <div className="grid grid-cols-4 gap-2">
              <Button
                onClick={() => router.push('/app/health')}
                className="flex flex-col items-center p-2 h-auto"
                variant="ghost"
              >
                <span className="text-lg">💚</span>
                <span className="text-xs mt-1">Health</span>
              </Button>
              <Button
                onClick={() => router.push('/app/finance')}
                className="flex flex-col items-center p-2 h-auto"
                variant="ghost"
              >
                <span className="text-lg">💰</span>
                <span className="text-xs mt-1">Finance</span>
              </Button>
              <Button
                onClick={() => router.push('/app/learn')}
                className="flex flex-col items-center p-2 h-auto"
                variant="ghost"
              >
                <span className="text-lg">📚</span>
                <span className="text-xs mt-1">Learn</span>
              </Button>
              <Button
                onClick={() => router.push('/app/routines')}
                className="flex flex-col items-center p-2 h-auto"
                variant="ghost"
              >
                <span className="text-lg">🤖</span>
                <span className="text-xs mt-1">AI</span>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}