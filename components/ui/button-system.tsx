'use client'

import React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { FinancialIcon } from './financial-icons'
import type { FinancialIcons } from './financial-icons'

// Professional button variants following design system principles
const buttonVariants = cva(
  // Base styles - consistent across all buttons
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-lg font-semibold transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'transform-gpu', // Hardware acceleration for animations
  ],
  {
    variants: {
      variant: {
        // Primary - Main actions (CTA)
        primary: [
          'bg-gradient-to-r from-orange-600 to-orange-700 text-white',
          'border border-orange-500 shadow-lg shadow-orange-600/25',
          'hover:from-orange-500 hover:to-orange-600 hover:shadow-xl hover:shadow-orange-600/30',
          'hover:scale-[1.02] active:scale-[0.98]',
          'focus-visible:ring-orange-500',
        ],
        // Secondary - Important but not primary actions
        secondary: [
          'bg-stone-800 text-orange-300 border border-orange-400/30',
          'shadow-md hover:bg-stone-700 hover:border-orange-400/50',
          'hover:text-orange-200 hover:scale-[1.01] active:scale-[0.99]',
          'focus-visible:ring-orange-400',
        ],
        // Tertiary - Supporting actions
        tertiary: [
          'bg-transparent text-stone-300 border border-stone-600',
          'hover:bg-stone-800/50 hover:text-stone-200 hover:border-stone-500',
          'hover:scale-[1.01] active:scale-[0.99]',
          'focus-visible:ring-stone-400',
        ],
        // Ghost - Minimal impact actions
        ghost: [
          'bg-transparent text-stone-400 border-none',
          'hover:bg-stone-800/30 hover:text-stone-300',
          'hover:scale-[1.01] active:scale-[0.99]',
          'focus-visible:ring-stone-400',
        ],
        // Destructive - Dangerous actions
        destructive: [
          'bg-gradient-to-r from-red-600 to-red-700 text-white',
          'border border-red-500 shadow-lg shadow-red-600/25',
          'hover:from-red-500 hover:to-red-600 hover:shadow-xl hover:shadow-red-600/30',
          'hover:scale-[1.02] active:scale-[0.98]',
          'focus-visible:ring-red-500',
        ],
        // Success - Positive confirmations
        success: [
          'bg-gradient-to-r from-green-600 to-green-700 text-white',
          'border border-green-500 shadow-lg shadow-green-600/25',
          'hover:from-green-500 hover:to-green-600 hover:shadow-xl hover:shadow-green-600/30',
          'hover:scale-[1.02] active:scale-[0.98]',
          'focus-visible:ring-green-500',
        ],
        // Light theme variants
        'primary-light': [
          'bg-gradient-to-r from-purple-600 to-indigo-600 text-white',
          'border border-purple-500 shadow-lg shadow-purple-600/25',
          'hover:from-purple-500 hover:to-indigo-500 hover:shadow-xl hover:shadow-purple-600/30',
          'hover:scale-[1.02] active:scale-[0.98]',
          'focus-visible:ring-purple-500',
        ],
        'secondary-light': [
          'bg-white text-purple-600 border border-purple-300',
          'shadow-md hover:bg-purple-50 hover:border-purple-400',
          'hover:text-purple-700 hover:scale-[1.01] active:scale-[0.99]',
          'focus-visible:ring-purple-400',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  icon?: keyof typeof FinancialIcons
  iconPosition?: 'left' | 'right'
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      icon,
      iconPosition = 'left',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    const isDisabled = disabled || loading

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}

        {!loading && icon && iconPosition === 'left' && (
          <FinancialIcon
            name={icon}
            size={size === 'sm' ? 14 : size === 'lg' || size === 'xl' ? 18 : 16}
          />
        )}

        {!loading && children}

        {!loading && icon && iconPosition === 'right' && (
          <FinancialIcon
            name={icon}
            size={size === 'sm' ? 14 : size === 'lg' || size === 'xl' ? 18 : 16}
          />
        )}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

// Specialized button components for common use cases
export const PrimaryActionButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'variant'>
>(({ children, ...props }, ref) => (
  <Button ref={ref} variant="primary" size="lg" {...props}>
    {children}
  </Button>
))

export const SecondaryActionButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'variant'>
>(({ children, ...props }, ref) => (
  <Button ref={ref} variant="secondary" size="md" {...props}>
    {children}
  </Button>
))

export const IconButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'size'>
>(({ children, icon, ...props }, ref) => (
  <Button ref={ref} size="icon" icon={icon} {...props}>
    {children}
  </Button>
))

// Button group component for proper visual grouping
interface ButtonGroupProps {
  children: React.ReactNode
  orientation?: 'horizontal' | 'vertical'
  spacing?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ButtonGroup({
  children,
  orientation = 'horizontal',
  spacing = 'md',
  className,
}: ButtonGroupProps) {
  const spacingClasses = {
    sm: orientation === 'horizontal' ? 'gap-2' : 'gap-2',
    md: orientation === 'horizontal' ? 'gap-3' : 'gap-3',
    lg: orientation === 'horizontal' ? 'gap-4' : 'gap-4',
  }

  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col',
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </div>
  )
}

// Action bar component for grouping related actions
interface ActionBarProps {
  title?: string
  description?: string
  primaryAction?: React.ReactNode
  secondaryActions?: React.ReactNode[]
  className?: string
}

export function ActionBar({
  title,
  description,
  primaryAction,
  secondaryActions = [],
  className,
}: ActionBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        'rounded-xl border border-stone-700 bg-stone-900/50 p-4',
        'backdrop-blur-sm',
        className
      )}
    >
      {(title || description) && (
        <div className="min-w-0 flex-1">
          {title && (
            <h3 className="truncate text-lg font-semibold text-stone-100">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-stone-400">{description}</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {secondaryActions.length > 0 && (
          <ButtonGroup spacing="sm">{secondaryActions}</ButtonGroup>
        )}
        {primaryAction}
      </div>
    </div>
  )
}

// Export the main button and its variants
export { Button, buttonVariants }
export default Button
