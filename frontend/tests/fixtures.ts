import { test as base, Page, BrowserContext } from '@playwright/test'

/**
 * Mock Supabase authentication for E2E tests
 */

// Generate a mock JWT-like token
function generateMockToken(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'test-user-id',
      email: 'test@example.com',
      role: 'authenticated',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    })
  ).toString('base64url')
  const signature = Buffer.from('mock-signature').toString('base64url')
  return `${header}.${payload}.${signature}`
}

const MOCK_ACCESS_TOKEN = generateMockToken()
const MOCK_REFRESH_TOKEN = 'mock-refresh-token'

// Session data to store in cookies
const mockSessionData = {
  access_token: MOCK_ACCESS_TOKEN,
  refresh_token: MOCK_REFRESH_TOKEN,
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'authenticated',
  },
}

/**
 * Set auth cookies on the context
 */
async function setAuthCookies(context: BrowserContext) {
  await context.addCookies([
    {
      name: 'sb-xxx-auth-token',
      value: encodeURIComponent(JSON.stringify(mockSessionData)),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: 'sb-access-token',
      value: MOCK_ACCESS_TOKEN,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: 'sb-refresh-token',
      value: MOCK_REFRESH_TOKEN,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ])
}

// Extend the base test with authenticated context
export const test = base.extend<{
  authenticatedPage: Page
}>({
  authenticatedPage: async ({ browser }, use) => {
    // Create a new context with auth cookies
    const context = await browser.newContext()

    // Set auth cookies before any page is created
    await setAuthCookies(context)

    // Add init script for localStorage
    await context.addInitScript(() => {
      const sessionData = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          role: 'authenticated',
        },
      }
      localStorage.setItem('sb-xxx-auth-token', JSON.stringify(sessionData))
    })

    const page = await context.newPage()

    await use(page)

    await context.close()
  },
})

export { expect } from '@playwright/test'

// Export helper for manual use
export async function mockLogin(page: Page) {
  await setAuthCookies(page.context())
}
