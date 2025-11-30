import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const inputVariants = cva(
  'flex w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#94A3B8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-[#E2E8F0] focus-visible:ring-[#275AF4] focus-visible:border-[#275AF4]',
        error: 'border-[#EF4444] focus-visible:ring-[#EF4444] focus-visible:border-[#EF4444]',
        success: 'border-[#10B981] focus-visible:ring-[#10B981] focus-visible:border-[#10B981]',
      },
      size: {
        sm: 'h-8 px-2 py-1 text-xs',
        default: 'h-10',
        lg: 'h-12 px-4 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, type, leadingIcon, trailingIcon, error, ...props }, ref) => {
    return (
      <div className="relative">
        {leadingIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">
            {leadingIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            inputVariants({ variant: error ? 'error' : variant, size }),
            leadingIcon && 'pl-10',
            trailingIcon && 'pr-10',
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        {trailingIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]">
            {trailingIcon}
          </div>
        )}
        {error && (
          <p
            id={`${props.id}-error`}
            className="mt-1 text-sm text-[#EF4444]"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input, inputVariants }