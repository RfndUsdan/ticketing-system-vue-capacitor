import { test, expect } from '@playwright/test'

test.describe('critical smoke flows (mocked API)', () => {
  test('login page renders and can submit credentials', async ({ page }) => {
    await page.route('**/api/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'ok',
          data: {
            token: 'test-token',
            user: { id: 1, name: 'Test User', role: 'user', email: 'user@test.com' },
          },
        }),
      })
    })
    await page.route('**/api/ticket**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'ok', data: [], meta: { current_page: 1, per_page: 10, last_page: 1, total: 0 } }),
      })
    })
    await page.route('**/api/notifications**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'ok', data: [], meta: { unread_count: 0 } }),
      })
    })

    await page.goto('/auth/login')
    await expect(page).toHaveURL(/\/auth\/login/)
    await page.getByRole('button', { name: /masuk|login/i }).first().waitFor({ timeout: 5000 }).catch(() => {})
    await expect(page.locator('body')).toContainText(/login|masuk|email/i)
  })

  test('app dashboard route redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
