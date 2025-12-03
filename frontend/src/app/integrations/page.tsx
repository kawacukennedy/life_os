'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/contexts/ToastContext'
import { useAnalytics } from '@/lib/analytics'
import gql from 'graphql-tag'
import { print } from 'graphql'
import { useQuery as useApolloQuery, useMutation as useApolloMutation } from '@apollo/client'

export const dynamic = 'force-dynamic'

const GET_INTEGRATIONS = gql`
  query GetIntegrations($userId: String!) {
    getUserIntegrations(userId: $userId) {
      id
      provider
      status
      connectedAt
      lastSyncAt
      scopes
    }
  }
`

const CONNECT_INTEGRATION = gql`
  mutation ConnectIntegration($userId: String!, $provider: String!, $scopes: [String!]!) {
    connectIntegration(userId: $userId, provider: $provider, scopes: $scopes) {
      success
      message
      authUrl
    }
  }
`

const DISCONNECT_INTEGRATION = gql`
  mutation DisconnectIntegration($userId: String!, $provider: String!) {
    disconnectIntegration(userId: $userId, provider: $provider) {
      success
      message
    }
  }
`

interface Integration {
  id: string
  provider: string
  status: 'connected' | 'disconnected' | 'error'
  connectedAt?: string
  lastSyncAt?: string
  scopes: string[]
}

const availableIntegrations = [
  {
    provider: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sync your calendar events and schedule',
    icon: '📅',
    scopes: ['calendar.readonly', 'calendar.events'],
    category: 'productivity',
    setupSteps: [
      'Click "Connect" to open Google OAuth',
      'Grant calendar access permissions',
      'LifeOS will sync your upcoming events',
      'Events appear in your unified timeline'
    ]
  },
  {
    provider: 'fitbit',
    name: 'Fitbit',
    description: 'Track steps, sleep, and health metrics',
    icon: '❤️',
    scopes: ['activity', 'heartrate', 'sleep', 'weight'],
    category: 'health',
    setupSteps: [
      'Click "Connect" to authorize Fitbit',
      'Allow access to activity and health data',
      'Data syncs automatically every hour',
      'View insights in your health dashboard'
    ]
  },
  {
    provider: 'apple_health',
    name: 'Apple Health',
    description: 'Import health and fitness data from Apple devices',
    icon: '🍎',
    scopes: ['healthkit'],
    category: 'health',
    setupSteps: [
      'Click "Connect" on your iOS device',
      'Grant Health app permissions',
      'Data transfers securely to LifeOS',
      'Monitor all metrics in one dashboard'
    ]
  },
  {
    provider: 'plaid',
    name: 'Bank Accounts',
    description: 'Connect your bank accounts for financial insights',
    icon: '🏦',
    scopes: ['accounts', 'transactions'],
    category: 'finance',
    setupSteps: [
      'Select your bank from the secure list',
      'Enter your online banking credentials',
      'Plaid securely connects your accounts',
      'View spending insights and budgets'
    ]
  },
  {
    provider: 'notion',
    name: 'Notion',
    description: 'Sync notes, tasks, and databases',
    icon: '📝',
    scopes: ['pages', 'databases'],
    category: 'productivity',
    setupSteps: [
      'Authorize Notion workspace access',
      'Select pages and databases to sync',
      'Content appears in your knowledge base',
      'Create tasks from Notion items'
    ]
  },
  {
    provider: 'slack',
    name: 'Slack',
    description: 'Get notified and manage communications',
    icon: '💬',
    scopes: ['channels', 'messages'],
    category: 'communication',
    setupSteps: [
      'Choose Slack workspace to connect',
      'Grant access to channels and messages',
      'Receive LifeOS notifications in Slack',
      'Create tasks from Slack messages'
    ]
  }
]

