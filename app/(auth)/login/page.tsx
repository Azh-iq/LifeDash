'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 px-4">
      <div className="w-full max-w-lg">
        {/* Enhanced Logo with Norwegian Purple Theme */}
        <div className="card-entrance mb-10 text-center">
          <div className="mb-6 inline-flex items-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg">
              <span className="text-2xl font-bold text-white">L</span>
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-gray-900">LifeDash</h1>
              <p className="text-gray-600">Din personlige kontrollpanel</p>
            </div>
          </div>
        </div>

        {/* Enhanced Login Form */}
        <Card
          className="card-entrance border-purple-200 bg-white/90 shadow-2xl backdrop-blur-sm"
          style={{ animationDelay: '200ms' }}
        >
          <CardHeader className="pb-8 text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">
              Velkommen tilbake
            </CardTitle>
            <p className="mt-3 text-lg text-gray-600">
              Logg inn på din LifeDash konto
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="shake rounded-xl border border-red-200 bg-red-50 p-4">
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

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-700"
                  >
                    E-post adresse
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="din@epost.no"
                    required
                    className="input-base h-12 text-base"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-700"
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
                    className="input-base h-12 text-base"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-14 w-full transform rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Logger inn...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Logg inn</span>
                    <svg
                      className="ui-icon h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <a
                href="#"
                className="text-sm font-medium text-purple-600 transition-colors hover:text-purple-700 hover:underline"
              >
                Glemt passord? Klikk her for å nullstille
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Demo info */}
        <div
          className="card-entrance mt-8 rounded-xl border border-purple-200/50 bg-gradient-to-r from-purple-50 to-indigo-50 p-6"
          style={{ animationDelay: '400ms' }}
        >
          <div className="flex items-start space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
              <svg
                className="h-5 w-5 text-purple-600"
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
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-purple-900">
                Demo Tilgang
              </h3>
              <p className="text-sm leading-relaxed text-purple-800">
                Du kan bruke hvilken som helst e-post og passord for å teste
                systemet. Alle funksjoner er tilgjengelige i demo-modus.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
