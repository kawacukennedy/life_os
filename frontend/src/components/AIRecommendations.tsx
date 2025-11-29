'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface AIRecommendation {
  id: string
  type: string
  confidence: number
  payload: any
  createdAt: string
}

interface AIRecommendationsProps {
  userId: string
  maxItems?: number
}

export default function AIRecommendations({ userId, maxItems = 5 }: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [loading, setLoading] = useState(true)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-recommendations', userId],
    queryFn: async () => {
      // In a real app, this would call the AI service
      // For now, return mock data
      return {
        suggestions: [
          {
            id: 'rec-1',
            type: 'schedule_optimization',
            confidence: 0.85,
            payload: {
              action: 'reschedule_meeting',
              reason: 'Better energy levels in the morning',
              time: '9:00 AM',
            },
            createdAt: new Date().toISOString(),
          },
          {
            id: 'rec-2',
            type: 'health_reminder',
            confidence: 0.72,
            payload: {
              action: 'drink_water',
              reason: 'You haven\'t logged water intake today',
              target: '8 glasses',
            },
            createdAt: new Date().toISOString(),
          },
          {
            id: 'rec-3',
            type: 'learning_suggestion',
            confidence: 0.68,
            payload: {
              action: 'start_course',
              course: 'Time Management Fundamentals',
              reason: 'Based on your calendar patterns',
            },
            createdAt: new Date().toISOString(),
          },
        ],
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  })

  useEffect(() => {
    if (data?.suggestions) {
      setRecommendations(data.suggestions.slice(0, maxItems))
    }
    setLoading(isLoading)
  }, [data, isLoading, maxItems])

  const handleAcceptRecommendation = async (recommendation: AIRecommendation) => {
    try {
      // In a real app, this would execute the recommendation
      console.log('Accepting recommendation:', recommendation)

      // Remove from list
      setRecommendations(prev => prev.filter(r => r.id !== recommendation.id))

      // Show success feedback
      // You could add a toast notification here
    } catch (error) {
      console.error('Error accepting recommendation:', error)
    }
  }

  const handleDismissRecommendation = (recommendationId: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== recommendationId))
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'schedule_optimization':
        return '📅'
      case 'health_reminder':
        return '💚'
      case 'learning_suggestion':
        return '📚'
      case 'finance_tip':
        return '💰'
      default:
        return '💡'
    }
  }

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'schedule_optimization':
        return 'border-blue-200 bg-blue-50'
      case 'health_reminder':
        return 'border-green-200 bg-green-50'
      case 'learning_suggestion':
        return 'border-purple-200 bg-purple-50'
      case 'finance_tip':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">AI Recommendations</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">AI Recommendations</h3>
        <div className="text-center py-4">
          <p className="text-gray-500 mb-2">Unable to load recommendations</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">AI Recommendations</h3>
        <Button onClick={() => refetch()} variant="ghost" size="sm">
          Refresh
        </Button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-gray-500">You're all caught up!</p>
          <p className="text-sm text-gray-400 mt-1">Check back later for new recommendations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-4 rounded-lg border ${getRecommendationColor(rec.type)} transition-all hover:shadow-sm`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl" role="img" aria-label={rec.type}>
                    {getRecommendationIcon(rec.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {rec.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(rec.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {rec.payload.reason || rec.payload.action}
                    </p>
                    {rec.payload.time && (
                      <p className="text-xs text-gray-500">
                        Suggested time: {rec.payload.time}
                      </p>
                    )}
                    {rec.payload.target && (
                      <p className="text-xs text-gray-500">
                        Target: {rec.payload.target}
                      </p>
                    )}
                    {rec.payload.course && (
                      <p className="text-xs text-gray-500">
                        Course: {rec.payload.course}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    onClick={() => handleAcceptRecommendation(rec)}
                    size="sm"
                    className="text-xs"
                  >
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleDismissRecommendation(rec.id)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}