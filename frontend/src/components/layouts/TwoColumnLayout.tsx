import { ReactNode } from 'react'

interface TwoColumnLayoutProps {
  leftContent: ReactNode
  rightContent: ReactNode
  leftWidth?: string
  className?: string
}

export default function TwoColumnLayout({
  leftContent,
  rightContent,
  leftWidth = '280px',
  className = '',
}: TwoColumnLayoutProps) {
  return (
    <div className={`flex ${className}`}>
      <aside
        className="flex-shrink-0"
        style={{ width: leftWidth }}
      >
        {leftContent}
      </aside>
      <main className="flex-1 min-w-0">
        {rightContent}
      </main>
    </div>
  )
}