'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  createAccount,
  updateAccount,
  getPlatforms,
  getPortfolios,
} from '@/lib/actions/platforms/crud'
import type { Account } from './account-card'
import type { Platform } from './platform-card'

interface Portfolio {
  id: string
  name: string
  currency: string
  is_default: boolean
  created_at: string
}

interface AccountFormProps {
  account?: Account
  userId: string
  onSuccess?: (account: Account) => void
  onCancel?: () => void
}

export default function AccountForm({
  account,
  userId,
  onSuccess,
  onCancel,
}: AccountFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    portfolio_id: '',
    platform_id: '',
    account_type: 'TAXABLE',
    currency: 'USD',
    account_number: '',
    opening_balance: 0,
    opening_date: '',
    auto_sync: false,
    sync_frequency: 24,
    is_active: true,
  })

  useEffect(() => {
    loadInitialData()
  }, [userId])

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        portfolio_id: account.portfolio.id,
        platform_id: account.platform.id,
        account_type: account.account_type,
        currency: account.currency,
        account_number: account.account_number || '',
        opening_balance: account.opening_balance,
        opening_date: account.opening_date || '',
        auto_sync: account.auto_sync,
        sync_frequency: account.sync_frequency || 24,
        is_active: account.is_active,
      })
    }
  }, [account])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)

      const [platformsResult, portfoliosResult] = await Promise.all([
        getPlatforms(),
        getPortfolios(userId),
      ])

      if (platformsResult.success) {
        setPlatforms(platformsResult.data || [])
      }

      if (portfoliosResult.success) {
        setPortfolios(portfoliosResult.data || [])
        // Set default portfolio if none selected and not editing
        if (!account && portfoliosResult.data?.length > 0) {
          const defaultPortfolio =
            portfoliosResult.data.find((p: Portfolio) => p.is_default) ||
            portfoliosResult.data[0]
          setFormData(prev => ({ ...prev, portfolio_id: defaultPortfolio.id }))
        }
      }
    } catch (err) {
      console.error('Error loading initial data:', err)
      setError('Failed to load form data')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const submitData = {
        ...formData,
        account_number: formData.account_number || undefined,
        opening_date: formData.opening_date || undefined,
        sync_frequency: formData.auto_sync
          ? formData.sync_frequency
          : undefined,
      }

      let result
      if (account) {
        result = await updateAccount({ ...submitData, id: account.id })
      } else {
        result = await createAccount(submitData)
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

  const accountTypes = [
    { value: 'TAXABLE', label: 'Taxable Account' },
    { value: 'TRADITIONAL_IRA', label: 'Traditional IRA' },
    { value: 'ROTH_IRA', label: 'Roth IRA' },
    { value: 'SEP_IRA', label: 'SEP IRA' },
    { value: 'SIMPLE_IRA', label: 'SIMPLE IRA' },
    { value: '401K', label: '401(k)' },
    { value: 'ROTH_401K', label: 'Roth 401(k)' },
    { value: '403B', label: '403(b)' },
    { value: '457', label: '457 Plan' },
    { value: 'HSA', label: 'Health Savings Account' },
    { value: 'TFSA', label: 'Tax-Free Savings Account' },
    { value: 'RRSP', label: 'Registered Retirement Savings Plan' },
    { value: 'RESP', label: 'Registered Education Savings Plan' },
    { value: 'ISA', label: 'Individual Savings Account' },
    { value: 'PENSION', label: 'Pension Account' },
    { value: 'TRUST', label: 'Trust Account' },
    { value: 'JOINT', label: 'Joint Account' },
    { value: 'INDIVIDUAL', label: 'Individual Account' },
    { value: 'CORPORATE', label: 'Corporate Account' },
    { value: 'CRYPTO', label: 'Crypto Account' },
    { value: 'SAVINGS', label: 'Savings Account' },
    { value: 'CHECKING', label: 'Checking Account' },
  ]

  const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'NOK', label: 'NOK - Norwegian Krone' },
    { value: 'SEK', label: 'SEK - Swedish Krona' },
    { value: 'DKK', label: 'DKK - Danish Krone' },
  ]

  if (loadingData) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            <span className="ml-2 text-gray-600">Loading form data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {account ? 'Edit Account' : 'Add New Account'}
            </h3>
            <p className="text-sm text-gray-600">
              Configure account settings and platform connection
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
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Main Trading Account"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Account Type *
                </label>
                <select
                  required
                  value={formData.account_type}
                  onChange={e =>
                    handleInputChange('account_type', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {accountTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Portfolio *
                </label>
                <select
                  required
                  value={formData.portfolio_id}
                  onChange={e =>
                    handleInputChange('portfolio_id', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a portfolio</option>
                  {portfolios.map(portfolio => (
                    <option key={portfolio.id} value={portfolio.id}>
                      {portfolio.name} {portfolio.is_default ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Platform *
                </label>
                <select
                  required
                  value={formData.platform_id}
                  onChange={e =>
                    handleInputChange('platform_id', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a platform</option>
                  {platforms.map(platform => (
                    <option key={platform.id} value={platform.id}>
                      {platform.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Currency *
                </label>
                <select
                  required
                  value={formData.currency}
                  onChange={e => handleInputChange('currency', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currencies.map(currency => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
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
                    Active Account
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900">
              Account Details
            </h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={e =>
                    handleInputChange('account_number', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Account number (optional, will be masked)
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Opening Date
                </label>
                <input
                  type="date"
                  value={formData.opening_date}
                  onChange={e =>
                    handleInputChange('opening_date', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Opening Balance
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.opening_balance}
                  onChange={e =>
                    handleInputChange(
                      'opening_balance',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Auto Sync Settings */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900">
              Sync Settings
            </h4>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.auto_sync}
                  onChange={e =>
                    handleInputChange('auto_sync', e.target.checked)
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Enable Auto Sync
                  </span>
                  <p className="text-xs text-gray-500">
                    Automatically sync data from the platform
                  </p>
                </div>
              </label>

              {formData.auto_sync && (
                <div className="ml-6">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Sync Frequency (hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={formData.sync_frequency}
                    onChange={e =>
                      handleInputChange(
                        'sync_frequency',
                        parseInt(e.target.value) || 24
                      )
                    }
                    className="w-32 rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    How often to sync (1-168 hours)
                  </p>
                </div>
              )}
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
                  <span>{account ? 'Updating...' : 'Creating...'}</span>
                </div>
              ) : (
                <span>{account ? 'Update Account' : 'Create Account'}</span>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
