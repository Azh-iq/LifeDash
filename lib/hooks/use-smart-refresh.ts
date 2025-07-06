'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PortfolioCacheManager } from '@/lib/cache/portfolio-cache'

interface SmartRefreshOptions {
  enabled?: boolean
  interval?: number
  staleTime?: number
  maxRetries?: number
  retryDelay?: number
  onError?: (error: Error) => void
  onSuccess?: (data: any) => void
}

/**
 * Smart refresh hook that implements intelligent caching and retry logic
 */
export function useSmartRefresh<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: SmartRefreshOptions = {}
) {
  const {
    enabled = true,
    interval = 30000,
    staleTime = 300000, // 5 minutes
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onSuccess,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)
  const [retryCount, setRetryCount] = useState(0)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Use refs to avoid circular dependencies
  const dataRef = useRef<T | null>(null)
  const lastFetchRef = useRef<number>(0)
  const retryCountRef = useRef<number>(0)

  // Update refs when state changes
  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    lastFetchRef.current = lastFetch
  }, [lastFetch])

  useEffect(() => {
    retryCountRef.current = retryCount
  }, [retryCount])

  // Stabilize callback dependencies
  const stableOnError = useCallback(
    (error: Error) => {
      onError?.(error)
    },
    [onError]
  )

  const stableOnSuccess = useCallback(
    (result: T) => {
      onSuccess?.(result)
    },
    [onSuccess]
  )

  const fetchData = useCallback(
    async (force = false) => {
      if (!enabled) return

      // Check if we have fresh cached data using refs
      const now = Date.now()
      const timeSinceLastFetch = now - lastFetchRef.current

      if (!force && timeSinceLastFetch < staleTime && dataRef.current) {
        return dataRef.current
      }

      // Check cache first
      const cached = PortfolioCacheManager.getCalculation(key, 'fetch')
      if (cached && !force) {
        setData(cached)
        return cached
      }

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Clear any pending retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }

      try {
        setLoading(true)
        setError(null)

        // Create new abort controller
        abortControllerRef.current = new AbortController()

        const result = await fetcher()

        // Cache the result
        PortfolioCacheManager.setCalculation(key, 'fetch', result, staleTime)

        setData(result)
        setLastFetch(now)
        setRetryCount(0)

        stableOnSuccess(result)

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')

        // Don't set error if request was aborted
        if (error.name === 'AbortError') {
          return
        }

        setError(error)

        // Retry logic using refs to avoid dependency issues
        if (retryCountRef.current < maxRetries) {
          setRetryCount(prev => prev + 1)

          // Use ref for timeout cleanup
          retryTimeoutRef.current = setTimeout(
            () => {
              fetchData(force)
            },
            retryDelay * Math.pow(2, retryCountRef.current)
          ) // Exponential backoff
        } else {
          stableOnError(error)
        }
      } finally {
        setLoading(false)
      }
    },
    [
      enabled,
      key,
      fetcher,
      staleTime,
      maxRetries,
      retryDelay,
      stableOnError,
      stableOnSuccess,
    ]
  )

  const refresh = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  // Set up automatic refresh
  useEffect(() => {
    if (!enabled || interval <= 0) return

    // Initial fetch
    fetchData()

    // Set up interval
    intervalRef.current = setInterval(() => {
      fetchData()
    }, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }
  }, [enabled, interval]) // Remove fetchData dependency to prevent infinite loops

  // Cleanup on unmount - ensure all resources are cleaned up
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort()
        } catch (error) {
          console.warn('Error aborting request:', error)
        }
        abortControllerRef.current = null
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }
  }, [])

  return {
    data,
    loading,
    error,
    refresh,
    isStale: lastFetch > 0 && Date.now() - lastFetch > staleTime,
    lastFetch,
    retryCount,
  }
}

/**
 * Hook for managing multiple smart refresh instances
 */
