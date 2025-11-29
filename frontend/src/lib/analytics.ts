// Analytics and event tracking service
interface AnalyticsEvent {
  event: string
  category: string
  action: string
  label?: string
  value?: number
  properties?: Record<string, any>
  timestamp: number
  userId?: string
  sessionId: string
}

class AnalyticsService {
  private events: AnalyticsEvent[] = []
  private sessionId: string
  private userId?: string
  private isEnabled: boolean = true

  constructor() {
    this.sessionId = this.generateSessionId()
    this.loadUserPreferences()
    this.initializeTracking()
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  private loadUserPreferences(): void {
    const preferences = localStorage.getItem('userPreferences')
    if (preferences) {
      const parsed = JSON.parse(preferences)
      this.isEnabled = parsed.analytics !== false
    }
    this.userId = localStorage.getItem('userId') || undefined
  }

  private initializeTracking(): void {
    if (!this.isEnabled) return

    // Track page views
    this.trackEvent('page_view', 'navigation', 'page_load', window.location.pathname)

    // Track user interactions
    this.trackUserInteractions()

    // Track performance metrics
    this.trackPerformanceMetrics()

    // Send batched events periodically
    setInterval(() => this.sendBatchEvents(), 30000) // Every 30 seconds
  }

  private trackUserInteractions(): void {
    // Track button clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const button = target.closest('button, [role="button"]')
      if (button) {
        const label = button.getAttribute('aria-label') ||
                     button.textContent?.trim() ||
                     button.getAttribute('title') ||
                     'Unknown button'
        this.trackEvent('button_click', 'interaction', 'click', label)
      }
    })

    // Track form submissions
    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement
      const formName = form.getAttribute('data-form-name') || form.id || 'unknown_form'
      this.trackEvent('form_submit', 'interaction', 'submit', formName)
    })

    // Track navigation
    let currentPath = window.location.pathname
    const observer = new MutationObserver(() => {
      const newPath = window.location.pathname
      if (newPath !== currentPath) {
        this.trackEvent('navigation', 'navigation', 'page_change', newPath, undefined, {
          from: currentPath,
          to: newPath
        })
        currentPath = newPath
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
  }

  private trackPerformanceMetrics(): void {
    // Track Core Web Vitals when available
    if ('web-vitals' in window) {
      // This would require installing web-vitals package
      // For now, we'll track basic metrics
    }

    // Track API response times
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = Date.now()
      const url = args[0] as string

      try {
        const response = await originalFetch(...args)
        const duration = Date.now() - startTime

        this.trackEvent('api_call', 'performance', 'response_time', url, duration, {
          status: response.status,
          method: args[1]?.method || 'GET'
        })

        return response
      } catch (error) {
        const duration = Date.now() - startTime
        this.trackEvent('api_call', 'performance', 'error', url, duration, {
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        throw error
      }
    }
  }

  public trackEvent(
    event: string,
    category: string,
    action: string,
    label?: string,
    value?: number,
    properties?: Record<string, any>
  ): void {
    if (!this.isEnabled) return

    const analyticsEvent: AnalyticsEvent = {
      event,
      category,
      action,
      label,
      value,
      properties,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    }

    this.events.push(analyticsEvent)

    // Send immediately for important events
    if (this.isImportantEvent(event)) {
      this.sendEvent(analyticsEvent)
    }

    // Keep only last 100 events in memory
    if (this.events.length > 100) {
      this.events = this.events.slice(-100)
    }
  }

  private isImportantEvent(event: string): boolean {
    const importantEvents = ['error', 'form_submit', 'purchase', 'signup']
    return importantEvents.includes(event)
  }

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // In production, send to analytics service
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        })
      } else {
        console.log('Analytics Event:', event)
      }
    } catch (error) {
      console.error('Failed to send analytics event:', error)
    }
  }

  private async sendBatchEvents(): Promise<void> {
    if (this.events.length === 0) return

    const eventsToSend = [...this.events]
    this.events = []

    try {
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/analytics/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: eventsToSend })
        })
      } else {
        console.log('Batch Analytics Events:', eventsToSend.length, 'events')
      }
    } catch (error) {
      console.error('Failed to send batch analytics events:', error)
      // Re-queue events on failure
      this.events.unshift(...eventsToSend)
    }
  }

  public setUserId(userId: string): void {
    this.userId = userId
  }

  public enable(): void {
    this.isEnabled = true
    localStorage.setItem('analyticsEnabled', 'true')
  }

  public disable(): void {
    this.isEnabled = false
    localStorage.setItem('analyticsEnabled', 'false')
  }

  public isTrackingEnabled(): boolean {
    return this.isEnabled
  }

  // Utility methods for common events
  public trackPageView(page: string): void {
    this.trackEvent('page_view', 'navigation', 'view', page)
  }

  public trackError(error: Error, context?: string): void {
    this.trackEvent('error', 'error', 'exception', error.message, undefined, {
      stack: error.stack,
      context
    })
  }

  public trackFeatureUsage(feature: string, action: string): void {
    this.trackEvent('feature_usage', 'engagement', action, feature)
  }

  public trackConversion(conversionType: string, value?: number): void {
    this.trackEvent('conversion', 'conversion', conversionType, undefined, value)
  }
}

export const analytics = new AnalyticsService()

// React hook for analytics
export function useAnalytics() {
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    isEnabled: analytics.isTrackingEnabled(),
    enable: analytics.enable.bind(analytics),
    disable: analytics.disable.bind(analytics),
  }
}