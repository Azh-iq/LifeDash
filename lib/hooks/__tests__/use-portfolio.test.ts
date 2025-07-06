import { renderHook, act, waitFor } from '@testing-library/react'
import {
  usePortfolios,
  usePortfolio,
  useOptimisticPortfolios,
} from '../use-portfolio'
import * as portfolioActions from '@/lib/actions/portfolio/crud'
import * as supabaseClient from '@/lib/supabase/client'

// Mock the dependencies
jest.mock('@/lib/actions/portfolio/crud')
jest.mock('@/lib/supabase/client')

const mockGetUserPortfolios = jest.mocked(portfolioActions.getUserPortfolios)
const mockGetPortfolioById = jest.mocked(portfolioActions.getPortfolioById)
const mockCreateClient = jest.mocked(supabaseClient.createClient)

// Mock Supabase client
const mockSupabaseClient = {
  channel: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis(),
  removeChannel: jest.fn(),
}

describe('usePortfolios', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabaseClient as any)
  })

  test('should fetch portfolios on mount', async () => {
    const mockPortfolios = [
      {
        id: '1',
        name: 'Test Portfolio',
        description: 'A test portfolio',
        type: 'INVESTMENT' as const,
        is_public: false,
        user_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        total_value: 1000,
        total_cost: 800,
        total_gain_loss: 200,
        holdings_count: 5,
      },
    ]

    mockGetUserPortfolios.mockResolvedValue({
      success: true,
      data: mockPortfolios,
    })

    const { result } = renderHook(() => usePortfolios())

    expect(result.current.loading).toBe(true)
    expect(result.current.portfolios).toEqual([])
    expect(result.current.error).toBeNull()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.portfolios).toEqual(mockPortfolios)
    expect(result.current.error).toBeNull()
    expect(mockGetUserPortfolios).toHaveBeenCalledTimes(1)
  })

  test('should handle fetch error', async () => {
    const errorMessage = 'Failed to fetch portfolios'
    mockGetUserPortfolios.mockResolvedValue({
      success: false,
      error: errorMessage,
    })

    const { result } = renderHook(() => usePortfolios())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.portfolios).toEqual([])
    expect(result.current.error).toBe(errorMessage)
  })

  test('should handle unexpected error', async () => {
    mockGetUserPortfolios.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => usePortfolios())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.portfolios).toEqual([])
    expect(result.current.error).toBe('An unexpected error occurred')
  })

  test('should refresh portfolios', async () => {
    const mockPortfolios = [
      {
        id: '1',
        name: 'Test Portfolio',
        description: 'A test portfolio',
        type: 'INVESTMENT' as const,
        is_public: false,
        user_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        total_value: 1000,
        total_cost: 800,
        total_gain_loss: 200,
        holdings_count: 5,
      },
    ]

    mockGetUserPortfolios.mockResolvedValue({
      success: true,
      data: mockPortfolios,
    })

    const { result } = renderHook(() => usePortfolios())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Call refresh
    await act(async () => {
      await result.current.refresh()
    })

    expect(mockGetUserPortfolios).toHaveBeenCalledTimes(2)
  })

  test('should set up real-time subscriptions', () => {
    renderHook(() => usePortfolios())

    expect(mockSupabaseClient.channel).toHaveBeenCalledWith('portfolios')
    expect(mockSupabaseClient.channel).toHaveBeenCalledWith('holdings')
    expect(mockSupabaseClient.channel).toHaveBeenCalledWith('stocks')
    expect(mockSupabaseClient.subscribe).toHaveBeenCalledTimes(3)
  })
})

describe('usePortfolio', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabaseClient as any)
  })

  test('should fetch single portfolio', async () => {
    const mockPortfolio = {
      id: '1',
      name: 'Test Portfolio',
      description: 'A test portfolio',
      type: 'INVESTMENT' as const,
      is_public: false,
      user_id: 'user-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      total_value: 1000,
      total_cost: 800,
      total_gain_loss: 200,
      holdings_count: 5,
    }

    mockGetPortfolioById.mockResolvedValue({
      success: true,
      data: mockPortfolio,
    })

    const { result } = renderHook(() => usePortfolio('1'))

    expect(result.current.loading).toBe(true)
    expect(result.current.portfolio).toBeNull()
    expect(result.current.error).toBeNull()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.portfolio).toEqual(mockPortfolio)
    expect(result.current.error).toBeNull()
    expect(mockGetPortfolioById).toHaveBeenCalledWith('1')
  })

  test('should handle empty portfolio ID', () => {
    const { result } = renderHook(() => usePortfolio(''))

    expect(result.current.loading).toBe(true)
    expect(result.current.portfolio).toBeNull()
    expect(result.current.error).toBeNull()
    expect(mockGetPortfolioById).not.toHaveBeenCalled()
  })

  test('should handle fetch error', async () => {
    const errorMessage = 'Portfolio not found'
    mockGetPortfolioById.mockResolvedValue({
      success: false,
      error: errorMessage,
    })

    const { result } = renderHook(() => usePortfolio('1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.portfolio).toBeNull()
    expect(result.current.error).toBe(errorMessage)
  })
})

describe('useOptimisticPortfolios', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabaseClient as any)
  })

  test('should add optimistic portfolio', async () => {
    const mockPortfolios = [
      {
        id: '1',
        name: 'Existing Portfolio',
        description: 'An existing portfolio',
        type: 'INVESTMENT' as const,
        is_public: false,
        user_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        total_value: 1000,
        total_cost: 800,
        total_gain_loss: 200,
        holdings_count: 5,
      },
    ]

    mockGetUserPortfolios.mockResolvedValue({
      success: true,
      data: mockPortfolios,
    })

    const { result } = renderHook(() => useOptimisticPortfolios())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.addOptimisticPortfolio({
        name: 'New Portfolio',
        description: 'A new portfolio',
        type: 'TRADING',
      })
    })

    expect(result.current.portfolios).toHaveLength(2)
    expect(result.current.portfolios[0].name).toBe('New Portfolio')
    expect(result.current.portfolios[0].id).toMatch(/^temp_/)
  })

  test('should update optimistic portfolio', async () => {
    const mockPortfolios = [
      {
        id: '1',
        name: 'Test Portfolio',
        description: 'A test portfolio',
        type: 'INVESTMENT' as const,
        is_public: false,
        user_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        total_value: 1000,
        total_cost: 800,
        total_gain_loss: 200,
        holdings_count: 5,
      },
    ]

    mockGetUserPortfolios.mockResolvedValue({
      success: true,
      data: mockPortfolios,
    })

    const { result } = renderHook(() => useOptimisticPortfolios())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.updateOptimisticPortfolio('1', {
        name: 'Updated Portfolio',
        total_value: 1500,
      })
    })

    expect(result.current.portfolios[0].name).toBe('Updated Portfolio')
    expect(result.current.portfolios[0].total_value).toBe(1500)
  })

  test('should remove optimistic portfolio', async () => {
    const mockPortfolios = [
      {
        id: '1',
        name: 'Test Portfolio',
        description: 'A test portfolio',
        type: 'INVESTMENT' as const,
        is_public: false,
        user_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        total_value: 1000,
        total_cost: 800,
        total_gain_loss: 200,
        holdings_count: 5,
      },
    ]

    mockGetUserPortfolios.mockResolvedValue({
      success: true,
      data: mockPortfolios,
    })

    const { result } = renderHook(() => useOptimisticPortfolios())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.portfolios).toHaveLength(1)

    act(() => {
      result.current.removeOptimisticPortfolio('1')
    })

    expect(result.current.portfolios).toHaveLength(0)
  })
})