export function useMultipleSmartRefresh<T extends Record<string, any>>(
  refreshers: Record<
    keyof T,
    {
      key: string
      fetcher: () => Promise<T[keyof T]>
      options?: SmartRefreshOptions
    }
  >
) {
  const [data, setData] = useState<Partial<T>>({})
  const [loading, setLoading] = useState<Record<keyof T, boolean>>(
    {} as Record<keyof T, boolean>
  )
  const [errors, setErrors] = useState<Record<keyof T, Error | null>>(
    {} as Record<keyof T, Error | null>
  )

  // Use refs to track current state values
  const dataRef = useRef<Partial<T>>({})
  const loadingRef = useRef<Record<keyof T, boolean>>(
    {} as Record<keyof T, boolean>
  )
  const errorsRef = useRef<Record<keyof T, Error | null>>(
    {} as Record<keyof T, Error | null>
  )

  const refreshInstances = Object.entries(refreshers).map(([key, config]) => {
    const {
      data: itemData,
      loading: itemLoading,
      error: itemError,
      refresh,
    } = useSmartRefresh(config.key, config.fetcher, config.options)

    // Use a single useEffect to batch all state updates
    useEffect(() => {
      let shouldUpdate = false

      // Check if data changed
      if (dataRef.current[key] !== itemData) {
        dataRef.current = { ...dataRef.current, [key]: itemData }
        shouldUpdate = true
      }

      // Check if loading changed
      if (loadingRef.current[key] !== itemLoading) {
        loadingRef.current = { ...loadingRef.current, [key]: itemLoading }
        shouldUpdate = true
      }

      // Check if error changed
      if (errorsRef.current[key] !== itemError) {
        errorsRef.current = { ...errorsRef.current, [key]: itemError }
        shouldUpdate = true
      }

      // Batch all updates in a single setState call
      if (shouldUpdate) {
        setData(dataRef.current)
        setLoading(loadingRef.current)
        setErrors(errorsRef.current)
      }
    }, [itemData, itemLoading, itemError, key])

    return { key, refresh }
  })

  const refreshAll = useCallback(() => {
    return Promise.all(refreshInstances.map(({ refresh }) => refresh()))
  }, [refreshInstances])

  const refreshOne = useCallback(
    (key: keyof T) => {
      const instance = refreshInstances.find(r => r.key === key)
      return instance?.refresh()
    },
    [refreshInstances]
  )

  const isAnyLoading = Object.values(loading).some(Boolean)
  const hasAnyError = Object.values(errors).some(Boolean)

  return {
    data,
    loading,
    errors,
    refreshAll,
    refreshOne,
    isAnyLoading,
    hasAnyError,
  }
}

/**
 * Hook for background refresh without affecting loading states
 */
export function useBackgroundRefresh<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: SmartRefreshOptions = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [backgroundLoading, setBackgroundLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastRefresh, setLastRefresh] = useState<number>(0)

  const {
    enabled = true,
    interval = 60000, // 1 minute for background refresh
    staleTime = 300000, // 5 minutes
  } = options

  const backgroundFetch = useCallback(async () => {
    if (!enabled) return

    try {
      setBackgroundLoading(true)
      setError(null)

      const result = await fetcher()

      // Cache the result
      PortfolioCacheManager.setCalculation(key, 'background', result, staleTime)

      setData(result)
      setLastRefresh(Date.now())
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
    } finally {
      setBackgroundLoading(false)
    }
  }, [enabled, key, fetcher, staleTime])

  useEffect(() => {
    if (!enabled || interval <= 0) return

    // Initial load from cache
    const cached = PortfolioCacheManager.getCalculation(key, 'background')
    if (cached) {
      setData(cached)
    }

    // Set up background refresh
    const intervalId = setInterval(backgroundFetch, interval)

    return () => {
      clearInterval(intervalId)
    }
  }, [enabled, interval, backgroundFetch, key])

  return {
    data,
    backgroundLoading,
    error,
    lastRefresh,
    refreshNow: backgroundFetch,
  }
}

export default useSmartRefresh
