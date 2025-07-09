'use client'

import React, { 
  useState, 
  useCallback, 
  useRef, 
  useEffect,
  ReactNode,
  TouchEvent,
  PointerEvent
} from 'react'
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { useResponsiveLayout } from '@/lib/hooks/use-responsive-layout'
import { cn } from '@/lib/utils'

interface MobileGestureHandlerProps {
  children: ReactNode
  enabled: boolean
  onSwipeLeft?: (widgetId: string) => void
  onSwipeRight?: (widgetId: string) => void
  onSwipeUp?: (widgetId: string) => void
  onSwipeDown?: (widgetId: string) => void
  onLongPress?: (widgetId: string) => void
  onTap?: (widgetId: string) => void
  onDoubleTap?: (widgetId: string) => void
  onPinch?: (widgetId: string, scale: number) => void
  swipeThreshold?: number
  longPressDelay?: number
  doubleTapDelay?: number
  hapticFeedback?: boolean
  className?: string
}

// Gesture detection thresholds
const GESTURE_THRESHOLDS = {
  swipe: {
    distance: 50,
    velocity: 300
  },
  longPress: {
    duration: 500,
    maxMovement: 10
  },
  doubleTap: {
    delay: 300,
    maxDistance: 20
  },
  pinch: {
    minScale: 0.5,
    maxScale: 2.0,
    threshold: 0.1
  }
}

// Touch point tracking
interface TouchPoint {
  id: number
  x: number
  y: number
  timestamp: number
}

// Gesture state
interface GestureState {
  isLongPressing: boolean
  longPressTimer: NodeJS.Timeout | null
  lastTap: number
  tapCount: number
  touchPoints: TouchPoint[]
  initialDistance: number
  currentScale: number
  gestureStartTime: number
  initialPosition: { x: number; y: number }
}

/**
 * Mobile Gesture Handler Component
 * 
 * Features:
 * - Swipe gestures (left, right, up, down)
 * - Long press detection
 * - Double tap recognition
 * - Pinch to zoom
 * - Haptic feedback simulation
 * - Touch point tracking
 * - Gesture conflict resolution
 * - Customizable thresholds
 * - Performance optimized
 */
