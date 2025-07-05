'use client'

// Animated Progress Ring Component
// Circular progress indicators with smooth animations

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useState, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { shouldReduceMotion } from '@/lib/animations'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface ProgressRingProps {
  // Core progress properties
  value: number // 0-100
  max?: number
  
  // Visual styling
  size?: number
  strokeWidth?: number
  className?: string
  
  // Colors and theming
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'gray' | 'gradient'
  backgroundColor?: string
  
  // Animation configuration
  duration?: number
  delay?: number
  ease?: 'linear' | 'easeOut' | 'easeInOut' | 'backOut'
  
  // Content and labels
  showValue?: boolean
  showPercentage?: boolean
  label?: string
  children?: React.ReactNode
  
  // Behavior options
  lineCap?: 'round' | 'square' | 'butt'
  direction?: 'clockwise' | 'counterclockwise'
  startAngle?: number // degrees
  
  // Event handlers
  onComplete?: () => void
  onUpdate?: (progress: number) => void
}

// =============================================================================
// STYLING CONFIGURATIONS
// =============================================================================

const colorVariants = {
  blue: {
    stroke: '#3b82f6',
    background: '#e5e7eb'
  },
  green: {
    stroke: '#10b981',
    background: '#e5e7eb'
  },
  red: {
    stroke: '#ef4444',
    background: '#e5e7eb'
  },
  purple: {
    stroke: '#8b5cf6',
    background: '#e5e7eb'
  },
  orange: {
    stroke: '#f59e0b',
    background: '#e5e7eb'
  },
  gray: {
    stroke: '#6b7280',
    background: '#e5e7eb'
  },
  gradient: {
    stroke: 'url(#progressGradient)',
    background: '#e5e7eb'
  }
} as const

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate circle properties for SVG
 */
function getCircleProps(size: number, strokeWidth: number) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const center = size / 2
  
  return {
    radius,
    circumference,
    center,
    viewBox: `0 0 ${size} ${size}`
  }
}

/**
 * Convert progress percentage to stroke-dashoffset
 */
function getStrokeDashOffset(progress: number, circumference: number, direction: 'clockwise' | 'counterclockwise') {
  const offset = circumference - (progress / 100) * circumference
  return direction === 'counterclockwise' ? -offset : offset
}

/**
 * Convert start angle to transform rotation
 */
function getRotationTransform(startAngle: number, center: number) {
  return `rotate(${startAngle - 90} ${center} ${center})`
}

// =============================================================================
// ANIMATED PROGRESS RING COMPONENT
// =============================================================================

