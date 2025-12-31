'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/contexts/ToastContext'
import { useAnalytics } from '@/lib/analytics'
import gql from 'graphql-tag'
import { print } from 'graphql'
import { useQuery as useApolloQuery } from '@apollo/client'

export const dynamic = 'force-dynamic'

const GET_HEALTH_DATA = gql`
  query GetHealthData($userId: String!) {
    getHealthSummary(userId: $userId) {
      userId
      date
      steps
      heartRate
      sleepHours
      calories
      activeMinutes
      vitals {
        id
        metricType
        value
        unit
        timestamp
      }
      anomalies {
        id
        vitalType
        severity
        message
        timestamp
      }
    }
  }
`

const GET_FITBIT_AUTH_URL = gql`
  query GetFitbitAuthUrl($userId: String!) {
    getFitbitAuthUrl(userId: $userId)
  }
`

const GET_HEALTH_INSIGHTS = gql`
  query GetHealthInsights($userId: String!) {
    getHealthInsights(userId: $userId) {
      insights {
        id
        type
        title
        description
        actionable
        createdAt
      }
    }
  }
`

interface HealthMetric {
  id: string
  metricType: string
  value: number
  unit: string
  timestamp: string
}

interface HealthAnomaly {
  id: string
  vitalType: string
  severity: 'low' | 'medium' | 'high'
  message: string
  timestamp: string
}

interface HealthData {
  userId: string
  date: string
  steps: number
  heartRate: number
  sleepHours: number
  calories: number
  activeMinutes: number
  vitals: HealthMetric[]
  anomalies: HealthAnomaly[]
}

export default function HealthPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day')
  const { addToast } = useToast()
  const { trackEvent } = useAnalytics()

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'user123' : 'user123'

  const { data: healthData, loading, error, refetch } = useApolloQuery(GET_HEALTH_DATA, {
    variables: { userId },
    onCompleted: (data) => {
      trackEvent('health_data_loaded', { period: selectedPeriod })
    },
    onError: (error) => {
      console.error('Health data error:', error)
      addToast({
        title: 'Health Data Error',
        description: 'Unable to load health data. Please try again.',
        variant: 'destructive'
      })
    }
  })

  const { data: insightsData } = useApolloQuery(GET_HEALTH_INSIGHTS, {
    variables: { userId },
  })

  useEffect(() => {
    refetch()
  }, [selectedPeriod])

  const { data: fitbitAuthData } = useApolloQuery(GET_FITBIT_AUTH_URL, {
    variables: { userId },
  })

  const handleConnectFitbit = () => {
    trackEvent('fitbit_connect_attempted')
    if (fitbitAuthData?.getFitbitAuthUrl) {
      window.location.href = fitbitAuthData.getFitbitAuthUrl
    } else {
      addToast({
        title: 'Error',
        description: 'Unable to get Fitbit authorization URL',
        variant: 'destructive',
      })
    }
  }

  const handleConnectAppleHealth = () => {
    // Implement Apple Health integration
    trackEvent('apple_health_connect_attempted')
    addToast({
      title: 'Connecting to Apple Health',
      description: 'Opening Apple Health permissions...',
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load health data</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    )
  }

  const data = healthData?.getHealthSummary

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Health Dashboard</h1>
            <p className="mt-2 text-gray-600">Track your health metrics and get personalized insights</p>
          </div>

          {/* Period Selector */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {(['day', 'week', 'month'] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  onClick={() => setSelectedPeriod(period)}
                  className="capitalize"
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>

          {/* Health Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Steps</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.steps?.toLocaleString() || 0}</p>
                </div>
                <div className="text-2xl">🚶</div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Heart Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.heartRate || 0} bpm</p>
                </div>
                <div className="text-2xl">❤️</div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sleep</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.sleepHours || 0}h</p>
                </div>
                <div className="text-2xl">😴</div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Calories</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.calories || 0}</p>
                </div>
                <div className="text-2xl">🔥</div>
              </div>
            </Card>
          </div>

          {/* Integration Section */}
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Connect Health Devices</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleConnectFitbit}
                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700"
              >
                <span>📊</span>
                <span>Connect Fitbit</span>
              </Button>
              <Button
                onClick={handleConnectAppleHealth}
                className="flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-900"
              >
                <span>🍎</span>
                <span>Connect Apple Health</span>
              </Button>
            </div>
          </Card>

          {/* Anomalies Section */}
          {data?.anomalies && data.anomalies.length > 0 && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Health Alerts</h2>
              <div className="space-y-3">
                {data.anomalies.map((anomaly: HealthAnomaly) => (
                  <div key={anomaly.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-red-800">{anomaly.message}</p>
                      <p className="text-sm text-red-600">{anomaly.vitalType}</p>
                    </div>
                    <Badge className={getSeverityColor(anomaly.severity)}>
                      {anomaly.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* AI Insights */}
          {insightsData?.getHealthInsights?.insights && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">AI Health Insights</h2>
              <div className="space-y-4">
                {insightsData.getHealthInsights.insights.map((insight: any) => (
                  <div key={insight.id} className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-900">{insight.title}</h3>
                    <p className="text-blue-700 mt-1">{insight.description}</p>
                    {insight.actionable && (
                      <Button size="sm" className="mt-2">
                        Take Action
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}