// Performance monitoring utilities

export interface PerformanceMetrics {
  fcp: number // First Contentful Paint
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte
}

export class PerformanceMonitor {
  private static observers: PerformanceObserver[] = []

  static init() {
    if (typeof window === 'undefined') return

    // Monitor Core Web Vitals
    this.observePerformance('paint', (entries) => {
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          console.log('FCP:', entry.startTime)
          // Send to analytics
        }
      })
    })

    this.observePerformance('largest-contentful-paint', (entries) => {
      entries.forEach((entry) => {
        console.log('LCP:', entry.startTime)
        // Send to analytics
      })
    })

    this.observePerformance('first-input', (entries) => {
      entries.forEach((entry) => {
        console.log('FID:', entry.processingStart - entry.startTime)
        // Send to analytics
      })
    })

    this.observePerformance('layout-shift', (entries) => {
      let clsValue = 0
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      console.log('CLS:', clsValue)
      // Send to analytics
    })
  }

  private static observePerformance(
    type: string,
    callback: (entries: PerformanceEntryList) => void
  ) {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(callback)
      observer.observe({ type, buffered: true })
      this.observers.push(observer)
    }
  }

  static measureTTFB(): number {
    if (typeof window === 'undefined') return 0

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return navigation.responseStart - navigation.requestStart
  }

  static measurePageLoad(): number {
    if (typeof window === 'undefined') return 0

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return navigation.loadEventEnd - navigation.loadEventStart
  }

  static cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// React hook for component performance monitoring
export const usePerformanceMark = (name: string) => {
  const startMark = `${name}-start`
  const endMark = `${name}-end`
  const measureName = `${name}-measure`

  const start = () => {
    if (typeof performance !== 'undefined') {
      performance.mark(startMark)
    }
  }

  const end = () => {
    if (typeof performance !== 'undefined') {
      performance.mark(endMark)
      performance.measure(measureName, startMark, endMark)
      const measure = performance.getEntriesByName(measureName)[0]
      console.log(`${name} duration:`, measure.duration)
    }
  }

  return { start, end }
}

// Bundle size monitoring
export const reportBundleSize = () => {
  if (typeof window === 'undefined') return

  // This would typically be done during build time
  // For runtime monitoring, we can check resource sizes
  const resources = performance.getEntriesByType('resource')
  const scripts = resources.filter(r => r.name.endsWith('.js'))

  scripts.forEach(script => {
    console.log(`Script: ${script.name}, Size: ${(script as any).transferSize || 'unknown'}`)
  })
}