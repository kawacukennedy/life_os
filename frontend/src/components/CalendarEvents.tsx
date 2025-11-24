'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { AuthAPI, CalendarEvent } from '@/lib/api/auth'

interface CalendarEventsProps {
  onAuthRequired?: () => void
}

export default function CalendarEvents({ onAuthRequired }: CalendarEventsProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const calendarEvents = await AuthAPI.getCalendarEvents()
      setEvents(calendarEvents)
      setError(null)
    } catch (err: any) {
      if (err.message.includes('401') || err.message.includes('403')) {
        setError('Google Calendar not connected')
        onAuthRequired?.()
      } else {
        setError('Failed to load calendar events')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConnectCalendar = () => {
    AuthAPI.getGoogleCalendarAuth()
  }

  const formatEventTime = (event: CalendarEvent) => {
    if (event.start.dateTime) {
      const date = new Date(event.start.dateTime)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return 'All day'
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded"></div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={handleConnectCalendar} className="bg-red-600 hover:bg-red-700">
          Connect Google Calendar
        </Button>
      </div>
    )
  }

  const todayEvents = events.filter(event => {
    const eventDate = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date!)
    const today = new Date()
    return eventDate.toDateString() === today.toDateString()
  })

  return (
    <div className="space-y-3">
      {todayEvents.length === 0 ? (
        <p className="text-gray-500 text-sm">No events scheduled for today</p>
      ) : (
        todayEvents.map((event) => (
          <div
            key={event.id}
            className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-3 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {event.summary}
              </p>
              <p className="text-xs text-gray-500">
                {formatEventTime(event)}
                {event.location && ` • ${event.location}`}
              </p>
            </div>
          </div>
        ))
      )}
      <Button
        onClick={() => setShowCreateForm(true)}
        className="w-full mt-4"
        variant="outline"
      >
        + Add Event
      </Button>
    </div>
  )
}