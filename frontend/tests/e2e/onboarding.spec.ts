import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow', () => {
  test('should complete onboarding successfully', async ({ page }) => {
    // Navigate to onboarding
    await page.goto('/app/onboard')

    // Check welcome step
    await expect(page.getByRole('heading', { name: 'Welcome to LifeOS' })).toBeVisible()

    // Click next
    await page.getByRole('button', { name: 'Next' }).click()

    // Check account setup step
    await expect(page.getByRole('heading', { name: 'Set Up Your Account' })).toBeVisible()

    // Fill account form
    await page.getByLabel('Full Name').fill('Test User')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Language').selectOption('en')

    // Click next
    await page.getByRole('button', { name: 'Next' }).click()

    // Check preferences step
    await expect(page.getByRole('heading', { name: 'Your Preferences' })).toBeVisible()

    // Click next
    await page.getByRole('button', { name: 'Next' }).click()

    // Check integrations step
    await expect(page.getByRole('heading', { name: 'Connect Your Services' })).toBeVisible()

    // Click next
    await page.getByRole('button', { name: 'Next' }).click()

    // Check AI assistant step
    await expect(page.getByRole('heading', { name: 'Meet Your AI Assistant' })).toBeVisible()

    // Click next
    await page.getByRole('button', { name: 'Complete' }).click()

    // Should redirect to dashboard
    await expect(page).toHaveURL('/app/dashboard')
  })

  test('should navigate with keyboard', async ({ page }) => {
    await page.goto('/app/onboard')

    // Tab to next button and press enter
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')

    // Should be on account setup
    await expect(page.getByRole('heading', { name: 'Set Up Your Account' })).toBeVisible()
  })

  test('should show validation errors', async ({ page }) => {
    await page.goto('/app/onboard')

    // Go to account step
    await page.getByRole('button', { name: 'Next' }).click()

    // Try to proceed without filling required fields
    await page.getByRole('button', { name: 'Next' }).click()

    // Should still be on account step (validation prevents progression)
    await expect(page.getByRole('heading', { name: 'Set Up Your Account' })).toBeVisible()
  })
})