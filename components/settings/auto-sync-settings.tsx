'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  RefreshCw,
  Settings,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  Activity,
  Zap
} from 'lucide-react'

interface BrokerSyncSettings {
  brokerId: string
  brokerName: string
  enabled: boolean
  intervalMinutes: number
  priority: number
  lastSyncTime?: string
  nextSyncTime?: string
  status: 'active' | 'paused' | 'error' | 'never_run'
  errorMessage?: string
  syncCount: number
}

interface AutoSyncSettingsProps {
  className?: string
}

const brokerDisplayNames: Record<string, string> = {
  'plaid': 'Plaid (US Brokers)',
  'schwab': 'Charles Schwab',
  'interactive_brokers': 'Interactive Brokers',
  'nordnet': 'Nordnet'
}

const brokerIcons: Record<string, string> = {
  'plaid': '🇺🇸',
  'schwab': '🏦',
  'interactive_brokers': '🌐',
  'nordnet': '🏛️'
}

const intervalOptions = [
  { value: 15, label: '15 minutter', description: 'Høyfrekvens (anbefalt for trading)' },
  { value: 30, label: '30 minutter', description: 'Middels frekvens' },
  { value: 60, label: '1 time', description: 'Standard frekvens' },
  { value: 120, label: '2 timer', description: 'Lav frekvens' },
  { value: 240, label: '4 timer', description: 'Daglig oppdatering' },
  { value: 480, label: '8 timer', description: 'Økonomisk plan' },
  { value: 1440, label: '24 timer', description: 'Manual kontroll' }
]

// Mock data - in real implementation this would come from user settings and broker connections
const mockBrokerSettings: BrokerSyncSettings[] = [
  {
    brokerId: 'interactive_brokers',
    brokerName: 'Interactive Brokers',
    enabled: true,
    intervalMinutes: 15,
    priority: 1,
    lastSyncTime: '2025-01-15T14:30:00Z',
    nextSyncTime: '2025-01-15T14:45:00Z',
    status: 'active',
    syncCount: 142
  },
  {
    brokerId: 'schwab',
    brokerName: 'Charles Schwab',
    enabled: true,
    intervalMinutes: 30,
    priority: 2,
    lastSyncTime: '2025-01-15T14:00:00Z',
    nextSyncTime: '2025-01-15T14:30:00Z',
    status: 'active',
    syncCount: 89
  },
  {
    brokerId: 'nordnet',
    brokerName: 'Nordnet',
    enabled: false,
    intervalMinutes: 60,
    priority: 3,
    lastSyncTime: '2025-01-15T12:00:00Z',
    status: 'paused',
    syncCount: 45
  },
  {
    brokerId: 'plaid',
    brokerName: 'Plaid (Fidelity)',
    enabled: true,
    intervalMinutes: 240,
    priority: 4,
    lastSyncTime: '2025-01-15T10:00:00Z',
    nextSyncTime: '2025-01-15T14:00:00Z',
    status: 'error',
    errorMessage: 'OAuth token expired',
    syncCount: 23
  }
]

