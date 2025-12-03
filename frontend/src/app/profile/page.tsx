'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/contexts/ToastContext'
import { useAnalytics } from '@/lib/analytics'
import gql from 'graphql-tag'
import { print } from 'graphql'
import { useQuery as useApolloQuery } from '@apollo/client'

export const dynamic = 'force-dynamic'

const GET_USER_PROFILE = gql`
  query GetUserProfile($userId: String!) {
    getUser(userId: $userId) {
      id
      email
      fullName
      avatar
      bio
      timezone
      preferences {
        theme
        language
        notifications
      }
      createdAt
      lastLoginAt
    }
  }
`

const UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile($userId: String!, $data: UpdateProfileInput!) {
    updateProfile(userId: $userId, data: $data) {
      id
      fullName
      bio
      timezone
      preferences {
        theme
        language
        notifications
      }
    }
  }
`

interface UserProfile {
  id: string
  email: string
  fullName: string
  avatar?: string
  bio?: string
  timezone: string
  preferences: {
    theme: string
    language: string
    notifications: boolean
  }
  createdAt: string
  lastLoginAt?: string
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    timezone: '',
    theme: 'light',
    language: 'en',
    notifications: true,
  })

  const { addToast } = useToast()
  const { trackEvent } = useAnalytics()

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'user123' : 'user123'

  const { data: profileData, loading, refetch } = useApolloQuery(GET_USER_PROFILE, {
    variables: { userId },
    onCompleted: (data) => {
      if (data?.getUser) {
        const user = data.getUser
        setFormData({
          fullName: user.fullName || '',
          bio: user.bio || '',
          timezone: user.timezone || 'UTC',
          theme: user.preferences?.theme || 'light',
          language: user.preferences?.language || 'en',
          notifications: user.preferences?.notifications ?? true,
        })
      }
    },
    onError: (error) => {
      console.error('Profile error:', error)
      addToast({
        title: 'Error',
        description: 'Unable to load profile.',
        variant: 'destructive',
      })
    }
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: print(UPDATE_USER_PROFILE),
          variables: {
            userId,
            data: {
              fullName: data.fullName,
              bio: data.bio,
              timezone: data.timezone,
              preferences: {
                theme: data.theme,
                language: data.language,
                notifications: data.notifications,
              },
            },
          },
        }),
      })
      const result = await response.json()
      if (result.errors) {
        throw new Error(result.errors[0].message)
      }
      return result.data.updateProfile
    },
    onSuccess: () => {
      addToast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      })
      setIsEditing(false)
      refetch()
      trackEvent('profile_updated')
    },
    onError: (error) => {
      addToast({
        title: 'Update Failed',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      })
    }
  })

  useEffect(() => {
    refetch()
  }, [])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate(formData)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data to original values
    if (profileData?.getUser) {
      const user = profileData.getUser
      setFormData({
        fullName: user.fullName || '',
        bio: user.bio || '',
        timezone: user.timezone || 'UTC',
        theme: user.preferences?.theme || 'light',
        language: user.preferences?.language || 'en',
        notifications: user.preferences?.notifications ?? true,
      })
    }
  }

  const user = profileData?.getUser as UserProfile | undefined

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ]

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="mt-2 text-gray-600">Manage your account information and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Overview */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                       {user?.avatar ? (
                         <Image
                           src={user.avatar}
                           alt="Profile"
                           width={96}
                           height={96}
                           className="w-24 h-24 rounded-full object-cover"
                         />
                       ) : (
                        <span className="text-2xl text-blue-600 font-semibold">
                          {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      {user?.fullName || 'User'}
                    </h2>
                    <p className="text-gray-600 mb-4">{user?.email}</p>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Member since:</span>
                        <span>
                          {user?.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : 'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last login:</span>
                        <span>
                          {user?.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : 'Today'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Account Information</h2>
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)}>
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          onClick={handleCancel}
                          disabled={updateProfileMutation.isLoading}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          disabled={updateProfileMutation.isLoading}
                        >
                          {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your full name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timezone
                          </label>
                          <select
                            value={formData.timezone}
                            onChange={(e) => handleInputChange('timezone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {timezones.map(tz => (
                              <option key={tz} value={tz}>{tz}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bio
                        </label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Tell us about yourself..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Theme
                          </label>
                          <select
                            value={formData.theme}
                            onChange={(e) => handleInputChange('theme', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="system">System</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Language
                          </label>
                          <select
                            value={formData.language}
                            onChange={(e) => handleInputChange('language', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {languages.map(lang => (
                              <option key={lang.code} value={lang.code}>{lang.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notifications
                          </label>
                          <select
                            value={formData.notifications.toString()}
                            onChange={(e) => handleInputChange('notifications', e.target.value === 'true')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                          </select>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                          </label>
                          <p className="text-gray-900">{user?.fullName || 'Not set'}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <p className="text-gray-900">{user?.email}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Timezone
                          </label>
                          <p className="text-gray-900">{user?.timezone || 'UTC'}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Theme
                          </label>
                          <Badge variant="secondary" className="capitalize">
                            {user?.preferences?.theme || 'light'}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bio
                        </label>
                        <p className="text-gray-900">{user?.bio || 'No bio added yet.'}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Language
                          </label>
                          <p className="text-gray-900">
                            {languages.find(l => l.code === user?.preferences?.language)?.name || 'English'}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notifications
                          </label>
                          <Badge variant={user?.preferences?.notifications ? 'default' : 'secondary'}>
                            {user?.preferences?.notifications ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}