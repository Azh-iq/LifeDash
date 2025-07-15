'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react'

interface BrokerPerformanceCardProps {
  brokerId: string
  displayName: string
  totalValue: number
  totalPnL: number
  returnPercent: number
  lastSync: string
  connectionStatus: 'connected' | 'disconnected' | 'syncing' | 'error'
  accountCount: number
  holdingsCount: number
  currency?: string
}

const brokerIcons: Record<string, string> = {
  'nordnet': '🏦',
  'schwab': '🇺🇸',
  'interactive_brokers': '🌐',
  'plaid': '🔗'
}

export function BrokerPerformanceCard({
  brokerId,
  displayName,
  totalValue,
  totalPnL,
  returnPercent,
  lastSync,
  connectionStatus,
  accountCount,
  holdingsCount,
  currency = 'NOK'
}: BrokerPerformanceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100)
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Tilkoblet</Badge>
      case 'syncing':
        return <Badge variant="secondary">Synkroniserer</Badge>
      case 'error':
        return <Badge variant="destructive">Feil</Badge>
      default:
        return <Badge variant="outline">Frakoblet</Badge>
    }
  }

  const getLastSyncText = () => {
    const now = new Date()
    const syncTime = new Date(lastSync)
    const diffMinutes = Math.floor((now.getTime() - syncTime.getTime()) / (1000 * 60))
    
    if (diffMinutes < 5) return 'Nylig'
    if (diffMinutes < 60) return `${diffMinutes}m siden`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}t siden`
    return `${Math.floor(diffMinutes / 1440)}d siden`
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{brokerIcons[brokerId] || '🏦'}</div>
            <div>
              <CardTitle className="text-lg">{displayName}</CardTitle>
              <CardDescription className="text-sm">
                {accountCount} kontoer • {holdingsCount} beholdninger
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Portfolio Value */}
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalValue)}
          </div>
          <div className="text-sm text-gray-600">Total porteføljeverdi</div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className={`text-lg font-semibold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-1">
              {totalPnL >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
              Urealisert P&L
            </div>
          </div>
          
          <div>
            <div className={`text-lg font-semibold ${returnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(returnPercent)}
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Avkastning
            </div>
          </div>
        </div>

        {/* Sync Status */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              Sist synkronisert
            </div>
            <div className="font-medium">
              {getLastSyncText()}
            </div>
          </div>
          
          {connectionStatus === 'syncing' && (
            <div className="mt-2">
              <Progress value={65} className="h-2" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}