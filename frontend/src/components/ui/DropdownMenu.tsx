import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface DropdownMenuProps {
  children: React.ReactNode
  className?: string
}

export interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

export interface DropdownMenuContentProps {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

export interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  asChild?: boolean
}

export interface DropdownMenuLabelProps {
  children: React.ReactNode
  className?: string
}

export interface DropdownMenuSeparatorProps {
  className?: string
}

export function DropdownMenu({ children, className }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { isOpen, setIsOpen } as any)
          : child
      )}
    </div>
  )
}

export function DropdownMenuTrigger({
  children,
  asChild = false,
  className,
  isOpen,
  setIsOpen
}: DropdownMenuTriggerProps & { isOpen?: boolean; setIsOpen?: (open: boolean) => void }) {
  const handleClick = () => {
    setIsOpen?.(!isOpen)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
      className: cn(children.props.className, className)
    } as any)
  }

  return (
    <button
      onClick={handleClick}
      className={cn('inline-flex items-center justify-center', className)}
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({
  children,
  align = 'start',
  className,
  isOpen
}: DropdownMenuContentProps & { isOpen?: boolean }) {
  if (!isOpen) return null

  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0'
  }

  return (
    <div
      className={cn(
        'absolute z-50 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg',
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
  asChild = false
}: DropdownMenuItemProps) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(
        'block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
        children.props.className,
        className
      )
    } as any)
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
        className
      )}
    >
      {children}
    </button>
  )
}

export function DropdownMenuLabel({ children, className }: DropdownMenuLabelProps) {
  return (
    <div className={cn('px-4 py-2 text-sm font-medium text-gray-900', className)}>
      {children}
    </div>
  )
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return <div className={cn('h-px bg-gray-200 my-1', className)} />
}