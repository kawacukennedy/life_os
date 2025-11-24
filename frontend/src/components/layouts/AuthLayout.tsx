import { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  title?: string
}

export default function AuthLayout({ children, title }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-start to-primary-end">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        {title && <h1 className="text-2xl font-bold text-center mb-6">{title}</h1>}
        {children}
      </div>
    </div>
  )
}