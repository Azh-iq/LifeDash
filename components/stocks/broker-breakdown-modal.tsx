'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  formatCurrency,
  formatPercentage,
  formatNumber,
} from '@/lib/utils/format'
import {
  Building2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  RefreshCw,
  ExternalLink,
  Merge,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BrokerBreakdownData {
  symbol: string
  stockName: string
  totalQuantity: number
  totalMarketValue: number
  totalCostBasis: number
  isDuplicate: boolean
  sourceDetails: {
    account_id: string
    broker_id: string
    quantity: number
    market_value: number
    cost_basis: number
    last_updated: string
  }[]
  brokerIds: string[]
  connectionIds: string[]
  lastUpdated: string
}

interface BrokerBreakdownModalProps {
  holding: BrokerBreakdownData
  trigger: React.ReactNode
  onMergeHoldings?: (holding: BrokerBreakdownData) => void
  onResolveConflict?: (holding: BrokerBreakdownData) => void
  onViewBrokerDetails?: (brokerId: string) => void
  onSyncBroker?: (brokerId: string) => void
}

const BROKER_CONFIG = {
  plaid: {
    name: 'Plaid',
    logo: '🏦',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
  schwab: {
    name: 'Charles Schwab',
    logo: '🇺🇸',
    color: 'bg-purple-500',
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50',
  },
  interactive_brokers: {
    name: 'Interactive Brokers',
    logo: '🌐',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
  },
  nordnet: {
    name: 'Nordnet',
    logo: '🇳🇴',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
  },
}

export function BrokerBreakdownModal({
  holding,
  trigger,
  onMergeHoldings,
  onResolveConflict,
  onViewBrokerDetails,
  onSyncBroker,
}: BrokerBreakdownModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null)

  const getBrokerConfig = (brokerId: string) => {
    return BROKER_CONFIG[brokerId as keyof typeof BROKER_CONFIG] || {
      name: brokerId,
      logo: '🏛️',
      color: 'bg-gray-500',
      textColor: 'text-gray-700',
      bgColor: 'bg-gray-50',
    }
  }

  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? (value / total) * 100 : 0
  }

  const getLastUpdatedStatus = (lastUpdated: string) => {
    const now = new Date()
    const updated = new Date(lastUpdated)
    const diffHours = (now.getTime() - updated.getTime()) / (1000 * 60 * 60)

    if (diffHours < 1) {
      return { status: 'fresh', color: 'text-green-600', icon: CheckCircle }
    } else if (diffHours < 24) {
      return { status: 'recent', color: 'text-yellow-600', icon: Clock }
    } else {
      return { status: 'stale', color: 'text-red-600', icon: AlertTriangle }
    }
  }

  const totalPnL = holding.totalMarketValue - holding.totalCostBasis
  const totalPnLPercent = holding.totalCostBasis > 0 ? (totalPnL / holding.totalCostBasis) * 100 : 0

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-purple-600" />
            <span>Megler-sammendrag for {holding.stockName}</span>
            {holding.isDuplicate && (
              <Badge variant="destructive" className="ml-2">
                <Merge className="h-3 w-3 mr-1" />
                Duplikat
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Total antall
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatNumber(holding.totalQuantity)}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Total markedsverdi
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {formatCurrency(holding.totalMarketValue, 'NOK', { compact: true })}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <div className={cn(
              'p-4 rounded-lg',
              totalPnL >= 0 
                ? 'bg-green-50 dark:bg-green-900/20' 
                : 'bg-red-50 dark:bg-red-900/20'
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn(
                    'text-sm font-medium',
                    totalPnL >= 0 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-red-700 dark:text-red-300'
                  )}>
                    Total P&L
                  </p>
                  <p className={cn(
                    'text-2xl font-bold',
                    totalPnL >= 0 
                      ? 'text-green-900 dark:text-green-100' 
                      : 'text-red-900 dark:text-red-100'
                  )}>
                    {formatCurrency(totalPnL, 'NOK', { compact: true })}
                  </p>
                </div>
                {totalPnL >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          </div>

          {/* Broker Distribution */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Megler-fordeling</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {holding.brokerIds.length} meglere
                </span>
                {holding.isDuplicate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onResolveConflict?.(holding)}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Løs konflikt
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {holding.brokerIds.map(brokerId => {
                const brokerConfig = getBrokerConfig(brokerId)
                const brokerHoldings = holding.sourceDetails.filter(d => d.broker_id === brokerId)
                const brokerTotal = brokerHoldings.reduce((sum, h) => sum + h.market_value, 0)
                const brokerQuantity = brokerHoldings.reduce((sum, h) => sum + h.quantity, 0)
                const brokerPercentage = calculatePercentage(brokerTotal, holding.totalMarketValue)

                return (
                  <motion.div
                    key={brokerId}
                    className={cn(
                      'p-4 rounded-lg border cursor-pointer transition-all',
                      selectedBroker === brokerId
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    onClick={() => setSelectedBroker(selectedBroker === brokerId ? null : brokerId)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold',
                          brokerConfig.color
                        )}>
                          {brokerConfig.logo}
                        </div>
                        <div>
                          <p className="font-medium">{brokerConfig.name}</p>
                          <p className="text-sm text-gray-600">
                            {brokerHoldings.length} konti
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewBrokerDetails?.(brokerId)
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Antall:</span>
                        <span className="font-medium">{formatNumber(brokerQuantity)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Markedsverdi:</span>
                        <span className="font-medium">{formatCurrency(brokerTotal, 'NOK')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Andel:</span>
                        <span className="font-medium">{formatPercentage(brokerPercentage)}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={cn('h-2 rounded-full', brokerConfig.color)}
                          style={{ width: `${brokerPercentage}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Detailed Breakdown Table */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Detaljert oversikt</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                    <TableHead>Megler</TableHead>
                    <TableHead>Konto</TableHead>
                    <TableHead className="text-right">Antall</TableHead>
                    <TableHead className="text-right">Markedsverdi</TableHead>
                    <TableHead className="text-right">Kostnad</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                    <TableHead className="text-right">Sist oppdatert</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holding.sourceDetails.map((detail, index) => {
                    const brokerConfig = getBrokerConfig(detail.broker_id)
                    const pnl = detail.market_value - detail.cost_basis
                    const pnlPercent = detail.cost_basis > 0 ? (pnl / detail.cost_basis) * 100 : 0
                    const updateStatus = getLastUpdatedStatus(detail.last_updated)

                    return (
                      <TableRow key={`${detail.broker_id}-${detail.account_id}-${index}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{brokerConfig.logo}</span>
                            <span className="font-medium">{brokerConfig.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {detail.account_id.slice(-8)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatNumber(detail.quantity)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(detail.market_value, 'NOK')}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(detail.cost_basis, 'NOK')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <div className={cn(
                              'font-medium',
                              pnl >= 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                              {formatCurrency(pnl, 'NOK')}
                            </div>
                            <div className={cn(
                              'text-sm',
                              pnl >= 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                              {formatPercentage(pnlPercent)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <updateStatus.icon className={cn('h-4 w-4', updateStatus.color)} />
                            <span className="text-sm text-gray-600">
                              {new Date(detail.last_updated).toLocaleString('nb-NO')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSyncBroker?.(detail.broker_id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Action Buttons */}
          {holding.isDuplicate && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onResolveConflict?.(holding)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Konfigurer sammenslåing
              </Button>
              <Button
                onClick={() => onMergeHoldings?.(holding)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Merge className="h-4 w-4 mr-2" />
                Slå sammen beholdninger
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}