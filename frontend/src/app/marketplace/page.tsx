'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/contexts/ToastContext'
import { useAnalytics } from '@/lib/analytics'
import gql from 'graphql-tag'
import { useQuery as useApolloQuery, useMutation as useApolloMutation } from '@apollo/client'

export const dynamic = 'force-dynamic'

const GET_PLUGINS = gql`
  query GetPlugins($category: PluginCategory, $limit: Int, $offset: Int) {
    getPlugins(category: $category, limit: $limit, offset: $offset) {
      id
      name
      slug
      description
      version
      author
      category
      status
      iconUrl
      installCount
      averageRating
      reviewCount
      tags
    }
  }
`

const SEARCH_PLUGINS = gql`
  query SearchPlugins($query: String!, $category: PluginCategory) {
    searchPlugins(query: $query, category: $category) {
      id
      name
      slug
      description
      version
      author
      category
      status
      iconUrl
      installCount
      averageRating
      reviewCount
      tags
    }
  }
`

const GET_USER_PLUGINS = gql`
  query GetUserPlugins($userId: String!) {
    getUserPlugins(userId: $userId) {
      id
      pluginId
      status
      plugin {
        id
        name
        category
      }
    }
  }
`

const INSTALL_PLUGIN = gql`
  mutation InstallPlugin($userId: String!, $pluginId: String!, $configuration: JSON) {
    installPlugin(userId: $userId, pluginId: $pluginId, configuration: $configuration) {
      success
      message
      userPlugin {
        id
        status
      }
    }
  }
`

const UNINSTALL_PLUGIN = gql`
  mutation UninstallPlugin($userId: String!, $pluginId: String!) {
    uninstallPlugin(userId: $userId, pluginId: $pluginId) {
      success
      message
    }
  }
`

interface Plugin {
  id: string
  name: string
  slug: string
  description: string
  version: string
  author: string
  category: string
  status: string
  iconUrl?: string
  installCount: number
  averageRating: number
  reviewCount: number
  tags?: string[]
}

interface UserPlugin {
  id: string
  pluginId: string
  status: string
  plugin?: {
    id: string
    name: string
    category: string
  }
}

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [installingPlugins, setInstallingPlugins] = useState<Set<string>>(new Set())

  const { addToast } = useToast()
  const { trackEvent } = useAnalytics()

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'user123' : 'user123'

  const { data: pluginsData, loading: pluginsLoading, refetch: refetchPlugins } = useApolloQuery(GET_PLUGINS, {
    variables: {
      category: activeCategory === 'all' ? undefined : activeCategory,
      limit: 20,
      offset: 0,
    },
    onError: (error) => {
      console.error('Plugins error:', error)
      addToast({
        title: 'Error',
        description: 'Unable to load plugins.',
        variant: 'destructive'
      })
    }
  })

  const { data: searchData, loading: searchLoading, refetch: refetchSearch } = useApolloQuery(SEARCH_PLUGINS, {
    variables: { query: searchQuery, category: activeCategory === 'all' ? undefined : activeCategory },
    skip: !searchQuery,
    onError: (error) => {
      console.error('Search error:', error)
    }
  })

  const { data: userPluginsData, refetch: refetchUserPlugins } = useApolloQuery(GET_USER_PLUGINS, {
    variables: { userId },
    onError: (error) => {
      console.error('User plugins error:', error)
    }
  })

  const [installPluginMutation] = useApolloMutation(INSTALL_PLUGIN, {
    onCompleted: (data) => {
      if (data.installPlugin.success) {
        addToast({
          title: 'Plugin Installed',
          description: data.installPlugin.message,
        })
        trackEvent('plugin_installed', { pluginId: data.installPlugin.userPlugin?.id })
        refetchUserPlugins()
      } else {
        addToast({
          title: 'Installation Failed',
          description: data.installPlugin.message,
          variant: 'destructive'
        })
      }
    },
    onError: (error) => {
      addToast({
        title: 'Installation Failed',
        description: 'Failed to install plugin.',
        variant: 'destructive'
      })
    }
  })

  const [uninstallPluginMutation] = useApolloMutation(UNINSTALL_PLUGIN, {
    onCompleted: (data) => {
      if (data.uninstallPlugin.success) {
        addToast({
          title: 'Plugin Uninstalled',
          description: data.uninstallPlugin.message,
        })
        trackEvent('plugin_uninstalled')
        refetchUserPlugins()
      } else {
        addToast({
          title: 'Uninstallation Failed',
          description: data.uninstallPlugin.message,
          variant: 'destructive'
        })
      }
    },
    onError: (error) => {
      addToast({
        title: 'Uninstallation Failed',
        description: 'Failed to uninstall plugin.',
        variant: 'destructive'
      })
    }
  })

  useEffect(() => {
    refetchPlugins()
    refetchUserPlugins()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      refetchSearch()
    } else {
      refetchPlugins()
    }
  }, [activeCategory, searchQuery])

  const plugins = searchQuery ? searchData?.searchPlugins || [] : pluginsData?.getPlugins || []
  const userPlugins = userPluginsData?.getUserPlugins || []
  const installedPluginIds = new Set(userPlugins.map((up: any) => up.pluginId))

  const categories = [
    { id: 'all', label: 'All', count: plugins.length },
    { id: 'productivity', label: 'Productivity' },
    { id: 'health', label: 'Health' },
    { id: 'finance', label: 'Finance' },
    { id: 'social', label: 'Social' },
    { id: 'communication', label: 'Communication' },
    { id: 'utilities', label: 'Utilities' },
  ]

  const handleInstallPlugin = async (pluginId: string) => {
    setInstallingPlugins(prev => new Set(prev).add(pluginId))

    try {
      await installPluginMutation({
        variables: {
          userId,
          pluginId,
        },
      })
    } finally {
      setInstallingPlugins(prev => {
        const newSet = new Set(prev)
        newSet.delete(pluginId)
        return newSet
      })
    }
  }

  const handleUninstallPlugin = async (pluginId: string) => {
    await uninstallPluginMutation({
      variables: {
        userId,
        pluginId,
      },
    })
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Plugin Marketplace</h1>
            <p className="mt-2 text-gray-600">Extend LifeOS with powerful integrations and tools</p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="max-w-md">
              <input
                type="text"
                placeholder="Search plugins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.label}
                  {category.count !== undefined && (
                    <Badge variant="secondary" className="ml-2">
                      {category.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Plugins Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(pluginsLoading || searchLoading) ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-8 w-24" />
                </Card>
              ))
            ) : plugins.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No plugins found matching your criteria.</p>
              </div>
            ) : (
              plugins.map((plugin: Plugin) => (
                <Card key={plugin.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                       {plugin.iconUrl ? (
                         <Image
                           src={plugin.iconUrl}
                           alt={plugin.name}
                           width={48}
                           height={48}
                           className="h-12 w-12 rounded-lg object-cover"
                         />
                       ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-lg">📦</span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{plugin.name}</h3>
                        <p className="text-sm text-gray-600">by {plugin.author}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {plugin.category}
                    </Badge>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {plugin.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        {renderStars(plugin.averageRating)}
                        <span>({plugin.reviewCount})</span>
                      </div>
                      <span>{plugin.installCount} installs</span>
                    </div>
                  </div>

                  {plugin.tags && plugin.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {plugin.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">v{plugin.version}</span>
                    {installedPluginIds.has(plugin.id) ? (
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
                        disabled={installingPlugins.has(plugin.id)}
                      >
                        {installingPlugins.has(plugin.id) ? 'Installing...' : 'Install'}
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}