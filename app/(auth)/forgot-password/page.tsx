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
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
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
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full">
        <PasswordResetRequestForm
          onSubmit={handlePasswordResetRequest}
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
                  <strong>Try these emails to see different behaviors:</strong>
                </div>
                <div>
                  • <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">notfound@test.com</code> - Shows "no account found" error
                </div>
                <div>
                  • <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">error@test.com</code> - Shows service error
                </div>
                <div>
                  • Any other email - Shows successful reset flow
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}