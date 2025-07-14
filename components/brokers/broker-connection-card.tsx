'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Building2, 
  Link as LinkIcon, 
  RefreshCw, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Settings 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

interface BrokerConnection {
  id: string
  broker_id: string
  display_name: string
  status: 'connected' | 'disconnected' | 'error' | 'pending'
  error_message?: string
  last_synced_at?: string
  created_at: string
  accounts_count: number
  metadata?: {
    country?: string
    connected_at?: string
    api_key?: string
  }
  last_sync?: {
    status: string
    completed_at?: string
    accounts_processed?: number
    holdings_processed?: number
    transactions_processed?: number
  }
}

interface BrokerConnectionCardProps {
  connection: BrokerConnection
  onSync: (connectionId: string) => void
  onDelete: (connectionId: string) => void
  onEdit: (connectionId: string) => void
  isLoading?: boolean
}

const brokerInfo = {
  plaid: {
    name: 'Plaid (USA)',
    icon: '🇺🇸',
    color: 'blue',
    description: 'Fidelity, Robinhood, E*TRADE og flere'
  },
  schwab: {
    name: 'Charles Schwab',
    icon: '🏦',
    color: 'indigo',
    description: 'Schwab brokerage konto'
  },
  interactive_brokers: {
    name: 'Interactive Brokers',
    icon: '🌍',
    color: 'purple',
    description: 'Globale markeder og trading'
  },
  nordnet: {
    name: 'Nordnet',
    icon: '🇳🇴',
    color: 'green',
    description: 'Nordiske markeder'
  }
}

const statusConfig = {
  connected: {
    color: 'green',
    text: 'Tilkoblet',
    icon: CheckCircle
  },
  disconnected: {
    color: 'gray',
    text: 'Frakoblet',
    icon: LinkIcon
  },
  error: {
    color: 'red',
    text: 'Feil',
    icon: AlertCircle
  },
  pending: {
    color: 'yellow',
    text: 'Venter...',
    icon: Clock
  }
}

export default function BrokerConnectionCard({
  connection,
  onSync,
  onDelete,
  onEdit,
  isLoading = false
}: BrokerConnectionCardProps) {
  const [syncing, setSyncing] = useState(false)
  
  const broker = brokerInfo[connection.broker_id as keyof typeof brokerInfo]
  const status = statusConfig[connection.status]
  const StatusIcon = status.icon

  const handleSync = async () => {
    setSyncing(true)
    try {
      await onSync(connection.id)
    } finally {
      setSyncing(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Aldri'
    return format(new Date(dateString), 'dd. MMM yyyy, HH:mm', { locale: nb })
  }

  const formatSyncSummary = () => {
    if (!connection.last_sync) return null
    
    const { accounts_processed, holdings_processed, transactions_processed } = connection.last_sync
    
    return [
      accounts_processed && `${accounts_processed} kontoer`,
      holdings_processed && `${holdings_processed} beholdninger`,
      transactions_processed && `${transactions_processed} transaksjoner`
    ].filter(Boolean).join(', ')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden">
        {/* Status indicator bar */}
        <div 
          className={`absolute top-0 left-0 right-0 h-1 bg-${status.color}-500`}
        />
        
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{broker?.icon}</div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  {connection.display_name}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  {broker?.description}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge 
                variant="outline" 
                className={`text-${status.color}-600 border-${status.color}-200 bg-${status.color}-50`}
              >
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.text}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(connection.id)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Rediger
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(connection.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Fjern
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Connection info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Kontoer</p>
              <p className="font-medium">{connection.accounts_count}</p>
            </div>
            <div>
              <p className="text-gray-600">Tilkoblet</p>
              <p className="font-medium">{formatDate(connection.created_at)}</p>
            </div>
          </div>

          {/* Country info for Nordnet */}
          {connection.broker_id === 'nordnet' && connection.metadata?.country && (
            <div className="text-sm">
              <p className="text-gray-600">Land</p>
              <p className="font-medium">
                {connection.metadata.country === 'no' && '🇳🇴 Norge'}
                {connection.metadata.country === 'se' && '🇸🇪 Sverige'}
                {connection.metadata.country === 'dk' && '🇩🇰 Danmark'}
                {connection.metadata.country === 'fi' && '🇫🇮 Finland'}
              </p>
            </div>
          )}

          {/* Error message */}
          {connection.status === 'error' && connection.error_message && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Tilkoblingsfeil</p>
                  <p className="text-xs text-red-600 mt-1">{connection.error_message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Last sync info */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sist synkronisert</p>
                <p className="text-sm font-medium">
                  {formatDate(connection.last_synced_at)}
                </p>
                {connection.last_sync && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatSyncSummary()}
                  </p>
                )}
              </div>
              
              <Button
                onClick={handleSync}
                disabled={syncing || isLoading || connection.status !== 'connected'}
                size="sm"
                variant="outline"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Synkroniserer...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Synkroniser
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Last sync status */}
          {connection.last_sync && (
            <div className="text-xs">
              <Badge 
                variant="outline" 
                className={
                  connection.last_sync.status === 'completed' 
                    ? 'text-green-600 border-green-200 bg-green-50'
                    : connection.last_sync.status === 'failed'
                    ? 'text-red-600 border-red-200 bg-red-50'
                    : 'text-blue-600 border-blue-200 bg-blue-50'
                }
              >
                Siste sync: {connection.last_sync.status === 'completed' ? 'Vellykket' : 
                  connection.last_sync.status === 'failed' ? 'Feilet' : 'Pågår'}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}