'use client'

import { useState, useEffect } from 'react'
import { addStockHolding, getUserAccounts } from '@/lib/actions/stocks/crud'
import StockSearch from './stock-search'

interface Stock {
  id: string
  symbol: string
  name: string
  company_name?: string
  exchange: string
  currency: string
  current_price?: number
  sector?: string
  industry?: string
  market_cap?: number
}

interface Account {
  id: string
  name: string
  account_type: string
  currency: string
  balance?: number
  portfolio_id: string
  portfolio?: {
    id: string
    name: string
  }
}

interface AddStockModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
}

export default function AddStockModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
}: AddStockModalProps) {
  const [step, setStep] = useState<'search' | 'details'>('search')
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    accountId: '',
    quantity: '',
    averageCost: '',
    currency: 'USD',
  })

  // Load user accounts when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      loadAccounts()
    }
  }, [isOpen, userId])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('search')
      setSelectedStock(null)
      setFormData({
        accountId: '',
        quantity: '',
        averageCost: '',
        currency: 'USD',
      })
      setError(null)
    }
  }, [isOpen])

  // Update currency when stock is selected
  useEffect(() => {
    if (selectedStock) {
      setFormData(prev => ({
        ...prev,
        currency: selectedStock.currency || 'USD',
        averageCost: selectedStock.current_price
          ? selectedStock.current_price.toString()
          : '',
      }))
    }
  }, [selectedStock])

  const loadAccounts = async () => {
    try {
      setIsLoading(true)
      const result = await getUserAccounts(userId)

      if (result.success) {
        setAccounts(result.data || [])
        // Auto-select first account if only one exists
        if (result.data?.length === 1) {
          setFormData(prev => ({ ...prev, accountId: result.data[0].id }))
        }
      } else {
        setError(result.error || 'Failed to load accounts')
      }
    } catch (err) {
      console.error('Error loading accounts:', err)
      setError('Failed to load accounts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock)
    setStep('details')
    setError(null)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedStock) return

    const quantity = parseFloat(formData.quantity)
    const averageCost = parseFloat(formData.averageCost)

    if (!formData.accountId || quantity <= 0 || averageCost <= 0) {
      setError('Please fill in all required fields with valid values')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const result = await addStockHolding(
        selectedStock.id,
        formData.accountId,
        quantity,
        averageCost,
        formData.currency
      )

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Failed to add stock holding')
      }
    } catch (err) {
      console.error('Error adding stock holding:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTotalCost = () => {
    const quantity = parseFloat(formData.quantity)
    const averageCost = parseFloat(formData.averageCost)

    if (quantity > 0 && averageCost > 0) {
      return (quantity * averageCost).toLocaleString('en-US', {
        style: 'currency',
        currency: formData.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    }
    return '0.00'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900">
            {step === 'search' ? 'Search for Stocks' : 'Add Stock to Portfolio'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'search' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Search for a stock by symbol or company name to add to your
                portfolio.
              </p>
              <StockSearch
                onSelectStock={handleStockSelect}
                placeholder="Enter stock symbol or company name..."
                className="w-full"
              />
            </div>
          )}

          {step === 'details' && selectedStock && (
            <div className="space-y-6">
              {/* Selected Stock Info */}
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500 text-white">
                    <span className="text-lg font-bold">
                      {selectedStock.symbol.substring(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {selectedStock.symbol}
                      </h3>
                      <span className="inline-flex items-center rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                        {selectedStock.exchange}
                      </span>
                    </div>
                    <p className="text-gray-600">
                      {selectedStock.company_name || selectedStock.name}
                    </p>
                    {selectedStock.current_price && (
                      <p className="text-sm text-gray-500">
                        Current Price:{' '}
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: selectedStock.currency,
                        }).format(selectedStock.current_price)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setStep('search')
                      setSelectedStock(null)
                    }}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Account Selection */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Account *
                  </label>
                  <select
                    value={formData.accountId}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        accountId: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select an account</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.account_type})
                        {account.portfolio?.name &&
                          ` - ${account.portfolio.name}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    value={formData.quantity}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="Number of shares"
                    required
                  />
                </div>

                {/* Average Cost */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Average Cost per Share *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">
                      {formData.currency === 'NOK' ? 'kr' : '$'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.averageCost}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          averageCost: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        currency: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="NOK">NOK - Norwegian Krone</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>

                {/* Total Cost Display */}
                {formData.quantity && formData.averageCost && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Total Cost:
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {calculateTotalCost()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="h-4 w-4 text-red-600"
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
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('search')
                      setSelectedStock(null)
                    }}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Adding...</span>
                      </>
                    ) : (
                      <span>Add to Portfolio</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
