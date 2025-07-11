'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  BlurredGradientSpinner,
  FinancialGrowthLoader,
  LifeDashLogo
} from '@/components/ui/uiverse-copied-loaders'
import { NeonButton } from '@/components/ui/uiverse-buttons'
import { FloatingCard } from '@/components/ui/uiverse-cards'

export default function UIShowcasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <LifeDashLogo size={60} animated={true} showText={true} className="justify-center mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            LifeDash UI Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Enkle og elegante UI-komponenter for LifeDash
          </p>
        </motion.div>

        {/* Clean Demo Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Financial Loader */}
          <FloatingCard>
            <h3 className="text-lg font-semibold mb-6 text-center">Financial Growth Loader</h3>
            <div className="flex justify-center">
              <FinancialGrowthLoader />
            </div>
            <p className="text-sm text-gray-600 text-center mt-4">
              Brukes på investeringssider
            </p>
          </FloatingCard>

          {/* Gradient Spinner */}
          <FloatingCard>
            <h3 className="text-lg font-semibold mb-6 text-center">Blurred Gradient Spinner</h3>
            <div className="flex justify-center">
              <BlurredGradientSpinner size={80} />
            </div>
            <p className="text-sm text-gray-600 text-center mt-4">
              Standard loading for alle sider
            </p>
          </FloatingCard>

          {/* Button Demo */}
          <FloatingCard>
            <h3 className="text-lg font-semibold mb-6 text-center">Neon Button</h3>
            <div className="flex justify-center">
              <NeonButton variant="purple">LifeDash Button</NeonButton>
            </div>
            <p className="text-sm text-gray-600 text-center mt-4">
              Hovedknapp for viktige handlinger
            </p>
          </FloatingCard>

          {/* Logo Demo */}
          <FloatingCard>
            <h3 className="text-lg font-semibold mb-6 text-center">LifeDash Logo</h3>
            <div className="flex justify-center">
              <LifeDashLogo size={80} animated={true} showText={false} />
            </div>
            <p className="text-sm text-gray-600 text-center mt-4">
              Responsive logo med animasjoner
            </p>
          </FloatingCard>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-8 mt-12"
        >
          <p className="text-gray-600">
            Ryddig og profesjonell UI for LifeDash
          </p>
        </motion.footer>
      </div>
    </div>
  )
}
