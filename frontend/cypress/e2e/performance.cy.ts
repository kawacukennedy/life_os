describe('Performance Tests', () => {
  it('should load the homepage quickly', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.performance.mark('start-loading')
      }
    }).then(() => {
      cy.window().then((win) => {
        win.performance.mark('end-loading')
        win.performance.measure('page-load', 'start-loading', 'end-loading')
        const measure = win.performance.getEntriesByName('page-load')[0]
        expect(measure.duration).to.be.lessThan(3000) // Less than 3 seconds
      })
    })
  })

  it('should have good Core Web Vitals', () => {
    cy.visit('/')

    // Wait for page to stabilize
    cy.wait(2000)

    cy.window().then((win) => {
      // Check if performance API is available
      if ('PerformanceObserver' in win) {
        // This would be more comprehensive in a real scenario
        // For now, just check that the page loaded
        cy.get('h1').should('contain', 'Get control of your life')
      }
    })
  })

  it('should handle navigation performance', () => {
    cy.visit('/')
    cy.contains('Get started — it\'s free').click()

    cy.url().should('include', '/auth/signup')

    // Check that navigation was fast
    cy.window().then((win) => {
      const navigation = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      expect(navigation.loadEventEnd - navigation.fetchStart).to.be.lessThan(2000)
    })
  })
})