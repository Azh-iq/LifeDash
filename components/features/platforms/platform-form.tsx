'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createPlatform, updatePlatform } from '@/lib/actions/platforms/crud'
import type { Platform } from './platform-card'

interface PlatformFormProps {
  platform?: Platform
  onSuccess?: (platform: Platform) => void
  onCancel?: () => void
}

export default function PlatformForm({
  platform,
  onSuccess,
  onCancel,
}: PlatformFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    type: 'BROKER',
    default_currency: 'USD',
    stock_commission: 0,
    etf_commission: 0,
    option_commission: 0,
    crypto_commission_percent: 0,
    fx_spread_percent: 0,
    country_code: '',
    is_active: true,
  })

  useEffect(() => {
    if (platform) {
      setFormData({
        name: platform.name,
        display_name: platform.display_name,
        type: platform.type,
        default_currency: platform.default_currency,
        stock_commission: platform.stock_commission,
        etf_commission: platform.etf_commission,
        option_commission: platform.option_commission,
        crypto_commission_percent: platform.crypto_commission_percent,
        fx_spread_percent: platform.fx_spread_percent,
        country_code: platform.country_code || '',
        is_active: platform.is_active,
      })
    }
  }, [platform])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const submitData = {
        ...formData,
        country_code: formData.country_code || undefined,
      }

      let result
      if (platform) {
        result = await updatePlatform({ ...submitData, id: platform.id })
      } else {
        result = await createPlatform(submitData)
      }

      if (result.success) {
        onSuccess?.(result.data)
      } else {
        setError(result.error || 'An error occurred')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const platformTypes = [
    { value: 'BROKER', label: 'Broker' },
    { value: 'BANK', label: 'Bank' },
    { value: 'CRYPTO_EXCHANGE', label: 'Crypto Exchange' },
    { value: 'ROBO_ADVISOR', label: 'Robo Advisor' },
    { value: 'MANUAL', label: 'Manual Entry' },
    { value: 'IMPORT_ONLY', label: 'Import Only' },
  ]

  const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'NOK', label: 'NOK - Norwegian Krone' },
    { value: 'SEK', label: 'SEK - Swedish Krona' },
    { value: 'DKK', label: 'DKK - Danish Krone' },
  ]

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {platform ? 'Edit Platform' : 'Add New Platform'}
            </h3>
            <p className="text-sm text-gray-600">
              Configure platform settings and fee structure
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center">
                <svg
                  className="mr-2 h-5 w-5 text-red-400"
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
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900">
              Basic Information
            </h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Platform Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., nordnet"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Unique identifier (lowercase, no spaces)
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.display_name}
                  onChange={e =>
                    handleInputChange('display_name', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Nordnet"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Platform Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={e => handleInputChange('type', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {platformTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Default Currency *
                </label>
                <select
                  required
                  value={formData.default_currency}
                  onChange={e =>
                    handleInputChange('default_currency', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currencies.map(currency => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Country Code
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={formData.country_code}
                  onChange={e =>
                    handleInputChange(
                      'country_code',
                      e.target.value.toUpperCase()
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., NO"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Two-letter country code (optional)
                </p>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e =>
                      handleInputChange('is_active', e.target.checked)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active Platform
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Fee Structure */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900">
              Fee Structure
            </h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Stock Commission ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.stock_commission}
                  onChange={e =>
                    handleInputChange(
                      'stock_commission',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ETF Commission ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.etf_commission}
                  onChange={e =>
                    handleInputChange(
                      'etf_commission',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Option Commission ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.option_commission}
                  onChange={e =>
                    handleInputChange(
                      'option_commission',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Crypto Commission (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.crypto_commission_percent}
                  onChange={e =>
                    handleInputChange(
                      'crypto_commission_percent',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  FX Spread (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.fx_spread_percent}
                  onChange={e =>
                    handleInputChange(
                      'fx_spread_percent',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Foreign exchange spread percentage
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 border-t border-gray-200 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>{platform ? 'Updating...' : 'Creating...'}</span>
                </div>
              ) : (
                <span>{platform ? 'Update Platform' : 'Create Platform'}</span>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
