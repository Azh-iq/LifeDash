'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

export interface ResponsiveLayoutState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  breakpoint: Breakpoint
  width: number
  height: number
  orientation: 'portrait' | 'landscape'
  isTouch: boolean
  pixelRatio: number
}

export interface ResponsiveLayoutHook extends ResponsiveLayoutState {
  // Component selection helpers
  selectComponent: <T>(components: {
    mobile?: T
    tablet?: T
    desktop?: T
    fallback?: T
  }) => T | undefined

  // Responsive value helpers
  responsiveValue: <T>(values: {
    mobile?: T
    tablet?: T
    desktop?: T
    fallback?: T
  }) => T | undefined

  // Breakpoint matchers
  matches: (breakpoints: Breakpoint | Breakpoint[]) => boolean

  // Media query helpers
  mediaQuery: (query: string) => boolean
}

// Breakpoint definitions (mobile-first)
const BREAKPOINTS = {
  mobile: 0,
  tablet: 640, // sm: 640px
  desktop: 1024, // lg: 1024px
} as const

// Media query strings
const MEDIA_QUERIES = {
  mobile: '(max-width: 639px)',
  tablet: '(min-width: 640px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  touch: '(pointer: coarse)',
  hover: '(hover: hover)',
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
} as const

/**
 * Custom hook for responsive layout detection and component selection
 *
 * Provides comprehensive responsive state management with:
 * - Breakpoint detection (mobile, tablet, desktop)
 * - Device capabilities (touch, hover, pixel ratio)
 * - Component selection helpers
 * - Responsive value mapping
 * - Media query matching
 */
export function useResponsiveLayout(): ResponsiveLayoutHook {
  const [state, setState] = useState<ResponsiveLayoutState>(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    breakpoint: 'desktop' as Breakpoint,
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    orientation: 'landscape' as const,
    isTouch: false,
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  }))

  // Update responsive state
  const updateState = useCallback(() => {
    if (typeof window === 'undefined') return

    const width = window.innerWidth
    const height = window.innerHeight
    const orientation = height > width ? 'portrait' : 'landscape'
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const pixelRatio = window.devicePixelRatio || 1

    // Determine breakpoint
    let breakpoint: Breakpoint = 'mobile'
    let isMobile = false
    let isTablet = false
    let isDesktop = false

    if (width >= BREAKPOINTS.desktop) {
      breakpoint = 'desktop'
      isDesktop = true
    } else if (width >= BREAKPOINTS.tablet) {
      breakpoint = 'tablet'
      isTablet = true
    } else {
      breakpoint = 'mobile'
      isMobile = true
    }

    setState({
      isMobile,
      isTablet,
      isDesktop,
      breakpoint,
      width,
      height,
      orientation,
      isTouch,
      pixelRatio,
    })
  }, [])

  // Setup event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initial state
    updateState()

    // Use refs to store timeout IDs for proper cleanup
    let resizeTimeoutId: NodeJS.Timeout | null = null
    let orientationTimeoutId: NodeJS.Timeout | null = null

    // Throttled resize handler
    const handleResize = () => {
      if (resizeTimeoutId) {
        clearTimeout(resizeTimeoutId)
      }
      resizeTimeoutId = setTimeout(updateState, 100)
    }

    // Orientation change handler
    const handleOrientationChange = () => {
      // Delay to allow browser to update dimensions
      if (orientationTimeoutId) {
        clearTimeout(orientationTimeoutId)
      }
      orientationTimeoutId = setTimeout(updateState, 200)
    }

    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('orientationchange', handleOrientationChange, {
      passive: true,
    })

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
      if (resizeTimeoutId) {
        clearTimeout(resizeTimeoutId)
      }
      if (orientationTimeoutId) {
        clearTimeout(orientationTimeoutId)
      }
    }
  }, [updateState])

  // Component selection helper
  const selectComponent = useCallback(
    <T>(components: { mobile?: T; tablet?: T; desktop?: T; fallback?: T }) => {
      if (state.isMobile && components.mobile) return components.mobile
      if (state.isTablet && components.tablet) return components.tablet
      if (state.isDesktop && components.desktop) return components.desktop
      return components.fallback
    },
    [state.isMobile, state.isTablet, state.isDesktop]
  )

  // Responsive value helper
  const responsiveValue = useCallback(
    <T>(values: { mobile?: T; tablet?: T; desktop?: T; fallback?: T }) => {
      if (state.isMobile && values.mobile !== undefined) return values.mobile
      if (state.isTablet && values.tablet !== undefined) return values.tablet
      if (state.isDesktop && values.desktop !== undefined) return values.desktop
      return values.fallback
    },
    [state.isMobile, state.isTablet, state.isDesktop]
  )

  // Breakpoint matcher
  const matches = useCallback(
    (breakpoints: Breakpoint | Breakpoint[]) => {
      const targetBreakpoints = Array.isArray(breakpoints)
        ? breakpoints
        : [breakpoints]
      return targetBreakpoints.includes(state.breakpoint)
    },
    [state.breakpoint]
  )

  // Media query helper
  const mediaQuery = useCallback((query: string) => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  }, [])

  return {
    ...state,
    selectComponent,
    responsiveValue,
    matches,
    mediaQuery,
  }
}

/**
 * Hook for detecting specific device capabilities
 */
export function useDeviceCapabilities() {
  const { isTouch, pixelRatio, mediaQuery } = useResponsiveLayout()

  return useMemo(
    () => ({
      isTouch,
      hasHover: mediaQuery(MEDIA_QUERIES.hover),
      isHighDPI: pixelRatio >= 2,
      supportsTouch: isTouch,
      prefersDark: mediaQuery('(prefers-color-scheme: dark)'),
      prefersReducedMotion: mediaQuery('(prefers-reduced-motion: reduce)'),
      isRetina: pixelRatio >= 2,
    }),
    [isTouch, pixelRatio, mediaQuery]
  )
}

/**
 * Hook for responsive breakpoint matching
 */
export function useBreakpoint(breakpoint: Breakpoint) {
  const { matches } = useResponsiveLayout()
  return matches(breakpoint)
}

/**
 * Hook for responsive values with type safety
 */
export function useResponsiveValue<T>(values: {
  mobile?: T
  tablet?: T
  desktop?: T
  fallback?: T
}) {
  const { responsiveValue } = useResponsiveLayout()
  return responsiveValue(values)
}

/**
 * Hook for component selection with type safety
 */
export function useResponsiveComponent<T>(components: {
  mobile?: T
  tablet?: T
  desktop?: T
  fallback?: T
}) {
  const { selectComponent } = useResponsiveLayout()
  return selectComponent(components)
}

/**
 * CSS-in-JS responsive utilities
 */
export function getResponsiveStyles(styles: {
  mobile?: React.CSSProperties
  tablet?: React.CSSProperties
  desktop?: React.CSSProperties
  fallback?: React.CSSProperties
}) {
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout()

  if (isMobile && styles.mobile) return styles.mobile
  if (isTablet && styles.tablet) return styles.tablet
  if (isDesktop && styles.desktop) return styles.desktop
  return styles.fallback || {}
}

/**
 * Responsive class name utilities
 */
export function getResponsiveClasses(classes: {
  mobile?: string
  tablet?: string
  desktop?: string
  fallback?: string
}) {
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout()

  if (isMobile && classes.mobile) return classes.mobile
  if (isTablet && classes.tablet) return classes.tablet
  if (isDesktop && classes.desktop) return classes.desktop
  return classes.fallback || ''
}

// Export breakpoint constants for external use
export { BREAKPOINTS, MEDIA_QUERIES }

// Export default hook
export default useResponsiveLayout
