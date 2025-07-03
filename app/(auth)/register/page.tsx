'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import RegisterForm from '@/components/features/auth/register-form'
import { type RegisterFormData } from '@/lib/validation/auth.schema'
import { useToast } from '@/components/ui/toast'

type RegistrationStep = 'form' | 'success'

export default function RegisterPage() {
  const [step, setStep] = useState<RegistrationStep>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  const handleRegister = async (data: RegisterFormData) => {
    setLoading(true)
    setError(null)
    setEmail(data.email)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simulate different registration scenarios
      if (data.email === 'existing@test.com') {
        throw new Error('An account with this email already exists')
      }

      if (data.email === 'error@test.com') {
        throw new Error('Registration failed. Please try again.')
      }

      // Successful registration
      setStep('success')
      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account.',
        variant: 'success',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
      toast({
        title: 'Registration Failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <svg
              className="h-8 w-8 text-green-600 dark:text-green-400"
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
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Check your email
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              We&apos;ve sent a verification link to{' '}
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {email}
              </span>
            </p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-left dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Next steps:
                </h4>
                <ul className="mt-1 space-y-1 text-sm text-blue-800 dark:text-blue-300">
                  <li>1. Check your email inbox (and spam folder)</li>
                  <li>2. Click the verification link</li>
                  <li>3. Complete your profile setup</li>
                  <li>4. Start using LifeDash!</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                // Simulate resending verification email
                toast({
                  title: 'Email sent!',
                  description: "We've sent another verification email.",
                  variant: 'success',
                })
              }}
              className="w-full rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-100 hover:text-primary-700 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30 dark:hover:text-primary-300"
            >
              Resend verification email
            </button>

            <button
              onClick={() => router.push('/auth/login')}
              className="block w-full text-center text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Already verified? Sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full">
        <RegisterForm
          onSubmit={handleRegister}
          loading={loading}
          error={error}
        />

        {/* Demo information */}
        <div className="mx-auto mt-8 max-w-lg">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
              Demo Information
            </h3>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <div>
                <strong>Try these emails to see different behaviors:</strong>
              </div>
              <div>
                •{' '}
                <code className="rounded bg-blue-100 px-1 dark:bg-blue-800">
                  existing@test.com
                </code>{' '}
                - Shows "email already exists" error
              </div>
              <div>
                •{' '}
                <code className="rounded bg-blue-100 px-1 dark:bg-blue-800">
                  error@test.com
                </code>{' '}
                - Shows generic registration error
              </div>
              <div>• Any other email - Shows successful registration flow</div>
              <div className="pt-2 text-xs">
                <strong>Note:</strong> The password strength meter updates in
                real-time as you type.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
