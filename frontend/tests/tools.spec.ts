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

test.describe('Tool Test Feature', () => {
  test('test button should be disabled for new unsaved tool', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/tools/new')

    const testButton = authenticatedPage.getByRole('button', { name: /^test$/i })
    await expect(testButton).toBeDisabled()
  })

  test('test button should have tooltip for new tool', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/tools/new')

    const testButton = authenticatedPage.getByRole('button', { name: /^test$/i })

    // Check the title attribute for tooltip
    const title = await testButton.getAttribute('title')
    expect(title).toContain('Save tool before testing')
  })

  test('should show test modal when test button is clicked on saved tool', async ({ authenticatedPage }) => {
    // First, create a tool
    await authenticatedPage.goto(BASE_URL + '/tools/new')

    // Fill in required fields
    await authenticatedPage.getByLabel(/tool name/i).fill('test_tool_for_testing')
    await authenticatedPage.getByLabel(/description/i).fill('Tool for testing the test feature')

    // Expand server settings and fill URL
    await authenticatedPage.getByRole('button', { name: /server settings/i }).click()
    await authenticatedPage.getByLabel(/server url/i).fill('https://httpbin.org/post')

    // Save the tool
    await authenticatedPage.getByRole('button', { name: /save/i }).click()

    // Wait for navigation to the saved tool page
    await authenticatedPage.waitForURL(/\/tools\/[a-f0-9-]+/)

    // Test button should now be enabled
    const testButton = authenticatedPage.getByRole('button', { name: /^test$/i })
    await expect(testButton).toBeEnabled()

    // Click the test button
    await testButton.click()

    // Modal should appear
    await expect(authenticatedPage.getByRole('dialog')).toBeVisible()
    await expect(authenticatedPage.getByText(/test tool: test_tool_for_testing/i)).toBeVisible()
  })

  test('test modal should have parameters input and run test button', async ({ authenticatedPage }) => {
    // Create a tool first
    await authenticatedPage.goto(BASE_URL + '/tools/new')
    await authenticatedPage.getByLabel(/tool name/i).fill('modal_test_tool')
    await authenticatedPage.getByRole('button', { name: /server settings/i }).click()
    await authenticatedPage.getByLabel(/server url/i).fill('https://httpbin.org/post')
    await authenticatedPage.getByRole('button', { name: /save/i }).click()
    await authenticatedPage.waitForURL(/\/tools\/[a-f0-9-]+/)

    // Open test modal
    await authenticatedPage.getByRole('button', { name: /^test$/i }).click()
    await expect(authenticatedPage.getByRole('dialog')).toBeVisible()

    // Check for parameters input
    await expect(authenticatedPage.getByLabel(/test parameters/i)).toBeVisible()

    // Check for run test button in dialog
    await expect(authenticatedPage.getByRole('button', { name: /run test/i })).toBeVisible()

    // Check for cancel button
    await expect(authenticatedPage.getByRole('button', { name: /cancel/i })).toBeVisible()
  })

  test('test modal should close on cancel', async ({ authenticatedPage }) => {
    // Create a tool first
    await authenticatedPage.goto(BASE_URL + '/tools/new')
    await authenticatedPage.getByLabel(/tool name/i).fill('close_modal_test')
    await authenticatedPage.getByRole('button', { name: /server settings/i }).click()
    await authenticatedPage.getByLabel(/server url/i).fill('https://httpbin.org/post')
    await authenticatedPage.getByRole('button', { name: /save/i }).click()
    await authenticatedPage.waitForURL(/\/tools\/[a-f0-9-]+/)

    // Open test modal
    await authenticatedPage.getByRole('button', { name: /^test$/i }).click()
    await expect(authenticatedPage.getByRole('dialog')).toBeVisible()

    // Click cancel
    await authenticatedPage.getByRole('button', { name: /cancel/i }).click()

    // Modal should close
    await expect(authenticatedPage.getByRole('dialog')).not.toBeVisible()
  })

  test('test modal should close on X button', async ({ authenticatedPage }) => {
    // Create a tool first
    await authenticatedPage.goto(BASE_URL + '/tools/new')
    await authenticatedPage.getByLabel(/tool name/i).fill('x_close_test')
    await authenticatedPage.getByRole('button', { name: /server settings/i }).click()
    await authenticatedPage.getByLabel(/server url/i).fill('https://httpbin.org/post')
    await authenticatedPage.getByRole('button', { name: /save/i }).click()
    await authenticatedPage.waitForURL(/\/tools\/[a-f0-9-]+/)

    // Open test modal
    await authenticatedPage.getByRole('button', { name: /^test$/i }).click()
    await expect(authenticatedPage.getByRole('dialog')).toBeVisible()

    // Click close X button (in the dialog header)
    const dialog = authenticatedPage.getByRole('dialog')
    await dialog.locator('button').first().click()

    // Modal should close
    await expect(authenticatedPage.getByRole('dialog')).not.toBeVisible()
  })
})
