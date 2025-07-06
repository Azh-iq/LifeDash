'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PlatformSelectionCard } from './platform-selection-card'
import { ConnectionModal } from './connection-modal'
import { completeSetup } from '@/lib/actions/platforms/setup'
import { getPlatforms } from '@/lib/actions/platforms/crud'

interface Step {
  id: string
  title: string
  description: string
}

interface PlatformWizardProps {
  currentStep: number
  setCurrentStep: (step: number) => void
  selectedPlatforms: string[]
  setSelectedPlatforms: (platforms: string[]) => void
  steps: Step[]
}

// Define platform logos as SVG components
const PlatformLogos = {
  nordnet: (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <rect width="100" height="100" rx="20" fill="#00A9CE"/>
      <text x="50" y="35" fontSize="14" fontWeight="bold" fill="white" textAnchor="middle">NORD</text>
      <text x="50" y="55" fontSize="14" fontWeight="bold" fill="white" textAnchor="middle">NET</text>
      <circle cx="50" cy="70" r="8" fill="white"/>
    </svg>
  ),
  dnb: (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <rect width="100" height="100" rx="12" fill="#004B87"/>
      <rect x="20" y="30" width="60" height="8" fill="white"/>
      <rect x="20" y="45" width="60" height="8" fill="white"/>
      <rect x="20" y="60" width="60" height="8" fill="white"/>
      <text x="50" y="85" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle">DNB</text>
    </svg>
  ),
  charles_schwab: (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <rect width="100" height="100" rx="16" fill="#00A651"/>
      <text x="50" y="40" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle">CHARLES</text>
      <text x="50" y="60" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle">SCHWAB</text>
      <circle cx="25" cy="75" r="3" fill="white"/>
      <circle cx="50" cy="75" r="3" fill="white"/>
      <circle cx="75" cy="75" r="3" fill="white"/>
    </svg>
  ),
}

// Define platform metadata that corresponds to database entries
const platformMetadata: Record<
  string,
  {
    logo: React.ReactNode
    description: string
    connectionTypes: string[]
    features: string[]
    popular: boolean
  }
> = {
  nordnet: {
    logo: PlatformLogos.nordnet,
    description: 'Skandinavias ledende investeringsplattform',
    connectionTypes: ['csv'],
    features: ['Aksjer', 'ETF', 'Fond', 'Opsjoner'],
    popular: true,
  },
  dnb: {
    logo: PlatformLogos.dnb,
    description: 'DNBs investeringstjeneste',
    connectionTypes: ['api'],
    features: ['Aksjer', 'Fond', 'Obligasjoner'],
    popular: true,
  },
  charles_schwab: {
    logo: PlatformLogos.charles_schwab,
    description: 'Global investeringsplattform',
    connectionTypes: ['api'],
    features: ['Aksjer', 'ETF', 'Opsjoner', 'Futures'],
    popular: false,
  },
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      className="space-y-8 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="space-y-4">
        <motion.div
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <svg
            className="h-12 w-12 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
              clipRule="evenodd"
            />
          </svg>
        </motion.div>

        <motion.h2
          className="text-4xl font-bold text-gray-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Velkommen til LifeDash
        </motion.h2>

        <motion.p
          className="mx-auto max-w-2xl text-xl text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          La oss sette opp dine investeringsplattformer slik at du kan få en
          samlet oversikt over alle dine investeringer på ett sted.
        </motion.p>
      </div>

      <motion.div
        className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-8 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Hva kan du gjøre med LifeDash?
        </h3>
        <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-2">
          <div className="flex items-start space-x-3">
            <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <svg
                className="h-4 w-4 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Samlet oversikt</p>
              <p className="text-sm text-gray-600">
                Se alle dine investeringer på ett sted
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-100">
              <svg
                className="h-4 w-4 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                Automatisk synkronisering
              </p>
              <p className="text-sm text-gray-600">
                Hold porteføljen oppdatert automatisk
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100">
              <svg
                className="h-4 w-4 text-purple-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Avansert analyse</p>
              <p className="text-sm text-gray-600">
                Detaljerte rapporter og innsikt
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100">
              <svg
                className="h-4 w-4 text-orange-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Sikker tilkobling</p>
              <p className="text-sm text-gray-600">
                Bank-grad sikkerhet for dine data
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        <Button
          onClick={onNext}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 text-lg font-semibold text-white hover:from-blue-700 hover:to-purple-700"
        >
          Start oppsett
        </Button>
      </motion.div>
    </motion.div>
  )
}

function PlatformSelectionStep({
  selectedPlatforms,
  setSelectedPlatforms,
  onNext,
  onBack,
  onSkip,
}: {
  selectedPlatforms: string[]
  setSelectedPlatforms: (platforms: string[]) => void
  onNext: () => void
  onBack: () => void
  onSkip?: () => void
}) {
  const [availablePlatforms, setAvailablePlatforms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlatforms = async () => {
      try {
        const result = await getPlatforms()
        if (result.success && result.data) {
          // Transform database platforms to include metadata
          const platforms = result.data
            .filter((platform: any) => platform.name !== 'demo') // Filter out demo platform
            .map((platform: any) => {
              const metadata = platformMetadata[platform.name] || {
                logo: (
                  <svg viewBox="0 0 100 100" className="h-full w-full">
                    <rect width="100" height="100" rx="16" fill="#6B7280"/>
                    <rect x="25" y="35" width="50" height="30" rx="4" fill="white"/>
                    <rect x="30" y="45" width="15" height="3" fill="#6B7280"/>
                    <rect x="30" y="52" width="25" height="3" fill="#6B7280"/>
                    <rect x="30" y="59" width="20" height="3" fill="#6B7280"/>
                  </svg>
                ),
                description: platform.display_name,
                connectionTypes: ['api'],
                features: ['Investments'],
                popular: false,
              }

              return {
                id: platform.id,
                name: platform.display_name,
                ...metadata,
                type: platform.type,
                country: platform.country_code,
                commission: getCommissionText(platform),
              }
            })
          setAvailablePlatforms(platforms)
        }
      } catch (error) {
        console.error('Failed to load platforms:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPlatforms()
  }, [])

  const getCommissionText = (platform: any) => {
    if (platform.stock_commission === 0) {
      return 'Gratis aksjer'
    } else if (platform.default_currency === 'NOK') {
      return `Fra ${platform.stock_commission} kr`
    } else {
      return `Fra ${platform.stock_commission} ${platform.default_currency}`
    }
  }

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(
      selectedPlatforms.includes(platformId)
        ? selectedPlatforms.filter(id => id !== platformId)
        : [...selectedPlatforms, platformId]
    )
  }

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Laster plattformer...</p>
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="space-y-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Velg dine investeringsplattformer
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          Velg hvilke plattformer du bruker for å investere. Du kan alltid legge
          til flere senere.
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {availablePlatforms.map((platform, index) => (
          <motion.div
            key={platform.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PlatformSelectionCard
              platform={platform}
              isSelected={selectedPlatforms.includes(platform.id)}
              onToggle={() => togglePlatform(platform.id)}
            />
          </motion.div>
        ))}
      </div>

      <div className="mx-auto max-w-3xl pt-8">
        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack} className="px-6">
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Tilbake
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {selectedPlatforms.length} plattformer valgt
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Skip knapp - liten og til høyre */}
            {onSkip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-gray-500 hover:text-gray-700 text-sm px-3 py-1"
              >
                Hopp over
              </Button>
            )}
            
            {/* Hovedknapp for å fortsette */}
            <Button
              onClick={onNext}
              disabled={selectedPlatforms.length === 0}
              className="px-6"
            >
              Fortsett
              <svg className="ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ConnectionStep({
  selectedPlatforms,
  onNext,
  onBack,
  onSkip,
}: {
  selectedPlatforms: string[]
  onNext: () => void
  onBack: () => void
  onSkip?: () => void
}) {
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
  const [currentConnectionModal, setCurrentConnectionModal] = useState<
    string | null
  >(null)
  const [availablePlatforms, setAvailablePlatforms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlatforms = async () => {
      try {
        const result = await getPlatforms()
        if (result.success && result.data) {
          // Transform database platforms to include metadata
          const platforms = result.data.map((platform: any) => {
            const metadata = platformMetadata[platform.name] || {
              logo: (
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <rect width="100" height="100" rx="16" fill="#6B7280"/>
                  <rect x="25" y="35" width="50" height="30" rx="4" fill="white"/>
                  <rect x="30" y="45" width="15" height="3" fill="#6B7280"/>
                  <rect x="30" y="52" width="25" height="3" fill="#6B7280"/>
                  <rect x="30" y="59" width="20" height="3" fill="#6B7280"/>
                </svg>
              ),
              description: platform.display_name,
              connectionTypes: ['api'],
              features: ['Investments'],
              popular: false,
            }

            return {
              id: platform.id,
              name: platform.display_name,
              ...metadata,
              type: platform.type,
              country: platform.country_code,
            }
          })
          setAvailablePlatforms(platforms)
        }
      } catch (error) {
        console.error('Failed to load platforms:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPlatforms()
  }, [])

  const selectedPlatformData = availablePlatforms.filter(p =>
    selectedPlatforms.includes(p.id)
  )

  const handleConnectionSuccess = (platformId: string) => {
    setConnectedPlatforms(prev => [...prev, platformId])
    setCurrentConnectionModal(null)
  }

  const canProceed = connectedPlatforms.length === selectedPlatforms.length

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Laster plattformer...</p>
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="space-y-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Koble til dine plattformer
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          Sett opp tilkoblinger til dine valgte plattformer for å synkronisere
          data automatisk.
        </p>
      </div>

      <div className="mx-auto max-w-3xl space-y-4">
        {selectedPlatformData.map((platform, index) => {
          const isConnected = connectedPlatforms.includes(platform.id)

          return (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 transition-all duration-200 hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 shadow-sm">
                      {platform.logo}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {platform.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {platform.description}
                      </p>
                      <div className="mt-1 flex items-center space-x-2">
                        {platform.connectionTypes.includes('api') && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                            API
                          </span>
                        )}
                        {platform.connectionTypes.includes('csv') && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                            CSV Import
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {isConnected ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-medium">Tilkoblet</span>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setCurrentConnectionModal(platform.id)}
                        variant="outline"
                        size="sm"
                      >
                        Koble til
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="mx-auto max-w-3xl pt-8">
        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack} className="px-6">
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Tilbake
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {connectedPlatforms.length} av {selectedPlatforms.length} tilkoblet
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Skip knapp - liten og til høyre */}
            {onSkip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-gray-500 hover:text-gray-700 text-sm px-3 py-1"
              >
                Hopp over
              </Button>
            )}
            
            {/* Hovedknapp for å fortsette */}
            <Button onClick={onNext} disabled={!canProceed} className="px-6">
              Fortsett
              <svg className="ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {currentConnectionModal && (
          <ConnectionModal
            platform={
              availablePlatforms.find(p => p.id === currentConnectionModal)!
            }
            onClose={() => setCurrentConnectionModal(null)}
            onSuccess={() => handleConnectionSuccess(currentConnectionModal)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SuccessStep() {
  const router = useRouter()
  const [isCompleting, setIsCompleting] = useState(false)

  const handleFinish = async () => {
    setIsCompleting(true)

    try {
      // Mark setup as completed
      const result = await completeSetup()

      if (result.success) {
        router.push('/investments/stocks')
      } else {
        console.error('Failed to complete setup:', result.error)
        // Still redirect to stocks page
        router.push('/investments/stocks')
      }
    } catch (error) {
      console.error('Complete setup error:', error)
      // Still redirect to stocks page
      router.push('/investments/stocks')
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <motion.div
      className="space-y-8 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-blue-500"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      >
        <svg
          className="h-16 w-16 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      </motion.div>

      <div className="space-y-4">
        <motion.h2
          className="text-4xl font-bold text-gray-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Alt er klart!
        </motion.h2>

        <motion.p
          className="mx-auto max-w-2xl text-xl text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Dine investeringsplattformer er nå konfigurert og klar til bruk. Du
          kan nå se en samlet oversikt over alle dine investeringer.
        </motion.p>
      </div>

      <motion.div
        className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-8 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Neste steg:
        </h3>
        <div className="space-y-4 text-left">
          <div className="flex items-start space-x-3">
            <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <span className="text-sm font-bold text-blue-600">1</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                Utforsk din portefølje
              </p>
              <p className="text-sm text-gray-600">
                Se en detaljert oversikt over alle dine investeringer
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-100">
              <span className="text-sm font-bold text-green-600">2</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                Sett opp automatisk synkronisering
              </p>
              <p className="text-sm text-gray-600">
                Hold dataene oppdatert automatisk
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100">
              <span className="text-sm font-bold text-purple-600">3</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                Utforsk avanserte funksjoner
              </p>
              <p className="text-sm text-gray-600">
                Analyser, rapporter og investeringsinnsikt
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        <Button
          onClick={handleFinish}
          size="lg"
          loading={isCompleting}
          loadingText="Fullfører oppsett..."
          className="bg-gradient-to-r from-green-600 to-blue-600 px-8 py-3 text-lg font-semibold text-white hover:from-green-700 hover:to-blue-700"
        >
          Gå til portefølje
          <svg className="ml-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </Button>
      </motion.div>
    </motion.div>
  )
}

export function PlatformWizard({
  currentStep,
  setCurrentStep,
  selectedPlatforms,
  setSelectedPlatforms,
  steps,
}: PlatformWizardProps) {
  const router = useRouter()

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    try {
      // Mark setup as skipped in session storage for immediate effect
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('setupSkipped', 'true')
      }
      // Redirect with skip parameter and session flag
      router.push('/investments/stocks?skip=true')
    } catch (error) {
      console.error('Failed to skip setup:', error)
      // Still redirect to stocks page with skip parameter
      router.push('/investments/stocks?skip=true')
    }
  }

  return (
    <AnimatePresence mode="wait">
      {currentStep === 0 && <WelcomeStep key="welcome" onNext={handleNext} />}

      {currentStep === 1 && (
        <PlatformSelectionStep
          key="selection"
          selectedPlatforms={selectedPlatforms}
          setSelectedPlatforms={setSelectedPlatforms}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
        />
      )}

      {currentStep === 2 && (
        <ConnectionStep
          key="connection"
          selectedPlatforms={selectedPlatforms}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
        />
      )}

      {currentStep === 3 && <SuccessStep key="success" />}
    </AnimatePresence>
  )
}
