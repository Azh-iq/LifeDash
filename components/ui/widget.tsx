'use client'

import { forwardRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Widget size variants
const widgetVariants = cva(
  // Base styles with LifeDash design system
  'relative overflow-hidden transition-all duration-300 ease-out',
  {
    variants: {
      size: {
        small: 'min-h-[200px] max-h-[300px]',
        medium: 'min-h-[300px] max-h-[400px]',
        large: 'min-h-[400px] max-h-[600px]',
        hero: 'min-h-[500px] max-h-[800px]',
      },
      category: {
        stocks: 'border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/30',
        crypto: 'border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/30',
        art: 'border-l-4 border-l-pink-500 bg-gradient-to-br from-pink-50/50 to-transparent dark:from-pink-950/30',
        other: 'border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/30',
      },
      state: {
        default: 'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
        loading: 'pointer-events-none',
        error: 'border-red-200 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/20',
      },
    },
    defaultVariants: {
      size: 'medium',
      category: 'stocks',
      state: 'default',
    },
  }
)

// Category color themes
const categoryColors = {
  stocks: {
    primary: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    accent: 'bg-purple-500',
    hover: 'hover:bg-purple-200 dark:hover:bg-purple-800/50',
  },
  crypto: {
    primary: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    accent: 'bg-orange-500',
    hover: 'hover:bg-orange-200 dark:hover:bg-orange-800/50',
  },
  art: {
    primary: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    accent: 'bg-pink-500',
    hover: 'hover:bg-pink-200 dark:hover:bg-pink-800/50',
  },
  other: {
    primary: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    accent: 'bg-blue-500',
    hover: 'hover:bg-blue-200 dark:hover:bg-blue-800/50',
  },
}

// Animation variants
const containerVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0.0, 0.2, 1], // Norwegian-inspired smooth easing
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1],
    }
  },
}

const shimmerVariants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: 'linear',
    },
  },
}

// Icons
const RefreshIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const ExportIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const MoreIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
)

const ErrorIcon = () => (
  <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export interface WidgetProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof widgetVariants> {
  // Basic props
  title: string
  description?: string
  icon?: React.ReactNode
  
  // Widget state
  loading?: boolean
  error?: string | null
  
  // Actions
  onRefresh?: () => void | Promise<void>
  onExport?: () => void | Promise<void>
  onMenuClick?: () => void
  
  // Customization
  actions?: React.ReactNode
  footer?: React.ReactNode
  
  // Norwegian accessibility
  refreshLabel?: string
  exportLabel?: string
  menuLabel?: string
  loadingLabel?: string
  errorRetryLabel?: string
}

const Widget = forwardRef<HTMLDivElement, WidgetProps>(
  (
    {
      title,
      description,
      icon,
      loading = false,
      error = null,
      onRefresh,
      onExport,
      onMenuClick,
      actions,
      footer,
      size,
      category = 'stocks',
      state = 'default',
      children,
      className,
      refreshLabel = 'Oppdater',
      exportLabel = 'Eksporter',
      menuLabel = 'Flere alternativer',
      loadingLabel = 'Laster...',
      errorRetryLabel = 'Prøv igjen',
      ...props
    },
    ref
  ) => {
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    
    const colors = categoryColors[category]
    const currentState = error ? 'error' : loading ? 'loading' : state

    const handleRefresh = useCallback(async () => {
      if (!onRefresh || isRefreshing) return
      
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }, [onRefresh, isRefreshing])

    const handleExport = useCallback(async () => {
      if (!onExport || isExporting) return
      
      setIsExporting(true)
      try {
        await onExport()
      } finally {
        setIsExporting(false)
      }
    }, [onExport, isExporting])

    return (
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn(
          widgetVariants({ size, category, state: currentState }),
          className
        )}
        {...props}
      >
        <Card className="h-full border-0 shadow-md">
          {/* Header */}
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {icon && (
                  <div className={cn('rounded-lg p-2', colors.bg)}>
                    <div className={colors.primary}>{icon}</div>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {title}
                  </h3>
                  {description && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {description}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1">
                {actions}
                
                {onRefresh && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    loading={isRefreshing}
                    aria-label={refreshLabel}
                    className={cn('transition-all duration-200', colors.hover)}
                  >
                    <motion.div
                      animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                      transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
                    >
                      <RefreshIcon />
                    </motion.div>
                  </Button>
                )}
                
                {onExport && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleExport}
                    disabled={isExporting}
                    loading={isExporting}
                    aria-label={exportLabel}
                    className={cn('transition-all duration-200', colors.hover)}
                  >
                    <ExportIcon />
                  </Button>
                )}
                
                {onMenuClick && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onMenuClick}
                    aria-label={menuLabel}
                    className={cn('transition-all duration-200', colors.hover)}
                  >
                    <MoreIcon />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent className="flex-1 pb-3">
            <AnimatePresence mode="wait">
              {error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                  <ErrorIcon />
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                  {onRefresh && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      loading={isRefreshing}
                      className="mt-3"
                    >
                      {errorRetryLabel}
                    </Button>
                  )}
                </motion.div>
              ) : loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Loading skeleton */}
                  <div className="space-y-3">
                    <motion.div
                      className="h-4 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 rounded"
                      variants={shimmerVariants}
                      animate="animate"
                      style={{
                        backgroundSize: '200% 100%',
                      }}
                    />
                    <motion.div
                      className="h-4 w-3/4 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 rounded"
                      variants={shimmerVariants}
                      animate="animate"
                      style={{
                        backgroundSize: '200% 100%',
                      }}
                    />
                    <motion.div
                      className="h-4 w-1/2 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 rounded"
                      variants={shimmerVariants}
                      animate="animate"
                      style={{
                        backgroundSize: '200% 100%',
                      }}
                    />
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                    {loadingLabel}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
                >
                  {children}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          {/* Footer */}
          {footer && (
            <CardFooter className="pt-0">
              {footer}
            </CardFooter>
          )}
        </Card>
      </motion.div>
    )
  }
)

Widget.displayName = 'Widget'

// Specialized widget components
const StockWidget = forwardRef<HTMLDivElement, Omit<WidgetProps, 'category'>>(
  (props, ref) => (
    <Widget ref={ref} category="stocks" {...props} />
  )
)
StockWidget.displayName = 'StockWidget'

const CryptoWidget = forwardRef<HTMLDivElement, Omit<WidgetProps, 'category'>>(
  (props, ref) => (
    <Widget ref={ref} category="crypto" {...props} />
  )
)
CryptoWidget.displayName = 'CryptoWidget'

const ArtWidget = forwardRef<HTMLDivElement, Omit<WidgetProps, 'category'>>(
  (props, ref) => (
    <Widget ref={ref} category="art" {...props} />
  )
)
ArtWidget.displayName = 'ArtWidget'

// Widget container for layout
const WidgetContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    columns?: 1 | 2 | 3 | 4
    gap?: 'sm' | 'md' | 'lg'
  }
>(({ className, columns = 2, gap = 'md', children, ...props }, ref) => {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  }
  
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        'grid auto-rows-fr',
        columnClasses[columns],
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
WidgetContainer.displayName = 'WidgetContainer'

export {
  Widget,
  StockWidget,
  CryptoWidget,
  ArtWidget,
  WidgetContainer,
  widgetVariants,
  type WidgetProps,
}