'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/contexts/ToastContext'
import { useAnalytics } from '@/lib/analytics'
import gql from 'graphql-tag'
import { print } from 'graphql'
import { useQuery as useApolloQuery, useMutation as useApolloMutation } from '@apollo/client'

export const dynamic = 'force-dynamic'

const GET_PRIVACY_SETTINGS = gql`
  query GetPrivacySettings($userId: String!) {
    getPrivacySettings(userId: $userId) {
      dataSharing
      analyticsTracking
      aiPersonalization
      thirdPartyIntegrations
      dataRetention
      exportRequests
    }
  }
`

const UPDATE_PRIVACY_SETTINGS = gql`
  mutation UpdatePrivacySettings($userId: String!, $settings: PrivacySettingsInput!) {
    updatePrivacySettings(userId: $userId, settings: $settings) {
      success
      message
    }
  }
`

const REQUEST_DATA_EXPORT = gql`
  mutation RequestDataExport($userId: String!) {
    requestDataExport(userId: $userId) {
      requestId
      estimatedCompletion
      status
    }
  }
`

const DELETE_ACCOUNT = gql`
  mutation DeleteAccount($userId: String!, $confirmation: String!) {
    deleteAccount(userId: $userId, confirmation: $confirmation) {
      success
      message
      deletionDate
    }
  }
`

interface PrivacySettings {
  dataSharing: boolean
  analyticsTracking: boolean
  aiPersonalization: boolean
  thirdPartyIntegrations: boolean
  dataRetention: string
  exportRequests: any[]
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'integrations' | 'account'>('privacy')
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    dataSharing: false,
    analyticsTracking: false,
    aiPersonalization: true,
    thirdPartyIntegrations: true,
    dataRetention: '7years',
    exportRequests: [],
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const { addToast } = useToast()
  const { trackEvent } = useAnalytics()

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'user123' : 'user123'

  const { data: settingsData, loading, refetch } = useApolloQuery(GET_PRIVACY_SETTINGS, {
    variables: { userId },
    onCompleted: (data) => {
      if (data?.getPrivacySettings) {
        setPrivacySettings(data.getPrivacySettings)
      }
    },
    onError: (error) => {
      console.error('Privacy settings error:', error)
      addToast({
        title: 'Settings Error',
        description: 'Unable to load privacy settings.',
        variant: 'destructive'
      })
    }
  })

  const [updateSettingsMutation] = useApolloMutation(UPDATE_PRIVACY_SETTINGS, {
    onCompleted: (data) => {
      addToast({
        title: 'Settings Updated',
        description: 'Your privacy settings have been saved.',
      })
      trackEvent('privacy_settings_updated')
    },
    onError: (error) => {
      addToast({
        title: 'Update Failed',
        description: 'Failed to update privacy settings.',
        variant: 'destructive'
      })
    }
  })

  const [requestExportMutation] = useApolloMutation(REQUEST_DATA_EXPORT, {
    onCompleted: (data) => {
      addToast({
        title: 'Export Requested',
        description: `Your data export request has been submitted. Request ID: ${data.requestDataExport.requestId}`,
      })
      trackEvent('data_export_requested')
    },
    onError: (error) => {
      addToast({
        title: 'Export Failed',
        description: 'Failed to request data export.',
        variant: 'destructive'
      })
    }
  })

  const [deleteAccountMutation] = useApolloMutation(DELETE_ACCOUNT, {
    onCompleted: (data) => {
      addToast({
        title: 'Account Deletion Scheduled',
        description: `Your account will be deleted on ${new Date(data.deleteAccount.deletionDate).toLocaleDateString()}.`,
      })
      trackEvent('account_deletion_requested')
    },
    onError: (error) => {
      addToast({
        title: 'Deletion Failed',
        description: 'Failed to schedule account deletion.',
        variant: 'destructive'
      })
    }
  })

  useEffect(() => {
    refetch()
  }, [])

  const handleSettingChange = (setting: keyof PrivacySettings, value: any) => {
    setPrivacySettings(prev => ({ ...prev, [setting]: value }))
  }

  const handleSaveSettings = () => {
    updateSettingsMutation({
      variables: {
        userId,
        settings: privacySettings,
      },
    })
  }

  const handleRequestExport = () => {
    requestExportMutation({
      variables: { userId },
    })
  }

  const handleDeleteAccount = () => {
    if (deleteConfirmation === 'DELETE') {
      deleteAccountMutation({
        variables: {
          userId,
          confirmation: deleteConfirmation,
        },
      })
    } else {
      addToast({
        title: 'Confirmation Required',
        description: 'Please type "DELETE" to confirm account deletion.',
        variant: 'destructive'
      })
    }
  }

