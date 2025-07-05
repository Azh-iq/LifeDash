'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getAccounts } from '@/lib/actions/platforms/crud'
import type { Account } from './account-card'

interface AccountSelectorProps {
  userId: string
  selectedAccountId?: string
  onAccountSelect?: (account: Account | null) => void
  showAllOption?: boolean
  className?: string
}

export default function AccountSelector({
  userId,
  selectedAccountId,
  onAccountSelect,
  showAllOption = true,
  className = '',
}: AccountSelectorProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAccounts()
  }, [userId])

  const loadAccounts = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await getAccounts(userId)
      if (result.success) {
        setAccounts(result.data || [])
      } else {
        setError(result.error || 'Failed to load accounts')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccountSelect = (account: Account | null) => {
    onAccountSelect?.(account)
    setIsOpen(false)
  }

  const selectedAccount = selectedAccountId
    ? accounts.find(account => account.id === selectedAccountId)
    : null

  const groupedAccounts = accounts.reduce(
    (groups, account) => {
      const platformName = account.platform.display_name
      if (!groups[platformName]) {
        groups[platformName] = []
      }
      groups[platformName].push(account)
      return groups
    },
    {} as Record<string, Account[]>
  )

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'TAXABLE':
        return 'bg-blue-100 text-blue-800'
      case 'TRADITIONAL_IRA':
      case 'ROTH_IRA':
      case 'SEP_IRA':
      case 'SIMPLE_IRA':
        return 'bg-green-100 text-green-800'
      case '401K':
      case 'ROTH_401K':
      case '403B':
      case '457':
        return 'bg-purple-100 text-purple-800'
      case 'HSA':
        return 'bg-orange-100 text-orange-800'
      case 'CRYPTO':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatAccountType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
  }

  if (isLoading) {
    return (
      <div className={`relative ${className}`}>
        <Button variant="outline" disabled className="w-full justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            <span>Loading accounts...</span>
          </div>
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <Button
          variant="outline"
          disabled
          className="w-full justify-between text-red-600"
        >
          <div className="flex items-center space-x-2">
            <svg
              className="h-4 w-4"
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
            <span>Error loading accounts</span>
          </div>
        </Button>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <div className="flex items-center space-x-2">
          <svg
            className="h-4 w-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <span className="truncate">
            {selectedAccount ? (
              <span>
                {selectedAccount.name}
                <span className="ml-1 text-sm text-gray-500">
                  ({selectedAccount.platform.display_name})
                </span>
              </span>
            ) : (
              'All Accounts'
            )}
          </span>
        </div>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
          {showAllOption && (
            <button
              onClick={() => handleAccountSelect(null)}
              className={`w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 ${
                !selectedAccountId ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                  <svg
                    className="h-4 w-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">All Accounts</p>
                  <p className="text-sm text-gray-500">
                    View all holdings across platforms
                  </p>
                </div>
              </div>
            </button>
          )}

          {Object.entries(groupedAccounts).map(
            ([platformName, platformAccounts]) => (
              <div key={platformName}>
                <div className="border-b border-gray-100 bg-gray-50 px-4 py-2">
                  <p className="text-sm font-semibold text-gray-700">
                    {platformName}
                  </p>
                </div>
                {platformAccounts.map(account => (
                  <button
                    key={account.id}
                    onClick={() => handleAccountSelect(account)}
                    className={`w-full border-b border-gray-50 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50 ${
                      selectedAccountId === account.id
                        ? 'bg-blue-50 text-blue-600'
                        : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                        <svg
                          className="h-4 w-4 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="truncate font-medium">{account.name}</p>
                          <Badge
                            className={`${getAccountTypeColor(account.account_type)} border-0 text-xs`}
                          >
                            {formatAccountType(account.account_type)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{account.currency}</span>
                          {account.portfolio.is_default && (
                            <>
                              <span>•</span>
                              <span className="text-orange-600">
                                Default Portfolio
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )
          )}

          {accounts.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              <svg
                className="mx-auto mb-4 h-12 w-12 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <p className="font-medium">No accounts found</p>
              <p className="text-sm">Add accounts to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}
