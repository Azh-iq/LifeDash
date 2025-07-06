'use client'

import { ReactNode, ComponentType, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { useResponsiveLayout } from '@/lib/hooks/use-responsive-layout'

interface ResponsiveWrapperProps {
  children: ReactNode
  className?: string
  mobileFirst?: boolean
  enableAnimations?: boolean
  fallback?: ReactNode
}

interface ConditionalRenderProps {
  mobile?: ReactNode
  tablet?: ReactNode
  desktop?: ReactNode
  fallback?: ReactNode
  className?: string
}

interface AdaptiveComponentProps<T = any> {
  MobileComponent: ComponentType<T>
  DesktopComponent: ComponentType<T>
  TabletComponent?: ComponentType<T>
  componentProps: T
  className?: string
  enableTransitions?: boolean
}

/**
 * Mobile Responsive Wrapper - Progressive Enhancement Container
 *
 * Provides responsive wrapper for components with mobile-first approach
 * Handles safe area insets, touch targets, and responsive breakpoints
 */
export function MobileResponsiveWrapper({
  children,
  className,
  mobileFirst = true,
  enableAnimations = true,
  fallback,
}: ResponsiveWrapperProps) {
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsiveLayout()

  const containerClasses = useMemo(
    () =>
      cn(
        // Base responsive classes
        'w-full min-h-0',

        // Mobile-first approach
        mobileFirst && [
          // Mobile base styles
          'px-4 py-2',
          // Touch-friendly spacing
          'touch-pan-y',
          // Safe area support
          'safe-area-inset-top safe-area-inset-bottom',

          // Tablet enhancements
          'sm:px-6 sm:py-4',

          // Desktop enhancements
          'lg:px-8 lg:py-6',

          // Large screen optimizations
          'xl:px-10 xl:py-8',
        ],

        // Desktop-first fallback
        !mobileFirst && ['px-8 py-6', 'md:px-6 md:py-4', 'sm:px-4 sm:py-2'],

        // Responsive utilities
        'transition-all duration-300 ease-in-out',

        className
      ),
    [mobileFirst, className]
  )

  const content = useMemo(() => {
    if (fallback && (isMobile === undefined || isTablet === undefined)) {
      return fallback
    }
    return children
  }, [children, fallback, isMobile, isTablet])

  if (!enableAnimations) {
    return (
      <div className={containerClasses} data-breakpoint={breakpoint}>
        {content}
      </div>
    )
  }

  return (
    <motion.div
      className={containerClasses}
      data-breakpoint={breakpoint}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <AnimatePresence mode="wait">{content}</AnimatePresence>
    </motion.div>
  )
}

/**
 * Conditional Render Component
 *
 * Renders different content based on screen size
 * Provides clean component switching with animations
 */
export function ConditionalRender({
  mobile,
  tablet,
  desktop,
  fallback,
  className,
}: ConditionalRenderProps) {
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsiveLayout()

  const currentContent = useMemo(() => {
    if (isMobile && mobile) return mobile
    if (isTablet && tablet) return tablet
    if (isDesktop && desktop) return desktop
    return fallback || null
  }, [isMobile, isTablet, isDesktop, mobile, tablet, desktop, fallback])

  if (!currentContent) return null

  return (
    <motion.div
      className={cn('w-full', className)}
      data-breakpoint={breakpoint}
      key={breakpoint}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {currentContent}
    </motion.div>
  )
}

/**
 * Adaptive Component Wrapper
 *
 * Automatically switches between mobile and desktop components
 * Maintains prop consistency across components
 */
export function AdaptiveComponent<T = any>({
  MobileComponent,
  DesktopComponent,
  TabletComponent,
  componentProps,
  className,
  enableTransitions = true,
}: AdaptiveComponentProps<T>) {
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsiveLayout()

  const ActiveComponent = useMemo(() => {
    if (isMobile) return MobileComponent
    if (isTablet && TabletComponent) return TabletComponent
    if (isDesktop) return DesktopComponent
    return DesktopComponent // Default fallback
  }, [
    isMobile,
    isTablet,
    isDesktop,
    MobileComponent,
    TabletComponent,
    DesktopComponent,
  ])

  if (!enableTransitions) {
    return (
      <div className={cn('w-full', className)} data-breakpoint={breakpoint}>
        <ActiveComponent {...componentProps} />
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={breakpoint}
        className={cn('w-full', className)}
        data-breakpoint={breakpoint}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <ActiveComponent {...componentProps} />
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Responsive Grid Wrapper
 *
 * Provides responsive grid layouts with mobile-first approach
 * Automatically adjusts columns based on screen size
 */
interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  mobileColumns?: number
  tabletColumns?: number
  desktopColumns?: number
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  minItemWidth?: string
}

export function ResponsiveGrid({
  children,
  className,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  gap = 'md',
  minItemWidth,
}: ResponsiveGridProps) {
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout()

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }

  const gridClasses = useMemo(() => {
    if (minItemWidth) {
      return cn(
        'grid',
        `grid-cols-[repeat(auto-fit,minmax(${minItemWidth},1fr))]`,
        gapClasses[gap],
        className
      )
    }

    return cn(
      'grid',
      `grid-cols-${mobileColumns}`,
      `sm:grid-cols-${tabletColumns}`,
      `lg:grid-cols-${desktopColumns}`,
      gapClasses[gap],
      className
    )
  }, [
    mobileColumns,
    tabletColumns,
    desktopColumns,
    gap,
    minItemWidth,
    className,
  ])

  return <div className={gridClasses}>{children}</div>
}

/**
 * Mobile-First Container
 *
 * Provides mobile-optimized container with safe areas
 * Includes touch-friendly interactions and proper spacing
 */
interface MobileFirstContainerProps {
  children: ReactNode
  className?: string
  enableSafeArea?: boolean
  enableTouchOptimization?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function MobileFirstContainer({
  children,
  className,
  enableSafeArea = true,
  enableTouchOptimization = true,
  maxWidth = 'full',
}: MobileFirstContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full',
  }

  const containerClasses = cn(
    'w-full mx-auto',

    // Max width
    maxWidthClasses[maxWidth],

    // Safe area support
    enableSafeArea && [
      'safe-area-inset-top',
      'safe-area-inset-bottom',
      'safe-area-inset-left',
      'safe-area-inset-right',
    ],

    // Touch optimization
    enableTouchOptimization && ['touch-pan-y', 'touch-pinch-zoom'],

    // Responsive padding
    'px-4 py-2',
    'sm:px-6 sm:py-4',
    'lg:px-8 lg:py-6',

    className
  )

  return <div className={containerClasses}>{children}</div>
}

/**
 * Responsive Visibility Wrapper
 *
 * Shows/hides content based on screen size
 * Provides clean visibility control with animations
 */
interface ResponsiveVisibilityProps {
  children: ReactNode
  showOn?: ('mobile' | 'tablet' | 'desktop')[]
  hideOn?: ('mobile' | 'tablet' | 'desktop')[]
  className?: string
  enableAnimations?: boolean
}

export function ResponsiveVisibility({
  children,
  showOn,
  hideOn,
  className,
  enableAnimations = true,
}: ResponsiveVisibilityProps) {
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout()

  const shouldShow = useMemo(() => {
    if (showOn) {
      return (
        (showOn.includes('mobile') && isMobile) ||
        (showOn.includes('tablet') && isTablet) ||
        (showOn.includes('desktop') && isDesktop)
      )
    }

    if (hideOn) {
      return !(
        (hideOn.includes('mobile') && isMobile) ||
        (hideOn.includes('tablet') && isTablet) ||
        (hideOn.includes('desktop') && isDesktop)
      )
    }

    return true
  }, [showOn, hideOn, isMobile, isTablet, isDesktop])

  if (!shouldShow) return null

  if (!enableAnimations) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

// Export all components
export default MobileResponsiveWrapper
