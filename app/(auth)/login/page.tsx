'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Import Supabase client
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // Attempt real Supabase login
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (error) {
        throw new Error(error.message)
      }

      // Successful login - redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-500 via-stocks-600 to-alternatives-500 px-4">
      <div className="w-full max-w-lg">
        {/* Modern Login Card */}
        <div className="rounded-2xl bg-white p-12 shadow-xl backdrop-blur-sm">
          {/* Logo and Title */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-gray-900">Portfolio Manager</h1>
            <p className="text-gray-600">Universal investment tracking</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center space-x-2">
                  <svg
                    className="h-5 w-5 text-red-500"
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
                  <p className="text-sm font-medium text-red-600">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  E-post
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="din@epost.no"
                  required
                  className="h-12 rounded-lg border-2 border-gray-200 bg-white px-4 text-base transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Passord
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Ditt passord"
                  required
                  className="h-12 rounded-lg border-2 border-gray-200 bg-white px-4 text-base transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-lg bg-brand-500 text-base font-semibold text-white transition-all duration-200 hover:bg-brand-600 hover:shadow-lg hover:shadow-brand-500/25 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Logger inn...</span>
                </div>
              ) : (
                'Logg inn'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">eller</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 rounded-lg border-2 border-gray-200 bg-white p-3 text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:border-gray-300">
              <span className="text-lg">🔵</span>
              <span className="font-medium">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 rounded-lg border-2 border-gray-200 bg-white p-3 text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:border-gray-300">
              <span className="text-lg">🍎</span>
              <span className="font-medium">Apple</span>
            </button>
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Har du ikke konto?{' '}
              <Link href="/register" className="font-medium text-brand-500 hover:text-brand-600">
                Registrer deg
              </Link>
            </p>
            <p className="mt-2">
              <Link href="/forgot-password" className="text-sm font-medium text-brand-500 hover:text-brand-600">
                Glemt passord?
              </Link>
            </p>
          </div>

          {/* Asset Class Badges */}
          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 rounded-full bg-stocks-50 px-3 py-1 text-xs font-semibold text-stocks-600">
              <span>📈</span>
              <span>Aksjer</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-crypto-50 px-3 py-1 text-xs font-semibold text-crypto-600">
              <span>₿</span>
              <span>Crypto</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-alternatives-50 px-3 py-1 text-xs font-semibold text-alternatives-600">
              <span>🎨</span>
              <span>Kunst</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-cash-50 px-3 py-1 text-xs font-semibold text-cash-600">
              <span>🏠</span>
              <span>Eiendom</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
