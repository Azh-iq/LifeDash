'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AnimatedCard,
  entranceVariants,
  NumberCounter,
} from '@/components/animated'

interface PartialDataIssue {
  type: 'missing_prices' | 'stale_data' | 'incomplete_holdings' | 'sync_error'
  severity: 'low' | 'medium' | 'high'
  description: string
  affectedItems: number
  lastUpdate?: string
}

interface PartialDataStateProps {
  issues: PartialDataIssue[]
  portfolioData?: {
    totalHoldings: number
    workingHoldings: number
    totalValue: number
    lastSync: string
  }
  onRefreshData?: () => void
  onFixIssues?: () => void
  onContinueAnyway?: () => void
  onGoToSetup?: () => void
  className?: string
}

export function PartialDataState({
  issues,
  portfolioData,
  onRefreshData,
  onFixIssues,
  onContinueAnyway,
  onGoToSetup,
  className = '',
}: PartialDataStateProps) {
  const router = useRouter()

  const getSeverityColor = (severity: PartialDataIssue['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getIssueIcon = (type: PartialDataIssue['type']) => {
    switch (type) {
      case 'missing_prices':
        return (
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
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        )
      case 'stale_data':
        return (
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      case 'incomplete_holdings':
        return (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )
      case 'sync_error':
        return (
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 14.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        )
      default:
        return (
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
    }
  }

  const getIssueTitle = (type: PartialDataIssue['type']) => {
    switch (type) {
      case 'missing_prices':
        return 'Manglende kurspriser'
      case 'stale_data':
        return 'Utdaterte data'
      case 'incomplete_holdings':
        return 'Ufullstendige beholdninger'
      case 'sync_error':
        return 'Synkroniseringsfeil'
      default:
        return 'Ukjent problem'
    }
  }

  const handleRefreshData = () => {
    if (onRefreshData) {
      onRefreshData()
    } else {
      window.location.reload()
    }
  }

  const handleFixIssues = () => {
    if (onFixIssues) {
      onFixIssues()
    } else {
      router.push('/investments/stocks/setup')
    }
  }

  const handleContinueAnyway = () => {
    if (onContinueAnyway) {
      onContinueAnyway()
    }
  }

  const handleGoToSetup = () => {
    if (onGoToSetup) {
      onGoToSetup()
    } else {
      router.push('/investments/stocks/setup')
    }
  }

  const highSeverityIssues = issues.filter(issue => issue.severity === 'high')
  const canContinue = highSeverityIssues.length === 0

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 ${className}`}
    >
      <div className="mx-auto max-w-4xl px-6 py-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={entranceVariants.container}
          className="text-center"
        >
          {/* Warning Icon */}
          <motion.div
            variants={entranceVariants.item}
            className="mb-8 flex justify-center"
          >
            <AnimatedCard
              className="inline-flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 shadow-2xl"
              hoverScale={1.05}
            >
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              >
                <svg
                  className="h-16 w-16 text-white"
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
              </motion.div>
            </AnimatedCard>
          </motion.div>

          {/* Title and Description */}
          <motion.div variants={entranceVariants.item} className="mb-8">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              Ufullstendige porteføljedata
            </h2>
            <p className="mb-4 text-xl text-gray-700">
              Noen av investeringsdataene dine er ikke oppdaterte eller mangler
            </p>
          </motion.div>

          {/* Portfolio Stats (if available) */}
          {portfolioData && (
            <motion.div variants={entranceVariants.item} className="mb-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card className="border-0 bg-white shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="mb-2">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Fungerende beholdninger
                    </p>
                    <div className="flex items-center justify-center space-x-2">
                      <NumberCounter
                        value={portfolioData.workingHoldings}
                        className="text-2xl font-bold text-green-600"
                      />
                      <span className="text-gray-400">/</span>
                      <NumberCounter
                        value={portfolioData.totalHoldings}
                        className="text-2xl font-bold text-gray-600"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-white shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="mb-2">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
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
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Estimert verdi</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {portfolioData.totalValue.toLocaleString('no-NO', {
                        style: 'currency',
                        currency: 'NOK',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-white shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="mb-2">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                        <svg
                          className="h-5 w-5 text-orange-600"
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
                    <p className="text-sm text-gray-600">Sist oppdatert</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {new Date(portfolioData.lastSync).toLocaleDateString(
                        'no-NO',
                        {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Issues List */}
          <motion.div variants={entranceVariants.item} className="mb-8">
            <Card className="border-0 bg-white shadow-xl">
              <CardHeader>
                <h3 className="text-xl font-bold text-gray-900">
                  Identifiserte problemer ({issues.length})
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {issues.map((issue, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="flex-shrink-0">
                        <div
                          className={`rounded-lg p-2 ${getSeverityColor(issue.severity)}`}
                        >
                          {getIssueIcon(issue.type)}
                        </div>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="mb-1 flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">
                            {getIssueTitle(issue.type)}
                          </h4>
                          <Badge className={getSeverityColor(issue.severity)}>
                            {issue.severity === 'high'
                              ? 'Kritisk'
                              : issue.severity === 'medium'
                                ? 'Middels'
                                : 'Lav'}
                          </Badge>
                        </div>
                        <p className="mb-2 text-sm text-gray-600">
                          {issue.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Berørte elementer: {issue.affectedItems}</span>
                          {issue.lastUpdate && (
                            <span>
                              Sist oppdatert:{' '}
                              {new Date(issue.lastUpdate).toLocaleString(
                                'no-NO'
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={entranceVariants.item} className="mb-8">
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0">
              <Button
                onClick={handleRefreshData}
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
                Oppdater data
              </Button>

              <Button
                onClick={handleFixIssues}
                variant="outline"
                className="border-orange-300 px-6 py-3 text-orange-700 hover:bg-orange-50"
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
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
                Løs problemer
              </Button>

              {canContinue && (
                <Button
                  onClick={handleContinueAnyway}
                  variant="ghost"
                  className="px-6 py-3 text-gray-600 hover:text-gray-800"
                >
                  Fortsett likevel
                </Button>
              )}
            </div>
          </motion.div>

          {/* Warning for High Severity Issues */}
          {!canContinue && (
            <motion.div variants={entranceVariants.item}>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-red-600"
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
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-red-900">
                        Kritiske problemer må løses først
                      </h4>
                      <p className="text-sm text-red-700">
                        Du må løse alle kritiske problemer før du kan fortsette
                        til porteføljevisningen.
                      </p>
                    </div>
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

export default PartialDataState
