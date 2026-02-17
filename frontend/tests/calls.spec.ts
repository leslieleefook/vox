import { test, expect } from './fixtures'

const BASE_URL = 'http://localhost:3000'

test.describe('Calls Page', () => {
  test('should display calls table', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/calls')

    // Check for page header
    await expect(authenticatedPage.locator('h1:has-text("Call Logs")')).toBeVisible()

    // Check for table headers - actual headers: Time, Phone, Caller, Duration, Latency, Status
    await expect(authenticatedPage.locator('th:has-text("Time")')).toBeVisible()
    await expect(authenticatedPage.locator('th:has-text("Phone")')).toBeVisible()
    await expect(authenticatedPage.locator('th:has-text("Caller")')).toBeVisible()
    await expect(authenticatedPage.locator('th:has-text("Duration")')).toBeVisible()
    await expect(authenticatedPage.locator('th:has-text("Latency")')).toBeVisible()
    await expect(authenticatedPage.locator('th:has-text("Status")')).toBeVisible()
  })

  test('should filter calls by search', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/calls')

    // Type in search
    await authenticatedPage.fill('input[placeholder*="Search"]', '+1868')

    // Wait for filtering
    await authenticatedPage.waitForTimeout(500)

    // Check that results contain the search term (if any exist)
    const rows = authenticatedPage.locator('tbody tr')
    const count = await rows.count()

    if (count > 0) {
      const firstRow = rows.first()
      const text = await firstRow.textContent()
      expect(text).toContain('+1868')
    }
  })

  test('should show empty state when no calls', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/calls')

    // Type search that won't match
    await authenticatedPage.fill('input[placeholder*="Search"]', 'xyznonexistent123')

    // Check for empty state
    await expect(authenticatedPage.locator('text=No calls found')).toBeVisible()
  })
})
