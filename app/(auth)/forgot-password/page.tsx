'use client'

import React, { useState } from 'react'
import { PasswordResetRequestForm } from '@/components/features/auth/password-reset-form'
import { type PasswordResetRequestData } from '@/lib/validation/auth.schema'
import { useToast } from '@/components/ui/toast'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  const handlePasswordResetRequest = async (data: PasswordResetRequestData) => {
    setLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Simulate different scenarios
      if (data.email === 'notfound@test.com') {
        throw new Error('No account found with this email address')
      }

      if (data.email === 'error@test.com') {
        throw new Error('Unable to send reset email. Please try again later.')
      }

      // Success
      setSuccess(true)
      toast({
        title: 'Reset link sent!',
        description: 'Check your email for the password reset link.',
        variant: 'success',
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send reset email'
      )
      toast({
        title: 'Reset Failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full">
        <PasswordResetRequestForm
          onSubmit={handlePasswordResetRequest}
          loading={loading}
          error={error}
          success={success}
        />

        {/* Demo information */}
        {!success && (
          <div className="mx-auto mt-8 max-w-md">
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
                    notfound@test.com
                  </code>{' '}
                  - Shows "no account found" error
                </div>
                <div>
                  •{' '}
                  <code className="rounded bg-blue-100 px-1 dark:bg-blue-800">
                    error@test.com
                  </code>{' '}
                  - Shows service error
                </div>
                <div>• Any other email - Shows successful reset flow</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
