'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <motion.div
      className={cn(
        'rounded-full border-2 border-gray-200 border-t-purple-600',
        sizeClasses[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }}
    />
  )
}

interface LoadingStateProps {
  message?: string
  submessage?: string
  className?: string
}

export function LoadingState({ message = 'Laster...', submessage, className }: LoadingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center justify-center gap-4 p-8', className)}
    >
      <LoadingSpinner size="lg" />
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900">{message}</p>
        {submessage && (
          <p className="text-sm text-gray-600 mt-1">{submessage}</p>
        )}
      </div>
    </motion.div>
  )
}