import React, { useState, useEffect, useRef } from 'react'
import { Input } from './Input'
import { Button } from './Button'
import { cn } from '@/lib/utils'

export interface SearchSuggestion {
  id: string
  label: string
  description?: string
}

export interface SearchBarProps {
  placeholder?: string
  onSearch: (query: string) => void
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
  suggestions?: SearchSuggestion[]
  loading?: boolean
  className?: string
}

export function SearchBar({
  placeholder = 'Search...',
  onSearch,
  onSuggestionSelect,
  suggestions = [],
  loading = false,
  className
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      if (query.trim()) {
        onSearch(query)
        setShowSuggestions(true)
      } else {
        setShowSuggestions(false)
      }
    }, 250)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, onSearch])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.label)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    onSuggestionSelect?.(suggestion)
  }

  return (
    <div ref={searchRef} className={cn('relative', className)}>
      <div className="flex">
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setShowSuggestions(true)}
          leadingIcon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          className="rounded-r-none border-r-0"
        />
        <Button
          type="submit"
          variant="default"
          className="rounded-l-none px-4"
          disabled={loading}
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            'Search'
          )}
        </Button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {suggestions.slice(0, 10).map((suggestion, index) => (
            <button
              key={suggestion.id}
              className={cn(
                'w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
                selectedIndex === index && 'bg-blue-50'
              )}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="font-medium text-gray-900">{suggestion.label}</div>
              {suggestion.description && (
                <div className="text-sm text-gray-500">{suggestion.description}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}