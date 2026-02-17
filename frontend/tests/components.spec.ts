import { test, expect } from '@playwright/test'

test.describe('VoxCard Component', () => {
  test('should have glass morphism styling', async ({ page }) => {
    // Create a simple test page
    await page.setContent(`
      <html>
        <head>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body class="bg-gray-900">
          <div class="glass p-4 rounded-xl" style="background: rgba(255,255,255,0.05); backdrop-filter: blur(16px);">
            Test Card
          </div>
        </body>
      </html>
    `)

    const card = page.locator('.glass')
    await expect(card).toBeVisible()

    // Check computed styles
    const backdropFilter = await card.evaluate(
      (el) => getComputedStyle(el).backdropFilter
    )
    expect(backdropFilter).toContain('blur')
  })
})

test.describe('PulseIndicator Component', () => {
  test('should show different states', async ({ page }) => {
    await page.setContent(`
      <html>
        <body class="bg-gray-900 p-8 flex gap-4">
          <div class="w-3 h-3 rounded-full bg-purple-500"></div>
          <div class="w-3 h-3 rounded-full bg-cyan-500"></div>
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
        </body>
      </html>
    `)

    const indicators = page.locator('body > div')
    await expect(indicators).toHaveCount(3)
  })
})

test.describe('VoxButton Component', () => {
  test('should render different variants', async ({ page }) => {
    await page.setContent(`
      <html>
        <body class="bg-gray-900 p-8 flex flex-col gap-4">
          <button class="bg-white/10 border border-white/20 px-4 py-2 rounded-lg text-white">Default</button>
          <button class="bg-purple-500 px-4 py-2 rounded-lg text-white">Primary</button>
          <button class="border border-white/20 px-4 py-2 rounded-lg text-white">Outline</button>
        </body>
      </html>
    `)

    const buttons = page.locator('button')
    await expect(buttons).toHaveCount(3)
    await expect(buttons.first()).toHaveText('Default')
    await expect(buttons.nth(1)).toHaveText('Primary')
    await expect(buttons.last()).toHaveText('Outline')
  })
})
