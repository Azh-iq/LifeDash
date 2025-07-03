'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestConnectionPage() {
  const [connectionStatus, setConnectionStatus] = useState<
    'testing' | 'success' | 'error'
  >('testing')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient()

        // Test basic connection
        const { data, error } = await supabase
          .from('_test')
          .select('*')
          .limit(1)

        if (error) {
          // Expected error for non-existent table means connection works
          if (error.message.includes('does not exist')) {
            setConnectionStatus('success')
          } else {
            setConnectionStatus('error')
            setErrorMessage(error.message)
          }
        } else {
          setConnectionStatus('success')
        }
      } catch (err) {
        setConnectionStatus('error')
        setErrorMessage(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    testConnection()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary p-4">
      <div className="card w-full max-w-md text-center">
        <h1 className="mb-6 text-h1">Supabase Connection Test</h1>

        {connectionStatus === 'testing' && (
          <div className="animate-pulse">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-secondary-blue/20"></div>
            <p className="text-body text-secondary-gray">
              Testing connection...
            </p>
          </div>
        )}

        {connectionStatus === 'success' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-green/20">
              <svg
                className="h-8 w-8 text-accent-green"
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
            <h2 className="mb-2 text-h2 text-accent-green">
              Connection Successful!
            </h2>
            <p className="text-body text-secondary-gray">
              Supabase client is working correctly
            </p>
          </div>
        )}

        {connectionStatus === 'error' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-red/20">
              <svg
                className="h-8 w-8 text-accent-red"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-h2 text-accent-red">Connection Failed</h2>
            <p className="text-body-sm text-secondary-gray">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  )
}
