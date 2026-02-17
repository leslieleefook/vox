import { Page, BrowserContext } from '@playwright/test'

/**
 * Mock Supabase authentication for E2E tests
 * Sets cookies that the Supabase auth-helpers middleware will recognize
 */

// Generate a base64-like token (simplified JWT format)
function generateMockToken(): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({
      sub: 'test-user-id',
      email: 'test@example.com',
      role: 'authenticated',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    })
  )
  const signature = btoa('mock-signature')
  return `${header}.${payload}.${signature}`
}

const MOCK_ACCESS_TOKEN = generateMockToken()
const MOCK_REFRESH_TOKEN = 'mock-refresh-token-' + Date.now()

/**
 * Set up mock authentication by setting Supabase cookies
 * This bypasses the actual Supabase authentication
 */
export async function mockLogin(page: Page) {
  const context = page.context()

  // Supabase auth-helpers uses cookies in this format
  // The cookie name is based on the project ref from SUPABASE_URL
  // For placeholder URL https://xxx.supabase.co, the ref is 'xxx'

  // Set the auth cookies that Supabase middleware expects
  await context.addCookies([
    {
      name: 'sb-xxx-auth-token',
      value: encodeURIComponent(
        JSON.stringify({
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
        })
      ),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
    // Also set individual token cookies (some Supabase versions use these)
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

/**
 * Alternative: Mock using localStorage (for client-side Supabase client)
 * Call this before navigating to the page
 */
export async function mockLocalStorageAuth(context: BrowserContext) {
  // Add a script that will set localStorage when the page loads
  await context.addInitScript(() => {
    const mockSession = {
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

    // Set in localStorage with the key Supabase expects
    // The key format is: sb-{projectRef}-auth-token
    localStorage.setItem('sb-xxx-auth-token', JSON.stringify(mockSession))
  })
}

/**
 * Complete mock setup - use both cookies and localStorage
 */
export async function setupMockAuth(page: Page) {
  // Set cookies for server-side middleware
  await mockLogin(page)

  // Also set localStorage for client-side
  await page.context().addInitScript(() => {
    const mockSession = {
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
    localStorage.setItem('sb-xxx-auth-token', JSON.stringify(mockSession))
  })
}
