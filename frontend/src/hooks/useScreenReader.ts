import { useCallback } from 'react'

export function useScreenReader() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.setAttribute('class', 'sr-only')
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }, [])

  return { announce }
}