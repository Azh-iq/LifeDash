'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/ui/modal'

export interface Account {
  id: string
  name: string
  account_type: string
  currency: string
  account_number?: string
  opening_balance: number
  opening_date?: string
  auto_sync: boolean
  sync_frequency?: number
  last_sync_at?: string
  is_active: boolean
  created_at: string
  platform: {
    id: string
    name: string
    display_name: string
    type: string
  }
  portfolio: {
    id: string
    name: string
    currency: string
    is_default: boolean
  }
}

interface AccountCardProps {
  account: Account
  onEdit?: (account: Account) => void
  onDelete?: (accountId: string) => void
  canEdit?: boolean
  canDelete?: boolean
  showPlatform?: boolean
  showPortfolio?: boolean
}

export default function AccountCard({
  account,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  showPlatform = true,
  showPortfolio = true,
}: AccountCardProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const handleDelete = () => {
    onDelete?.(account.id)
    setDeleteModalOpen(false)
  }

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'TAXABLE':
        return (
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        )
      case 'TRADITIONAL_IRA':
      case 'ROTH_IRA':
      case 'SEP_IRA':
      case 'SIMPLE_IRA':
        return (
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
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        )
      case '401K':
      case 'ROTH_401K':
      case '403B':
      case '457':
        return (
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        )
      case 'CRYPTO':
        return (
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
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
            />
          </svg>
        )
      default:
        return (
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
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        )
    }
  }

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('no-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const maskAccountNumber = (accountNumber?: string) => {
    if (!accountNumber || accountNumber.length <= 4) return accountNumber
    return `****${accountNumber.slice(-4)}`
  }

  return (
    <>
      <Card className="border-0 bg-white shadow-lg transition-all duration-200 hover:shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                {getAccountTypeIcon(account.account_type)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {account.name}
                </h3>
                <div className="flex items-center space-x-2">
                  <Badge
                    className={`${getAccountTypeColor(account.account_type)} border-0 text-xs`}
                  >
                    {formatAccountType(account.account_type)}
                  </Badge>
                  {account.portfolio.is_default && (
                    <Badge
                      variant="outline"
                      className="border-orange-200 text-xs text-orange-600"
                    >
                      Default
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge
                className={`${account.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} border-0`}
              >
                {account.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Platform and Portfolio Info */}
          {(showPlatform || showPortfolio) && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {showPlatform && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Platform
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {account.platform.display_name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {account.platform.type.replace('_', ' ')}
                  </p>
                </div>
              )}
              {showPortfolio && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Portfolio
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {account.portfolio.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {account.portfolio.currency}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Account Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Currency
              </p>
              <p className="text-sm font-bold text-gray-900">
                {account.currency}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Opening Balance
              </p>
              <p className="text-sm font-bold text-gray-900">
                {account.opening_balance.toLocaleString('no-NO', {
                  style: 'currency',
                  currency: account.currency,
                  minimumFractionDigits: 0,
                })}
              </p>
            </div>
          </div>

          {/* Account Number and Dates */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {account.account_number && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Account Number
                </p>
                <p className="font-mono text-sm text-gray-900">
                  {maskAccountNumber(account.account_number)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Opening Date
              </p>
              <p className="text-sm text-gray-900">
                {formatDate(account.opening_date)}
              </p>
            </div>
          </div>

          {/* Auto Sync Info */}
          {account.auto_sync && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-center space-x-2">
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Auto Sync Enabled
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-blue-700">
                    {account.sync_frequency && (
                      <span>Every {account.sync_frequency} hours</span>
                    )}
                    {account.last_sync_at && (
                      <span>Last sync: {formatDate(account.last_sync_at)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {(canEdit || canDelete) && (
            <div className="flex items-center justify-end space-x-2 pt-2">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit?.(account)}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <svg
                    className="mr-1 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteModalOpen(true)}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <svg
                    className="mr-1 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete Account"
        description={`Are you sure you want to delete the account "${account.name}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  )
}
