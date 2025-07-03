'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import {
  passwordResetRequestSchema,
  passwordResetSchema,
  type PasswordResetRequestData,
  type PasswordResetData,
} from '@/lib/validation/auth.schema'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import PasswordStrength from './password-strength'

// Password Reset Request Form
export interface PasswordResetRequestFormProps {
  onSubmit: (data: PasswordResetRequestData) => Promise<void>
  loading?: boolean
  error?: string | null
  success?: boolean
  className?: string
}

export const PasswordResetRequestForm: React.FC<PasswordResetRequestFormProps> = ({
  onSubmit,
  loading = false,
  error = null,
  success = false,
  className,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<PasswordResetRequestData>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: '',
    },
  })

  const handleFormSubmit = async (data: PasswordResetRequestData) => {
    try {
      clearErrors()
      await onSubmit(data)
    } catch (err) {
      if (err instanceof Error) {
        setError('email', { message: err.message })
      }
    }
  }

  const isLoading = loading || isSubmitting

  if (success) {
    return (
      <Card className={cn('w-full max-w-md mx-auto', className)}>
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Check your email
          </CardTitle>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            We&apos;ve sent a password reset link to your email address.
          </p>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              If you don&apos;t see the email in your inbox, check your spam folder.
              The link will expire in 1 hour.
            </p>
          </div>
          
          <div className="space-y-2">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              Send another email
            </Button>
            
            <Link
              href="/auth/login"
              className="block w-full text-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Reset your password
        </CardTitle>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          <Input
            {...register('email')}
            type="email"
            label="Email address"
            placeholder="Enter your email"
            error={errors.email?.message}
            disabled={isLoading}
            autoComplete="email"
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
            }
          />

          <Button
            type="submit"
            loading={isLoading}
            loadingText="Sending reset link..."
            className="w-full"
            size="lg"
          >
            Send reset link
          </Button>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Password Reset Form (for when user clicks the reset link)
export interface PasswordResetFormProps {
  token: string
  onSubmit: (data: PasswordResetData) => Promise<void>
  loading?: boolean
  error?: string | null
  success?: boolean
  className?: string
}

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  token,
  onSubmit,
  loading = false,
  error = null,
  success = false,
  className,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<PasswordResetData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      token,
      password: '',
      confirmPassword: '',
    },
  })

  const watchedPassword = watch('password')

  const handleFormSubmit = async (data: PasswordResetData) => {
    try {
      clearErrors()
      await onSubmit(data)
    } catch (err) {
      if (err instanceof Error) {
        setError('root', { message: err.message })
      }
    }
  }

  const isLoading = loading || isSubmitting

  if (success) {
    return (
      <Card className={cn('w-full max-w-md mx-auto', className)}>
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Password reset successful
          </CardTitle>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Your password has been successfully updated.
          </p>
        </CardHeader>
        
        <CardContent className="text-center">
          <Link href="/auth/login">
            <Button className="w-full" size="lg">
              Sign in with new password
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Create new password
        </CardTitle>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2">
          Your new password must be different from your previous password.
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {(error || errors.root) && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error || errors.root?.message}
                </p>
              </div>
            </div>
          )}

          {/* Hidden token field */}
          <input {...register('token')} type="hidden" />

          {/* New password field with strength meter */}
          <div className="space-y-3">
            <Input
              {...register('password')}
              type="password"
              label="New password"
              placeholder="Create a strong password"
              error={errors.password?.message}
              disabled={isLoading}
              autoComplete="new-password"
              showPasswordToggle
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              }
            />
            
            {watchedPassword && (
              <PasswordStrength
                password={watchedPassword}
                showFeedback={true}
                className="mt-2"
              />
            )}
          </div>

          {/* Confirm new password field */}
          <Input
            {...register('confirmPassword')}
            type="password"
            label="Confirm new password"
            placeholder="Confirm your new password"
            error={errors.confirmPassword?.message}
            disabled={isLoading}
            autoComplete="new-password"
            showPasswordToggle
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />

          <Button
            type="submit"
            loading={isLoading}
            loadingText="Updating password..."
            className="w-full"
            size="lg"
          >
            Update password
          </Button>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}