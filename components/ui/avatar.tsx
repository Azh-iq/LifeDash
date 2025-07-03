'use client'

import React, { forwardRef, useState } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full transition-all duration-200',
  {
    variants: {
      size: {
        sm: 'h-8 w-8',
        default: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
        '2xl': 'h-20 w-20',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export interface AvatarProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof avatarVariants> {
  src?: string
  alt?: string
  fallback?: string
  loading?: boolean
  onClick?: () => void
}

const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  (
    { className, size, src, alt, fallback, loading, onClick, ...props },
    ref
  ) => {
    const [imageError, setImageError] = useState(false)
    const [imageLoading, setImageLoading] = useState(true)

    const handleImageLoad = () => {
      setImageLoading(false)
    }

    const handleImageError = () => {
      setImageError(true)
      setImageLoading(false)
    }

    const getInitials = (name?: string) => {
      if (!name) return '?'
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    const shouldShowImage = src && !imageError && !loading
    const shouldShowFallback = !shouldShowImage || imageLoading

    return (
      <span
        ref={ref}
        className={cn(
          avatarVariants({ size }),
          onClick && 'cursor-pointer hover:opacity-80',
          className
        )}
        onClick={onClick}
        {...props}
      >
        {shouldShowImage && (
          <img
            src={src}
            alt={alt || 'Avatar'}
            className={cn(
              'aspect-square h-full w-full object-cover transition-opacity duration-200',
              imageLoading && 'opacity-0'
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}

        {shouldShowFallback && (
          <span
            className={cn(
              'flex h-full w-full items-center justify-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
              size === 'sm' && 'text-xs',
              size === 'default' && 'text-sm',
              size === 'lg' && 'text-base',
              size === 'xl' && 'text-lg',
              size === '2xl' && 'text-xl'
            )}
          >
            {loading ? (
              <svg
                className={cn(
                  'animate-spin',
                  size === 'sm' && 'h-3 w-3',
                  size === 'default' && 'h-4 w-4',
                  size === 'lg' && 'h-5 w-5',
                  size === 'xl' && 'h-6 w-6',
                  size === '2xl' && 'h-8 w-8'
                )}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              getInitials(fallback || alt)
            )}
          </span>
        )}
      </span>
    )
  }
)

Avatar.displayName = 'Avatar'

// Avatar Group component for multiple avatars
export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number
  spacing?: 'tight' | 'normal' | 'loose'
  size?: 'sm' | 'default' | 'lg' | 'xl' | '2xl'
  children: React.ReactNode
}

const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  (
    {
      className,
      max = 5,
      spacing = 'normal',
      size = 'default',
      children,
      ...props
    },
    ref
  ) => {
    const spacingClasses = {
      tight: '-space-x-1',
      normal: '-space-x-2',
      loose: '-space-x-1',
    }

    const childrenArray = React.Children.toArray(children)
    const visibleChildren = childrenArray.slice(0, max)
    const remainingCount = childrenArray.length - max

    return (
      <div
        ref={ref}
        className={cn('flex items-center', spacingClasses[spacing], className)}
        {...props}
      >
        {visibleChildren.map((child, index) => (
          <div
            key={index}
            className="relative rounded-full ring-2 ring-white dark:ring-neutral-900"
          >
            {React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<AvatarProps>, {
                  size,
                })
              : child}
          </div>
        ))}

        {remainingCount > 0 && (
          <div className="relative rounded-full ring-2 ring-white dark:ring-neutral-900">
            <Avatar
              size={size}
              fallback={`+${remainingCount}`}
              className="bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
            />
          </div>
        )}
      </div>
    )
  }
)

AvatarGroup.displayName = 'AvatarGroup'

export { Avatar, AvatarGroup, avatarVariants }
