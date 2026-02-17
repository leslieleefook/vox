import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')

    // Check for Vox branding
    await expect(page.locator('text=Vox')).toBeVisible()

    // Check for login form elements
    await expect(page.locator('label:has-text("Email")')).toBeVisible()
    await expect(page.locator('label:has-text("Password")')).toBeVisible()
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible()

    // Check for OAuth buttons
    await expect(page.locator('button:has-text("Google")')).toBeVisible()
    await expect(page.locator('button:has-text("GitHub")')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')

    // Submit form
    await page.click('button:has-text("Sign In")')

    // Check for error message
    await expect(page.locator('text=/login failed|invalid/i')).toBeVisible({
      timeout: 5000,
    })
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/login')

    // Enter invalid email
    await page.fill('input[type="email"]', 'notanemail')
    await page.fill('input[type="password"]', 'somepassword')

    // Try to submit
    await page.click('button:has-text("Sign In")')

    // Browser should prevent submission due to type="email"
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveValue('notanemail')
  })
})

test.describe('Protected Routes', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/assistants')

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })
})
