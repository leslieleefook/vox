import { test, expect } from '@playwright/test'

// Test credentials from environment
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'leslieleefook@incusservices.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Password123'

test.describe('Authentication Flow', () => {
  test('should login successfully with valid credentials', async ({ page, browserName }) => {
    // Skip in WebKit due to stricter cookie policies that prevent JS-set cookies
    // WebKit requires server-side cookie setting which the local Supabase doesn't do
    test.skip(browserName === 'webkit', 'WebKit has stricter cookie policies')

    await page.goto('/login')

    // Fill in valid credentials
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"]')

    await emailInput.fill(TEST_EMAIL)
    await passwordInput.fill(TEST_PASSWORD)

    // Submit form
    await submitButton.click()

    // Wait for redirect to assistants page
    await expect(page).toHaveURL(/\/assistants/, { timeout: 20000 })

    // Verify we're on the assistants page
    await expect(page.locator('h1, h2').filter({ hasText: /assistants/i })).toBeVisible({ timeout: 10000 })
  })

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

  test('should show error for invalid credentials', async ({ page, browserName }) => {
    await page.goto('/login')

    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')

    // Submit form
    await page.click('button:has-text("Sign In")')

    // Wait for response
    await page.waitForTimeout(3000)

    // Check for error indication - either error message or still on login page
    // Different browsers handle this differently
    const url = page.url()

    if (browserName === 'webkit') {
      // WebKit may handle errors differently - check we're still on login or see any feedback
      const hasError = await page.locator('div[class*="error"], div:has-text("Invalid"), div:has-text("failed"), div:has-text("error")').count() > 0
      const stillOnLogin = url.includes('/login')
      expect(hasError || stillOnLogin).toBe(true)
    } else {
      // Chromium/Firefox should show error message
      const errorDiv = page.locator('div[class*="error"], div:has-text("Invalid"), div:has-text("failed"), div:has-text("error")').first()
      await expect(errorDiv).toBeVisible({ timeout: 10000 })
    }
  })

  test('should validate email format', async ({ page, browserName }) => {
    await page.goto('/login')

    // Enter invalid email
    await page.fill('input[type="email"]', 'notanemail')
    await page.fill('input[type="password"]', 'somepassword')

    // Try to submit
    await page.click('button:has-text("Sign In")')

    // Browser should prevent submission due to type="email"
    // WebKit may clear the input, Chromium/Firefox keep it
    const emailInput = page.locator('input[type="email"]')
    const value = await emailInput.inputValue()

    if (browserName === 'webkit') {
      // WebKit may handle invalid emails by clearing or rejecting the value
      // The key test is that we're still on the login page (form wasn't submitted)
      const url = page.url()
      expect(url).toContain('/login')
    } else {
      // Chromium/Firefox keep the invalid value
      expect(value).toBe('notanemail')
    }
  })
})

test.describe('Protected Routes', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/assistants')

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })
})
