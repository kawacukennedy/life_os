describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should navigate to signup page', () => {
    cy.contains('Get started — it\'s free').click()
    cy.url().should('include', '/auth/signup')
    cy.contains('Sign Up for LifeOS').should('be.visible')
  })

  it('should show validation errors on empty form submission', () => {
    cy.visit('/auth/signup')
    cy.get('button[type="submit"]').click()
    cy.contains('email is required').should('be.visible')
    cy.contains('password is required').should('be.visible')
  })

  it('should allow user to sign up with valid data', () => {
    cy.visit('/auth/signup')
    cy.get('input[name="fullName"]').type('Test User')
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="password"]').type('Password123!')
    cy.get('select[name="timezone"]').select('America/New_York')
    cy.get('input[name="acceptTerms"]').check()
    cy.get('button[type="submit"]').click()
    // Assuming successful signup redirects to onboarding
    cy.url().should('include', '/onboard')
  })

  it('should navigate to login page', () => {
    cy.visit('/auth/signup')
    cy.contains("Don't have an account? Sign up").should('not.exist')
    cy.visit('/auth/login')
    cy.contains('Log In to LifeOS').should('be.visible')
  })
})