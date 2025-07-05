'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      setUser(session.user)
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">LifeDash</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const cards = [
    {
      id: 'investments',
      title: 'Investeringer',
      description: 'Portfolio oversikt og aksjeanalyser',
      value: 'NOK 524,000',
      change: '+3.2%',
      icon: (
        <svg
          className="ui-icon-lg h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      bgClass: 'card-investments',
      headerClass: 'header-investments',
      textColor: 'text-investments-600',
      bgColor: 'bg-investments-50',
      borderColor: 'border-investments-500',
      href: '/investments',
    },
    {
      id: 'hobby',
      title: 'Hobby prosjekter',
      description: 'Kreative prosjekter og hobbyer',
      value: '12 aktive',
      change: '+2 nye',
      icon: (
        <svg
          className="ui-icon-lg h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
      bgClass: 'card-projects',
      headerClass: 'header-projects',
      textColor: 'text-projects-600',
      bgColor: 'bg-projects-50',
      borderColor: 'border-projects-500',
      href: '/hobby',
    },
    {
      id: 'economy',
      title: 'Økonomi',
      description: 'Budsjett og økonomisk oversikt',
      value: 'NOK 45,230',
      change: '+8.1%',
      icon: (
        <svg
          className="ui-icon-lg h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
      bgClass: 'card-economy',
      headerClass: 'header-economy',
      textColor: 'text-economy-600',
      bgColor: 'bg-economy-50',
      borderColor: 'border-economy-500',
      href: '/economy',
    },
    {
      id: 'tools',
      title: 'Verktøy',
      description: 'Kalkulatorer og nyttige verktøy',
      value: '8 verktøy',
      change: 'Tilgjengelig',
      icon: (
        <svg
          className="ui-icon-lg h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      bgClass: 'card-tools',
      headerClass: 'header-tools',
      textColor: 'text-tools-600',
      bgColor: 'bg-tools-50',
      borderColor: 'border-tools-500',
      href: '/tools',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50">
      {/* Enhanced Header with Untitled UI styling */}
      <div className="glass-effect border-b border-gray-200/50">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
                <span className="text-xl font-bold text-white">L</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  LifeDash
                </span>
                <p className="text-sm text-gray-600">
                  Din personlige kontrollpanel
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-gray-500">Velkommen tilbake</p>
                <p className="font-semibold text-gray-900">
                  {user?.user_metadata?.full_name ||
                    user?.email?.split('@')[0] ||
                    'Bruker'}
                </p>
              </div>
              <button
                onClick={async () => {
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  router.replace('/login')
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-all duration-200 hover:bg-gray-200 hover:text-gray-800"
              >
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Enhanced Welcome Section */}
        <div className="mb-16 text-center">
          <h1 className="mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-4xl font-bold text-transparent md:text-6xl">
            Velkommen til LifeDash
          </h1>
          <p className="mx-auto max-w-4xl text-xl leading-relaxed text-gray-600">
            Din personlige kontrollpanel for å holde oversikt over
            investeringer, hobby prosjekter, økonomi og nyttige verktøy. Alt
            samlet på ett sted med profesjonell oversikt.
          </p>
        </div>

        {/* Enhanced Cards Grid with Untitled UI styling */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {cards.map((card, index) => (
            <button
              key={card.id}
              onClick={() => router.push(card.href)}
              className={`group relative transform ${card.bgClass} card-entrance p-8 transition-all duration-300`}
              style={{
                animationDelay: `${index * 150}ms`,
              }}
            >
              {/* Header Section */}
              <div className="mb-6 flex items-center justify-between">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl ${card.bgColor} transition-transform duration-300 group-hover:scale-110`}
                >
                  <div className={card.textColor}>{card.icon}</div>
                </div>

                {/* Arrow indicator */}
                <div className="opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                  <svg
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>

              {/* Content Section */}
              <div className="space-y-4 text-left">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 transition-colors group-hover:text-gray-800">
                    {card.title}
                  </h3>
                  <p className="text-gray-600">{card.description}</p>
                </div>

                {/* Metrics */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="financial-number text-2xl font-bold text-gray-900">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`text-sm font-semibold ${card.change.startsWith('+') ? 'text-green-600' : card.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'}`}
                  >
                    {card.change}
                  </div>
                </div>
              </div>

              {/* Subtle hover overlay */}
              <div
                className={`absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-5 ${card.bgColor}`}
              />
            </button>
          ))}
        </div>

        {/* Quick Stats Section */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-white/80 p-6 shadow-md backdrop-blur-sm">
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                Total Verdi
              </p>
              <p className="financial-number mt-2 text-3xl font-bold text-gray-900">
                NOK 569,230
              </p>
              <p className="text-sm text-green-600">+4.2% denne måneden</p>
            </div>
          </div>

          <div className="rounded-xl bg-white/80 p-6 shadow-md backdrop-blur-sm">
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                Aktive Prosjekter
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">12</p>
              <p className="text-sm text-blue-600">2 nye denne uken</p>
            </div>
          </div>

          <div className="rounded-xl bg-white/80 p-6 shadow-md backdrop-blur-sm">
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                Verktøy Brukt
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">8</p>
              <p className="text-sm text-purple-600">Sist brukt i dag</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
