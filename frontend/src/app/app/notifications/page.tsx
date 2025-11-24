'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { NotificationsAPI, Notification as APINotification } from '@/lib/api/notifications'
import { useWebSocket } from '@/hooks/useWebSocket'

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all')
  const [notifications, setNotifications] = useState<APINotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const userId = localStorage.getItem('userId') || 'user123' // In real app, get from auth context
  const { socket } = useWebSocket(userId)

  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    if (socket) {
      socket.on('notification', (newNotification: APINotification) => {
        setNotifications(prev => [newNotification, ...prev])
      })
    }

    return () => {
      if (socket) {
        socket.off('notification')
      }
    }
  }, [socket])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const data = await NotificationsAPI.getUserNotifications(userId)
      setNotifications(data)
    } catch (err) {
      setError('Failed to load notifications')
      console.error('Error loading notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true
    return notification.type === filter
  })

  const markAsRead = async (id: string) => {
    try {
      await NotificationsAPI.markAsRead(id, userId)
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, isRead: true, readAt: new Date().toISOString() } : notification
        )
      )
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await NotificationsAPI.markAllAsRead(userId)
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true, readAt: new Date().toISOString() }))
      )
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-start mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadNotifications}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <Button onClick={markAllAsRead} disabled={notifications.length === 0}>
              Mark All as Read
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filter Tabs */}
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <div className="flex space-x-4">
              {[
                { key: 'all', label: 'All' },
                { key: 'info', label: 'Info' },
                { key: 'success', label: 'Success' },
                { key: 'warning', label: 'Warning' },
                { key: 'error', label: 'Error' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-primary-start text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white shadow rounded-lg">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No notifications found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-6 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            notification.type === 'info' ? 'bg-blue-100 text-blue-800' :
                            notification.type === 'success' ? 'bg-green-100 text-green-800' :
                            notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            notification.type === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {notification.type}
                          </span>
                          {!notification.isRead && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {!notification.isRead && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}