export function MobileGestureHandler({
  children,
  enabled,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onLongPress,
  onTap,
  onDoubleTap,
  onPinch,
  swipeThreshold = GESTURE_THRESHOLDS.swipe.distance,
  longPressDelay = GESTURE_THRESHOLDS.longPress.duration,
  doubleTapDelay = GESTURE_THRESHOLDS.doubleTap.delay,
  hapticFeedback = true,
  className
}: MobileGestureHandlerProps) {
  const { isMobile, isTouch } = useResponsiveLayout()
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Gesture state
  const [gestureState, setGestureState] = useState<GestureState>({
    isLongPressing: false,
    longPressTimer: null,
    lastTap: 0,
    tapCount: 0,
    touchPoints: [],
    initialDistance: 0,
    currentScale: 1,
    gestureStartTime: 0,
    initialPosition: { x: 0, y: 0 }
  })

  // Motion values for visual feedback
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const rotate = useMotionValue(0)

  // Transform values for visual effects
  const opacity = useTransform(x, [-100, 0, 100], [0.5, 1, 0.5])
  const backgroundColor = useTransform(
    x,
    [-100, -50, 0, 50, 100],
    ['rgba(239, 68, 68, 0.1)', 'rgba(245, 158, 11, 0.1)', 'rgba(255, 255, 255, 0)', 'rgba(245, 158, 11, 0.1)', 'rgba(239, 68, 68, 0.1)']
  )

  // Haptic feedback helper
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!hapticFeedback || !navigator.vibrate) return
    
    const patterns = {
      light: [10],
      medium: [50],
      heavy: [100]
    }
    
    navigator.vibrate(patterns[type])
  }, [hapticFeedback])

  // Calculate distance between two touch points
  const getDistance = useCallback((point1: TouchPoint, point2: TouchPoint) => {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    )
  }, [])

  // Get widget ID from target element
  const getWidgetId = useCallback((element: HTMLElement): string => {
    let current = element
    while (current && current !== containerRef.current) {
      if (current.dataset.widgetId) {
        return current.dataset.widgetId
      }
      current = current.parentElement as HTMLElement
    }
    return ''
  }, [])

  // Handle touch start
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!enabled || !isTouch) return

    const touch = event.touches[0]
    const currentTime = Date.now()
    const widgetId = getWidgetId(event.target as HTMLElement)

    // Update touch points
    const touchPoints = Array.from(event.touches).map((touch, index) => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      timestamp: currentTime
    }))

    setGestureState(prev => ({
      ...prev,
      touchPoints,
      gestureStartTime: currentTime,
      initialPosition: { x: touch.clientX, y: touch.clientY }
    }))

    // Handle multi-touch (pinch)
    if (event.touches.length === 2) {
      const distance = getDistance(touchPoints[0], touchPoints[1])
      setGestureState(prev => ({
        ...prev,
        initialDistance: distance,
        currentScale: 1
      }))
    }

    // Handle single touch (tap, long press)
    if (event.touches.length === 1) {
      // Check for double tap
      if (currentTime - gestureState.lastTap < doubleTapDelay) {
        setGestureState(prev => ({
          ...prev,
          tapCount: prev.tapCount + 1,
          lastTap: currentTime
        }))
        
        if (gestureState.tapCount + 1 >= 2) {
          onDoubleTap?.(widgetId)
          triggerHapticFeedback('light')
          return
        }
      } else {
        setGestureState(prev => ({
          ...prev,
          tapCount: 1,
          lastTap: currentTime
        }))
      }

      // Start long press timer
      const longPressTimer = setTimeout(() => {
        setGestureState(prev => ({
          ...prev,
          isLongPressing: true
        }))
        onLongPress?.(widgetId)
        triggerHapticFeedback('heavy')
      }, longPressDelay)

      setGestureState(prev => ({
        ...prev,
        longPressTimer
      }))
    }
  }, [enabled, isTouch, getWidgetId, doubleTapDelay, gestureState.lastTap, gestureState.tapCount, onDoubleTap, onLongPress, triggerHapticFeedback, longPressDelay, getDistance])

  // Handle touch move
  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!enabled || !isTouch) return

    const touch = event.touches[0]
    const currentTime = Date.now()
    const widgetId = getWidgetId(event.target as HTMLElement)

    // Update touch points
    const touchPoints = Array.from(event.touches).map((touch, index) => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      timestamp: currentTime
    }))

    setGestureState(prev => ({
      ...prev,
      touchPoints
    }))

    // Handle pinch gesture
    if (event.touches.length === 2) {
      const distance = getDistance(touchPoints[0], touchPoints[1])
      const scaleChange = distance / gestureState.initialDistance
      
      if (Math.abs(scaleChange - 1) > GESTURE_THRESHOLDS.pinch.threshold) {
        setGestureState(prev => ({
          ...prev,
          currentScale: scaleChange
        }))
        
        scale.set(scaleChange)
        onPinch?.(widgetId, scaleChange)
      }
    }

    // Handle single touch movement
    if (event.touches.length === 1) {
      const deltaX = touch.clientX - gestureState.initialPosition.x
      const deltaY = touch.clientY - gestureState.initialPosition.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // Cancel long press if moved too much
      if (distance > GESTURE_THRESHOLDS.longPress.maxMovement) {
        if (gestureState.longPressTimer) {
          clearTimeout(gestureState.longPressTimer)
          setGestureState(prev => ({
            ...prev,
            longPressTimer: null,
            isLongPressing: false
          }))
        }
      }

      // Update visual feedback
      x.set(deltaX)
      y.set(deltaY)
      
      // Add slight rotation for visual effect
      const rotationAngle = deltaX * 0.1
      rotate.set(rotationAngle)
    }
  }, [enabled, isTouch, getWidgetId, gestureState.initialPosition, gestureState.initialDistance, gestureState.longPressTimer, getDistance, scale, onPinch, x, y, rotate])

  // Handle touch end
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!enabled || !isTouch) return

    const currentTime = Date.now()
    const widgetId = getWidgetId(event.target as HTMLElement)

    // Clear long press timer
    if (gestureState.longPressTimer) {
      clearTimeout(gestureState.longPressTimer)
      setGestureState(prev => ({
        ...prev,
        longPressTimer: null
      }))
    }

    // Handle swipe gestures
    if (gestureState.touchPoints.length > 0) {
      const touch = gestureState.touchPoints[0]
      const deltaX = touch.x - gestureState.initialPosition.x
      const deltaY = touch.y - gestureState.initialPosition.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const duration = currentTime - gestureState.gestureStartTime
      const velocity = distance / duration

      if (distance > swipeThreshold || velocity > GESTURE_THRESHOLDS.swipe.velocity) {
        // Determine swipe direction
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI
        
        if (Math.abs(angle) < 45) {
          // Swipe right
          onSwipeRight?.(widgetId)
          triggerHapticFeedback('medium')
        } else if (Math.abs(angle) > 135) {
          // Swipe left
          onSwipeLeft?.(widgetId)
          triggerHapticFeedback('medium')
        } else if (angle > 45 && angle < 135) {
          // Swipe down
          onSwipeDown?.(widgetId)
          triggerHapticFeedback('medium')
        } else if (angle < -45 && angle > -135) {
          // Swipe up
          onSwipeUp?.(widgetId)
          triggerHapticFeedback('medium')
        }
      } else if (!gestureState.isLongPressing && gestureState.tapCount === 1) {
        // Handle single tap
        setTimeout(() => {
          if (gestureState.tapCount === 1) {
            onTap?.(widgetId)
            triggerHapticFeedback('light')
          }
        }, doubleTapDelay)
      }
    }

    // Reset gesture state
    setGestureState(prev => ({
      ...prev,
      touchPoints: [],
      isLongPressing: false,
      currentScale: 1,
      tapCount: 0
    }))

    // Reset visual feedback
    x.set(0)
    y.set(0)
    scale.set(1)
    rotate.set(0)
  }, [enabled, isTouch, getWidgetId, gestureState.longPressTimer, gestureState.touchPoints, gestureState.initialPosition, gestureState.gestureStartTime, gestureState.isLongPressing, gestureState.tapCount, swipeThreshold, onSwipeRight, onSwipeLeft, onSwipeDown, onSwipeUp, triggerHapticFeedback, onTap, doubleTapDelay, x, y, scale, rotate])

  // Handle pan gesture (framer-motion)
  const handlePan = useCallback((event: any, info: PanInfo) => {
    if (!enabled || !isMobile) return

    const { offset, velocity, delta } = info
    const widgetId = getWidgetId(event.target as HTMLElement)

    // Update visual feedback
    x.set(offset.x)
    y.set(offset.y)
    
    // Add rotation effect
    const rotationAngle = offset.x * 0.05
    rotate.set(rotationAngle)
  }, [enabled, isMobile, getWidgetId, x, y, rotate])

  // Handle pan end
  const handlePanEnd = useCallback((event: any, info: PanInfo) => {
    if (!enabled || !isMobile) return

    const { offset, velocity } = info
    const widgetId = getWidgetId(event.target as HTMLElement)

    // Check for swipe gestures
    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > GESTURE_THRESHOLDS.swipe.velocity) {
      if (offset.x > 0) {
        onSwipeRight?.(widgetId)
      } else {
        onSwipeLeft?.(widgetId)
      }
      triggerHapticFeedback('medium')
    }

    if (Math.abs(offset.y) > swipeThreshold || Math.abs(velocity.y) > GESTURE_THRESHOLDS.swipe.velocity) {
      if (offset.y > 0) {
        onSwipeDown?.(widgetId)
      } else {
        onSwipeUp?.(widgetId)
      }
      triggerHapticFeedback('medium')
    }

    // Reset position
    x.set(0)
    y.set(0)
    rotate.set(0)
  }, [enabled, isMobile, getWidgetId, swipeThreshold, onSwipeRight, onSwipeLeft, onSwipeDown, onSwipeUp, triggerHapticFeedback, x, y, rotate])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gestureState.longPressTimer) {
        clearTimeout(gestureState.longPressTimer)
      }
    }
  }, [gestureState.longPressTimer])

  if (!enabled || !isMobile) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      ref={containerRef}
      className={cn('relative', className)}
      style={{
        x,
        y,
        scale,
        rotate,
        opacity,
        backgroundColor
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
      drag={false} // We handle dragging manually
      whileTap={{ scale: 0.98 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30
      }}
    >
      {children}
      
      {/* Gesture feedback overlay */}
      {gestureState.isLongPressing && (
        <motion.div
          className="absolute inset-0 bg-blue-500/20 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
      
      {/* Swipe direction indicator */}
      {Math.abs(x.get()) > 20 && (
        <motion.div
          className={cn(
            'absolute top-1/2 transform -translate-y-1/2 text-white font-semibold text-sm pointer-events-none',
            x.get() > 0 ? 'right-4' : 'left-4'
          )}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          {x.get() > 0 ? '→' : '←'}
        </motion.div>
      )}
    </motion.div>
  )
}