'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Always redirect to login on root access
    router.replace('/login')
  }, [router])

  // Enhanced loading with new Untitled UI styling
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="card-entrance text-center">
        <div className="mb-6 flex items-center justify-center">
          <div className="border-3 h-12 w-12 animate-spin rounded-full border-blue-600 border-t-transparent shadow-lg"></div>
        </div>
        <div className="mb-4 inline-flex items-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
            <span className="text-xl font-bold text-white">L</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">LifeDash</h1>
        </div>
        <p className="text-lg text-gray-600">Starter opp...</p>
      </div>
    </div>
  )
}