export const ProgressRing = forwardRef<SVGSVGElement, ProgressRingProps>(({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  color = 'blue',
  backgroundColor,
  duration = 1.5,
  delay = 0,
  ease = 'easeOut',
  showValue = false,
  showPercentage = false,
  label,
  children,
  lineCap = 'round',
  direction = 'clockwise',
  startAngle = 0,
  onComplete,
  onUpdate
}, ref) => {
  // Animation state
  const motionProgress = useMotionValue(0)
  const [currentValue, setCurrentValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Calculate progress percentage
  const progressPercentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  // Calculate circle properties
  const { radius, circumference, center, viewBox } = getCircleProps(size, strokeWidth)
  
  // Transform motion value to stroke-dashoffset
  const strokeDashoffset = useTransform(
    motionProgress,
    [0, 100],
    [circumference, getStrokeDashOffset(100, circumference, direction)]
  )
  
  // Color configuration
  const colors = colorVariants[color]
  const bgColor = backgroundColor || colors.background
  
  // Respect reduced motion preference
  const reducedMotion = shouldReduceMotion()
  const animationDuration = reducedMotion ? 0.3 : duration
  
  // Animation effect
  useEffect(() => {
    if (isAnimating) return
    
    const currentProgress = motionProgress.get()
    if (currentProgress === progressPercentage) return
    
    setIsAnimating(true)
    
    const controls = animate(motionProgress, progressPercentage, {
      duration: animationDuration,
      delay,
      ease: ease as any,
      onUpdate: (latest) => {
        setCurrentValue((latest / 100) * max)
        onUpdate?.(latest)
      },
      onComplete: () => {
        setIsAnimating(false)
        onComplete?.()
      }
    })
    
    return controls.stop
  }, [progressPercentage, motionProgress, animationDuration, delay, ease, max, onUpdate, onComplete, isAnimating])
  
  // Build classes
  const svgClasses = cn(
    'drop-shadow-sm',
    className
  )
  
  return (
    <div className="relative inline-flex items-center justify-center">
      {/* SVG Progress Ring */}
      <motion.svg
        ref={ref}
        width={size}
        height={size}
        viewBox={viewBox}
        className={svgClasses}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Gradient Definition */}
        {color === 'gradient' && (
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        )}
        
        {/* Background Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
          className="opacity-20"
        />
        
        {/* Progress Circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap={lineCap}
          strokeDasharray={circumference}
          style={{
            strokeDashoffset,
            transform: getRotationTransform(startAngle, center),
            transformOrigin: 'center'
          }}
          initial={{ strokeDashoffset: circumference }}
        />
      </motion.svg>
      
      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children || (
          <>
            {/* Value Display */}
            {(showValue || showPercentage) && (
              <motion.div
                className="font-semibold text-gray-900 dark:text-gray-100"
                style={{ fontSize: size * 0.12 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: animationDuration + delay, duration: 0.3 }}
              >
                {showPercentage 
                  ? `${Math.round(currentValue / max * 100)}%`
                  : Math.round(currentValue)
                }
              </motion.div>
            )}
            
            {/* Label */}
            {label && (
              <motion.div
                className="text-xs text-gray-600 dark:text-gray-400 mt-1"
                style={{ fontSize: size * 0.08 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: animationDuration + delay + 0.1, duration: 0.3 }}
              >
                {label}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
})

ProgressRing.displayName = 'ProgressRing'

// =============================================================================
// SPECIALIZED PROGRESS VARIANTS
// =============================================================================

/**
 * Portfolio Allocation Ring - For displaying asset allocation
 */
export const AllocationRing = forwardRef<SVGSVGElement, Omit<ProgressRingProps, 'showPercentage' | 'color'> & {
  allocation: number // 0-100
  target?: number
  assetName?: string
}>(({
  allocation,
  target,
  assetName,
  value,
  ...props
}, ref) => {
  const isOnTarget = target ? Math.abs(allocation - target) <= 2 : true
  const color = isOnTarget ? 'green' : allocation > (target || 0) ? 'orange' : 'blue'
  
  return (
    <ProgressRing
      ref={ref}
      value={allocation}
      color={color}
      showPercentage
      label={assetName}
      {...props}
    >
      <div className="text-center">
        <div className="font-bold text-lg">{Math.round(allocation)}%</div>
        {target && (
          <div className="text-xs text-gray-500">
            Target: {target}%
          </div>
        )}
        {assetName && (
          <div className="text-xs text-gray-600 mt-1">
            {assetName}
          </div>
        )}
      </div>
    </ProgressRing>
  )
})

AllocationRing.displayName = 'AllocationRing'

/**
 * Performance Ring - For displaying performance metrics
 */
export const PerformanceRing = forwardRef<SVGSVGElement, Omit<ProgressRingProps, 'max' | 'color'> & {
  performance: number // -100 to +100
  benchmark?: number
}>(({
  performance,
  benchmark,
  value,
  ...props
}, ref) => {
  // Normalize performance to 0-100 scale for display
  const normalizedValue = Math.max(0, Math.min(100, (performance + 100) / 2))
  const color = performance >= 0 ? 'green' : 'red'
  
  return (
    <ProgressRing
      ref={ref}
      value={normalizedValue}
      max={100}
      color={color}
      {...props}
    >
      <div className="text-center">
        <div className={cn(
          "font-bold text-lg",
          performance >= 0 ? "text-green-600" : "text-red-600"
        )}>
          {performance >= 0 ? '+' : ''}{performance.toFixed(1)}%
        </div>
        {benchmark && (
          <div className="text-xs text-gray-500">
            vs {benchmark >= 0 ? '+' : ''}{benchmark.toFixed(1)}%
          </div>
        )}
      </div>
    </ProgressRing>
  )
})

PerformanceRing.displayName = 'PerformanceRing'

/**
 * Goal Progress Ring - For tracking financial goals
 */
export const GoalProgressRing = forwardRef<SVGSVGElement, Omit<ProgressRingProps, 'showValue'> & {
  current: number
  goal: number
  currency?: string
}>(({
  current,
  goal,
  currency = 'NOK',
  value,
  ...props
}, ref) => {
  const progress = (current / goal) * 100
  const isComplete = progress >= 100
  const color = isComplete ? 'green' : progress >= 75 ? 'blue' : 'gray'
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  return (
    <ProgressRing
      ref={ref}
      value={progress}
      color={color}
      {...props}
    >
      <div className="text-center">
        <div className="font-bold text-base">
          {formatCurrency(current)}
        </div>
        <div className="text-xs text-gray-500">
          av {formatCurrency(goal)}
        </div>
        <div className={cn(
          "text-sm font-medium mt-1",
          isComplete ? "text-green-600" : "text-blue-600"
        )}>
          {Math.round(progress)}%
        </div>
      </div>
    </ProgressRing>
  )
})

GoalProgressRing.displayName = 'GoalProgressRing'

/**
 * Multi-Ring Progress - For displaying multiple metrics
 */
export const MultiRingProgress = forwardRef<HTMLDivElement, {
  rings: Array<{
    value: number
    max?: number
    color?: ProgressRingProps['color']
    strokeWidth?: number
    label?: string
  }>
  size?: number
  spacing?: number
  className?: string
}>(({
  rings,
  size = 120,
  spacing = 12,
  className
}, ref) => {
  const totalRings = rings.length
  const centerSize = size - (totalRings - 1) * spacing * 2
  
  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      {rings.map((ring, index) => {
        const ringSize = centerSize + index * spacing * 2
        const strokeWidth = ring.strokeWidth || 6
        
        return (
          <div
            key={index}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              width: ringSize,
              height: ringSize,
              top: (size - ringSize) / 2,
              left: (size - ringSize) / 2
            }}
          >
            <ProgressRing
              value={ring.value}
              max={ring.max}
              size={ringSize}
              strokeWidth={strokeWidth}
              color={ring.color}
              duration={1.5 + index * 0.2}
              delay={index * 0.1}
            />
          </div>
        )
      })}
      
      {/* Center content */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{
          width: centerSize * 0.6,
          height: centerSize * 0.6,
          top: (size - centerSize * 0.6) / 2,
          left: (size - centerSize * 0.6) / 2
        }}
      >
        <div className="text-center">
          <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
            Portfolio
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Overview
          </div>
        </div>
      </div>
    </div>
  )
})

MultiRingProgress.displayName = 'MultiRingProgress'

// =============================================================================
// EXPORTS
// =============================================================================

export default ProgressRing