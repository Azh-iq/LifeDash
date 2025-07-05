'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Platform {
  id: string
  name: string
  description: string
  type: string
  country: string
  logo: string
  connectionTypes: string[]
  features: string[]
  commission: string
  popular?: boolean
}

interface PlatformSelectionCardProps {
  platform: Platform
  isSelected: boolean
  onToggle: () => void
}

export function PlatformSelectionCard({
  platform,
  isSelected,
  onToggle,
}: PlatformSelectionCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`
          relative cursor-pointer overflow-hidden transition-all duration-300
          ${
            isSelected
              ? 'bg-blue-50 shadow-lg ring-2 ring-blue-500 ring-offset-2'
              : 'border-gray-200 bg-white hover:shadow-lg'
          }
        `}
        onClick={onToggle}
      >
        {/* Popular Badge */}
        {platform.popular && (
          <div className="absolute right-4 top-4 z-10">
            <Badge className="border-0 bg-gradient-to-r from-orange-500 to-red-500 text-xs font-semibold text-white">
              Populær
            </Badge>
          </div>
        )}

        {/* Selection Indicator */}
        <div className="absolute left-4 top-4 z-10">
          <motion.div
            className={`
              h-6 w-6 rounded-full border-2 transition-all duration-200
              ${
                isSelected
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 bg-white'
              }
            `}
            animate={{
              scale: isSelected ? 1.1 : 1,
              backgroundColor: isSelected ? '#3b82f6' : '#ffffff',
            }}
          >
            {isSelected && (
              <motion.svg
                className="h-4 w-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </motion.svg>
            )}
          </motion.div>
        </div>

        <div className="p-6 pt-12">
          {/* Platform Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-3xl">
              {platform.logo}
            </div>
            <h3
              className={`mb-2 text-xl font-bold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}
            >
              {platform.name}
            </h3>
            <p
              className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}
            >
              {platform.description}
            </p>
          </div>

          {/* Platform Details */}
          <div className="space-y-4">
            {/* Type and Country */}
            <div className="flex items-center justify-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {platform.type === 'BROKER'
                  ? 'Megler'
                  : platform.type === 'BANK'
                    ? 'Bank'
                    : platform.type}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {platform.country}
              </Badge>
            </div>

            {/* Commission */}
            <div className="text-center">
              <p className="mb-1 text-xs text-gray-500">Kommisjon</p>
              <p
                className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}
              >
                {platform.commission}
              </p>
            </div>

            {/* Connection Types */}
            <div className="flex justify-center space-x-2">
              {platform.connectionTypes.map(type => (
                <Badge
                  key={type}
                  className={`text-xs ${
                    type === 'api'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {type === 'api' ? 'API' : 'CSV Import'}
                </Badge>
              ))}
            </div>

            {/* Features */}
            <div>
              <p className="mb-2 text-center text-xs text-gray-500">
                Støttede produkter
              </p>
              <div className="flex flex-wrap justify-center gap-1">
                {platform.features.map(feature => (
                  <span
                    key={feature}
                    className={`
                      inline-block rounded-md px-2 py-1 text-xs
                      ${
                        isSelected
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }
                    `}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Selection Status */}
            <div className="border-t border-gray-100 pt-4">
              <div
                className={`
                rounded-lg py-2 text-center transition-colors duration-200
                ${
                  isSelected
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-50 text-gray-600'
                }
              `}
              >
                <p className="text-sm font-medium">
                  {isSelected ? '✓ Valgt' : 'Klikk for å velge'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hover Effect Overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0"
          animate={{ opacity: isSelected ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </Card>
    </motion.div>
  )
}
