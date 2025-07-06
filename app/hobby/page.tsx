'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function HobbyPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)

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

  // Mock hobby data
  const projects = [
    {
      id: 'photography',
      title: 'Fotografering',
      status: 'Aktiv',
      progress: 75,
      description: 'Portrettfotografering og naturbilder',
      nextAction: 'Utendørs fotografering i helgen',
      timeSpent: '24 timer',
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
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      id: 'woodworking',
      title: 'Trearbeid',
      status: 'Planlagt',
      progress: 20,
      description: 'Bygge et bord til stuen',
      nextAction: 'Kjøpe materialer',
      timeSpent: '8 timer',
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
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      ),
    },
    {
      id: 'gardening',
      title: 'Hagearbeid',
      status: 'Sesong',
      progress: 60,
      description: 'Grønnsakhage og blomsterbed',
      nextAction: 'Plante tomater',
      timeSpent: '15 timer',
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
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a4 4 0 004-4V5a2 2 0 00-2-2h-2z"
          />
        </svg>
      ),
    },
    {
      id: 'music',
      title: 'Musikkproduksjon',
      status: 'Aktiv',
      progress: 45,
      description: 'Lære musikk-produksjon og mixing',
      nextAction: 'Fullføre beat-produksjon',
      timeSpent: '32 timer',
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
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
      ),
    },
  ]

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'Aktiv').length,
    totalHours: projects.reduce((sum, p) => sum + parseInt(p.timeSpent), 0),
    avgProgress: Math.round(
      projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
    ),
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-projects-50 to-purple-100">
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-projects-600 border-t-transparent"></div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-projects-900">
            LifeDash
          </h1>
          <p className="text-projects-600">Laster hobby prosjekter...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-projects-50 via-purple-50 to-projects-100">
      {/* Enhanced Header with Purple Theme */}
      <div className="header-projects border-b border-projects-200/50">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white transition-all duration-200 hover:scale-105 hover:bg-white/30"
              >
                <svg
                  className="ui-icon h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Hobby Prosjekter
                </h1>
                <p className="text-white/80">
                  Kreative prosjekter og personlige interesser
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-white/70">Kreativitet</p>
                <p className="font-semibold text-white">
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
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white transition-all duration-200 hover:bg-white/30"
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
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card className="border-0 bg-projects-50 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-projects-500 text-white">
                  <svg
                    className="ui-icon h-6 w-6"
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
                </div>
              </div>
              <h4 className="text-sm font-medium uppercase tracking-wide text-projects-600">
                Totalt Prosjekter
              </h4>
              <p className="financial-number mt-2 text-3xl font-bold text-projects-900">
                {stats.totalProjects}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-projects-50 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-projects-500 text-white">
                  <svg
                    className="ui-icon h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="text-sm font-medium uppercase tracking-wide text-projects-600">
                Aktive Prosjekter
              </h4>
              <p className="financial-number mt-2 text-3xl font-bold text-projects-900">
                {stats.activeProjects}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-projects-50 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-projects-500 text-white">
                  <svg
                    className="ui-icon h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="text-sm font-medium uppercase tracking-wide text-projects-600">
                Timer Totalt
              </h4>
              <p className="financial-number mt-2 text-3xl font-bold text-projects-900">
                {stats.totalHours}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-projects-50 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-projects-500 text-white">
                  <svg
                    className="ui-icon h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="text-sm font-medium uppercase tracking-wide text-projects-600">
                Gjennomsnitt Progress
              </h4>
              <p className="financial-number mt-2 text-3xl font-bold text-projects-900">
                {stats.avgProgress}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className="card-projects card-entrance group transform transition-all duration-300 hover:-translate-y-3"
              style={{
                animationDelay: `${index * 150}ms`,
              }}
            >
              <Card className="h-full border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-projects-50 shadow-lg transition-transform duration-300 group-hover:scale-110">
                      <div className="text-projects-600">{project.icon}</div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`inline-flex items-center space-x-1 rounded-full px-3 py-1 text-sm font-semibold ${
                          project.status === 'Aktiv'
                            ? 'bg-green-50 text-green-600'
                            : project.status === 'Planlagt'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-orange-50 text-orange-600'
                        }`}
                      >
                        <span>{project.status}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 transition-colors group-hover:text-projects-700">
                        {project.title}
                      </h3>
                      <p className="text-gray-600">{project.description}</p>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Progress
                        </span>
                        <span className="text-sm font-semibold text-projects-600">
                          {project.progress}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-projects-500 transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Neste handling:
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {project.nextAction}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Tid brukt:
                        </span>
                        <span className="financial-number text-sm font-medium text-gray-900">
                          {project.timeSpent}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Add New Project Card */}
        <div className="mt-8">
          <button className="card-projects group w-full transform transition-all duration-300 hover:-translate-y-1">
            <Card className="border-2 border-dashed border-projects-300 shadow-lg hover:border-projects-500 hover:shadow-xl">
              <CardContent className="p-12 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-projects-50 transition-colors group-hover:bg-projects-100">
                    <svg
                      className="h-8 w-8 text-projects-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">
                  Legg til nytt prosjekt
                </h3>
                <p className="text-gray-600">
                  Start et nytt kreativt prosjekt eller hobby
                </p>
              </CardContent>
            </Card>
          </button>
        </div>
      </div>
    </div>
  )
}
