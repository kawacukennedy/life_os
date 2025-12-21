import React, { useState } from 'react'
import Link from 'next/link'
import { SearchBar, SearchSuggestion } from './SearchBar'
import { Button } from './Button'
import { Avatar } from './Avatar'
import { Badge } from './Badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './DropdownMenu'

export interface DashboardHeaderProps {
  user?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  notifications?: Array<{
    id: string
    title: string
    message: string
    read: boolean
    timestamp: Date
  }>
  onSearch?: (query: string) => void
  onSearchSuggestionSelect?: (suggestion: SearchSuggestion) => void
  searchSuggestions?: SearchSuggestion[]
  onLogout?: () => void
  className?: string
}

export function DashboardHeader({
  user,
  notifications = [],
  onSearch,
  onSearchSuggestionSelect,
  searchSuggestions,
  onLogout,
  className = ''
}: DashboardHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className={`h-18 bg-white border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/app/dashboard" className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">LifeOS</div>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            {onSearch && (
              <SearchBar
                placeholder="Search tasks, notes, contacts..."
                onSearch={onSearch}
                onSuggestionSelect={onSearchSuggestionSelect}
                suggestions={searchSuggestions}
              />
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 17H9a6 6 0 01-6-6V9a6 6 0 0110.29-4.12L15 9v8z" />
                </svg>
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 5).map(notification => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.timestamp.toLocaleDateString()}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2 mt-2" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No notifications
                      </div>
                    )}
                  </div>
                  {notifications.length > 5 && (
                    <div className="p-4 border-t border-gray-200">
                      <Button variant="ghost" size="sm" className="w-full">
                        View all notifications
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar
                      src={user.avatar}
                      alt={user.name}
                      size="small"
                    />
                    <span className="hidden md:block text-sm font-medium">
                      {user.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/app/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/billing">Billing</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}