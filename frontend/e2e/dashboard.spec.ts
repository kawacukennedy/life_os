import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('should load dashboard page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/LifeOS/)
    await expect(page.locator('h1')).toContainText('Welcome back!')
  })

  test('should navigate between tabs', async ({ page }) => {
    await page.goto('/')

    // Check Overview tab is active by default
    await expect(page.locator('button').filter({ hasText: 'Overview' })).toHaveClass(/bg-blue-600/)

    // Click AI Insights tab
    await page.locator('button').filter({ hasText: 'AI Insights' }).click()
    await expect(page.locator('h2')).toContainText('AI-Powered Insights')
  })

  test('should display key metrics', async ({ page }) => {
    await page.goto('/')

    // Check if metrics cards are present
    await expect(page.locator('text=Steps Today')).toBeVisible()
    await expect(page.locator('text=Balance')).toBeVisible()
    await expect(page.locator('text=Day Streak')).toBeVisible()
    await expect(page.locator('text=Active Tasks')).toBeVisible()
  })
})