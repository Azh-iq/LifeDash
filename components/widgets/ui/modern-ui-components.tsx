'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Loader2 } from 'lucide-react'

// Modern Glassmorphism Button Component
interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  glassmorphism?: boolean
  children: React.ReactNode
  className?: string
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  glassmorphism = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const baseClasses = cn(
    'relative overflow-hidden transition-all duration-300 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'transform-gpu will-change-transform',
    {
      // Glassmorphism effects
      'backdrop-blur-md bg-white/20 border border-white/30 shadow-lg': glassmorphism,
      'hover:bg-white/30 hover:border-white/40': glassmorphism && !disabled,
      
      // Standard variants
      'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg': variant === 'primary' && !glassmorphism,
      'hover:from-purple-700 hover:to-indigo-700': variant === 'primary' && !glassmorphism && !disabled,
      'focus:ring-purple-500': variant === 'primary',
      
      'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 shadow-md': variant === 'secondary' && !glassmorphism,
      'hover:from-gray-200 hover:to-gray-300': variant === 'secondary' && !glassmorphism && !disabled,
      'focus:ring-gray-400': variant === 'secondary',
      
      'bg-transparent hover:bg-gray-100 text-gray-700': variant === 'ghost' && !glassmorphism,
      'focus:ring-gray-400': variant === 'ghost',
      
      'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg': variant === 'destructive' && !glassmorphism,
      'hover:from-red-600 hover:to-red-700': variant === 'destructive' && !glassmorphism && !disabled,
      'focus:ring-red-500': variant === 'destructive',
      
      // Sizes
      'px-3 py-1.5 text-sm font-medium rounded-md': size === 'sm',
      'px-4 py-2 text-sm font-medium rounded-lg': size === 'md',
      'px-6 py-3 text-base font-semibold rounded-xl': size === 'lg',
      
      // States
      'opacity-60 cursor-not-allowed': disabled,
      'hover:scale-105 hover:shadow-xl': !disabled && !glassmorphism,
      'hover:shadow-2xl': !disabled && glassmorphism,
      'active:scale-95': !disabled,
    },
    className
  )

  return (
    <motion.button
      className={baseClasses}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    >
      {/* Animated background gradient */}
      <AnimatePresence>
        {isHovered && !disabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
        )}
      </AnimatePresence>

      {/* Shimmer effect */}
      {!disabled && (
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
            animate={{
              x: isHovered ? ['-100%', '100%'] : '-100%',
            }}
            transition={{
              duration: 0.8,
              ease: "easeInOut",
            }}
          />
        </div>
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
        {children}
      </span>

      {/* Ripple effect */}
      {isPressed && !disabled && (
        <motion.span
          className="absolute inset-0 rounded-full bg-white/30"
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </motion.button>
  )
}

// Modern Glassmorphism Card Component
interface ModernCardProps {
  children: React.ReactNode
  className?: string
  glassmorphism?: boolean
  interactive?: boolean
  loading?: boolean
  onClick?: () => void
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  className,
  glassmorphism = false,
  interactive = false,
  loading = false,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const cardClasses = cn(
    'relative overflow-hidden transition-all duration-300 ease-out',
    'border border-gray-200 shadow-lg',
    {
      // Glassmorphism effects
      'backdrop-blur-md bg-white/10 border-white/20 shadow-xl': glassmorphism,
      'hover:bg-white/20 hover:border-white/30': glassmorphism && interactive,
      
      // Standard styles
      'bg-white': !glassmorphism,
      'hover:shadow-xl hover:scale-105': interactive && !glassmorphism,
      'hover:shadow-2xl': interactive && glassmorphism,
      
      // Interactive states
      'cursor-pointer': interactive,
      'opacity-60': loading,
    },
    className
  )

  return (
    <motion.div
      className={cardClasses}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={interactive ? { scale: 1.02 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Animated border gradient */}
      <AnimatePresence>
        {isHovered && interactive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-transparent to-purple-500/20 rounded-lg"
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : (
          children
        )}
      </div>

      {/* Glassmorphism overlay */}
      {glassmorphism && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      )}
    </motion.div>
  )
}

// Modern Search Input Component
interface ModernSearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  glassmorphism?: boolean
  icon?: React.ReactNode
  onClear?: () => void
  loading?: boolean
}

export const ModernSearchInput: React.FC<ModernSearchInputProps> = ({
  glassmorphism = false,
  icon,
  onClear,
  loading = false,
  className,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const inputClasses = cn(
    'w-full px-4 py-3 text-sm transition-all duration-300 ease-out',
    'border border-gray-200 rounded-lg shadow-sm',
    'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
    'placeholder:text-gray-400',
    {
      // Glassmorphism effects
      'backdrop-blur-md bg-white/10 border-white/20 text-white placeholder:text-white/60': glassmorphism,
      'focus:bg-white/20 focus:border-white/30': glassmorphism,
      
      // Standard styles
      'bg-white': !glassmorphism,
      'hover:shadow-md': !glassmorphism,
      
      // With icon padding
      'pl-12': icon,
      'pr-12': onClear || loading,
    },
    className
  )

  return (
    <div className="relative">
      {/* Icon */}
      {icon && (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}

      {/* Input */}
      <motion.input
        ref={inputRef}
        className={inputClasses}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        whileFocus={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...props}
      />

      {/* Clear button or loading */}
      {(onClear || loading) && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            onClear && (
              <button
                onClick={onClear}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )
          )}
        </div>
      )}

      {/* Focus indicator */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Modern Loading Component
interface ModernLoadingProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'dots' | 'pulse'
  message?: string
  glassmorphism?: boolean
}

export const ModernLoading: React.FC<ModernLoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  message,
  glassmorphism = false,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  const containerClasses = cn(
    'flex flex-col items-center justify-center gap-3 p-6',
    {
      'text-white': glassmorphism,
      'text-gray-600': !glassmorphism,
    }
  )

  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return (
          <Loader2 className={cn(sizeClasses[size], 'animate-spin')} />
        )
      
      case 'dots':
        return (
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={cn(
                  'rounded-full bg-purple-500',
                  size === 'sm' && 'w-2 h-2',
                  size === 'md' && 'w-3 h-3',
                  size === 'lg' && 'w-4 h-4'
                )}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        )
      
      case 'pulse':
        return (
          <motion.div
            className={cn(
              'rounded-full bg-purple-500',
              sizeClasses[size]
            )}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          />
        )
      
      default:
        return <Loader2 className={cn(sizeClasses[size], 'animate-spin')} />
    }
  }

  return (
    <div className={containerClasses}>
      {renderLoader()}
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium"
        >
          {message}
        </motion.p>
      )}
    </div>
  )
}

