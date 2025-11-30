'use client'

import { useEffect, useState, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client'
import { Button } from '@/components/ui/Button'
import { DashboardSkeleton } from '@/components/ui/CardSkeleton'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { useToast } from '@/contexts/ToastContext'
import { useAnalytics } from '@/lib/analytics'
import gql from 'graphql-tag'

const AIAssistant = lazy(() => import('@/components/AIAssistant'))
const CalendarEventsComponent = lazy(() => import('@/components/CalendarEvents'))
const AIRecommendations = lazy(() => import('@/components/AIRecommendations'))
const DashboardSkeleton = lazy(() => import('@/components/ui/CardSkeleton').then(mod => ({ default: mod.DashboardSkeleton })))

// GraphQL Queries
const GET_DASHBOARD_DATA = gql`
  query GetDashboardData($userId: String!) {
    userProfile(userId: $userId) {
      user {
        id
        email
        name
        locale
        timezone
      }
      profile {
        displayName
        bio
        preferences
        connectedIntegrations
      }
      connectedIntegrations
    }
    tasks(userId: $userId, limit: 10) {
      tasks {
        id
        title
        status
        priority
        dueAt
        durationMinutes
      }
      totalCount
    }
    getSuggestions(userId: $userId, context: "dashboard_overview", maxResults: 5) {
      suggestions {
        id
        type
        confidence
        payload
        createdAt
      }
      modelMeta
    }
  }
`

const GET_AI_RECOMMENDATIONS = gql`
  query GetAIRecommendations($userId: String!, $userData: String!) {
    getPersonalizedRecommendations(userId: $userId, userData: $userData) {
      recommendations {
        id
        category
        priority
        advice
        actionable
        createdAt
      }
      modelMeta
    }
  }
`

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
  const router = useRouter()
  const { addToast } = useToast()
  const { trackError, trackFeatureUsage } = useAnalytics()

  const userId = localStorage.getItem('userId') || 'user123'
  const { socket } = useWebSocket(userId)

  // GraphQL query for dashboard data
  const { data, loading, error, refetch } = useQuery(GET_DASHBOARD_DATA, {
    variables: { userId },
    onCompleted: (data) => {
      if (data) {
        // Create dashboard tiles from GraphQL data
        const dashboardTiles: DashboardTile[] = [
          {
            id: 'tasks',
            type: 'tasks',
            title: 'Active Tasks',
            value: data.tasks?.totalCount || 0,
            icon: '📋',
            color: 'bg-blue-500',
          },
          {
            id: 'profile',
            type: 'profile',
            title: 'Profile Status',
            value: data.userProfile?.profile?.displayName || 'Setup Profile',
            icon: '👤',
            color: 'bg-green-500',
          },
        ]

        setTiles(dashboardTiles)

        // Set AI suggestions
        const aiSuggestions = data.getSuggestions?.suggestions || []
        setSuggestions(aiSuggestions.map((s: any) => JSON.parse(s.payload).action || s.type))
      }
    },
    onError: (error) => {
      console.error('GraphQL error:', error)
      trackError(error, 'dashboard_graphql')
      addToast({
        title: 'Dashboard Error',
        description: 'Unable to load dashboard data. Please try again.',
        variant: 'destructive'
      })
    }
  })

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

  const loadDashboardData = () => {
    refetch()
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