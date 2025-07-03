'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils/cn'
import {
  twoFactorSetupSchema,
  twoFactorVerifySchema,
  type TwoFactorSetupData,
  type TwoFactorVerifyData,
} from '@/lib/validation/auth.schema'
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

// 2FA Setup Component
export interface TwoFactorSetupProps {
  qrCodeUrl: string
  backupCodes: string[]
  onSubmit: (data: TwoFactorSetupData) => Promise<void>
  loading?: boolean
  error?: string | null
  className?: string
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  qrCodeUrl,
  backupCodes,
  onSubmit,
  loading = false,
  error = null,
  className,
}) => {
  const [step, setStep] = useState<'qr-code' | 'verify' | 'backup-codes'>('qr-code')
  const [codes, setCodes] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const {
    handleSubmit,
    formState: { isSubmitting },
    setError,
    clearErrors,
  } = useForm<TwoFactorSetupData>({
    resolver: zodResolver(twoFactorSetupSchema),
  })

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return // Prevent multiple characters

    const newCodes = [...codes]
    newCodes[index] = value

    setCodes(newCodes)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleFormSubmit = async () => {
    const code = codes.join('')
    if (code.length !== 6) {
      setError('code', { message: 'Please enter the complete 6-digit code' })
      return
    }

    try {
      clearErrors()
      await onSubmit({ code })
      setStep('backup-codes')
    } catch (err) {
      if (err instanceof Error) {
        setError('code', { message: err.message })
      }
    }
  }

  const isLoading = loading || isSubmitting

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {step === 'qr-code' && 'Set up 2FA'}
          {step === 'verify' && 'Verify your device'}
          {step === 'backup-codes' && 'Save backup codes'}
        </CardTitle>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2">
          {step === 'qr-code' && 'Scan the QR code with your authenticator app'}
          {step === 'verify' && 'Enter the 6-digit code from your authenticator app'}
          {step === 'backup-codes' && 'Store these codes in a safe place'}
        </p>
      </CardHeader>

      <CardContent>
        {step === 'qr-code' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg border-2 border-neutral-200">
                <img
                  src={qrCodeUrl}
                  alt="2FA QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                How to set up:
              </h3>
              <ol className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-medium">
                    1
                  </span>
                  Download an authenticator app like Google Authenticator or Authy
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-medium">
                    2
                  </span>
                  Scan this QR code with your authenticator app
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-medium">
                    3
                  </span>
                  Enter the 6-digit code from your app to verify
                </li>
              </ol>
            </div>

            <Button
              onClick={() => setStep('verify')}
              className="w-full"
              size="lg"
            >
              I've scanned the QR code
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
                Enter the 6-digit code from your authenticator app
              </p>
              
              <div className="flex gap-2 justify-center">
                {codes.map((code, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={code}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-medium border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:border-primary-500 focus:ring-primary-500 focus:ring-1 transition-colors"
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleFormSubmit}
                loading={isLoading}
                loadingText="Verifying..."
                className="w-full"
                size="lg"
                disabled={codes.join('').length !== 6}
              >
                Verify and enable 2FA
              </Button>
              
              <Button
                onClick={() => setStep('qr-code')}
                variant="ghost"
                className="w-full"
                disabled={isLoading}
              >
                Back to QR code
              </Button>
            </div>
          </div>
        )}

        {step === 'backup-codes' && (
          <div className="space-y-6">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-300">
                    Important: Save these backup codes
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                Your backup codes:
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg font-mono text-sm text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  const codesText = backupCodes.join('\n')
                  navigator.clipboard.writeText(codesText)
                }}
                variant="outline"
                className="w-full"
              >
                Copy codes to clipboard
              </Button>
              
              <Button
                onClick={() => window.print()}
                variant="outline"
                className="w-full"
              >
                Print codes
              </Button>
              
              <Button
                onClick={() => window.close()}
                className="w-full"
                size="lg"
              >
                I've saved my backup codes
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 2FA Verification Component (for login)
export interface TwoFactorVerifyProps {
  onSubmit: (data: TwoFactorVerifyData) => Promise<void>
  loading?: boolean
  error?: string | null
  className?: string
  showBackupOption?: boolean
}

export const TwoFactorVerify: React.FC<TwoFactorVerifyProps> = ({
  onSubmit,
  loading = false,
  error = null,
  className,
  showBackupOption = true,
}) => {
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [codes, setCodes] = useState(['', '', '', '', '', ''])
  const [backupCode, setBackupCode] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const {
    handleSubmit,
    formState: { isSubmitting },
    setError,
    clearErrors,
  } = useForm<TwoFactorVerifyData>({
    resolver: zodResolver(twoFactorVerifySchema),
  })

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return

    const newCodes = [...codes]
    newCodes[index] = value
    setCodes(newCodes)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleFormSubmit = async () => {
    try {
      clearErrors()
      
      if (useBackupCode) {
        if (!backupCode.trim()) {
          setError('backupCode', { message: 'Please enter a backup code' })
          return
        }
        await onSubmit({ code: '', backupCode: backupCode.trim() })
      } else {
        const code = codes.join('')
        if (code.length !== 6) {
          setError('code', { message: 'Please enter the complete 6-digit code' })
          return
        }
        await onSubmit({ code })
      }
    } catch (err) {
      if (err instanceof Error) {
        const field = useBackupCode ? 'backupCode' : 'code'
        setError(field, { message: err.message })
      }
    }
  }

  const isLoading = loading || isSubmitting

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Two-factor authentication
        </CardTitle>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2">
          {useBackupCode
            ? 'Enter one of your backup codes'
            : 'Enter the 6-digit code from your authenticator app'}
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {!useBackupCode ? (
            <div className="space-y-4">
              <div className="flex gap-2 justify-center">
                {codes.map((code, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={code}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-medium border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:border-primary-500 focus:ring-primary-500 focus:ring-1 transition-colors"
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter backup code"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                className="w-full px-4 py-3 text-center font-mono text-lg border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:border-primary-500 focus:ring-primary-500 focus:ring-1 transition-colors"
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleFormSubmit}
              loading={isLoading}
              loadingText="Verifying..."
              className="w-full"
              size="lg"
              disabled={
                useBackupCode 
                  ? !backupCode.trim()
                  : codes.join('').length !== 6
              }
            >
              Verify
            </Button>

            {showBackupOption && (
              <Button
                onClick={() => {
                  setUseBackupCode(!useBackupCode)
                  setCodes(['', '', '', '', '', ''])
                  setBackupCode('')
                  clearErrors()
                }}
                variant="ghost"
                className="w-full"
                disabled={isLoading}
              >
                {useBackupCode
                  ? 'Use authenticator app instead'
                  : 'Use backup code instead'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}