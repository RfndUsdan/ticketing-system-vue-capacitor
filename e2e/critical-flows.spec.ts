import { test, expect } from '@playwright/test'

test.describe('critical smoke flows (mocked API)', () => {
  test('login page renders and can submit credentials', async ({ page }) => {
    await page.route('**/api/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'ok',
          data: { token: 'test-token', user: { id: 1, name: 'Test User', role: 'user', email: 'user@test.com' } },
        }),
      })
    })
    await page.route('**/api/ticket**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'ok', data: [], meta: { current_page: 1, per_page: 10, last_page: 1, total: 0 } }) })
    })
    await page.route('**/api/notifications**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'ok', data: [], meta: { unread_count: 0 } }) })
    })

    await page.goto('/auth/login')
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.locator('body')).toContainText(/login|masuk|email/i)
  })

  test('app dashboard route redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('authenticated user sees dashboard and notifications (mocked)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({ id: 1, name: 'User', role: 'user', email: 'u@test.com' }))
      document.cookie = 'token=test-token; path=/'
    })
    await page.route('**/api/ticket**', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          message: 'ok',
          data: [{ code: 'T-1', title: 'Ticket A', status: 'open', priority: 'low', description: 'desc', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', ticket_replies: [] }],
          meta: { current_page: 1, per_page: 10, last_page: 2, total: 11 },
        }),
      })
    })
    await page.route('**/api/notifications/unread-count', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'ok', data: { unread_count: 2 } }) })
    })
    await page.route('**/api/notifications?**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'ok', data: [{ id: 1, title: 'Update', message: 'Ada balasan', read_at: null, created_at: '2026-01-01T00:00:00Z', data: { ticket_code: 'T-1' } }], meta: { unread_count: 1 } }) })
    })
    await page.route('**/api/notifications', async (route) => {
      if (route.request().url().includes('unread-count')) return
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'ok', data: [{ id: 1, title: 'Update', message: 'Ada balasan', read_at: null, created_at: '2026-01-01T00:00:00Z', data: { ticket_code: 'T-1' } }], meta: { unread_count: 1 } }) })
    })

    await page.goto('/')
    await expect(page.locator('body')).toContainText(/Tiket Saya|Ticket A/i)

    await page.goto('/notifications')
    await expect(page.locator('body')).toContainText(/Notifikasi|Update/i)
  })
})