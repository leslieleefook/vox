import { test, expect } from './fixtures'

const BASE_URL = 'http://localhost:3000'

test.describe('Analytics Page', () => {
  test('should display analytics page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/analytics')

    // Check for page header
    await expect(authenticatedPage.locator('h1:has-text("Analytics")')).toBeVisible()

    // Check for description
    await expect(authenticatedPage.locator('text=View call metrics and performance insights')).toBeVisible()
  })

  test('should display stats cards', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/analytics')

    // Check for stat labels
    await expect(authenticatedPage.locator('text=Total Calls')).toBeVisible()
    await expect(authenticatedPage.locator('text=Avg. Duration')).toBeVisible()
    await expect(authenticatedPage.locator('text=Success Rate')).toBeVisible()
  })

  test('should display chart placeholder', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/analytics')

    // Check for chart section header
    await expect(authenticatedPage.locator('h2:has-text("Call Volume")')).toBeVisible()

    // Check for placeholder message
    await expect(authenticatedPage.locator('text=Analytics dashboard coming soon')).toBeVisible()
  })

})
