'use client'

import { useState, useEffect, useCallback, memo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { X, ChevronUp } from 'lucide-react'

interface ActionSheetItem {
  id: string
  label: string
  icon?: React.ElementType
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
  badge?: string
}

interface MobileActionSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  items: ActionSheetItem[]
  showHandle?: boolean
  closeOnAction?: boolean
  cancelLabel?: string
  className?: string
}

const MobileActionSheet = memo(
  ({
    isOpen,
    onClose,
    title,
    subtitle,
    items,
    showHandle = true,
    closeOnAction = true,
    cancelLabel = 'Cancel',
    className,
  }: MobileActionSheetProps) => {
    const [isVisible, setIsVisible] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)
    const [dragY, setDragY] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const sheetRef = useRef<HTMLDivElement>(null)
    const startY = useRef(0)
    const currentY = useRef(0)

    // Handle open/close animations
    useEffect(() => {
      if (isOpen) {
        setIsVisible(true)
        setIsAnimating(true)
        setTimeout(() => setIsAnimating(false), 300)
      } else {
        setIsAnimating(true)
        setTimeout(() => {
          setIsVisible(false)
          setIsAnimating(false)
          setDragY(0)
        }, 300)
      }
    }, [isOpen])

    // Handle escape key
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          onClose()
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    // Lock body scroll when open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
        return () => {
          document.body.style.overflow = 'unset'
        }
      }
    }, [isOpen])

    // Touch handlers for drag-to-dismiss
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      const touch = e.touches[0]
      startY.current = touch.clientY
      currentY.current = touch.clientY
      setIsDragging(true)
    }, [])

    const handleTouchMove = useCallback(
      (e: React.TouchEvent) => {
        if (!isDragging) return

        const touch = e.touches[0]
        currentY.current = touch.clientY
        const deltaY = currentY.current - startY.current

        // Only allow dragging down
        if (deltaY > 0) {
          setDragY(deltaY)
        }
      },
      [isDragging]
    )

    const handleTouchEnd = useCallback(() => {
      setIsDragging(false)

      // If dragged more than 100px, close the sheet
      if (dragY > 100) {
        onClose()
      } else {
        // Snap back to original position
        setDragY(0)
      }
    }, [dragY, onClose])

    const handleItemClick = useCallback(
      (item: ActionSheetItem) => {
        if (item.disabled) return

        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(item.destructive ? 100 : 50)
        }

        item.onClick()

        if (closeOnAction) {
          onClose()
        }
      },
      [closeOnAction, onClose]
    )

    const handleBackdropClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      },
      [onClose]
    )

    const handleClose = useCallback(() => {
      onClose()
    }, [onClose])

    if (!isVisible) return null

    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-end justify-center',
          className
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            'absolute inset-0 bg-black/50 transition-opacity duration-300',
            isOpen && !isAnimating ? 'opacity-100' : 'opacity-0'
          )}
          onClick={handleBackdropClick}
        />

        {/* Action Sheet */}
        <div
          ref={sheetRef}
          className={cn(
            'relative w-full max-w-md rounded-t-2xl bg-white shadow-xl transition-transform duration-300',
            'safe-area-inset-bottom',
            isOpen && !isAnimating ? 'translate-y-0' : 'translate-y-full'
          )}
          style={{
            transform: `translateY(${isOpen && !isAnimating ? dragY : '100%'}px)`,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Handle */}
          {showHandle && (
            <div className="flex justify-center pb-2 pt-4">
              <div className="h-1 w-12 rounded-full bg-gray-300" />
            </div>
          )}

          {/* Header */}
          {(title || subtitle) && (
            <div className="border-b border-gray-200 px-6 py-4">
              {title && (
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
          )}

          {/* Action Items */}
          <div className="py-2">
            {items.map((item, index) => {
              const Icon = item.icon

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={cn(
                    'flex w-full items-center justify-between px-6 py-4 text-left transition-colors',
                    'touch-manipulation active:bg-gray-50',
                    item.destructive
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-900 hover:bg-gray-50',
                    item.disabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    {Icon && (
                      <Icon
                        className={cn(
                          'h-5 w-5',
                          item.destructive ? 'text-red-500' : 'text-gray-400'
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        'font-medium',
                        item.destructive ? 'text-red-600' : 'text-gray-900'
                      )}
                    >
                      {item.label}
                    </span>
                  </div>

                  {item.badge && (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Cancel Button */}
          <div className="border-t border-gray-200 px-6 py-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="w-full font-medium"
            >
              {cancelLabel}
            </Button>
          </div>
        </div>
      </div>
    )
  }
)

MobileActionSheet.displayName = 'MobileActionSheet'

export default MobileActionSheet

// Context Menu Alternative for Mobile
export const MobileContextMenu = memo(
  ({
    trigger,
    items,
    align = 'bottom',
  }: {
    trigger: React.ReactNode
    items: ActionSheetItem[]
    align?: 'top' | 'bottom'
  }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const triggerRef = useRef<HTMLDivElement>(null)

    const handleTriggerClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault()

        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect()
          setPosition({
            x: rect.left + rect.width / 2,
            y: align === 'top' ? rect.top : rect.bottom,
          })
        }

        setIsOpen(true)
      },
      [align]
    )

    const handleClose = useCallback(() => {
      setIsOpen(false)
    }, [])

    return (
      <>
        <div
          ref={triggerRef}
          onClick={handleTriggerClick}
          className="cursor-pointer"
        >
          {trigger}
        </div>

        {isOpen && (
          <div className="fixed inset-0 z-50" onClick={handleClose}>
            <div
              className={cn(
                'absolute min-w-48 rounded-xl border border-gray-200 bg-white py-2 shadow-lg',
                '-translate-x-1/2 transform',
                align === 'top' ? '-translate-y-full' : 'translate-y-2'
              )}
              style={{
                left: position.x,
                top: position.y,
              }}
            >
              {items.map(item => {
                const Icon = item.icon

                return (
                  <button
                    key={item.id}
                    onClick={e => {
                      e.stopPropagation()
                      item.onClick()
                      handleClose()
                    }}
                    disabled={item.disabled}
                    className={cn(
                      'flex w-full items-center space-x-3 px-4 py-3 text-left transition-colors',
                      'hover:bg-gray-50 active:bg-gray-100',
                      item.destructive ? 'text-red-600' : 'text-gray-900',
                      item.disabled && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    {Icon && (
                      <Icon
                        className={cn(
                          'h-4 w-4',
                          item.destructive ? 'text-red-500' : 'text-gray-400'
                        )}
                      />
                    )}
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </>
    )
  }
)

MobileContextMenu.displayName = 'MobileContextMenu'

// Quick Action Sheet Hook
export const useActionSheet = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<{
    title?: string
    subtitle?: string
    items: ActionSheetItem[]
  }>({ items: [] })

  const showActionSheet = useCallback(
    (newConfig: {
      title?: string
      subtitle?: string
      items: ActionSheetItem[]
    }) => {
      setConfig(newConfig)
      setIsOpen(true)
    },
    []
  )

  const hideActionSheet = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    config,
    showActionSheet,
    hideActionSheet,
  }
}
