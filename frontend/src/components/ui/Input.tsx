import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'text' | 'password' | 'search' | 'number'
  error?: boolean
  leadingIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'text', error, leadingIcon, ...props }, ref) => {
    return (
      <div className="relative">
        {leadingIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {leadingIcon}
          </div>
        )}
        <input
          type={variant === 'password' ? 'password' : variant === 'number' ? 'number' : 'text'}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            leadingIcon && 'pl-10',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }