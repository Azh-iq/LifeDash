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
  Zap,
  Loader2
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
  connectionId?: string
}

interface AutoSyncSettingsProps {
  className?: string
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

export function AutoSyncSettings({ className }: AutoSyncSettingsProps) {
  const [brokerSettings, setBrokerSettings] = useState<BrokerSyncSettings[]>([])
  const [globalAutoSync, setGlobalAutoSync] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch real broker settings from API
  const fetchBrokerSettings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/brokers/status')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch broker settings')
      }
      
      setBrokerSettings(result.data || [])
      
      // Set global sync based on whether any brokers are enabled
      const hasEnabledBrokers = result.data?.some((broker: BrokerSyncSettings) => broker.enabled) || false
      setGlobalAutoSync(hasEnabledBrokers)
      
    } catch (err) {
      console.error('Error fetching broker settings:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBrokerSettings()
  }, [])

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
      const response = await fetch('/api/brokers/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brokerId,
          enabled
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update broker sync')
      }

      // Optimistically update the UI
      setBrokerSettings(prev => prev.map(broker => 
        broker.brokerId === brokerId 
          ? { ...broker, enabled, status: enabled ? 'active' : 'paused' }
          : broker
      ))
      
      // Update global sync state
      const hasEnabledBrokers = brokerSettings.some(broker => 
        broker.brokerId === brokerId ? enabled : broker.enabled
      )
      setGlobalAutoSync(hasEnabledBrokers)
      
    } catch (error) {
      console.error('Error updating broker sync:', error)
      setError(error instanceof Error ? error.message : 'Failed to update broker sync')
    } finally {
      setIsUpdating(false)
    }
  }

  const updateSyncInterval = async (brokerId: string, intervalMinutes: number) => {
    setIsUpdating(true)
    
    try {
      const brokerSettings = brokerSettings.find(b => b.brokerId === brokerId)
      if (!brokerSettings) {
        throw new Error('Broker not found')
      }

      const response = await fetch('/api/brokers/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brokerId,
          enabled: brokerSettings.enabled,
          intervalMinutes
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update sync interval')
      }

      // Optimistically update the UI
      setBrokerSettings(prev => prev.map(broker => 
        broker.brokerId === brokerId 
          ? { ...broker, intervalMinutes }
          : broker
      ))
      
    } catch (error) {
      console.error('Error updating sync interval:', error)
      setError(error instanceof Error ? error.message : 'Failed to update sync interval')
    } finally {
      setIsUpdating(false)
    }
  }

  const startManualSync = async (brokerId: string) => {
    setIsUpdating(true)
    
    try {
      const response = await fetch('/api/brokers/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brokerId,
          force: true
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start manual sync')
      }

      // Update status to show sync in progress
      setBrokerSettings(prev => prev.map(broker => 
        broker.brokerId === brokerId 
          ? { ...broker, status: 'active', lastSyncTime: new Date().toISOString() }
          : broker
      ))
      
    } catch (error) {
      console.error('Error starting manual sync:', error)
      setError(error instanceof Error ? error.message : 'Failed to start manual sync')
    } finally {
      setIsUpdating(false)
    }
  }

  const toggleGlobalSync = async (enabled: boolean) => {
    setIsUpdating(true)
    setGlobalAutoSync(enabled)
    
    try {
      // Update all brokers
      for (const broker of brokerSettings) {
        await toggleBrokerSync(broker.brokerId, enabled)
      }
      
    } catch (error) {
      console.error('Error updating global sync:', error)
      setError(error instanceof Error ? error.message : 'Failed to update global sync')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Automatisk Synkronisering
          </CardTitle>
          <CardDescription>
            Administrer automatisk synkronisering av broker data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Laster broker innstillinger...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Automatisk Synkronisering
          </CardTitle>
          <CardDescription>
            Administrer automatisk synkronisering av broker data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Feil ved lasting av broker innstillinger: {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchBrokerSettings} 
                className="ml-2"
              >
                Prøv igjen
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (brokerSettings.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Automatisk Synkronisering
          </CardTitle>
          <CardDescription>
            Administrer automatisk synkronisering av broker data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Ingen broker tilkoblinger funnet. Koble til meglere først for å konfigurere automatisk synkronisering.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Automatisk Synkronisering
        </CardTitle>
        <CardDescription>
          Administrer automatisk synkronisering av broker data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Auto-Sync Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
          <div className="space-y-1">
            <Label className="text-base font-medium">Global Auto-Synkronisering</Label>
            <div className="text-sm text-gray-600">
              Aktiverer/deaktiverer automatisk synkronisering for alle meglere
            </div>
          </div>
          <Switch
            checked={globalAutoSync}
            onCheckedChange={toggleGlobalSync}
            disabled={isUpdating}
          />
        </div>

        {/* Broker Settings Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Megler</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Frekvens</TableHead>
                <TableHead>Sist synkronisert</TableHead>
                <TableHead>Neste sync</TableHead>
                <TableHead>Antall syncer</TableHead>
                <TableHead>Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brokerSettings.map((broker) => (
                <TableRow key={broker.brokerId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {brokerIcons[broker.brokerId] || '🏛️'}
                      </span>
                      <div>
                        <div className="font-medium">{broker.brokerName}</div>
                        <div className="text-sm text-gray-500">
                          Prioritet: {broker.priority}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(broker.status)}
                      {broker.errorMessage && (
                        <div className="text-xs text-red-600 max-w-[200px] truncate" title={broker.errorMessage}>
                          {broker.errorMessage}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={broker.intervalMinutes.toString()}
                      onValueChange={(value) => updateSyncInterval(broker.brokerId, parseInt(value))}
                      disabled={isUpdating || !broker.enabled}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {intervalOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {broker.lastSyncTime 
                        ? formatRelativeTime(broker.lastSyncTime)
                        : 'Aldri'
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {broker.enabled ? formatNextSyncTime(broker.nextSyncTime) : 'Deaktivert'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-mono">
                      {broker.syncCount.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={broker.enabled}
                        onCheckedChange={(enabled) => toggleBrokerSync(broker.brokerId, enabled)}
                        disabled={isUpdating}
                        size="sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startManualSync(broker.brokerId)}
                        disabled={isUpdating || !broker.enabled}
                        className="h-8 px-2"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Sync Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Aktive Meglere</span>
            </div>
            <div className="text-2xl font-bold text-green-900 mt-1">
              {brokerSettings.filter(b => b.status === 'active').length}
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <Activity className="w-4 h-4" />
              <span className="font-medium">Total Syncer</span>
            </div>
            <div className="text-2xl font-bold text-blue-900 mt-1">
              {brokerSettings.reduce((sum, b) => sum + b.syncCount, 0).toLocaleString()}
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Ventende Syncer</span>
            </div>
            <div className="text-2xl font-bold text-amber-900 mt-1">
              {brokerSettings.filter(b => b.status === 'active' && b.nextSyncTime).length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}