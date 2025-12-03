'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/contexts/ToastContext'

const GET_PLUGINS = gql`
  query GetPlugins {
    plugins {
      id
      name
      description
      version
      author
      category
      isActive
    }
  }
`

const GET_USER_PLUGINS = gql`
  query GetUserPlugins($userId: String!) {
    userPlugins(userId: $userId) {
      id
      name
      description
      version
      author
      category
      installedAt
    }
  }
`

const INSTALL_PLUGIN = gql`
  mutation InstallPlugin($userId: String!, $pluginId: String!) {
    installPlugin(userId: $userId, pluginId: $pluginId) {
      id
      name
    }
  }
`

const UNINSTALL_PLUGIN = gql`
  mutation UninstallPlugin($userId: String!, $pluginId: String!) {
    uninstallPlugin(userId: $userId, pluginId: $pluginId)
  }
`

interface Plugin {
  id: string
  name: string
  description?: string
  version: string
  author: string
  category: string
  isActive: boolean
  installedAt?: string
}

export default function PluginsPage() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'installed'>('marketplace')
  const { addToast } = useToast()

  const userId = localStorage.getItem('userId') || 'user123'

  const { data: pluginsData, loading: pluginsLoading } = useQuery(GET_PLUGINS)
  const { data: userPluginsData, loading: userPluginsLoading, refetch: refetchUserPlugins } = useQuery(GET_USER_PLUGINS, {
    variables: { userId }
  })

  const [installPlugin] = useMutation(INSTALL_PLUGIN, {
    onCompleted: () => {
      refetchUserPlugins()
      addToast({
        title: 'Plugin Installed',
        description: 'The plugin has been installed successfully.',
        variant: 'default'
      })
    },
    onError: () => {
      addToast({
        title: 'Installation Failed',
        description: 'Failed to install the plugin.',
        variant: 'destructive'
      })
    }
  })

  const [uninstallPlugin] = useMutation(UNINSTALL_PLUGIN, {
    onCompleted: () => {
      refetchUserPlugins()
      addToast({
        title: 'Plugin Uninstalled',
        description: 'The plugin has been uninstalled successfully.',
        variant: 'default'
      })
    }
  })

  const handleInstallPlugin = (pluginId: string) => {
    installPlugin({
      variables: { userId, pluginId }
    })
  }

  const handleUninstallPlugin = (pluginId: string) => {
    if (confirm('Are you sure you want to uninstall this plugin?')) {
      uninstallPlugin({
        variables: { userId, pluginId }
      })
    }
  }

  const isPluginInstalled = (pluginId: string) => {
    return userPluginsData?.userPlugins?.some((plugin: Plugin) => plugin.id === pluginId)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'productivity': return 'bg-blue-100 text-blue-800'
      case 'health': return 'bg-green-100 text-green-800'
      case 'finance': return 'bg-yellow-100 text-yellow-800'
      case 'social': return 'bg-purple-100 text-purple-800'
      case 'learning': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Plugin Marketplace</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'marketplace'
                      ? 'border-primary-start text-primary-start'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Marketplace
                </button>
                <button
                  onClick={() => setActiveTab('installed')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'installed'
                      ? 'border-primary-start text-primary-start'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Installed Plugins
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'marketplace' && (
            <div>
              <div className="mb-6">
                <p className="text-gray-600">
                  Discover and install plugins to extend LifeOS functionality.
                  Plugins can add new integrations, automation rules, and custom features.
                </p>
              </div>

              {pluginsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pluginsData?.plugins?.map((plugin: Plugin) => (
                    <div key={plugin.id} className="bg-white shadow rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{plugin.name}</h3>
                          <p className="text-sm text-gray-500">by {plugin.author}</p>
                        </div>
                        <Badge className={getCategoryColor(plugin.category)}>
                          {plugin.category}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-4">{plugin.description}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">v{plugin.version}</span>
                        {isPluginInstalled(plugin.id) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUninstallPlugin(plugin.id)}
                          >
                            Uninstall
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleInstallPlugin(plugin.id)}
                          >
                            Install
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'installed' && (
            <div>
              <div className="mb-6">
                <p className="text-gray-600">
                  Manage your installed plugins. You can uninstall plugins you no longer need.
                </p>
              </div>

              {userPluginsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {userPluginsData?.userPlugins?.map((plugin: Plugin) => (
                    <div key={plugin.id} className="bg-white shadow rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{plugin.name}</h3>
                          <p className="text-sm text-gray-600">{plugin.description}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-xs text-gray-500">v{plugin.version}</span>
                            <span className="text-xs text-gray-500">by {plugin.author}</span>
                            <Badge className={getCategoryColor(plugin.category)}>
                              {plugin.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-500">
                            Installed {plugin.installedAt ? new Date(plugin.installedAt).toLocaleDateString() : 'recently'}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUninstallPlugin(plugin.id)}
                          >
                            Uninstall
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!userPluginsData?.userPlugins || userPluginsData.userPlugins.length === 0) && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No plugins installed yet.</p>
                      <Button
                        className="mt-4"
                        onClick={() => setActiveTab('marketplace')}
                      >
                        Browse Marketplace
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}