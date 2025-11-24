import { useEffect } from 'react'

interface ShortcutMap {
  [key: string]: () => void
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap = {}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Default shortcuts
      const defaultShortcuts: ShortcutMap = {
        'ctrl+k': () => console.log('Quick search triggered'),
        'shift+n': () => console.log('New task triggered'),
        'ctrl+d': () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/app/dashboard'
          }
        },
        'ctrl+h': () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/app/health'
          }
        },
        'ctrl+f': () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/app/finance'
          }
        },
        'ctrl+l': () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/app/learn'
          }
        },
        'ctrl+,': () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/app/settings'
          }
        },
      }

      // Combine default and custom shortcuts
      const allShortcuts = { ...defaultShortcuts, ...shortcuts }

      // Check for matching shortcuts
      for (const [key, action] of Object.entries(allShortcuts)) {
        const keys = key.toLowerCase().split('+')
        const modifiers = keys.slice(0, -1)
        const mainKey = keys[keys.length - 1]

        const modifierMatch = modifiers.every(modifier => {
          switch (modifier) {
            case 'ctrl':
              return event.ctrlKey || event.metaKey
            case 'shift':
              return event.shiftKey
            case 'alt':
              return event.altKey
            default:
              return false
          }
        })

        if (modifierMatch && event.key.toLowerCase() === mainKey) {
          event.preventDefault()
          action()
          break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}