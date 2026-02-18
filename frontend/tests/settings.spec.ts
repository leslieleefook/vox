import { test, expect } from './fixtures'

const BASE_URL = 'http://localhost:3000'

test.describe('Settings Page', () => {
  test('should display settings page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/settings')

    // Check for page header
    await expect(authenticatedPage.locator('h1:has-text("Settings")')).toBeVisible()

    // Check for description
    await expect(authenticatedPage.locator('text=Manage your account and preferences')).toBeVisible()
  })

  test('should display profile section', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/settings')

    // Check for profile header
    await expect(authenticatedPage.locator('h2:has-text("Profile")')).toBeVisible()

    // Check for email field (use label selector to avoid matching "Email & push alerts")
    await expect(authenticatedPage.locator('label:has-text("Email")')).toBeVisible()

    // Check for display name field
    await expect(authenticatedPage.locator('label:has-text("Display Name")')).toBeVisible()

    // Check for save button
    await expect(authenticatedPage.locator('button:has-text("Save Changes")')).toBeVisible()
  })

  test('should display quick settings section', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/settings')

    // Check for quick settings header
    await expect(authenticatedPage.locator('h2:has-text("Quick Settings")')).toBeVisible()

    // Check for settings options
    await expect(authenticatedPage.locator('text=Notifications')).toBeVisible()
    await expect(authenticatedPage.locator('text=Security')).toBeVisible()
    await expect(authenticatedPage.locator('text=Appearance')).toBeVisible()
  })

  test('should display danger zone', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/settings')

    // Check for danger zone header
    await expect(authenticatedPage.locator('h2:has-text("Danger Zone")')).toBeVisible()

    // Check for delete account button
    await expect(authenticatedPage.locator('button:has-text("Delete Account")')).toBeVisible()
  })

})
