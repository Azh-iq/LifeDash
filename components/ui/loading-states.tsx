'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  TrendingUp,
  Activity,
  BarChart3,
  PieChart,
  Loader2,
} from 'lucide-react'

interface LoadingStateProps {
  variant?: 'chart' | 'table' | 'widget' | 'minimal' | 'pulse'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
}

export function LoadingState({
  variant = 'widget',
  size = 'md',
  className,
  text = 'Laster...',
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-20',
    md: 'h-32',
    lg: 'h-48',
    xl: 'h-64',
  }

  if (variant === 'minimal') {
    return (
      <motion.div
        className={cn(
          'flex items-center justify-center',
          sizeClasses[size],
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-6 w-6 rounded-full border-2 border-purple-600 border-t-transparent"
        />
        {text && (
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {text}
          </span>
        )}
      </motion.div>
    )
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className={cn(
          'flex items-center justify-center',
          sizeClasses[size],
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="h-8 w-8 rounded-full bg-purple-600 opacity-60"
        />
        {text && (
          <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
            {text}
          </span>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-center space-y-4',
        sizeClasses[size],
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <LoadingIcon variant={variant} />
      <motion.p
        className="text-sm font-medium text-gray-600 dark:text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {text}
      </motion.p>
    </motion.div>
  )
}

function LoadingIcon({ variant }: { variant: string }) {
  const iconProps = {
    className: 'w-8 h-8 text-purple-600 dark:text-purple-400',
    strokeWidth: 2,
  }

  switch (variant) {
    case 'chart':
      return (
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <BarChart3 {...iconProps} />
        </motion.div>
      )
    case 'table':
      return (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Activity {...iconProps} />
        </motion.div>
      )
    default:
      return (
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <TrendingUp {...iconProps} />
        </motion.div>
      )
  }
}

interface SkeletonLoaderProps {
  variant?: 'chart' | 'table' | 'card' | 'text'
  rows?: number
  className?: string
}

export function SkeletonLoader({
  variant = 'card',
  rows = 5,
  className,
}: SkeletonLoaderProps) {
  if (variant === 'chart') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Chart header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-32 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-24 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-8 w-12 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"
              />
            ))}
          </div>
        </div>

        {/* Chart area */}
        <div className="relative h-64 animate-pulse overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Chart footer */}
        <div className="flex items-center justify-between text-sm">
          <div className="h-4 w-20 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-16 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Table header */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-8 w-8 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"
              />
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
              <div className="h-6 w-16 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>

        {/* Table rows */}
        <div className="space-y-2">
          {[...Array(rows)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-24 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-16 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'text') {
    return (
      <div className={cn('space-y-3', className)}>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-4/5 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {[...Array(rows)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-24 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-4/5 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

interface MicroInteractionProps {
  children: React.ReactNode
  hover?: boolean
  tap?: boolean
  className?: string
}

export function MicroInteraction({
  children,
  hover = true,
  tap = true,
  className,
}: MicroInteractionProps) {
  return (
    <motion.div
      className={cn(className)}
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      whileTap={tap ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  )
}

interface PulseDotsProps {
  count?: number
  color?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PulseDots({
  count = 3,
  color = 'purple',
  size = 'md',
  className,
}: PulseDotsProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  const colorClasses = {
    purple: 'bg-purple-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            'rounded-full',
            sizeClasses[size],
            colorClasses[color as keyof typeof colorClasses] || 'bg-purple-600'
          )}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

interface LoadingBarProps {
  progress?: number
  indeterminate?: boolean
  color?: string
  className?: string
}

export function LoadingBar({
  progress = 0,
  indeterminate = false,
  color = 'purple',
  className,
}: LoadingBarProps) {
  const colorClasses = {
    purple: 'bg-purple-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
  }

  return (
    <div
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
        className
      )}
    >
      <motion.div
        className={cn(
          'h-full rounded-full',
          colorClasses[color as keyof typeof colorClasses] || 'bg-purple-600'
        )}
        initial={{ width: 0 }}
        animate={
          indeterminate
            ? {
                x: ['-100%', '100%'],
                width: ['20%', '80%', '20%'],
              }
            : { width: `${progress}%` }
        }
        transition={
          indeterminate
            ? {
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : { duration: 0.5, ease: 'easeOut' }
        }
      />
    </div>
  )
}