export default function IntegrationsPage() {
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null)

  const { addToast } = useToast()
  const { trackEvent } = useAnalytics()

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'user123' : 'user123'

  const { data: integrationsData, loading, refetch } = useApolloQuery(GET_INTEGRATIONS, {
    variables: { userId },
    onError: (error) => {
      console.error('Integrations error:', error)
      addToast({
        title: 'Error',
        description: 'Unable to load integrations.',
        variant: 'destructive',
      })
    }
  })

  const connectMutation = useMutation({
    mutationFn: async ({ provider, scopes }: { provider: string, scopes: string[] }) => {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: print(CONNECT_INTEGRATION),
          variables: { userId, provider, scopes },
        }),
      })
      const result = await response.json()
      if (result.errors) {
        throw new Error(result.errors[0].message)
      }
      return result.data.connectIntegration
    },
    onSuccess: (data, variables) => {
      if (data.authUrl) {
        // Redirect to OAuth provider
        window.location.href = data.authUrl
      } else {
        addToast({
          title: 'Connected!',
          description: `${variables.provider} has been connected successfully.`,
        })
        refetch()
      }
      trackEvent('integration_connected', { provider: variables.provider })
    },
    onError: (error, variables) => {
      addToast({
        title: 'Connection Failed',
        description: `Failed to connect ${variables.provider}. Please try again.`,
        variant: 'destructive',
      })
    },
    onSettled: () => {
      setConnectingProvider(null)
    }
  })

  const disconnectMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: print(DISCONNECT_INTEGRATION),
          variables: { userId, provider },
        }),
      })
      const result = await response.json()
      if (result.errors) {
        throw new Error(result.errors[0].message)
      }
      return result.data.disconnectIntegration
    },
    onSuccess: (data, provider) => {
      addToast({
        title: 'Disconnected',
        description: `${provider} has been disconnected.`,
      })
      refetch()
      trackEvent('integration_disconnected', { provider })
    },
    onError: (error, provider) => {
      addToast({
        title: 'Disconnection Failed',
        description: `Failed to disconnect ${provider}. Please try again.`,
        variant: 'destructive',
      })
    }
  })

  useEffect(() => {
    refetch()
  }, [])

  const userIntegrations = integrationsData?.getUserIntegrations || []
  const connectedProviders = userIntegrations
    .filter((int: any) => int.status === 'connected')
    .map((int: any) => int.provider)

  const handleConnect = async (integration: typeof availableIntegrations[0]) => {
    setConnectingProvider(integration.provider)
    connectMutation.mutate({
      provider: integration.provider,
      scopes: integration.scopes,
    })
  }

  const handleDisconnect = async (provider: string) => {
    disconnectMutation.mutate(provider)
  }

  const getIntegrationStatus = (provider: string) => {
    const integration = userIntegrations.find((int: any) => int.provider === provider)
    return integration?.status || 'disconnected'
  }

  const getLastSync = (provider: string) => {
    const integration = userIntegrations.find((int: any) => int.provider === provider)
    return integration?.lastSyncAt
  }

  const categories = ['productivity', 'health', 'finance', 'communication']

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
            <p className="mt-2 text-gray-600">Connect your favorite tools and services to supercharge your LifeOS experience</p>
          </div>

          {/* Connected Services Overview */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-xl font-semibold">Connected Services</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {connectedProviders.length > 0 ? (
                  connectedProviders.map((provider: any) => {
                    const integration = availableIntegrations.find(i => i.provider === provider)
                    return (
                      <div key={provider} className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl mb-2">{integration?.icon}</div>
                        <h3 className="font-medium text-green-800">{integration?.name}</h3>
                        <p className="text-xs text-green-600 mt-1">Connected</p>
                      </div>
                    )
                  })
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500 mb-4">No services connected yet</p>
                    <p className="text-sm text-gray-400">Connect your first integration below to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Available Integrations */}
          {categories.map(category => {
            const categoryIntegrations = availableIntegrations.filter(i => i.category === category)

            return (
              <div key={category} className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 capitalize">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categoryIntegrations.map(integration => {
                    const status = getIntegrationStatus(integration.provider)
                    const lastSync = getLastSync(integration.provider)
                    const isConnecting = connectingProvider === integration.provider

                    return (
                      <Card key={integration.provider} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="text-3xl">{integration.icon}</div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                                <p className="text-sm text-gray-600">{integration.description}</p>
                              </div>
                            </div>
                            <Badge
                              variant={status === 'connected' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {status}
                            </Badge>
                          </div>

                          {status === 'connected' && lastSync && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-800">
                                Last synced: {new Date(lastSync).toLocaleString()}
                              </p>
                            </div>
                          )}

                          <div className="space-y-3">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">What this connects:</h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {integration.setupSteps.slice(2).map((step, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-blue-500 mr-2">•</span>
                                    {step}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                              <div className="flex flex-wrap gap-1">
                                {integration.scopes.map(scope => (
                                  <Badge key={scope} variant="outline" className="text-xs">
                                    {scope}
                                  </Badge>
                                ))}
                              </div>

                              {status === 'connected' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDisconnect(integration.provider)}
                                  disabled={disconnectMutation.isLoading}
                                >
                                  Disconnect
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleConnect(integration)}
                                  disabled={isConnecting || connectMutation.isLoading}
                                >
                                  {isConnecting ? 'Connecting...' : 'Connect'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Setup Guide */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Integration Setup Guide</h2>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <h3>Getting Started</h3>
                <ol>
                  <li>Choose an integration from the categories above</li>
                  <li>Click &quot;Connect&quot; to start the authorization process</li>
                  <li>Grant the requested permissions to LifeOS</li>
                  <li>Your data will begin syncing automatically</li>
                  <li>View insights in the relevant dashboard sections</li>
                </ol>

                <h3>Security & Privacy</h3>
                <ul>
                  <li>All connections use OAuth 2.0 for secure authorization</li>
                  <li>You can revoke access anytime in your account settings</li>
                  <li>Data is encrypted in transit and at rest</li>
                  <li>We only access the data you explicitly authorize</li>
                </ul>

                <h3>Need Help?</h3>
                <p>
                  Having trouble connecting a service? Check our{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-800">integration help center</a>{' '}
                  or contact support.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}