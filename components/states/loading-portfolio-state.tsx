'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AnimatedCard,
  NumberCounter,
  ProgressRing,
} from '@/components/animated'

interface LoadingPortfolioStateProps {
  type?: 'initial' | 'data' | 'prices' | 'full'
  message?: string
  showProgress?: boolean
  progress?: number
  className?: string
}

export function LoadingPortfolioState({
  type = 'initial',
  message,
  showProgress = false,
  progress = 0,
  className = '',
}: LoadingPortfolioStateProps) {
  const getLoadingMessage = () => {
    if (message) return message

    switch (type) {
      case 'initial':
        return 'Laster aksjer...'
      case 'data':
        return 'Henter porteføljedata...'
      case 'prices':
        return 'Oppdaterer priser...'
      case 'full':
        return 'Laster fullstendig portefølje...'
      default:
        return 'Laster...'
    }
  }

  const getLoadingIcon = () => {
    switch (type) {
      case 'initial':
        return (
          <svg
            className="h-8 w-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        )
      case 'data':
        return (
          <svg
            className="h-8 w-8 text-blue-600"
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
        )
      case 'prices':
        return (
          <svg
            className="h-8 w-8 text-blue-600"
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
        )
      default:
        return (
          <svg
            className="h-8 w-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        )
    }
  }

  if (type === 'initial' || type === 'full') {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ${className}`}
      >
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            {/* Animated Loading Icon */}
            <motion.div
              className="mb-6 flex justify-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {showProgress ? (
                <div className="relative">
                  <ProgressRing
                    progress={progress}
                    size={80}
                    strokeWidth={6}
                    color="#3B82F6"
                    className="mb-4"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      {getLoadingIcon()}
                    </motion.div>
                  </div>
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 shadow-lg">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    {getLoadingIcon()}
                  </motion.div>
                </div>
              )}
            </motion.div>

            {/* Loading Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="mb-2 text-3xl font-bold text-blue-900">
                LifeDash
              </h1>
              <p className="text-lg text-blue-600">{getLoadingMessage()}</p>
              {showProgress && (
                <div className="mt-4">
                  <NumberCounter
                    value={progress}
                    suffix="%"
                    className="text-2xl font-bold text-blue-700"
                  />
                </div>
              )}
            </motion.div>

            {/* Animated Dots */}
            <motion.div
              className="mt-8 flex justify-center space-x-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-blue-400"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // Inline loading states for data/prices
  if (type === 'data' || type === 'prices') {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 ${className}`}
      >
        {/* Header Skeleton */}
        <div className="border-b border-blue-200/50 bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="mx-auto max-w-7xl px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div>
                  <Skeleton className="mb-2 h-8 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Portfolio Overview Skeleton */}
          <Card className="mb-8 border-0 bg-gradient-to-r from-blue-500 to-blue-600 shadow-2xl">
            <CardContent className="p-10">
              <div className="text-center">
                <Skeleton className="mx-auto mb-4 h-6 w-32 bg-white/20" />
                <Skeleton className="mx-auto mb-6 h-16 w-64 bg-white/20" />
                <div className="flex items-center justify-center space-x-3">
                  <Skeleton className="h-8 w-24 rounded-full bg-white/20" />
                  <Skeleton className="h-2 w-2 rounded-full bg-white/20" />
                  <Skeleton className="h-8 w-32 bg-white/20" />
                  <Skeleton className="h-6 w-20 rounded-full bg-white/20" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Skeleton */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <AnimatedCard key={i} className="border-0 bg-blue-50 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="mb-3 flex justify-center">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                  </div>
                  <Skeleton className="mx-auto mb-2 h-4 w-24" />
                  <Skeleton className="mx-auto h-8 w-16" />
                </CardContent>
              </AnimatedCard>
            ))}
          </div>

          {/* Holdings Table Skeleton */}
          <AnimatedCard className="border-0 bg-white shadow-xl">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div>
                    <Skeleton className="mb-1 h-6 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="mb-1 h-4 w-20" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        'Aksje',
                        'Antall',
                        'Gj.snitt',
                        'Kurs',
                        'Verdi',
                        'P&L',
                      ].map(header => (
                        <th key={header} className="px-6 py-4 text-left">
                          <Skeleton className="h-4 w-16" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {[1, 2, 3, 4, 5].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <Skeleton className="h-10 w-10 rounded-xl" />
                            <div>
                              <Skeleton className="mb-1 h-4 w-16" />
                              <Skeleton className="mb-1 h-3 w-24" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-right">
                            <Skeleton className="mb-1 h-4 w-12" />
                            <Skeleton className="h-3 w-8" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-right">
                            <Skeleton className="mb-1 h-4 w-16" />
                            <Skeleton className="h-3 w-12" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-right">
                            <Skeleton className="mb-1 h-6 w-16 rounded-full" />
                            <Skeleton className="h-4 w-12" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </AnimatedCard>
        </div>

        {/* Loading Overlay for Price Updates */}
        {type === 'prices' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm"
          >
            <AnimatedCard className="rounded-xl bg-white p-6 shadow-2xl">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  {getLoadingIcon()}
                </motion.div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {getLoadingMessage()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Oppdaterer aksjekurser...
                  </p>
                </div>
              </div>
            </AnimatedCard>
          </motion.div>
        )}
      </div>
    )
  }

  return null
}

export default LoadingPortfolioState
