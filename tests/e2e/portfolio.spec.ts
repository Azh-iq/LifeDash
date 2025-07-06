import { test, expect } from '@playwright/test'

test.describe('Portfolio Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/auth/v1/user', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user-id',
          email: 'test@example.com',
        }),
      })
    })

    // Mock portfolio data
    await page.route('**/rest/v1/portfolios*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            name: 'Test Portfolio',
            description: 'My test portfolio',
            user_id: 'test-user-id',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ]),
      })
    })

    // Mock holdings data
    await page.route('**/rest/v1/holdings*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            portfolio_id: '1',
            stock_id: '1',
            quantity: 10,
            average_price: 140.0,
            current_price: 150.0,
            currency: 'USD',
            stock: {
              symbol: 'AAPL',
              name: 'Apple Inc.',
              current_price: 150.0,
            },
          },
        ]),
      })
    })

    await page.goto('/dashboard')
  })

  test('should display portfolio dashboard', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /portfolio/i })
    ).toBeVisible()
    await expect(page.getByText(/test portfolio/i)).toBeVisible()
  })

  test('should display holdings table', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByText(/aapl/i)).toBeVisible()
    await expect(page.getByText(/apple inc/i)).toBeVisible()
    await expect(page.getByText(/10/)).toBeVisible() // quantity
  })

  test('should allow adding new stock', async ({ page }) => {
    await page.getByRole('button', { name: /add stock/i }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByLabelText(/symbol/i)).toBeVisible()
    await expect(page.getByLabelText(/quantity/i)).toBeVisible()
  })

  test('should calculate portfolio metrics', async ({ page }) => {
    // Check for portfolio value display
    await expect(page.getByText(/total value/i)).toBeVisible()
    await expect(page.getByText(/day change/i)).toBeVisible()
    await expect(page.getByText(/total return/i)).toBeVisible()
  })

  test('should display performance chart', async ({ page }) => {
    await expect(
      page.locator('[data-testid="performance-chart"]')
    ).toBeVisible()
  })

  test('should filter holdings by search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search holdings/i)
    await searchInput.fill('AAPL')

    await expect(page.getByText(/apple inc/i)).toBeVisible()

    await searchInput.fill('GOOGL')
    await expect(page.getByText(/apple inc/i)).not.toBeVisible()
  })

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Should show mobile-optimized layout
    await expect(page.getByTestId('mobile-portfolio-view')).toBeVisible()

    // Should have mobile-friendly navigation
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible()
  })
})
