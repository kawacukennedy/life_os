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
import { useLazyQuery } from '@apollo/client'

const GET_SOCIAL_CONNECTIONS = gql`
  query GetSocialConnections($userId: String!) {
    getSocialConnections(userId: $userId) {
      connections {
        id
        name
        avatar
        mutualInterests
        connectionStrength
        lastInteraction
        sharedGoals
        status
      }
      recommendations {
        id
        name
        avatar
        reason
        mutualConnections
        sharedInterests
      }
    }
  }
`

const GET_SHARED_GOALS = gql`
  query GetSharedGoals($userId: String!) {
    getSharedGoals(userId: $userId) {
      goals {
        id
        title
        description
        participants
        progress
        deadline
        category
      }
    }
  }
`

interface Connection {
  id: string
  name: string
  avatar: string
  mutualInterests: string[]
  connectionStrength: number
  lastInteraction: string
  sharedGoals: string[]
  status: 'connected' | 'pending' | 'suggested'
}

interface Recommendation {
  id: string
  name: string
  avatar: string
  reason: string
  mutualConnections: number
  sharedInterests: string[]
}

interface SharedGoal {
  id: string
  title: string
  description: string
  participants: string[]
  progress: number
  deadline: string
  category: string
}

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState<'connections' | 'goals' | 'discover'>('connections')
  const { addToast } = useToast()
  const { trackEvent } = useAnalytics()

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'user123' : 'user123'

  const { data: connectionsData, isLoading: connectionsLoading, refetch: refetchConnections } = useLazyQuery(GET_SOCIAL_CONNECTIONS, {
    variables: { userId },
    onCompleted: (data) => {
      trackEvent('social_connections_loaded', { count: data?.getSocialConnections?.connections?.length })
    },
    onError: (error) => {
      console.error('Social connections error:', error)
      addToast({
        title: 'Social Data Error',
        description: 'Unable to load social connections. Please try again.',
        variant: 'destructive'
      })
    }
  })

  const { data: goalsData, isLoading: goalsLoading, refetch: refetchGoals } = useLazyQuery(GET_SHARED_GOALS, {
    variables: { userId },
    onCompleted: (data) => {
      trackEvent('shared_goals_loaded', { count: data?.getSharedGoals?.goals?.length })
    },
  })

  useEffect(() => {
    refetchConnections()
    refetchGoals()
  }, [])

  const handleConnect = (connectionId: string, name: string) => {
    trackEvent('social_connection_request', { connectionId, name })
    addToast({
      title: 'Connection Request Sent',
      description: `Sent connection request to ${name}`,
    })
  }

  const handleJoinGoal = (goalId: string, title: string) => {
    trackEvent('shared_goal_joined', { goalId, title })
    addToast({
      title: 'Joined Shared Goal',
      description: `Successfully joined "${title}"`,
    })
  }

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'bg-green-100 text-green-800'
    if (strength >= 60) return 'bg-blue-100 text-blue-800'
    if (strength >= 40) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const connections = connectionsData?.getSocialConnections?.connections || []
  const recommendations = connectionsData?.getSocialConnections?.recommendations || []
  const goals = goalsData?.getSharedGoals?.goals || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Social Network</h1>
            <p className="mt-2 text-gray-600">Connect with like-minded people and collaborate on shared goals</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {[
                { id: 'connections', label: 'Connections', count: connections.length },
                { id: 'goals', label: 'Shared Goals', count: goals.length },
                { id: 'discover', label: 'Discover', count: recommendations.length },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="flex items-center space-x-2"
                >
                  <span>{tab.label}</span>
                  <Badge variant="secondary">{tab.count}</Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Connections Tab */}
          {activeTab === 'connections' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connectionsLoading ? (
                [...Array(6)].map((_, i) => (
                  <Card key={i} className="p-6">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </Card>
                ))
              ) : connections.length > 0 ? (
                connections.map((connection: Connection) => (
                  <Card key={connection.id} className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <img
                        src={connection.avatar || '/default-avatar.png'}
                        alt={connection.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{connection.name}</h3>
                        <Badge className={getStrengthColor(connection.connectionStrength)}>
                          {connection.connectionStrength}% match
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Mutual interests: {connection.mutualInterests.join(', ')}
                      </p>
                      {connection.sharedGoals.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Shared goals: {connection.sharedGoals.length}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Last interaction: {new Date(connection.lastInteraction).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Button size="sm" variant="outline">
                        Message
                      </Button>
                      <Button size="sm" variant="outline">
                        View Profile
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 mb-4">No connections yet.</p>
                  <Button onClick={() => setActiveTab('discover')}>
                    Discover People
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Shared Goals Tab */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              {goalsLoading ? (
                [...Array(3)].map((_, i) => (
                  <Card key={i} className="p-6">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-96 mb-4" />
                    <Skeleton className="h-2 w-full mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </Card>
                ))
              ) : goals.length > 0 ? (
                goals.map((goal: SharedGoal) => (
                  <Card key={goal.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{goal.title}</h3>
                        <p className="text-gray-600 mt-1">{goal.description}</p>
                      </div>
                      <Badge variant="outline">{goal.category}</Badge>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        {goal.participants.length} participants • Due {new Date(goal.deadline).toLocaleDateString()}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleJoinGoal(goal.id, goal.title)}
                      >
                        Join Goal
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No shared goals available.</p>
                  <Button>Create New Goal</Button>
                </div>
              )}
            </div>
          )}

          {/* Discover Tab */}
          {activeTab === 'discover' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec: Recommendation) => (
                <Card key={rec.id} className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={rec.avatar || '/default-avatar.png'}
                      alt={rec.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{rec.name}</h3>
                      <p className="text-sm text-gray-600">{rec.mutualConnections} mutual connections</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{rec.reason}</p>
                  {rec.sharedInterests.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Shared interests:</p>
                      <div className="flex flex-wrap gap-1">
                        {rec.sharedInterests.slice(0, 3).map((interest, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={() => handleConnect(rec.id, rec.name)}
                  >
                    Connect
                  </Button>
                </Card>
              ))}
              {recommendations.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 mb-4">No recommendations available.</p>
                  <p className="text-sm text-gray-400">Complete your profile to get better recommendations.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}