// Modern Tooltip Component
interface ModernTooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  glassmorphism?: boolean
  delayDuration?: number
}

export const ModernTooltip: React.FC<ModernTooltipProps> = ({
  children,
  content,
  side = 'top',
  glassmorphism = false,
  delayDuration = 200,
}) => {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className={cn(
            'max-w-xs p-3 text-sm font-medium transition-all duration-200',
            {
              'backdrop-blur-md bg-black/80 border-white/20 text-white shadow-xl': glassmorphism,
              'bg-gray-900 text-white border-gray-800': !glassmorphism,
            }
          )}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            {content}
          </motion.div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Modern Widget Action Button
interface ModernWidgetActionProps {
  icon: React.ReactNode
  label: string
  onClick: (event?: React.MouseEvent<HTMLButtonElement>) => void
  variant?: 'primary' | 'secondary' | 'destructive'
  disabled?: boolean
  loading?: boolean
  glassmorphism?: boolean
}

export const ModernWidgetAction: React.FC<ModernWidgetActionProps> = ({
  icon,
  label,
  onClick,
  variant = 'secondary',
  disabled = false,
  loading = false,
  glassmorphism = false,
}) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onClick(event)
  }

  return (
    <ModernTooltip content={label} glassmorphism={glassmorphism}>
      <ModernButton
        variant={variant}
        size="sm"
        onClick={handleClick}
        disabled={disabled}
        loading={loading}
        glassmorphism={glassmorphism}
        className="p-2 min-w-[36px] h-9"
      >
        {icon}
      </ModernButton>
    </ModernTooltip>
  )
}

// Export all components
export {
  ModernButton,
  ModernCard,
  ModernSearchInput,
  ModernLoading,
  ModernTooltip,
  ModernWidgetAction,
}