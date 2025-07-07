'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, TrendingUp, PieChart, BarChart3, Import } from 'lucide-react'
import AddTransactionModal, { TransactionData } from './add-transaction-modal'
import CSVImportModal from './csv-import-modal'

interface EmptyStocksPageProps {
  onTransactionAdded?: (transaction: TransactionData) => void
  onImportComplete?: (result: any) => void
}

export function EmptyStocksPage({
  onTransactionAdded,
  onImportComplete,
}: EmptyStocksPageProps) {
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] =
    useState(false)
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false)

  const handleTransactionSubmit = async (transactionData: TransactionData) => {
    // Create portfolio first, then add transaction
    // For now, just notify parent
    onTransactionAdded?.(transactionData)

    // Close modal
    setIsAddTransactionModalOpen(false)
  }

  const features = [
    {
      icon: <Plus className="h-6 w-6" />,
      title: 'Legg til transaksjoner',
      description: 'Registrer kjøp og salg av aksjer manuelt',
      action: () => setIsAddTransactionModalOpen(true),
      actionText: 'Legg til transaksjon',
      primary: true,
    },
    {
      icon: <Import className="h-6 w-6" />,
      title: 'Importer fra CSV',
      description: 'Last opp transaksjoner fra din broker',
      action: () => setIsCSVModalOpen(true),
      actionText: 'Importer CSV',
      primary: false,
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Se utvikling',
      description: 'Følg verdien på investeringene dine',
      disabled: true,
    },
    {
      icon: <PieChart className="h-6 w-6" />,
      title: 'Portefølje-analyse',
      description: 'Få innsikt i din aksjefordeling',
      disabled: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Hero Section */}
      <div className="px-4 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl"
        >
          <div className="mb-6 flex justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="rounded-full bg-purple-100 p-6"
            >
              <BarChart3 className="h-16 w-16 text-purple-600" />
            </motion.div>
          </div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-4 text-4xl font-bold text-gray-900"
          >
            Kom i gang med din aksjeportefølje
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8 text-xl text-gray-600"
          >
            Du har ingen aksjer registrert ennå. Start ved å legge til dine
            første investeringer manuelt.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-12 flex justify-center gap-2"
          >
            <Badge variant="outline" className="bg-white">
              📈 Reelle priser
            </Badge>
            <Badge variant="outline" className="bg-white">
              🔄 Automatisk oppdatering
            </Badge>
            <Badge variant="outline" className="bg-white">
              📊 Detaljerte analyser
            </Badge>
          </motion.div>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <Card
                className={`h-full transition-all duration-200 ${
                  feature.disabled
                    ? 'opacity-60'
                    : 'hover:shadow-lg hover:shadow-purple-500/10'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`rounded-lg p-3 ${
                        feature.disabled
                          ? 'bg-gray-100 text-gray-400'
                          : feature.primary
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-2 text-lg font-semibold text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="mb-4 text-gray-600">
                        {feature.description}
                      </p>
                      {feature.action && !feature.disabled && (
                        <Button
                          onClick={feature.action}
                          variant={feature.primary ? 'default' : 'outline'}
                          className={
                            feature.primary
                              ? 'bg-purple-600 hover:bg-purple-700'
                              : ''
                          }
                        >
                          {feature.actionText}
                        </Button>
                      )}
                      {feature.disabled && (
                        <Badge variant="secondary" className="text-xs">
                          Tilgjengelig når du har aksjer
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Start Tips */}
      <div className="bg-white py-12">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="text-center"
          >
            <h2 className="mb-8 text-2xl font-bold text-gray-900">
              Tips for å komme i gang
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <span className="text-lg font-bold text-green-600">1</span>
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">
                  Start enkelt
                </h3>
                <p className="text-sm text-gray-600">
                  Legg til din første aksje med 'Legg til transaksjon' knappen
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-lg font-bold text-blue-600">2</span>
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">
                  Søk og velg
                </h3>
                <p className="text-sm text-gray-600">
                  Bruk søkefunksjonen for å finne aksjer som Apple, Tesla,
                  Equinor
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <span className="text-lg font-bold text-purple-600">3</span>
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">
                  Se resultatene
                </h3>
                <p className="text-sm text-gray-600">
                  Få automatisk oppdaterte priser og se utviklingen på
                  investeringene
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddTransactionModalOpen}
        onClose={() => setIsAddTransactionModalOpen(false)}
        onSubmit={handleTransactionSubmit}
        accounts={[]} // Empty since we don't have a portfolio yet
      />

      <CSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onImportComplete={result => {
          onImportComplete?.(result)
          setIsCSVModalOpen(false)
        }}
      />
    </div>
  )
}
