import { test, expect } from '@playwright/test'

// Note: These tests require authentication
// In CI, you would set up a test user and authenticate first

test.describe('Assistants Page', () => {
  test.skip('should display assistants list', async ({ page }) => {
    // This test is skipped because it requires authentication
    // To enable, add authentication setup

    await page.goto('/assistants')

    // Check for page header
    await expect(page.locator('h1:has-text("Assistants")')).toBeVisible()

    // Check for create button
    await expect(page.locator('button:has-text("Create Assistant")')).toBeVisible()

    // Check for search input
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()
  })

  test.skip('should filter assistants by search', async ({ page }) => {
    await page.goto('/assistants')

    // Type in search
    await page.fill('input[placeholder*="Search"]', 'Customer')

    // Wait for filtered results
    await page.waitForTimeout(500)

    // Check that only matching assistants are shown
    const cards = page.locator('[class*="VoxCard"]')
    const count = await cards.count()

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      const text = await card.textContent()
      expect(text?.toLowerCase()).toContain('customer')
    }
  })

  test.skip('should show empty state when no assistants', async ({ page }) => {
    await page.goto('/assistants')

    // Type search that won't match anything
    await page.fill('input[placeholder*="Search"]', 'xyznonexistent123')

    // Check for empty state
    await expect(page.locator('text=No assistants found')).toBeVisible()
  })
})

test.describe('Assistant Card', () => {
  test.skip('should display assistant details', async ({ page }) => {
    await page.goto('/assistants')

    // Get first assistant card
    const firstCard = page.locator('[class*="VoxCard"]').first()

    // Check for expected elements
    await expect(firstCard.locator('h3')).toBeVisible() // Name
    await expect(firstCard.locator('text=/Today:|calls/')).toBeVisible() // Call count
  })

  test.skip('should have edit and delete buttons', async ({ page }) => {
    await page.goto('/assistants')

    const firstCard = page.locator('[class*="VoxCard"]').first()

    // Check for action buttons
    const editButton = firstCard.locator('button').filter({ hasText: '' }).first()
    await expect(editButton).toBeVisible()
  })
})
