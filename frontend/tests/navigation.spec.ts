import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'
const API_URL = 'http://localhost:8000'

test.describe('Navigation and Links', () => {
  test('should load homepage and redirect to login (unauthenticated)', async ({ page }) => {
    await page.goto(BASE_URL)
    // Homepage redirects to /login when not authenticated
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should load login page', async ({ page }) => {
    await page.goto(BASE_URL + '/login')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('h1')).toContainText('Vox')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('should redirect to login when accessing assistants page (unauthenticated)', async ({ page }) => {
    await page.goto(BASE_URL + '/assistants')
    // Should redirect to login with redirect param
    await expect(page).toHaveURL(/\/login\?redirect=%2Fassistants/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should redirect to login when accessing calls page (unauthenticated)', async ({ page }) => {
    await page.goto(BASE_URL + '/calls')
    // Should redirect to login with redirect param
    await expect(page).toHaveURL(/\/login\?redirect=%2Fcalls/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should have working navigation links from login', async ({ page }) => {
    await page.goto(BASE_URL + '/login')

    // Check Vox branding is visible
    await expect(page.locator('text=Vox')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })
})

test.describe('API Health Check', () => {
  test('should return healthy status from API', async ({ page }) => {
    const response = await page.request.get(`${API_URL}/api/v1/health`)
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data.status).toBe('healthy')
    expect(data.database).toBe('healthy')
    expect(data.redis).toBe('healthy')
  })

  test('should access API docs', async ({ page }) => {
    const response = await page.request.get(`${API_URL}/docs`)
    expect(response.ok()).toBeTruthy()
  })
})
