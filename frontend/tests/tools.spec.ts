import { test, expect } from './fixtures'

const BASE_URL = 'http://localhost:3000'

test.describe('Tools Page', () => {
  test('should display tools page header', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/tools')

    await expect(authenticatedPage.locator('h1:has-text("Tools")')).toBeVisible()
    await expect(authenticatedPage.getByText('Configure external tools/APIs')).toBeVisible()
  })

  test('should display create tool button', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/tools')

    await expect(authenticatedPage.getByRole('link', { name: /create tool/i })).toBeVisible()
  })

  test('should display tools grid or empty state', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/tools')

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle')

    // Either empty state or tools should be visible
    const emptyState = authenticatedPage.getByText('No tools configured')
    const toolsGrid = authenticatedPage.locator('div.grid')

    const hasEmptyState = await emptyState.isVisible().catch(() => false)
    const hasTools = (await toolsGrid.count()) > 0

    expect(hasEmptyState || hasTools).toBeTruthy()
  })

  test('should navigate to new tool page on create click', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/tools')

    await authenticatedPage.getByRole('link', { name: /create tool/i }).click()
    await expect(authenticatedPage).toHaveURL(/\/tools\/new/)
    await expect(authenticatedPage.getByText('New Tool')).toBeVisible()
  })
})

test.describe('Tool Editor Page', () => {
  test('should display new tool editor', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/tools/new')

    // Check for back link
    await expect(authenticatedPage.getByRole('link', { name: /back to tools/i })).toBeVisible()

    // Check for tool settings section
    await expect(authenticatedPage.getByLabel(/tool name/i)).toBeVisible()

    // Check for save button
    await expect(authenticatedPage.getByRole('button', { name: /save/i })).toBeVisible()
  })

  test('should validate tool name', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/tools/new')

    const nameInput = authenticatedPage.getByLabel(/tool name/i)

    // Enter invalid name with spaces
    await nameInput.fill('invalid tool name')
    await nameInput.blur()

    // Should show validation error
    await expect(authenticatedPage.getByText(/can only contain letters/i)).toBeVisible()
  })

  test('should accept valid tool name', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/tools/new')

    const nameInput = authenticatedPage.getByLabel(/tool name/i)

    // Enter valid name
    await nameInput.fill('get_weather_data')
    await nameInput.blur()

    // Should not show validation error
    await expect(authenticatedPage.getByText(/can only contain letters/i)).not.toBeVisible()
  })

  test('should expand server settings accordion', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/tools/new')

    // Server settings accordion should be expandable
    await authenticatedPage.getByRole('button', { name: /server settings/i }).click()
    await expect(authenticatedPage.getByLabel(/server url/i)).toBeVisible()
  })
})
