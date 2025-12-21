import React from 'react'
import { cn } from '@/lib/utils'

export interface AvatarProps {
  src?: string
  alt?: string
  size?: 'small' | 'medium' | 'large'
  status?: 'online' | 'offline' | 'away'
  className?: string
  children?: React.ReactNode
}

const sizeClasses = {
  small: 'w-6 h-6',
  medium: 'w-10 h-10',
  large: 'w-16 h-16'
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500'
}

export function Avatar({
  src,
  alt,
  size = 'medium',
  status,
  className,
  children
}: AvatarProps) {
  return (
    <div className="relative inline-block">
      <div
        className={cn(
          'rounded-full bg-gray-200 flex items-center justify-center overflow-hidden',
          sizeClasses[size],
          className
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          children || (
            <span className="text-gray-600 font-medium text-sm">
              {alt?.charAt(0).toUpperCase() || '?'}
            </span>
          )
        )}
      </div>
      {status && (
        <div
          className={cn(
            'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
            statusColors[status]
          )}
        />
      )}
    </div>
  )
}