'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '@/components/features/auth/login-form'
import { TwoFactorVerify } from '@/components/features/auth/two-factor-auth'
import { type LoginFormData, type TwoFactorVerifyData } from '@/lib/validation/auth.schema'
import { useToast } from '@/components/ui/toast'

type AuthStep = 'login' | '2fa' | 'success'

export default function LoginPage() {
  const [step, setStep] = useState<AuthStep>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true)
    setError(null)
    setEmail(data.email)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simulate different login scenarios
      if (data.email === 'user@2fa.com') {
        // User has 2FA enabled
        setStep('2fa')
        toast({
          title: '2FA Required',
          description: 'Please enter your two-factor authentication code.',
          variant: 'info',
        })
      } else if (data.email === 'error@test.com') {
        // Simulate login error
        throw new Error('Invalid email or password')
      } else {
        // Successful login without 2FA
        setStep('success')
        toast({
          title: 'Welcome back!',
          description: 'You have been successfully signed in.',
          variant: 'success',
        })
        
        // Redirect after short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      toast({
        title: 'Login Failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTwoFactor = async (data: TwoFactorVerifyData) => {
    setLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simulate 2FA verification
      if (data.code === '123456' || data.backupCode === 'BACKUP123') {
        setStep('success')
        toast({
          title: 'Welcome back!',
          description: 'Two-factor authentication successful.',
          variant: 'success',
        })
        
        // Redirect after short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        throw new Error('Invalid authentication code')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '2FA verification failed')
      toast({
        title: '2FA Failed',
        description: err instanceof Error ? err.message : 'Please check your code and try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Welcome back!
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Redirecting to your dashboard...
          </p>
          <div className="w-8 h-8 mx-auto">
            <svg
              className="animate-spin h-8 w-8 text-primary-600"
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
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      {step === 'login' && (
        <div className="w-full">
          <LoginForm
            onSubmit={handleLogin}
            loading={loading}
            error={error}
          />
          
          {/* Demo credentials */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Demo Credentials
              </h3>
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <div>
                  <strong>Regular login:</strong> any email + any password
                </div>
                <div>
                  <strong>2FA demo:</strong> user@2fa.com + any password
                  <br />
                  <span className="text-xs">Then use code: 123456 or backup: BACKUP123</span>
                </div>
                <div>
                  <strong>Error demo:</strong> error@test.com + any password
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === '2fa' && (
        <div className="w-full">
          <TwoFactorVerify
            onSubmit={handleTwoFactor}
            loading={loading}
            error={error}
          />
          
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setStep('login')
                setError(null)
              }}
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              ← Back to login
            </button>
          </div>
        </div>
      )}
    </div>
  )
}