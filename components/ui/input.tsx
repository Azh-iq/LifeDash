'use client'

import { forwardRef, useState } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const inputVariants = cva(
  // Base styles with LifeDash design system - white background with dark text
  'flex w-full rounded-lg border bg-white px-3 py-2 text-sm transition-all duration-200 text-gray-900 placeholder:text-gray-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20',
        error:
          'border-error-500 text-error-600 placeholder:text-error-400 focus:border-error-500 focus:ring-1 focus:ring-error-500/20',
        success:
          'border-success-500 text-success-600 placeholder:text-success-400 focus:border-success-500 focus:ring-1 focus:ring-success-500/20',
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        default: 'h-10 px-3',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string
  description?: string
  error?: string
  success?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  showPasswordToggle?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      type = 'text',
      label,
      description,
      error,
      success,
      leftIcon,
      rightIcon,
      showPasswordToggle = false,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    // Determine the current variant based on validation state
    const currentVariant = error ? 'error' : success ? 'success' : variant

    // Generate unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const descriptionId = description ? `${inputId}-description` : undefined
    const errorId = error ? `${inputId}-error` : undefined
    const successId = success ? `${inputId}-success` : undefined

    const isPassword = type === 'password' && showPasswordToggle
    const inputType = isPassword && showPassword ? 'text' : type

    const EyeIcon = ({ open }: { open: boolean }) => (
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {open ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
          />
        )}
      </svg>
    )

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'mb-2 block text-sm font-medium transition-colors duration-200',
              error ? 'text-error-600' : 'text-gray-900',
              isFocused && !error && 'text-primary-600'
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            type={inputType}
            className={cn(
              inputVariants({ variant: currentVariant, size, className }),
              leftIcon && 'pl-10',
              (rightIcon || isPassword) && 'pr-10'
            )}
            ref={ref}
            id={inputId}
            aria-describedby={cn(descriptionId, errorId, successId)}
            aria-invalid={!!error}
            onFocus={e => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={e => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />

          {(rightIcon || isPassword) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isPassword ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 transition-colors duration-200 hover:text-gray-600 focus:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              ) : (
                <div className="text-gray-400">{rightIcon}</div>
              )}
            </div>
          )}
        </div>

        {description && !error && !success && (
          <p
            id={descriptionId}
            className="mt-1 text-xs text-neutral-500 dark:text-neutral-400"
          >
            {description}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400"
            role="alert"
          >
            <svg
              className="h-3 w-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {success && (
          <p
            id={successId}
            className="mt-1 flex items-center gap-1 text-xs text-green-600 dark:text-green-400"
            role="status"
          >
            <svg
              className="h-3 w-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {success}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input, inputVariants }
