import { rest } from 'msw'

export const handlers = [
  // Mock Supabase API endpoints
  rest.get('*/rest/v1/portfolios', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: '1',
          name: 'Test Portfolio',
          description: 'A test portfolio',
          user_id: 'test-user-id',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ])
    )
  }),

  rest.get('*/rest/v1/stocks', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: '1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          current_price: 150.0,
          currency: 'USD',
          market: 'NASDAQ',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          symbol: 'GOOGL',
          name: 'Alphabet Inc.',
          current_price: 2500.0,
          currency: 'USD',
          market: 'NASDAQ',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ])
    )
  }),

  rest.get('*/rest/v1/holdings', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: '1',
          portfolio_id: '1',
          stock_id: '1',
          quantity: 10,
          average_price: 140.0,
          currency: 'USD',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ])
    )
  }),

  rest.get('*/rest/v1/platforms', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: '1',
          name: 'Nordnet',
          type: 'broker',
          country: 'NO',
          supports_api: false,
          supports_csv: true,
          csv_format: 'nordnet',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ])
    )
  }),

  // Mock Yahoo Finance API
  rest.get('*/finance/quote', (req, res, ctx) => {
    const symbol = req.url.searchParams.get('symbol')
    return res(
      ctx.json({
        quoteResponse: {
          result: [
            {
              symbol: symbol || 'AAPL',
              regularMarketPrice: 150.0,
              regularMarketChange: 2.5,
              regularMarketChangePercent: 1.69,
              currency: 'USD',
            },
          ],
        },
      })
    )
  }),

  // Mock authentication endpoints
  rest.post('*/auth/v1/token', (req, res, ctx) => {
    return res(
      ctx.json({
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          created_at: '2024-01-01T00:00:00Z',
        },
      })
    )
  }),

  rest.get('*/auth/v1/user', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      })
    )
  }),

  // Fallback handler for unhandled requests
  rest.all('*', (req, res, ctx) => {
    console.warn(`Unhandled ${req.method} request to ${req.url}`)
    return res(ctx.status(404), ctx.json({ message: 'Not found' }))
  }),
]