  const privacyOptions = [
    {
      key: 'dataSharing' as keyof PrivacySettings,
      title: 'Data Sharing',
      description: 'Allow sharing anonymized data for product improvement',
      default: false,
    },
    {
      key: 'analyticsTracking' as keyof PrivacySettings,
      title: 'Analytics Tracking',
      description: 'Enable usage analytics to improve your experience',
      default: false,
    },
    {
      key: 'aiPersonalization' as keyof PrivacySettings,
      title: 'AI Personalization',
      description: 'Use your data to provide personalized AI recommendations',
      default: true,
    },
    {
      key: 'thirdPartyIntegrations' as keyof PrivacySettings,
      title: 'Third-party Integrations',
      description: 'Allow connections to external services (Google, Fitbit, etc.)',
      default: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-2 text-gray-600">Manage your account, privacy, and preferences</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {[
                { id: 'profile', label: 'Profile' },
                { id: 'privacy', label: 'Privacy & Security' },
                { id: 'integrations', label: 'Integrations' },
                { id: 'account', label: 'Account' },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Privacy Settings</h2>
                <div className="space-y-6">
                  {privacyOptions.map((option) => (
                    <div key={option.key} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{option.title}</h3>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings[option.key] as boolean}
                          onChange={(e) => handleSettingChange(option.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}

                  <div className="pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Retention Period
                    </label>
                    <select
                      value={privacySettings.dataRetention}
                      onChange={(e) => handleSettingChange('dataRetention', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1year">1 Year</option>
                      <option value="3years">3 Years</option>
                      <option value="7years">7 Years</option>
                      <option value="forever">Forever</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6">
                  <Button onClick={handleSaveSettings}>
                    Save Privacy Settings
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Data Export & Deletion</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Export Your Data</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Download a copy of all your data stored in LifeOS.
                    </p>
                    <Button variant="outline" onClick={handleRequestExport}>
                      Request Data Export
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium text-red-900 mb-2">Delete Account</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    {!showDeleteConfirm ? (
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        Delete Account
                      </Button>
                    ) : (
                      <div className="space-y-4">
                         <p className="text-sm text-red-600">
                           Type &quot;DELETE&quot; to confirm account deletion:
                         </p>
                        <input
                          type="text"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="Type DELETE"
                          className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <div className="flex space-x-2">
                          <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmation !== 'DELETE'}
                          >
                            Confirm Deletion
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowDeleteConfirm(false)
                              setDeleteConfirmation('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    defaultValue="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue="john@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    rows={3}
                    defaultValue="Passionate about productivity and personal growth."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button>Save Profile</Button>
              </div>
            </Card>
          )}

           {/* Integrations Tab */}
           {activeTab === 'integrations' && (
             <div className="space-y-6">
               <Card className="p-6">
                 <div className="flex items-center justify-between mb-4">
                   <h2 className="text-xl font-semibold">Plugin Marketplace</h2>
                   <Button onClick={() => window.location.href = '/app/marketplace'}>
                     Browse Marketplace
                   </Button>
                 </div>
                 <p className="text-gray-600 mb-4">
                   Discover and install plugins to extend LifeOS functionality
                 </p>
               </Card>

               <Card className="p-6">
                 <h2 className="text-xl font-semibold mb-4">Connected Services</h2>
                 <div className="space-y-4">
                   {[
                     { name: 'Google Calendar', status: 'connected', description: 'Sync your calendar events' },
                     { name: 'Fitbit', status: 'connected', description: 'Track your health and fitness data' },
                     { name: 'Plaid', status: 'disconnected', description: 'Connect your bank accounts' },
                     { name: 'Notion', status: 'disconnected', description: 'Sync with your notes and tasks' },
                   ].map((integration) => (
                     <div key={integration.name} className="flex items-center justify-between p-4 border rounded-lg">
                       <div>
                         <h3 className="font-medium">{integration.name}</h3>
                         <p className="text-sm text-gray-600">{integration.description}</p>
                       </div>
                       <div className="flex items-center space-x-2">
                         <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                           {integration.status}
                         </Badge>
                         <Button size="sm" variant="outline">
                           {integration.status === 'connected' ? 'Manage' : 'Connect'}
                         </Button>
                       </div>
                     </div>
                   ))}
                 </div>
               </Card>
             </div>
           )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Account Management</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Subscription</h3>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">LifeOS Premium</p>
                      <p className="text-sm text-gray-600">Monthly subscription</p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Account Created</h3>
                  <p className="text-gray-600">January 15, 2024</p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Storage Used</h3>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600">1.5 GB of 10 GB used</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}