'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { PlatformWizard } from '@/components/features/platforms/platform-wizard'

interface StepType {
  id: string
  title: string
  description: string
}

const steps: StepType[] = [
  {
    id: 'welcome',
    title: 'Velkommen',
    description: 'Start din investeringsreise',
  },
  {
    id: 'selection',
    title: 'Velg plattformer',
    description: 'Velg dine investeringsplattformer',
  },
  {
    id: 'connection',
    title: 'Koble til',
    description: 'Sett opp tilkoblinger',
  },
  { id: 'success', title: 'Ferdig', description: 'Alt er konfigurert' },
]

function StepIndicator({
  steps,
  currentStep,
}: {
  steps: StepType[]
  currentStep: number
}) {
  return (
    <div className="mb-12 flex items-center justify-center space-x-8">
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          className="flex items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex flex-col items-center space-y-2">
            <motion.div
              className={`
                flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold
                transition-all duration-300
                ${
                  index < currentStep
                    ? 'bg-blue-600 text-white'
                    : index === currentStep
                      ? 'bg-blue-100 text-blue-600 ring-4 ring-blue-100'
                      : 'bg-gray-100 text-gray-400'
                }
              `}
              animate={{
                scale: index === currentStep ? 1.1 : 1,
                backgroundColor:
                  index < currentStep
                    ? '#2563eb'
                    : index === currentStep
                      ? '#dbeafe'
                      : '#f3f4f6',
              }}
              transition={{ duration: 0.3 }}
            >
              {index < currentStep ? (
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </motion.div>
            <div className="text-center">
              <p
                className={`text-sm font-medium ${index <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}
              >
                {step.title}
              </p>
              <p
                className={`text-xs ${index <= currentStep ? 'text-gray-600' : 'text-gray-400'}`}
              >
                {step.description}
              </p>
            </div>
          </div>

          {index < steps.length - 1 && (
            <motion.div
              className={`mx-4 h-0.5 w-16 transition-colors duration-300 ${
                index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            />
          )}
        </motion.div>
      ))}
    </div>
  )
}

export default function PlatformSetupPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <svg
          className="absolute left-0 top-0 h-full w-full"
          viewBox="0 0 1000 1000"
          fill="none"
        >
          <defs>
            <pattern
              id="grid"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="rgb(59 130 246 / 0.05)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Floating Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-blue-200/20 blur-xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute right-1/4 top-1/3 h-24 w-24 rounded-full bg-purple-200/20 blur-xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 h-40 w-40 rounded-full bg-indigo-200/20 blur-xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <motion.header
          className="pb-4 pt-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600">
                  <svg
                    className="h-6 w-6 text-white"
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
                  <h1 className="text-2xl font-bold text-gray-900">LifeDash</h1>
                  <p className="text-sm text-gray-600">Platform Setup</p>
                </div>
              </div>

              <motion.div
                className="text-right"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-sm text-gray-600">
                  Steg {currentStep + 1} av {steps.length}
                </p>
                <div className="mt-1 h-2 w-32 rounded-full bg-gray-200">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
                    initial={{ width: '0%' }}
                    animate={{
                      width: `${((currentStep + 1) / steps.length) * 100}%`,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* Step Indicator - Hidden on mobile */}
        <div className="flex-shrink-0 py-8 hidden md:block">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>

        {/* Wizard Content */}
        <div className="flex flex-1 items-center justify-center px-4 md:px-6 pb-6 md:pb-12">
          <motion.div
            className="w-full max-w-4xl"
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
          >
            <PlatformWizard
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              selectedPlatforms={selectedPlatforms}
              setSelectedPlatforms={setSelectedPlatforms}
              steps={steps}
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
