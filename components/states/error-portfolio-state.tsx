'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedCard, entranceVariants } from '@/components/animated'

interface ErrorPortfolioStateProps {
  error: string | Error
  type?: 'network' | 'auth' | 'data' | 'server' | 'unknown'
  onRetry?: () => void
  onGoHome?: () => void
  onContactSupport?: () => void
  showRetry?: boolean
  showContactSupport?: boolean
  className?: string
}

export function ErrorPortfolioState({
  error,
  type = 'unknown',
  onRetry,
  onGoHome,
  onContactSupport,
  showRetry = true,
  showContactSupport = true,
  className = '',
}: ErrorPortfolioStateProps) {
  const router = useRouter()

  const errorMessage = typeof error === 'string' ? error : error.message

  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          title: 'Tilkoblingsfeil',
          subtitle: 'Kan ikke koble til serveren',
          icon: (
            <svg
              className="h-12 w-12 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
              />
            </svg>
          ),
          bgColor: 'from-orange-500 to-red-500',
          iconBg: 'bg-orange-100',
        }
      case 'auth':
        return {
          title: 'Autentiseringsfeil',
          subtitle: 'Du må logge inn på nytt',
          icon: (
            <svg
              className="h-12 w-12 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          ),
          bgColor: 'from-yellow-500 to-orange-500',
          iconBg: 'bg-yellow-100',
        }
      case 'data':
        return {
          title: 'Datafeil',
          subtitle: 'Problem med å laste porteføljedata',
          icon: (
            <svg
              className="h-12 w-12 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          ),
          bgColor: 'from-blue-500 to-indigo-500',
          iconBg: 'bg-blue-100',
        }
      case 'server':
        return {
          title: 'Serverfeil',
          subtitle: 'Teknisk problem på vår side',
          icon: (
            <svg
              className="h-12 w-12 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
              />
            </svg>
          ),
          bgColor: 'from-purple-500 to-pink-500',
          iconBg: 'bg-purple-100',
        }
      default:
        return {
          title: 'Noe gikk galt',
          subtitle: 'Uventet feil oppstod',
          icon: (
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 14.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          ),
          bgColor: 'from-red-500 to-pink-500',
          iconBg: 'bg-red-100',
        }
    }
  }

  const config = getErrorConfig()

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome()
    } else {
      router.push('/dashboard')
    }
  }

  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport()
    } else {
      // Could open support modal or navigate to support page
      console.log('Contact support')
    }
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-red-50 to-pink-50 ${className}`}
    >
      <div className="mx-auto max-w-4xl px-6 py-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={entranceVariants.container}
          className="text-center"
        >
          {/* Animated Error Icon */}
          <motion.div
            variants={entranceVariants.item}
            className="mb-8 flex justify-center"
          >
            <AnimatedCard
              className={`inline-flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br ${config.bgColor} shadow-2xl`}
              hoverScale={1.05}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              >
                <div className={`rounded-full p-3 ${config.iconBg}`}>
                  {config.icon}
                </div>
              </motion.div>
            </AnimatedCard>
          </motion.div>

          {/* Error Title and Description */}
          <motion.div variants={entranceVariants.item} className="mb-8">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              {config.title}
            </h2>
            <p className="mb-4 text-xl font-medium text-gray-700">
              {config.subtitle}
            </p>
            <div className="mx-auto max-w-2xl">
              <Card className="border-gray-200 bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-gray-600"
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
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-800">
                        Feilmelding:
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            variants={entranceVariants.item}
            className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0"
          >
            {showRetry && (
              <Button
                onClick={handleRetry}
                className="bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
              >
                <svg
                  className="mr-2 h-5 w-5"
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
                Prøv igjen
              </Button>
            )}

            <Button
              onClick={handleGoHome}
              variant="outline"
              className="border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50"
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Gå til Dashboard
            </Button>
          </motion.div>

          {/* Additional Help */}
          <motion.div variants={entranceVariants.item} className="mt-8">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <svg
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-blue-900">
                      Trenger du hjelp?
                    </h4>
                    <p className="mb-3 text-sm text-blue-700">
                      {type === 'network' &&
                        'Sjekk internettforbindelsen din og prøv igjen. Hvis problemet vedvarer, kan det være midlertidig nedetid.'}
                      {type === 'auth' &&
                        'Logg inn på nytt for å få tilgang til porteføljedataene dine.'}
                      {type === 'data' &&
                        'Dette kan skyldes problemer med datakildene våre. Prøv igjen om litt.'}
                      {type === 'server' &&
                        'Vi jobber med å løse problemet. Prøv igjen om noen minutter.'}
                      {type === 'unknown' &&
                        'Hvis problemet vedvarer, kan du kontakte support for hjelp.'}
                    </p>
                    {showContactSupport && (
                      <Button
                        onClick={handleContactSupport}
                        variant="ghost"
                        className="p-0 text-blue-600 hover:text-blue-800"
                      >
                        <svg
                          className="mr-2 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        Kontakt support
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Error Details (for development) */}
          {process.env.NODE_ENV === 'development' && (
            <motion.div variants={entranceVariants.item} className="mt-8">
              <Card className="border-gray-300 bg-gray-100">
                <CardContent className="p-4">
                  <div className="text-left">
                    <h4 className="mb-2 font-semibold text-gray-900">
                      Utviklerinfo:
                    </h4>
                    <pre className="overflow-x-auto text-xs text-gray-700">
                      {JSON.stringify(
                        {
                          error: errorMessage,
                          type,
                          timestamp: new Date().toISOString(),
                          userAgent:
                            typeof navigator !== 'undefined'
                              ? navigator.userAgent
                              : 'N/A',
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default ErrorPortfolioState
