'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestConnectionPage() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient()
        
        // Test basic connection
        const { data, error } = await supabase.from('_test').select('*').limit(1)
        
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
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center">
        <h1 className="text-h1 mb-6">Supabase Connection Test</h1>
        
        {connectionStatus === 'testing' && (
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-secondary-blue/20 rounded-full mx-auto mb-4"></div>
            <p className="text-body text-secondary-gray">Testing connection...</p>
          </div>
        )}
        
        {connectionStatus === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-accent-green/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-h2 text-accent-green mb-2">Connection Successful!</h2>
            <p className="text-body text-secondary-gray">
              Supabase client is working correctly
            </p>
          </div>
        )}
        
        {connectionStatus === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-accent-red/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-accent-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-h2 text-accent-red mb-2">Connection Failed</h2>
            <p className="text-body-sm text-secondary-gray">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  )
}