import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-[#275AF4] to-[#6B49FF] text-white hover:from-[#1e4ed8] hover:to-[#5a3fd1] shadow-lg hover:shadow-xl focus-visible:ring-[#275AF4]',
        primary: 'bg-[#275AF4] text-white hover:bg-[#1e4ed8] focus-visible:ring-[#275AF4]',
        secondary: 'bg-[#6B49FF] text-white hover:bg-[#5a3fd1] focus-visible:ring-[#6B49FF]',
        success: 'bg-[#00C2A8] text-white hover:bg-[#00a890] focus-visible:ring-[#00C2A8]',
        warning: 'bg-[#FFD24C] text-[#0F1724] hover:bg-[#e6bd44] focus-visible:ring-[#FFD24C]',
        destructive: 'bg-[#EF4444] text-white hover:bg-[#dc2626] focus-visible:ring-[#EF4444]',
        outline: 'border-2 border-[#275AF4] text-[#275AF4] hover:bg-[#275AF4] hover:text-white focus-visible:ring-[#275AF4]',
        ghost: 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F1724] focus-visible:ring-[#275AF4]',
        link: 'text-[#275AF4] underline-offset-4 hover:underline hover:text-[#1e4ed8] focus-visible:ring-[#275AF4]',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-md',
        default: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 py-3 text-base rounded-lg',
        xl: 'h-14 px-8 py-4 text-lg rounded-xl',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        aria-pressed={variant === 'default' ? 'true' : undefined}
        aria-disabled={loading || props.disabled}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <span className="mr-2" aria-hidden="true">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }