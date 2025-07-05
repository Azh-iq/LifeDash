'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedCard, entranceVariants } from '@/components/animated'

interface EmptyPortfolioStateProps {
  title?: string
  subtitle?: string
  description?: string
  onSetupPlatform?: () => void
  onManualSetup?: () => void
  onGoToPortfolios?: () => void
  className?: string
}

export function EmptyPortfolioState({
  title = "Ingen aksjer funnet",
  subtitle = "Kom i gang med investeringene dine",
  description = "Start med å sette opp investeringskontoene dine og legge til aksjeposisjoner for å få en komplett oversikt over porteføljen din.",
  onSetupPlatform,
  onManualSetup,
  onGoToPortfolios,
  className = ""
}: EmptyPortfolioStateProps) {
  const router = useRouter()

  const handleSetupPlatform = () => {
    if (onSetupPlatform) {
      onSetupPlatform()
    } else {
      router.push('/investments/stocks/setup')
    }
  }

  const handleManualSetup = () => {
    if (onManualSetup) {
      onManualSetup()
    }
  }

  const handleGoToPortfolios = () => {
    if (onGoToPortfolios) {
      onGoToPortfolios()
    } else {
      router.push('/investments')
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 ${className}`}>
      <div className="mx-auto max-w-4xl px-6 py-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={entranceVariants.container}
          className="text-center"
        >
          {/* Animated Icon */}
          <motion.div
            variants={entranceVariants.item}
            className="mb-8 flex justify-center"
          >
            <AnimatedCard
              className="inline-flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl"
              hoverScale={1.05}
              clickEffect="ripple"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              >
                <svg
                  className="h-16 w-16 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                  />
                </svg>
              </motion.div>
            </AnimatedCard>
          </motion.div>

          {/* Title and Description */}
          <motion.div variants={entranceVariants.item} className="mb-8">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              {title}
            </h2>
            <p className="mb-2 text-xl font-medium text-blue-600">
              {subtitle}
            </p>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              {description}
            </p>
          </motion.div>

          {/* Action Cards */}
          <motion.div
            variants={entranceVariants.item}
            className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            {/* Setup Platform Wizard */}
            <AnimatedCard
              className="p-6 bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              hoverScale={1.02}
              clickEffect="bounce"
            >
              <div className="mb-4 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <svg
                    className="h-6 w-6 text-blue-600"
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
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Plattform Veiviser
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                La oss guide deg gjennom oppsettet av investeringskontoene dine
              </p>
              <Button
                onClick={handleSetupPlatform}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Start Veiviser
              </Button>
            </AnimatedCard>

            {/* Manual Setup */}
            <AnimatedCard
              className="p-6 bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              hoverScale={1.02}
              clickEffect="bounce"
            >
              <div className="mb-4 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                  <svg
                    className="h-6 w-6 text-indigo-600"
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
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Manuelt Oppsett
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                Sett opp plattformer og kontoer manuelt med full kontroll
              </p>
              <Button
                onClick={handleManualSetup}
                variant="outline"
                className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                Manuelt Oppsett
              </Button>
            </AnimatedCard>

            {/* Import Data */}
            <AnimatedCard
              className="p-6 bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              hoverScale={1.02}
              clickEffect="bounce"
            >
              <div className="mb-4 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Importer Data
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                Last opp CSV-filer fra meglerhus eller bank
              </p>
              <Button
                onClick={handleGoToPortfolios}
                variant="outline"
                className="w-full border-green-200 text-green-600 hover:bg-green-50"
              >
                Gå til Porteføljer
              </Button>
            </AnimatedCard>
          </motion.div>

          {/* Additional Help */}
          <motion.div variants={entranceVariants.item}>
            <Card className="bg-blue-50 border-blue-200 shadow-lg">
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
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-blue-900">
                      Trenger du hjelp?
                    </h4>
                    <p className="text-sm text-blue-700">
                      Vi støtter populære norske plattformer som Nordnet, DNB, og Schwab. 
                      Du kan også importere data fra CSV-filer eller legge til aksjer manuelt.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Demo Data Option */}
          <motion.div variants={entranceVariants.item} className="mt-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="h-px flex-1 bg-gray-300"></div>
              <span className="text-sm text-gray-500">eller</span>
              <div className="h-px flex-1 bg-gray-300"></div>
            </div>
            <div className="mt-4">
              <Button
                variant="ghost"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => {
                  // Could implement demo data loading here
                  console.log('Load demo data')
                }}
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Se demo med eksempeldata
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default EmptyPortfolioState