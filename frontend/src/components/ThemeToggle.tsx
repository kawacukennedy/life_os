import { Button } from './ui/Button'
import { useTheme } from '@/contexts/ThemeContext'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="sm"
      className="flex items-center space-x-2"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-4 h-4" />
          <span>Dark Mode</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4" />
          <span>Light Mode</span>
        </>
      )}
    </Button>
  )
}