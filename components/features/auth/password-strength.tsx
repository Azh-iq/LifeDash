'use client'

import React, { useMemo } from 'react'
import { cn } from '@/lib/utils/cn'
import { getPasswordStrength } from '@/lib/validation/auth.schema'

export interface PasswordStrengthProps {
  password: string
  showFeedback?: boolean
  showScore?: boolean
  className?: string
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  showFeedback = true,
  showScore = false,
  className,
}) => {
  const { score, strength, feedback, isValid } = useMemo(
    () => getPasswordStrength(password),
    [password]
  )

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'strong':
        return 'bg-blue-500'
      case 'very-strong':
        return 'bg-green-500'
      default:
        return 'bg-neutral-300'
    }
  }

  const getStrengthText = (strength: string) => {
    switch (strength) {
      case 'weak':
        return 'Weak'
      case 'medium':
        return 'Fair'
      case 'strong':
        return 'Strong'
      case 'very-strong':
        return 'Very Strong'
      default:
        return 'Enter password'
    }
  }

  const getStrengthTextColor = (strength: string) => {
    switch (strength) {
      case 'weak':
        return 'text-red-600 dark:text-red-400'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'strong':
        return 'text-blue-600 dark:text-blue-400'
      case 'very-strong':
        return 'text-green-600 dark:text-green-400'
      default:
        return 'text-neutral-500 dark:text-neutral-400'
    }
  }

  if (!password) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex justify-between items-center">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            Password strength
          </span>
        </div>
        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
          <div className="bg-neutral-300 dark:bg-neutral-600 h-2 rounded-full w-0 transition-all duration-300" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength meter */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            Password strength
          </span>
          <div className="flex items-center gap-2">
            {showScore && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {score}/100
              </span>
            )}
            <span className={cn('text-sm font-medium', getStrengthTextColor(strength))}>
              {getStrengthText(strength)}
            </span>
            {isValid && (
              <svg
                className="w-4 h-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        </div>
        
        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-500 ease-out',
              getStrengthColor(strength)
            )}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Strength indicators */}
      <div className="grid grid-cols-4 gap-1">
        {['weak', 'medium', 'strong', 'very-strong'].map((level, index) => {
          const isActive = 
            (level === 'weak' && score >= 25) ||
            (level === 'medium' && score >= 50) ||
            (level === 'strong' && score >= 75) ||
            (level === 'very-strong' && score >= 90)
          
          return (
            <div
              key={level}
              className={cn(
                'h-1 rounded-full transition-all duration-300',
                isActive ? getStrengthColor(level) : 'bg-neutral-200 dark:bg-neutral-700'
              )}
            />
          )
        })}
      </div>

      {/* Feedback messages */}
      {showFeedback && feedback.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            To strengthen your password:
          </h4>
          <ul className="space-y-1">
            {feedback.map((message, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400"
              >
                <svg
                  className="w-3 h-3 mt-0.5 text-neutral-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span>{message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Requirements checklist */}
      {password && (
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Requirements:
          </h4>
          <div className="grid grid-cols-1 gap-1">
            {[
              { test: password.length >= 8, label: 'At least 8 characters' },
              { test: /[A-Z]/.test(password), label: 'One uppercase letter' },
              { test: /[a-z]/.test(password), label: 'One lowercase letter' },
              { test: /\d/.test(password), label: 'One number' },
              { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), label: 'One special character' },
            ].map((requirement, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs"
              >
                <div
                  className={cn(
                    'w-3 h-3 rounded-full flex items-center justify-center transition-colors duration-200',
                    requirement.test
                      ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                  )}
                >
                  {requirement.test ? (
                    <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <div className="w-1 h-1 rounded-full bg-current" />
                  )}
                </div>
                <span
                  className={cn(
                    'transition-colors duration-200',
                    requirement.test
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-neutral-500 dark:text-neutral-400'
                  )}
                >
                  {requirement.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PasswordStrength

// Compact version for inline use
export interface PasswordStrengthCompactProps {
  password: string
  className?: string
}

export const PasswordStrengthCompact: React.FC<PasswordStrengthCompactProps> = ({
  password,
  className,
}) => {
  const { score, strength, isValid } = useMemo(
    () => getPasswordStrength(password),
    [password]
  )

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'strong':
        return 'bg-blue-500'
      case 'very-strong':
        return 'bg-green-500'
      default:
        return 'bg-neutral-300'
    }
  }

  if (!password) return null

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-full h-1">
        <div
          className={cn(
            'h-1 rounded-full transition-all duration-500 ease-out',
            getStrengthColor(strength)
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      {isValid && (
        <svg
          className="w-3 h-3 text-green-500 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </div>
  )
}

// Hook for password strength
export const usePasswordStrength = (password: string) => {
  return useMemo(() => getPasswordStrength(password), [password])
}