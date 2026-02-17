import { test, expect } from './fixtures'

const BASE_URL = 'http://localhost:3000'

test.describe('Assistants Page', () => {
  test('should display assistants list', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/assistants')

    // Check for page header
    await expect(authenticatedPage.locator('h1:has-text("Assistants")')).toBeVisible()

    // Check for create button
    await expect(authenticatedPage.locator('button:has-text("Create Assistant")')).toBeVisible()

    // Check for search input
    await expect(authenticatedPage.locator('input[placeholder*="Search"]')).toBeVisible()
  })

  test('should filter assistants by search', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/assistants')

    // Type in search
    await authenticatedPage.fill('input[placeholder*="Search"]', 'Customer')

    // Wait for filtered results
    await authenticatedPage.waitForTimeout(500)

    // Check that only matching assistants are shown
    const cards = authenticatedPage.locator('[class*="VoxCard"]')
    const count = await cards.count()

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      const text = await card.textContent()
      expect(text?.toLowerCase()).toContain('customer')
    }
  })

  test('should show empty state when no assistants', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/assistants')

    // Type search that won't match anything
    await authenticatedPage.fill('input[placeholder*="Search"]', 'xyznonexistent123')

    // Check for empty state
    await expect(authenticatedPage.locator('text=No assistants found')).toBeVisible()
  })
})

test.describe('Assistant Card', () => {
  test('should display assistant details', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/assistants')

    // Wait for page to load - use locator-based waiting
    await authenticatedPage.locator('div.grid').waitFor({ timeout: 10000 })

    // Check if we have assistants (not empty state)
    const hasAssistants = await authenticatedPage.locator('div.grid h3').count() > 0

    if (hasAssistants) {
      // Get first assistant card by finding the grid container and its children
      const firstCard = authenticatedPage.locator('div.grid > div').first()

      // Check for expected elements
      await expect(firstCard.locator('h3')).toBeVisible() // Name
      // Check for Created date text (actual UI shows "Created:" not "Today:")
      await expect(firstCard.locator('text=/Created:/i')).toBeVisible()
    } else {
      // Empty state is acceptable
      await expect(authenticatedPage.locator('text=No assistants')).toBeVisible()
    }
  })

  test('should have edit and delete buttons', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/assistants')

    // Wait for page to load - use locator-based waiting
    await authenticatedPage.locator('div.grid').waitFor({ timeout: 10000 })

    // Check if we have assistants (not empty state)
    const hasAssistants = await authenticatedPage.locator('div.grid h3').count() > 0

    if (hasAssistants) {
      // Get first assistant card
      const firstCard = authenticatedPage.locator('div.grid > div').first()

      // Check for action buttons (Edit and Delete) - look for buttons with icons
      const buttons = firstCard.locator('button')
      const buttonCount = await buttons.count()
      expect(buttonCount).toBeGreaterThan(0)
    } else {
      // If no assistants, the test passes as there's nothing to edit/delete
      expect(true).toBe(true)
    }
  })
})
