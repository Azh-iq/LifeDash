'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PasswordResetForm } from '@/components/features/auth/password-reset-form'
import { type PasswordResetData } from '@/lib/validation/auth.schema'
import { useToast } from '@/components/ui/toast'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
      // Simulate token validation
      setTimeout(() => {
        if (tokenParam === 'invalid-token') {
          setTokenValid(false)
        } else if (tokenParam === 'expired-token') {
          setTokenValid(false)
          setError('This password reset link has expired. Please request a new one.')
        } else {
          setTokenValid(true)
        }
      }, 500)
    } else {
      setTokenValid(false)
      setError('Invalid or missing reset token.')
    }
  }, [searchParams])

  const handlePasswordReset = async (data: PasswordResetData) => {
    setLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simulate different scenarios
      if (data.token === 'invalid-token') {
        throw new Error('Invalid reset token')
      }
      
      if (data.token === 'expired-token') {
        throw new Error('Reset token has expired')
      }

      // Success
      setSuccess(true)
      toast({
        title: 'Password updated!',
        description: 'Your password has been successfully changed.',
        variant: 'success',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
      toast({
        title: 'Reset Failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Loading state while validating token
  if (tokenValid === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
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
              <p className="text-neutral-600 dark:text-neutral-400">
                Validating reset token...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Invalid token state
  if (!tokenValid || !token) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
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
            </div>
            <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Invalid reset link
            </CardTitle>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              {error || 'This password reset link is invalid or has expired.'}
            </p>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Password reset links expire after 1 hour for security reasons.
              </p>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => router.push('/auth/forgot-password')}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                Request new reset link
              </button>
              
              <button
                onClick={() => router.push('/auth/login')}
                className="block w-full text-center text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                Back to sign in
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full">
        <PasswordResetForm
          token={token}
          onSubmit={handlePasswordReset}
          loading={loading}
          error={error}
          success={success}
        />
        
        {/* Demo information */}
        {!success && (
          <div className="mt-8 max-w-md mx-auto">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Demo Information
              </h3>
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <div>
                  <strong>Token validation examples:</strong>
                </div>
                <div>
                  • <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">?token=invalid-token</code> - Shows invalid token error
                </div>
                <div>
                  • <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">?token=expired-token</code> - Shows expired token error
                </div>
                <div>
                  • <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">?token=valid-token</code> - Shows password reset form
                </div>
                <div className="pt-2 text-xs">
                  <strong>Note:</strong> Try different URLs to see various token states.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}