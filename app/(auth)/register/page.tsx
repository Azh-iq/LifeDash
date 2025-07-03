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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md mx-auto text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
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

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-left">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
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
                <ul className="text-sm text-blue-800 dark:text-blue-300 mt-1 space-y-1">
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
                  description: 'We\'ve sent another verification email.',
                  variant: 'success',
                })
              }}
              className="w-full px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg transition-colors"
            >
              Resend verification email
            </button>
            
            <button
              onClick={() => router.push('/auth/login')}
              className="block w-full text-center text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              Already verified? Sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full">
        <RegisterForm
          onSubmit={handleRegister}
          loading={loading}
          error={error}
        />
        
        {/* Demo information */}
        <div className="mt-8 max-w-lg mx-auto">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Demo Information
            </h3>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <div>
                <strong>Try these emails to see different behaviors:</strong>
              </div>
              <div>
                • <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">existing@test.com</code> - Shows "email already exists" error
              </div>
              <div>
                • <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">error@test.com</code> - Shows generic registration error
              </div>
              <div>
                • Any other email - Shows successful registration flow
              </div>
              <div className="pt-2 text-xs">
                <strong>Note:</strong> The password strength meter updates in real-time as you type.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}