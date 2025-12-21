import React from 'react'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { Card, CardContent } from './Card'

export interface ProfileCardProps {
  id: string
  name: string
  avatar?: string
  bio?: string
  location?: string
  stats?: {
    followers?: number
    following?: number
    posts?: number
  }
  isFollowing?: boolean
  onFollow?: () => void
  onMessage?: () => void
  className?: string
}

export function ProfileCard({
  id,
  name,
  avatar,
  bio,
  location,
  stats,
  isFollowing = false,
  onFollow,
  onMessage,
  className
}: ProfileCardProps) {
  return (
    <Card className={`w-80 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <Avatar
            src={avatar}
            alt={name}
            size="large"
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{name}</h3>
            {location && (
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {location}
              </p>
            )}
            {bio && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{bio}</p>
            )}
            {stats && (
              <div className="flex space-x-4 mt-3">
                {stats.followers !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{stats.followers}</div>
                    <div className="text-xs text-gray-500">Followers</div>
                  </div>
                )}
                {stats.following !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{stats.following}</div>
                    <div className="text-xs text-gray-500">Following</div>
                  </div>
                )}
                {stats.posts !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{stats.posts}</div>
                    <div className="text-xs text-gray-500">Posts</div>
                  </div>
                )}
              </div>
            )}
            <div className="flex space-x-2 mt-4">
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                onClick={onFollow}
                className="flex-1"
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              {onMessage && (
                <Button variant="outline" size="sm" onClick={onMessage}>
                  Message
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}