'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { loginSchema, type LoginFormData } from '@/lib/validation/auth.schema'
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui'

export interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>
  loading?: boolean
  error?: string | null
  className?: string
  showRememberMe?: boolean
  showForgotPassword?: boolean
  showSignUpLink?: boolean
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  loading = false,
  error = null,
  className,
  showRememberMe = true,
  showForgotPassword = true,
  showSignUpLink = true,
}) => {
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const handleFormSubmit = async (data: LoginFormData) => {
    try {
      clearErrors()
      await onSubmit(data)
    } catch (err) {
      // Handle different types of errors
      if (err instanceof Error) {
        if (err.message.includes('email')) {
          setError('email', { message: err.message })
        } else if (err.message.includes('password')) {
          setError('password', { message: err.message })
        } else {
          setError('root', { message: err.message })
        }
      }
    }
  }

  const isLoading = loading || isSubmitting

  return (
    <Card className={cn('mx-auto w-full max-w-md', className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Welcome back
        </CardTitle>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Sign in to your LifeDash account
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Global error message */}
          {(error || errors.root) && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400"
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

          {/* Email field */}
          <div className="space-y-2">
            <Input
              {...register('email')}
              type="email"
              label="Email address"
              placeholder="Enter your email"
              error={errors.email?.message}
              disabled={isLoading}
              autoComplete="email"
              leftIcon={
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              }
            />
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Enter your password"
              error={errors.password?.message}
              disabled={isLoading}
              autoComplete="current-password"
              showPasswordToggle
              leftIcon={
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              }
            />
          </div>

          {/* Remember me and Forgot password */}
          <div className="flex items-center justify-between">
            {showRememberMe && (
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  className="h-4 w-4 rounded border-neutral-300 bg-neutral-100 text-primary-600 focus:ring-2 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-700 dark:ring-offset-neutral-800 dark:focus:ring-primary-600"
                  disabled={isLoading}
                />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Remember me
                </span>
              </label>
            )}

            {showForgotPassword && (
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Forgot password?
              </Link>
            )}
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            loading={isLoading}
            loadingText="Signing in..."
            className="w-full"
            size="lg"
          >
            Sign in
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300 dark:border-neutral-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              className="w-full justify-center"
            >
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Google</span>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              className="w-full justify-center"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook</span>
              </div>
            </Button>
          </div>

          {/* Sign up link */}
          {showSignUpLink && (
            <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Sign up
              </Link>
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

export default LoginForm

// Compact login form for modals or embedded use
export interface CompactLoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>
  loading?: boolean
  error?: string | null
  className?: string
}

export const CompactLoginForm: React.FC<CompactLoginFormProps> = ({
  onSubmit,
  loading = false,
  error = null,
  className,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const isLoading = loading || isSubmitting

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-4', className)}
    >
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <Input
        {...register('email')}
        type="email"
        placeholder="Email"
        error={errors.email?.message}
        disabled={isLoading}
        size="sm"
      />

      <Input
        {...register('password')}
        type="password"
        placeholder="Password"
        error={errors.password?.message}
        disabled={isLoading}
        size="sm"
        showPasswordToggle
      />

      <Button
        type="submit"
        loading={isLoading}
        loadingText="Signing in..."
        className="w-full"
        size="sm"
      >
        Sign in
      </Button>
    </form>
  )
}
