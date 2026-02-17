import { test, expect } from '@playwright/test'

test.describe('Calls Page', () => {
  test.skip('should display calls table', async ({ page }) => {
    await page.goto('/calls')

    // Check for page header
    await expect(page.locator('h1:has-text("Call Logs")')).toBeVisible()

    // Check for table headers
    await expect(page.locator('th:has-text("Time")')).toBeVisible()
    await expect(page.locator('th:has-text("Phone")')).toBeVisible()
    await expect(page.locator('th:has-text("Assistant")')).toBeVisible()
    await expect(page.locator('th:has-text("Status")')).toBeVisible()
  })

  test.skip('should filter calls by search', async ({ page }) => {
    await page.goto('/calls')

    // Type in search
    await page.fill('input[placeholder*="Search"]', '+1868')

    // Wait for filtering
    await page.waitForTimeout(500)

    // Check that results contain the search term
    const rows = page.locator('tbody tr')
    const count = await rows.count()

    if (count > 0) {
      const firstRow = rows.first()
      const text = await firstRow.textContent()
      expect(text).toContain('+1868')
    }
  })

  test.skip('should show empty state when no calls', async ({ page }) => {
    await page.goto('/calls')

    // Type search that won't match
    await page.fill('input[placeholder*="Search"]', 'xyznonexistent123')

    // Check for empty state
    await expect(page.locator('text=No calls found')).toBeVisible()
  })
})
