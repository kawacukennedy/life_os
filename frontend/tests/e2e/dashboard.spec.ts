import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('should load dashboard with AI recommendations', async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-token')
    })

    await page.goto('/app/dashboard')

    // Check main heading
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    // Check for AI recommendations section
    await expect(page.getByText('AI Recommendations')).toBeVisible()

    // Check for navigation
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('should be accessible', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-token')
    })

    await page.goto('/app/dashboard')

    // Check for skip link
    await expect(page.getByText('Skip to main content')).toBeVisible()

    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3').allTextContents()
    expect(headings.length).toBeGreaterThan(0)
  })

  test('should handle offline state', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-token')
    })

    await page.goto('/app/dashboard')

    // Simulate offline
    await page.context().setOffline(true)

    // Check for offline indicator
    await expect(page.getByText(/offline/i)).toBeVisible()
  })
})