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
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui'

// Backup Codes Display Component
interface BackupCodesDisplayProps {
  backupCodes: string[]
  onComplete: () => void
  className?: string
}

const BackupCodesDisplay: React.FC<BackupCodesDisplayProps> = ({
  backupCodes,
  onComplete,
  className,
}) => {
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const handleCopyToClipboard = async () => {
    try {
      const codesText = `LifeDash Backup Codes\n\nThese are your two-factor authentication backup codes.\nEach code can only be used once.\n\n${backupCodes.join('\n')}\n\nGenerated on: ${new Date().toLocaleDateString()}\n\nStore these codes securely!`
      await navigator.clipboard.writeText(codesText)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const handleDownload = () => {
    const codesText = `LifeDash Backup Codes\n\nThese are your two-factor authentication backup codes.\nEach code can only be used once.\n\n${backupCodes.join('\n')}\n\nGenerated on: ${new Date().toLocaleDateString()}\n\nStore these codes securely!`

    const blob = new Blob([codesText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lifedash-backup-codes-${Date.now()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setDownloaded(true)
  }

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>LifeDash Backup Codes</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .codes { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
            .code { padding: 10px; background: #f5f5f5; border: 1px solid #ddd; text-align: center; font-family: monospace; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>LifeDash Backup Codes</h1>
          <div class="warning">
            <strong>Important:</strong> These are your two-factor authentication backup codes. 
            Each code can only be used once. Store these codes securely!
          </div>
          <div class="codes">
            ${backupCodes.map(code => `<div class="code">${code}</div>`).join('')}
          </div>
          <div class="footer">
            Generated on: ${new Date().toLocaleDateString()}<br>
            Keep these codes safe and accessible only to you.
          </div>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Critical Warning */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <div className="flex items-start gap-3">
          <svg
            className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600 dark:text-red-400"
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
            <h4 className="text-lg font-semibold text-red-800 dark:text-red-300">
              Critical: Save These Backup Codes Now
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-red-700 dark:text-red-400">
              These codes are your <strong>only way</strong> to access your
              account if you lose your phone or authenticator app. Each code can
              only be used once.{' '}
              <strong>You will not see these codes again!</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Backup Codes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Your 8 Backup Codes
          </h3>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            Each code works once
          </span>
        </div>

        <div className="rounded-lg border bg-neutral-50 p-4 dark:bg-neutral-900">
          <div className="grid grid-cols-2 gap-3">
            {backupCodes.map((code, index) => (
              <div
                key={index}
                className="group relative rounded-lg border border-neutral-200 bg-white p-3 transition-colors hover:border-primary-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-primary-600"
              >
                <div className="text-center font-mono text-base tracking-wider text-neutral-900 dark:text-neutral-100">
                  {code}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="absolute inset-0 flex items-center justify-center rounded-lg bg-neutral-900/5 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-neutral-100/5"
                  title="Copy this code"
                >
                  <svg
                    className="h-4 w-4 text-neutral-600 dark:text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Options */}
      <div className="space-y-3">
        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
          Save these codes safely:
        </h4>

        <div className="grid grid-cols-1 gap-3">
          <Button
            onClick={handleCopyToClipboard}
            variant="outline"
            className="w-full justify-start gap-3"
            size="lg"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span className="flex-1 text-left">
              {copied ? 'Copied to clipboard!' : 'Copy all codes to clipboard'}
            </span>
            {copied && (
              <svg
                className="h-5 w-5 text-green-600"
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
            )}
          </Button>

          <Button
            onClick={handleDownload}
            variant="outline"
            className="w-full justify-start gap-3"
            size="lg"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="flex-1 text-left">
              {downloaded ? 'Downloaded!' : 'Download as text file'}
            </span>
            {downloaded && (
              <svg
                className="h-5 w-5 text-green-600"
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
            )}
          </Button>

          <Button
            onClick={handlePrint}
            variant="outline"
            className="w-full justify-start gap-3"
            size="lg"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            <span className="flex-1 text-left">Print codes</span>
          </Button>
        </div>
      </div>

      {/* Security Tips */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h4 className="mb-2 font-medium text-blue-800 dark:text-blue-300">
          Security Tips:
        </h4>
        <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
          <li>• Store codes in a password manager</li>
          <li>• Keep a physical copy in a safe place</li>
          <li>• Don't store codes in photos or emails</li>
          <li>• Each code works only once</li>
        </ul>
      </div>

      {/* Completion */}
      <div className="space-y-3">
        <Button
          onClick={onComplete}
          className="w-full"
          size="lg"
          disabled={!copied && !downloaded}
        >
          {copied || downloaded
            ? "I've safely stored my backup codes"
            : 'Save codes first, then continue'}
        </Button>

        {!copied && !downloaded && (
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Please save your codes using one of the options above
          </p>
        )}
      </div>
    </div>
  )
}

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
  const [step, setStep] = useState<'qr-code' | 'verify' | 'backup-codes'>(
    'qr-code'
  )
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
    <Card className={cn('mx-auto w-full max-w-md', className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {step === 'qr-code' && 'Set up 2FA'}
          {step === 'verify' && 'Verify your device'}
          {step === 'backup-codes' && 'Save backup codes'}
        </CardTitle>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          {step === 'qr-code' && 'Scan the QR code with your authenticator app'}
          {step === 'verify' &&
            'Enter the 6-digit code from your authenticator app'}
          {step === 'backup-codes' && 'Store these codes in a safe place'}
        </p>
      </CardHeader>

      <CardContent>
        {step === 'qr-code' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="rounded-lg border-2 border-neutral-200 bg-white p-4">
                <img src={qrCodeUrl} alt="2FA QR Code" className="h-48 w-48" />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                How to set up:
              </h3>
              <ol className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li className="flex gap-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-600 dark:bg-primary-900 dark:text-primary-400">
                    1
                  </span>
                  Download an authenticator app like Google Authenticator or
                  Authy
                </li>
                <li className="flex gap-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-600 dark:bg-primary-900 dark:text-primary-400">
                    2
                  </span>
                  Scan this QR code with your authenticator app
                </li>
                <li className="flex gap-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-600 dark:bg-primary-900 dark:text-primary-400">
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
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                Enter the 6-digit code from your authenticator app
              </p>

              <div className="flex justify-center gap-2">
                {codes.map((code, index) => (
                  <input
                    key={index}
                    ref={el => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={code}
                    onChange={e => handleCodeChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    className="h-12 w-12 rounded-lg border border-neutral-300 bg-white text-center text-lg font-medium text-neutral-900 transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
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
          <BackupCodesDisplay
            backupCodes={backupCodes}
            onComplete={() => window.close()}
          />
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
          setError('code', {
            message: 'Please enter the complete 6-digit code',
          })
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
    <Card className={cn('mx-auto w-full max-w-md', className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Two-factor authentication
        </CardTitle>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          {useBackupCode
            ? 'Enter one of your backup codes'
            : 'Enter the 6-digit code from your authenticator app'}
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {!useBackupCode ? (
            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                {codes.map((code, index) => (
                  <input
                    key={index}
                    ref={el => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={code}
                    onChange={e => handleCodeChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    className="h-12 w-12 rounded-lg border border-neutral-300 bg-white text-center text-lg font-medium text-neutral-900 transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
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
                onChange={e => setBackupCode(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-center font-mono text-lg text-neutral-900 transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
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
                useBackupCode ? !backupCode.trim() : codes.join('').length !== 6
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
