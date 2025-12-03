'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/contexts/ToastContext'
import { useAnalytics } from '@/lib/analytics'
import gql from 'graphql-tag'
import { useQuery as useApolloQuery } from '@apollo/client'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const GET_DASHBOARD_DATA = gql`
  query GetDashboardData($userId: String!) {
    getUserTasks(userId: $userId, limit: 5) {
      id
      title
      status
      priority
      dueDate
    }
    getHealthSummary(userId: $userId) {
      steps
      calories
      sleepHours
      activeMinutes
    }
    getFinanceOverview(userId: $userId) {
      totalBalance
      monthlySpending
      budgetStatus
    }
    getLearningProgress(userId: $userId) {
      totalCourses
      completedCourses
      currentStreak
    }
    getUserPlugins(userId: $userId) {
      id
      plugin {
        name
        category
      }
    }
  }
`

const GET_AI_SUGGESTIONS = gql`
  query GetAISuggestions($userId: String!) {
    getAISuggestions(userId: $userId, limit: 3) {
      id
      type
      title
      description
      priority
      actionable
    }
  }
`

interface DashboardData {
  getUserTasks: Array<{
    id: string
    title: string
    status: string
    priority: string
    dueDate: string
  }>
  getHealthSummary: {
    steps: number
    calories: number
    sleepHours: number
    activeMinutes: number
  }
  getFinanceOverview: {
    totalBalance: number
    monthlySpending: number
    budgetStatus: string
  }
  getLearningProgress: {
    totalCourses: number
    completedCourses: number
    currentStreak: number
  }
  getUserPlugins: Array<{
    id: string
    plugin: {
      name: string
      category: string
    }
  }>
}

interface AISuggestion {
  id: string
  type: string
  title: string
  description: string
  priority: string
  actionable: boolean
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'insights'>('overview')

  const { addToast } = useToast()
  const { trackEvent, trackPageView } = useAnalytics()

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'user123' : 'user123'

  const { data: dashboardData, loading: dashboardLoading, refetch: refetchDashboard } = useApolloQuery(GET_DASHBOARD_DATA, {
    variables: { userId },
    onError: (error) => {
      console.error('Dashboard error:', error)
      addToast({
        title: 'Dashboard Error',
        description: 'Unable to load dashboard data.',
        variant: 'destructive'
      })
    }
  })

  const { data: aiSuggestions, loading: suggestionsLoading } = useApolloQuery(GET_AI_SUGGESTIONS, {
    variables: { userId },
    onError: (error) => {
      console.error('AI suggestions error:', error)
    }
  })

  useEffect(() => {
    trackPageView('dashboard')
    refetchDashboard()
  }, [])

  const data = dashboardData as DashboardData | undefined
  const suggestions = aiSuggestions?.getAISuggestions as AISuggestion[] | undefined

  const quickActions = [
    {
      title: 'Add Task',
      description: 'Create a new task',
      icon: '📝',
      href: '/tasks',
      action: () => trackEvent('quick_action', { action: 'add_task' })
    },
    {
      title: 'Log Health',
      description: 'Record health metrics',
      icon: '❤️',
      href: '/health',
      action: () => trackEvent('quick_action', { action: 'log_health' })
    },
    {
      title: 'Start Learning',
      description: 'Continue your courses',
      icon: '📚',
      href: '/learn',
      action: () => trackEvent('quick_action', { action: 'start_learning' })
    },
    {
      title: 'View Finances',
      description: 'Check your budget',
      icon: '💰',
      href: '/finance',
      action: () => trackEvent('quick_action', { action: 'view_finances' })
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
           <p className="mt-2 text-gray-600">Here&apos;s what&apos;s happening with your LifeOS today</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'outline'}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </Button>
            <Button
              variant={activeTab === 'insights' ? 'default' : 'outline'}
              onClick={() => setActiveTab('insights')}
            >
              AI Insights
            </Button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                <>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">
                            {data?.getHealthSummary?.steps?.toLocaleString() || 0}
                          </p>
                          <p className="text-sm text-gray-600">Steps Today</p>
                        </div>
                        <div className="text-2xl">🚶</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-green-600">
                            ${data?.getFinanceOverview?.totalBalance?.toLocaleString() || 0}
                          </p>
                          <p className="text-sm text-gray-600">Balance</p>
                        </div>
                        <div className="text-2xl">💰</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-purple-600">
                            {data?.getLearningProgress?.currentStreak || 0}
                          </p>
                          <p className="text-sm text-gray-600">Day Streak</p>
                        </div>
                        <div className="text-2xl">🔥</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-orange-600">
                            {data?.getUserTasks?.length || 0}
                          </p>
                          <p className="text-sm text-gray-600">Active Tasks</p>
                        </div>
                        <div className="text-2xl">✅</div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Today's Tasks & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                   <h2 className="text-xl font-semibold">Today&apos;s Tasks</h2>
                </CardHeader>
                <CardContent>
                  {dashboardLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : data?.getUserTasks?.length ? (
                    <div className="space-y-3">
                      {data.getUserTasks.slice(0, 3).map(task => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                            }`} />
                            <div>
                              <p className={`font-medium ${
                                task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                              }`}>
                                {task.title}
                              </p>
                              {task.dueDate && (
                                <p className="text-sm text-gray-500">
                                  Due: {new Date(task.dueDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
                            {task.priority}
                          </Badge>
                        </div>
                      ))}
                      <Link href="/tasks">
                        <Button variant="outline" className="w-full mt-4">
                          View All Tasks
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No tasks for today</p>
                      <Link href="/tasks">
                        <Button>Add Your First Task</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Quick Actions</h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {quickActions.map(action => (
                      <Link key={action.title} href={action.href}>
                        <div
                          className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={action.action}
                        >
                          <div className="text-2xl mb-2">{action.icon}</div>
                          <h3 className="font-medium text-gray-900">{action.title}</h3>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Connected Services */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Connected Services</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'Google Calendar', connected: true },
                    { name: 'Fitbit', connected: true },
                    { name: 'Plaid', connected: false },
                    { name: 'Plugins', connected: (data?.getUserPlugins?.length || 0) > 0 },
                  ].map(service => (
                    <div key={service.name} className="text-center">
                      <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                        service.connected ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <span className="text-xl">
                          {service.connected ? '✅' : '❌'}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="text-xs text-gray-500">
                        {service.connected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Link href="/settings">
                    <Button variant="outline">Manage Integrations</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">AI-Powered Insights</h2>
                <p className="text-gray-600">Personalized recommendations based on your data</p>
              </CardHeader>
              <CardContent>
                {suggestionsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : suggestions?.length ? (
                  <div className="space-y-4">
                    {suggestions.map(suggestion => (
                      <div key={suggestion.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{suggestion.title}</h3>
                          <Badge variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}>
                            {suggestion.priority}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{suggestion.description}</p>
                        {suggestion.actionable && (
                          <Button size="sm">
                            Take Action
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No insights available yet. Keep using LifeOS to get personalized recommendations!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}