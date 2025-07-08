'use client'

import React, { useState, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { FinancialIcon, CurrencyIcon, StatusIcon } from './financial-icons'
import type { FinancialIcons } from './financial-icons'

interface EnhancedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  success?: boolean
  icon?: keyof typeof FinancialIcons
  currency?: string
  floatingLabel?: boolean
  variant?: 'default' | 'dark'
  helpText?: string
}

export const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  (
    {
      label,
      error,
      success,
      icon,
      currency,
      floatingLabel = true,
      variant = 'default',
      helpText,
      className,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [hasValue, setHasValue] = useState(
      Boolean(props.value || props.defaultValue)
    )

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      props.onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(Boolean(e.target.value))
      props.onChange?.(e)
    }

    const isLabelFloated = isFocused || hasValue

    return (
      <div className="relative w-full">
        {/* Input Container */}
        <div className="relative">
          {/* Background with gradient border effect */}
          <div
            className={cn(
              'absolute inset-0 rounded-lg transition-all duration-300',
              variant === 'dark'
                ? [
                    // Dark theme background
                    'bg-gradient-to-r p-[2px]',
                    error
                      ? 'from-red-500 via-red-600 to-red-700'
                      : success
                        ? 'from-green-500 via-green-600 to-green-700'
                        : isFocused
                          ? 'from-orange-400 via-orange-500 to-orange-600'
                          : 'from-gray-600 via-gray-700 to-gray-800',
                  ]
                : [
                    // Light theme background
                    'bg-gradient-to-r p-[2px]',
                    error
                      ? 'from-red-400 via-red-500 to-red-600'
                      : success
                        ? 'from-green-400 via-green-500 to-green-600'
                        : isFocused
                          ? 'from-purple-400 via-purple-500 to-purple-600'
                          : 'from-gray-200 via-gray-300 to-gray-400',
                  ]
            )}
          >
            <div
              className={cn(
                'h-full w-full rounded-lg',
                variant === 'dark' ? 'bg-gray-900' : 'bg-white'
              )}
            />
          </div>

          {/* Input Element */}
          <input
            ref={ref}
            {...props}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            className={cn(
              // Base styles
              'relative w-full rounded-lg px-4 py-3 transition-all duration-300',
              'border-0 bg-transparent focus:outline-none focus:ring-0',
              'placeholder-transparent',

              // Theme-specific text color
              variant === 'dark' ? 'text-white' : 'text-gray-900',

              // Padding adjustments for icons
              icon && 'pl-12',
              currency && 'pr-12',
              icon && currency && 'pl-12 pr-12',

              // Floating label padding
              floatingLabel && 'pb-2 pt-6',

              className
            )}
            placeholder=""
          />

          {/* Floating Label */}
          {floatingLabel && (
            <label
              className={cn(
                'pointer-events-none absolute left-4 transition-all duration-300',
                'origin-left transform',
                variant === 'dark' ? 'text-gray-300' : 'text-gray-600',

                // Floating state
                isLabelFloated
                  ? [
                      'top-2 scale-90 text-xs',
                      error
                        ? 'text-red-500'
                        : success
                          ? 'text-green-500'
                          : variant === 'dark'
                            ? 'text-orange-400'
                            : 'text-purple-600',
                    ]
                  : 'top-3.5 text-base',

                // Icon adjustment
                icon && (isLabelFloated ? 'left-4' : 'left-12')
              )}
            >
              {label}
            </label>
          )}

          {/* Static Label (non-floating) */}
          {!floatingLabel && (
            <label
              className={cn(
                'mb-2 block text-sm font-medium',
                variant === 'dark' ? 'text-gray-200' : 'text-gray-700',
                error && 'text-red-600',
                success && 'text-green-600'
              )}
            >
              {label}
            </label>
          )}

          {/* Left Icon */}
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <FinancialIcon
                name={icon}
                className={cn(
                  'transition-colors duration-300',
                  variant === 'dark' ? 'text-gray-400' : 'text-gray-500',
                  isFocused &&
                    (variant === 'dark' ? 'text-orange-400' : 'text-purple-600')
                )}
                size={18}
              />
            </div>
          )}

          {/* Right Currency/Status Icon */}
          {currency && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CurrencyIcon
                currency={currency}
                className={cn(
                  'transition-colors duration-300',
                  variant === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}
                size={16}
              />
            </div>
          )}

          {/* Status Icon */}
          {(error || success) && !currency && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <StatusIcon status={error ? 'error' : 'success'} size={16} />
            </div>
          )}
        </div>

        {/* Help Text */}
        {helpText && !error && (
          <p
            className={cn(
              'mt-2 text-xs',
              variant === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}
          >
            {helpText}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p className="mt-2 text-xs text-red-600 duration-300 animate-in slide-in-from-left-2">
            {error}
          </p>
        )}

        {/* Success Message */}
        {success && !error && (
          <p className="mt-2 text-xs text-green-600 duration-300 animate-in slide-in-from-left-2">
            Gyldig verdi
          </p>
        )}
      </div>
    )
  }
)

EnhancedInput.displayName = 'EnhancedInput'

// Specialized number input for financial values
interface FinancialInputProps extends Omit<EnhancedInputProps, 'type'> {
  min?: number
  max?: number
  step?: number
  showCalculator?: boolean
}

export const FinancialInput = forwardRef<HTMLInputElement, FinancialInputProps>(
  ({ showCalculator = false, ...props }, ref) => {
    return (
      <EnhancedInput
        ref={ref}
        type="number"
        icon={showCalculator ? 'calculator' : 'banknote'}
        {...props}
      />
    )
  }
)

FinancialInput.displayName = 'FinancialInput'

// Date input with calendar icon
interface DateInputProps extends Omit<EnhancedInputProps, 'type'> {}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (props, ref) => {
    return <EnhancedInput ref={ref} type="date" icon="calendar" {...props} />
  }
)

DateInput.displayName = 'DateInput'

// Search input for stocks
interface SearchInputProps extends Omit<EnhancedInputProps, 'type'> {}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (props, ref) => {
    return <EnhancedInput ref={ref} type="text" icon="search" {...props} />
  }
)

SearchInput.displayName = 'SearchInput'