export function AutoSyncSettings({ className }: AutoSyncSettingsProps) {
  const [brokerSettings, setBrokerSettings] = useState<BrokerSyncSettings[]>(mockBrokerSettings)
  const [globalAutoSync, setGlobalAutoSync] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Akkurat nå'
    if (diffMinutes < 60) return `${diffMinutes}m siden`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}t siden`
    return `${Math.floor(diffMinutes / 1440)}d siden`
  }

  const formatNextSyncTime = (timestamp?: string) => {
    if (!timestamp) return 'Ikke planlagt'
    
    const now = new Date()
    const nextSync = new Date(timestamp)
    const diffMinutes = Math.floor((nextSync.getTime() - now.getTime()) / (1000 * 60))
    
    if (diffMinutes < 0) return 'Overdue'
    if (diffMinutes < 60) return `Om ${diffMinutes}m`
    if (diffMinutes < 1440) return `Om ${Math.floor(diffMinutes / 60)}t`
    return `Om ${Math.floor(diffMinutes / 1440)}d`
  }

  const getStatusBadge = (status: BrokerSyncSettings['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800 gap-1">
          <Activity className="w-3 h-3" />Aktiv
        </Badge>
      case 'paused':
        return <Badge variant="secondary" className="gap-1">
          <Pause className="w-3 h-3" />Pauset
        </Badge>
      case 'error':
        return <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />Feil
        </Badge>
      case 'never_run':
        return <Badge variant="outline" className="gap-1">
          <Clock className="w-3 h-3" />Aldri kjørt
        </Badge>
      default:
        return <Badge variant="outline">Ukjent</Badge>
    }
  }

  const toggleBrokerSync = async (brokerId: string, enabled: boolean) => {
    setIsUpdating(true)
    
    try {
      setBrokerSettings(prev => prev.map(broker => 
        broker.brokerId === brokerId 
          ? { ...broker, enabled, status: enabled ? 'active' : 'paused' }
          : broker
      ))
      
      // In real implementation, this would call an API to update sync settings
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      console.error('Error updating broker sync:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const updateSyncInterval = async (brokerId: string, intervalMinutes: number) => {
    setIsUpdating(true)
    
    try {
      setBrokerSettings(prev => prev.map(broker => 
        broker.brokerId === brokerId 
          ? { ...broker, intervalMinutes }
          : broker
      ))
      
      // In real implementation, this would call an API to update interval
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      console.error('Error updating sync interval:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const startManualSync = async (brokerId: string) => {
    setIsUpdating(true)
    
    try {
      // Update status to show sync in progress
      setBrokerSettings(prev => prev.map(broker => 
        broker.brokerId === brokerId 
          ? { ...broker, status: 'active', lastSyncTime: new Date().toISOString() }
          : broker
      ))
      
      // In real implementation, this would trigger actual sync
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      console.error('Error starting manual sync:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const toggleGlobalSync = async (enabled: boolean) => {
    setIsUpdating(true)
    setGlobalAutoSync(enabled)
    
    try {
      if (!enabled) {
        // Pause all brokers
        setBrokerSettings(prev => prev.map(broker => ({
          ...broker,
          enabled: false,
          status: 'paused' as const
        })))
      } else {
        // Resume previously enabled brokers
        setBrokerSettings(prev => prev.map(broker => ({
          ...broker,
          enabled: broker.status !== 'error',
          status: broker.status === 'error' ? 'error' : 'active' as const
        })))
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      console.error('Error toggling global sync:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const activeBrokers = brokerSettings.filter(b => b.enabled && b.status === 'active')
  const totalSyncCount = brokerSettings.reduce((sum, b) => sum + b.syncCount, 0)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automatisk Synkronisering</h2>
          <p className="text-gray-600">Konfigurer automatisk synkronisering av broker data</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="global-sync" className="text-sm font-medium">
            Master kontroll
          </Label>
          <Switch
            id="global-sync"
            checked={globalAutoSync}
            onCheckedChange={toggleGlobalSync}
            disabled={isUpdating}
          />
        </div>
      </div>

      {/* Global Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Synkronisering Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{activeBrokers.length}</div>
              <div className="text-sm text-gray-600">Aktive meglere</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalSyncCount}</div>
              <div className="text-sm text-gray-600">Totale synkroniseringer</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.min(...activeBrokers.map(b => b.intervalMinutes), 999)}m
              </div>
              <div className="text-sm text-gray-600">Høyeste frekvens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {globalAutoSync ? 'PÅ' : 'AV'}
              </div>
              <div className="text-sm text-gray-600">Auto-synk status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert for Global Status */}
      {!globalAutoSync && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Automatisk synkronisering er slått av. Broker data vil ikke oppdateres automatisk.
          </AlertDescription>
        </Alert>
      )}

      {/* Broker Settings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Megler Innstillinger</CardTitle>
          <CardDescription>
            Konfigurer synkroniseringsfrekvens og status for hver megler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Megler</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Frekvens</TableHead>
                <TableHead>Sist synkronisert</TableHead>
                <TableHead>Neste sync</TableHead>
                <TableHead>Aktivert</TableHead>
                <TableHead>Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brokerSettings.map((broker) => (
                <TableRow key={broker.brokerId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{brokerIcons[broker.brokerId]}</span>
                      <div>
                        <div className="font-medium">{broker.brokerName}</div>
                        <div className="text-sm text-gray-600">
                          Prioritet: {broker.priority} • {broker.syncCount} syncs
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(broker.status)}
                      {broker.errorMessage && (
                        <div className="text-xs text-red-600">{broker.errorMessage}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={broker.intervalMinutes.toString()}
                      onValueChange={(value) => updateSyncInterval(broker.brokerId, parseInt(value))}
                      disabled={!broker.enabled || isUpdating}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {intervalOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            <div>
                              <div>{option.label}</div>
                              <div className="text-xs text-gray-500">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {broker.lastSyncTime ? formatRelativeTime(broker.lastSyncTime) : 'Aldri'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {broker.enabled ? formatNextSyncTime(broker.nextSyncTime) : 'Pauset'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={broker.enabled}
                      onCheckedChange={(enabled) => toggleBrokerSync(broker.brokerId, enabled)}
                      disabled={!globalAutoSync || isUpdating}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startManualSync(broker.brokerId)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Avanserte Innstillinger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Anbefaling:</strong> Interactive Brokers og Schwab gir de mest nøyaktige real-time dataene. 
                Plaid og Nordnet kan ha forsinkelse på opptil flere timer.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Sync Frekvens Guide:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• <strong>15-30m:</strong> For aktiv trading</li>
                  <li>• <strong>1-2t:</strong> For daglige investeringer</li>
                  <li>• <strong>4-8t:</strong> For langsiktige strategier</li>
                  <li>• <strong>24t:</strong> For passive forvaltning</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Feilhåndtering:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Automatisk retry med backoff</li>
                  <li>• OAuth token refresh</li>
                  <li>• Fallback til cache data</li>
                  <li>• Email notifikasjoner ved feil</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}