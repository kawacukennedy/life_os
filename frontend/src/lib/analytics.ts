import { useCallback } from 'react'

export const useAnalytics = () => {
  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    // In a real implementation, this would send to analytics service
    console.log('Analytics event:', eventName, properties)

    // Example: Send to Google Analytics, Mixpanel, etc.
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', eventName, properties)
    }
  }, [])

  const trackPageView = useCallback((pageName: string) => {
    trackEvent('page_view', { page: pageName })
  }, [trackEvent])

  return {
    trackEvent,
    trackPageView,
  }
}