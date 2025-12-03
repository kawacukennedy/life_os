'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/contexts/ToastContext'

const GET_CONNECTIONS = gql`
  query GetConnections($userId: String!) {
    connections(userId: $userId) {
      id
      userId
      connectedUserId
      status
      createdAt
    }
  }
`

const GET_SHARED_GOALS = gql`
  query GetSharedGoals($userId: String!) {
    sharedGoals(userId: $userId) {
      id
      title
      description
      participants
      progress
      createdAt
    }
  }
`

const SEND_CONNECTION_REQUEST = gql`
  mutation SendConnectionRequest($userId: String!, $targetUserId: String!) {
    sendConnectionRequest(userId: $userId, targetUserId: $targetUserId) {
      id
      status
    }
  }
`

const ACCEPT_CONNECTION = gql`
  mutation AcceptConnection($connectionId: String!) {
    acceptConnection(connectionId: $connectionId)
  }
`

interface Connection {
  id: string
  userId: string
  connectedUserId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
}

interface SharedGoal {
  id: string
  title: string
  description?: string
  participants: string[]
  progress: number
  createdAt: string
}

export default function SocialPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [sharedGoals, setSharedGoals] = useState<SharedGoal[]>([])
  const [isCreateGoalModalOpen, setIsCreateGoalModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { addToast } = useToast()

  const userId = localStorage.getItem('userId') || 'user123'

  const { data: connectionsData, loading: connectionsLoading, refetch: refetchConnections } = useQuery(GET_CONNECTIONS, {
    variables: { userId },
    onCompleted: (data) => {
      if (data?.connections) {
        setConnections(data.connections)
      }
    }
  })

  const { data: goalsData, loading: goalsLoading, refetch: refetchGoals } = useQuery(GET_SHARED_GOALS, {
    variables: { userId },
    onCompleted: (data) => {
      if (data?.sharedGoals) {
        setSharedGoals(data.sharedGoals)
      }
    }
  })

  const [sendConnectionRequest] = useMutation(SEND_CONNECTION_REQUEST, {
    onCompleted: () => {
      refetchConnections()
      addToast({
        title: 'Connection Request Sent',
        description: 'Your connection request has been sent successfully.',
        variant: 'default'
      })
    },
    onError: () => {
      addToast({
        title: 'Error',
        description: 'Failed to send connection request.',
        variant: 'destructive'
      })
    }
  })

  const [acceptConnection] = useMutation(ACCEPT_CONNECTION, {
    onCompleted: () => {
      refetchConnections()
      addToast({
        title: 'Connection Accepted',
        description: 'You are now connected!',
        variant: 'default'
      })
    }
  })

  const handleSendRequest = (targetUserId: string) => {
    sendConnectionRequest({
      variables: { userId, targetUserId }
    })
  }

  const handleAcceptConnection = (connectionId: string) => {
    acceptConnection({
      variables: { connectionId }
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'declined': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (connectionsLoading || goalsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-start"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Social Network</h1>
            <Button onClick={() => setIsCreateGoalModalOpen(true)}>
              Create Shared Goal
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Search */}
          <div className="mb-6">
            <Input
              type="text"
              placeholder="Search for people with similar goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Connections */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Connections</h2>
              <div className="space-y-4">
                {connections.map((connection) => (
                  <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <Avatar size="medium" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          User {connection.connectedUserId}
                        </p>
                        <Badge className={getStatusColor(connection.status)}>
                          {connection.status}
                        </Badge>
                      </div>
                    </div>
                    {connection.status === 'pending' && connection.connectedUserId !== userId && (
                      <Button
                        size="sm"
                        onClick={() => handleAcceptConnection(connection.id)}
                      >
                        Accept
                      </Button>
                    )}
                  </div>
                ))}
                {connections.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No connections yet. Start connecting!</p>
                )}
              </div>

              {/* Find People */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Find People</h3>
                <div className="space-y-2">
                  {/* Mock users for demo */}
                  {['user456', 'user789', 'user101'].map((mockUserId) => (
                    <div key={mockUserId} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center">
                        <Avatar size="small" />
                        <span className="ml-2 text-sm text-gray-700">{mockUserId}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendRequest(mockUserId)}
                      >
                        Connect
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Shared Goals */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Shared Goals</h2>
              <div className="space-y-4">
                {sharedGoals.map((goal) => (
                  <div key={goal.id} className="p-4 border rounded-lg">
                    <h3 className="font-medium text-gray-900">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                    )}
                    <div className="mt-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(goal.progress * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-start h-2 rounded-full"
                          style={{ width: `${goal.progress * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span>{goal.participants.length} participants</span>
                    </div>
                  </div>
                ))}
                {sharedGoals.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No shared goals yet. Create one!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create Shared Goal Modal */}
      {isCreateGoalModalOpen && (
        <SharedGoalModal
          onClose={() => setIsCreateGoalModalOpen(false)}
          onSubmit={(goalData) => {
            // TODO: Implement create shared goal mutation
            console.log('Create goal:', goalData)
            setIsCreateGoalModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

interface SharedGoalModalProps {
  onClose: () => void
  onSubmit: (goalData: Partial<SharedGoal>) => void
}

function SharedGoalModal({ onClose, onSubmit }: SharedGoalModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    participants: [] as string[]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Modal onClose={onClose} title="Create Shared Goal">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Goal Title</label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-start focus:border-primary-start"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Invite Participants</label>
          <Input
            type="text"
            placeholder="Enter user IDs separated by commas"
            value={formData.participants.join(', ')}
            onChange={(e) => setFormData({
              ...formData,
              participants: e.target.value.split(',').map(id => id.trim()).filter(id => id)
            })}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Create Goal
          </Button>
        </div>
      </form>
    </Modal>
  )
}