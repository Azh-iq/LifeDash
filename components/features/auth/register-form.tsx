'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { registerSchema, type RegisterFormData } from '@/lib/validation/auth.schema'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import PasswordStrength from './password-strength'

export interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => Promise<void>
  loading?: boolean
  error?: string | null
  className?: string
  showSignInLink?: boolean
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  loading = false,
  error = null,
  className,
  showSignInLink = true,
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      marketingEmails: false,
    },
    mode: 'onChange',
  })

  const watchedPassword = watch('password')

  const handleFormSubmit = async (data: RegisterFormData) => {
    try {
      clearErrors()
      await onSubmit(data)
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('email')) {
          setError('email', { message: err.message })
        } else {
          setError('root', { message: err.message })
        }
      }
    }
  }

  const isLoading = loading || isSubmitting

  return (
    <Card className={cn('w-full max-w-lg mx-auto', className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Create your account
        </CardTitle>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2">
          Get started with LifeDash today
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Global error message */}
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

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              {...register('firstName')}
              label="First name"
              placeholder="John"
              error={errors.firstName?.message}
              disabled={isLoading}
              autoComplete="given-name"
            />
            <Input
              {...register('lastName')}
              label="Last name"
              placeholder="Doe"
              error={errors.lastName?.message}
              disabled={isLoading}
              autoComplete="family-name"
            />
          </div>

          {/* Email field */}
          <Input
            {...register('email')}
            type="email"
            label="Email address"
            placeholder="john@example.com"
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

          {/* Password field with strength meter */}
          <div className="space-y-3">
            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              label="Password"
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

          {/* Confirm password field */}
          <Input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm password"
            placeholder="Confirm your password"
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

          {/* Terms and conditions */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                {...register('acceptTerms')}
                type="checkbox"
                className="w-4 h-4 mt-0.5 text-primary-600 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-neutral-800 focus:ring-2 dark:bg-neutral-700 dark:border-neutral-600"
                disabled={isLoading}
              />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                I agree to the{' '}
                <Link
                  href="/legal/terms"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
                  target="_blank"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href="/legal/privacy"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
                  target="_blank"
                >
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="text-sm text-red-600 dark:text-red-400 ml-7">
                {errors.acceptTerms.message}
              </p>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                {...register('marketingEmails')}
                type="checkbox"
                className="w-4 h-4 mt-0.5 text-primary-600 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-neutral-800 focus:ring-2 dark:bg-neutral-700 dark:border-neutral-600"
                disabled={isLoading}
              />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                I&apos;d like to receive product updates, tips, and promotional emails (optional)
              </span>
            </label>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            loading={isLoading}
            loadingText="Creating account..."
            className="w-full"
            size="lg"
          >
            Create account
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300 dark:border-neutral-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-neutral-950 text-neutral-500 dark:text-neutral-400">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social signup buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              className="w-full justify-center"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook</span>
              </div>
            </Button>
          </div>

          {/* Sign in link */}
          {showSignInLink && (
            <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

export default RegisterForm