'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/ui/modal'

export interface Platform {
  id: string
  name: string
  display_name: string
  type: string
  default_currency: string
  stock_commission: number
  etf_commission: number
  option_commission: number
  crypto_commission_percent: number
  fx_spread_percent: number
  country_code?: string
  is_active: boolean
  created_at: string
}

interface PlatformCardProps {
  platform: Platform
  onEdit?: (platform: Platform) => void
  onDelete?: (platformId: string) => void
  canEdit?: boolean
  canDelete?: boolean
}

export default function PlatformCard({
  platform,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}: PlatformCardProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const handleDelete = () => {
    onDelete?.(platform.id)
    setDeleteModalOpen(false)
  }

  const getPlatformIcon = (type: string) => {
    switch (type) {
      case 'BROKER':
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
      case 'BANK':
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
      case 'CRYPTO_EXCHANGE':
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        )
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BROKER':
        return 'bg-blue-100 text-blue-800'
      case 'BANK':
        return 'bg-green-100 text-green-800'
      case 'CRYPTO_EXCHANGE':
        return 'bg-purple-100 text-purple-800'
      case 'ROBO_ADVISOR':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCommission = (value: number, isPercent = false) => {
    if (value === 0) return 'Free'
    return isPercent ? `${value}%` : `$${value}`
  }

  return (
    <>
      <Card className="border-0 bg-white shadow-lg transition-all duration-200 hover:shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                {getPlatformIcon(platform.type)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {platform.display_name}
                </h3>
                <p className="text-sm text-gray-600">{platform.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`${getTypeColor(platform.type)} border-0`}>
                {platform.type.replace('_', ' ')}
              </Badge>
              {platform.country_code && (
                <Badge variant="outline" className="text-xs">
                  {platform.country_code}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Currency and Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Default Currency
              </p>
              <p className="text-sm font-bold text-gray-900">
                {platform.default_currency}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Status
              </p>
              <Badge
                className={`${platform.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} border-0`}
              >
                {platform.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          {/* Commission Structure */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Fee Structure
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Stocks:</span>
                <span className="font-medium">
                  {formatCommission(platform.stock_commission)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ETFs:</span>
                <span className="font-medium">
                  {formatCommission(platform.etf_commission)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Options:</span>
                <span className="font-medium">
                  {formatCommission(platform.option_commission)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Crypto:</span>
                <span className="font-medium">
                  {formatCommission(platform.crypto_commission_percent, true)}
                </span>
              </div>
            </div>
            {platform.fx_spread_percent > 0 && (
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-gray-600">FX Spread:</span>
                <span className="font-medium">
                  {formatCommission(platform.fx_spread_percent, true)}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {(canEdit || canDelete) && (
            <div className="flex items-center justify-end space-x-2 pt-2">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit?.(platform)}
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
        title="Delete Platform"
        description={`Are you sure you want to delete ${platform.display_name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  )
}
