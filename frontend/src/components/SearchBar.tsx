import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  type: 'page' | 'action' | 'task' | 'course'
  url: string
  description?: string
}

interface SearchBarProps {
  placeholder?: string
  className?: string
}

export default function SearchBar({ placeholder = "Search LifeOS...", className = "" }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Predefined search results
  const searchData: SearchResult[] = [
    { id: 'dashboard', title: 'Dashboard', type: 'page', url: '/app/dashboard', description: 'Main dashboard overview' },
    { id: 'health', title: 'Health', type: 'page', url: '/app/health', description: 'Health metrics and tracking' },
    { id: 'finance', title: 'Finance', type: 'page', url: '/app/finance', description: 'Financial overview and budgeting' },
    { id: 'learn', title: 'Learning', type: 'page', url: '/app/learn', description: 'Courses and learning progress' },
    { id: 'settings', title: 'Settings', type: 'page', url: '/app/settings', description: 'App preferences and integrations' },
    { id: 'notifications', title: 'Notifications', type: 'page', url: '/app/notifications', description: 'Messages and alerts' },
    { id: 'analytics', title: 'Analytics', type: 'page', url: '/app/analytics', description: 'Detailed analytics and insights' },
    { id: 'routines', title: 'Routines', type: 'page', url: '/app/routines', description: 'AI-powered daily routines' },
    { id: 'add-task', title: 'Add New Task', type: 'action', url: '/app/dashboard', description: 'Create a new task' },
    { id: 'plan-day', title: 'Plan My Day', type: 'action', url: '/app/dashboard', description: 'AI-powered daily planning' },
    { id: 'health-summary', title: 'Health Summary', type: 'action', url: '/app/health', description: 'View health metrics' },
    { id: 'budget-check', title: 'Budget Check', type: 'action', url: '/app/finance', description: 'Review financial status' },
  ]

  useEffect(() => {
    if (query.length > 0) {
      const filtered = searchData.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase())
      )
      setResults(filtered)
      setIsOpen(true)
      setSelectedIndex(-1)
    } else {
      setResults([])
      setIsOpen(false)
    }
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => prev < results.length - 1 ? prev + 1 : prev)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleSelect(results[selectedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          setSelectedIndex(-1)
          inputRef.current?.blur()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, results])

  const handleSelect = (result: SearchResult) => {
    setQuery('')
    setIsOpen(false)
    setSelectedIndex(-1)

    if (result.type === 'action') {
      // Handle actions
      switch (result.id) {
        case 'add-task':
          // Could trigger a modal or navigate to task creation
          router.push('/app/dashboard')
          break
        case 'plan-day':
          // Could trigger AI planning
          router.push('/app/dashboard')
          break
        case 'health-summary':
          router.push('/app/health')
          break
        case 'budget-check':
          router.push('/app/finance')
          break
        default:
          router.push(result.url)
      }
    } else {
      router.push(result.url)
    }
  }

  const handleInputFocus = () => {
    if (query.length > 0) {
      setIsOpen(true)
    }
  }

  const clearSearch = () => {
    setQuery('')
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-start focus:border-transparent"
          aria-label="Search LifeOS"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50"
          role="listbox"
          aria-label="Search results"
        >
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                index === selectedIndex ? 'bg-gray-100' : ''
              }`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center text-sm ${
                  result.type === 'page' ? 'bg-blue-100 text-blue-600' :
                  result.type === 'action' ? 'bg-green-100 text-green-600' :
                  result.type === 'task' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {result.type === 'page' ? '📄' :
                   result.type === 'action' ? '⚡' :
                   result.type === 'task' ? '✓' : '📚'}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{result.title}</div>
                  {result.description && (
                    <div className="text-sm text-gray-500">{result.description}</div>
                  )}
                </div>
                <div className="text-xs text-gray-400 capitalize">{result.type}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length > 0 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No results found for "{query}"
        </div>
      )}
    </div>
  )
}