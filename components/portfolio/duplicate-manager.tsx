'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { DuplicateResolutionModal } from '@/components/stocks/duplicate-resolution-modal'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Building2,
  TrendingUp,
  RefreshCw,
  Settings,
  Eye,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useMultiBrokerPortfolioState } from '@/lib/hooks/use-multi-broker-portfolio-state'

interface DuplicateHolding {
  brokerId: string
  brokerName: string
  accountId: string
  accountName: string
  quantity: number
  marketValue: number
  costBasis: number
  lastUpdated: string
  confidence: number
}

interface DuplicateGroup {
  symbol: string
  companyName: string
  duplicateHoldings: DuplicateHolding[]
  totalQuantity: number
  totalMarketValue: number
  avgCostBasis: number
  detectionConfidence: number
  status: 'detected' | 'resolved' | 'ignored'
  resolution?: {
    action: 'merge' | 'separate' | 'ignore'
    preferredSource?: string
    resolvedAt: string
    reason: string
  }
}

interface DuplicateManagerProps {
  className?: string
  onDuplicatesResolved?: () => void
}

const brokerDisplayNames: Record<string, string> = {
  'plaid': 'Plaid',
  'schwab': 'Schwab',
  'interactive_brokers': 'IBKR',
  'nordnet': 'Nordnet'
}

export function DuplicateManager({ className, onDuplicatesResolved }: DuplicateManagerProps) {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null)
  const [showResolutionModal, setShowResolutionModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [autoResolveMode, setAutoResolveMode] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { 
    data: multiBrokerData, 
    triggerAggregation, 
    isAggregating, 
    refresh: refreshAggregation 
  } = useMultiBrokerPortfolioState()

  // Fetch real duplicate data from aggregation API
  const fetchDuplicateData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get consolidated holdings data which includes duplicate information
      const response = await fetch('/api/portfolio/aggregate')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch duplicate data')
      }

      // Extract duplicate information from consolidated holdings
      const consolidatedHoldings = result.data?.consolidatedHoldings || []
      
      // Group holdings by symbol to find duplicates
      const duplicateMap = new Map<string, any[]>()
      
      // For now, we'll simulate duplicate detection based on consolidated holdings data
      // In a real implementation, this logic would be more sophisticated
      consolidatedHoldings.forEach((holding: any) => {
        if (holding.account_count > 1 || holding.broker_ids?.length > 1) {
          // This holding exists across multiple accounts/brokers - potential duplicate
          const symbol = holding.symbol
          
          if (!duplicateMap.has(symbol)) {
            duplicateMap.set(symbol, [])
          }
          
          duplicateMap.get(symbol)?.push(holding)
        }
      })

      // Convert to DuplicateGroup format
      const duplicateGroups: DuplicateGroup[] = Array.from(duplicateMap.entries()).map(([symbol, holdings]) => {
        const firstHolding = holdings[0]
        
        // Create mock duplicate holdings for demonstration
        // In real implementation, this would come from the actual broker data breakdown
        const duplicateHoldings: DuplicateHolding[] = firstHolding.broker_ids?.map((brokerId: string, index: number) => ({
          brokerId,
          brokerName: brokerDisplayNames[brokerId] || brokerId,
          accountId: `${brokerId}-${index + 1}`,
          accountName: `Account ${index + 1}`,
          quantity: Math.round(firstHolding.total_quantity / firstHolding.broker_ids.length),
          marketValue: Math.round(firstHolding.total_market_value / firstHolding.broker_ids.length),
          costBasis: Math.round(firstHolding.total_cost_basis / firstHolding.broker_ids.length),
          lastUpdated: firstHolding.last_updated || new Date().toISOString(),
          confidence: 85 + Math.random() * 15 // Simulate confidence score
        })) || []

        return {
          symbol,
          companyName: symbol, // In real implementation, would fetch company name
          duplicateHoldings,
          totalQuantity: firstHolding.total_quantity,
          totalMarketValue: firstHolding.total_market_value,
          avgCostBasis: firstHolding.total_cost_basis,
          detectionConfidence: Math.round(85 + Math.random() * 15),
          status: firstHolding.is_duplicate ? 'detected' : 'resolved' as 'detected' | 'resolved'
        }
      })

      setDuplicateGroups(duplicateGroups)
      
    } catch (err) {
      console.error('Error fetching duplicate data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDuplicateData()
  }, [multiBrokerData])

  const unresolvedGroups = duplicateGroups.filter(g => g.status === 'detected')
  const resolvedGroups = duplicateGroups.filter(g => g.status === 'resolved' || g.status === 'ignored')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadge = (status: DuplicateGroup['status']) => {
    switch (status) {
      case 'detected':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" />Krever handling</Badge>
      case 'resolved':
        return <Badge variant="default" className="bg-green-100 text-green-800 gap-1"><CheckCircle className="w-3 h-3" />Løst</Badge>
      case 'ignored':
        return <Badge variant="outline" className="gap-1"><Eye className="w-3 h-3" />Ignorert</Badge>
      default:
        return <Badge variant="outline">Ukjent</Badge>
    }
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 95) return <Badge variant="default" className="bg-green-100 text-green-800">Høy</Badge>
    if (confidence >= 80) return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Middels</Badge>
    return <Badge variant="destructive">Lav</Badge>
  }

  const handleResolveGroup = (group: DuplicateGroup) => {
    setSelectedGroup(group)
    setShowResolutionModal(true)
  }

  const handleResolutionComplete = async (resolution: any) => {
    setIsProcessing(true)
    
    try {
      // In real implementation, this would call an API to actually resolve the duplicate
      // For now, we'll update the local state and trigger re-aggregation
      
      setDuplicateGroups(prev => prev.map(group => 
        group === selectedGroup 
          ? {
              ...group,
              status: resolution.action === 'ignore' ? 'ignored' : 'resolved',
              resolution: {
                action: resolution.action,
                preferredSource: resolution.preferredSource,
                resolvedAt: new Date().toISOString(),
                reason: resolution.reason
              }
            }
          : group
      ))

      // Trigger portfolio aggregation to reflect changes
      await triggerAggregation('NOK')
      
      onDuplicatesResolved?.()
      
    } catch (error) {
      console.error('Error resolving duplicate:', error)
      setError(error instanceof Error ? error.message : 'Failed to resolve duplicate')
    } finally {
      setIsProcessing(false)
      setShowResolutionModal(false)
      setSelectedGroup(null)
    }
  }

  const handleAutoResolve = async () => {
    setIsProcessing(true)
    
    try {
      // Auto-resolve all duplicates with high confidence
      const autoResolutions = unresolvedGroups
        .filter(group => group.detectionConfidence >= 90)
        .map(group => ({
          ...group,
          status: 'resolved' as const,
          resolution: {
            action: 'merge' as const,
            preferredSource: group.duplicateHoldings
              .sort((a, b) => b.confidence - a.confidence)[0].brokerId,
            resolvedAt: new Date().toISOString(),
            reason: 'Auto-resolved: high confidence duplicate detection'
          }
        }))

      setDuplicateGroups(prev => prev.map(group => {
        const resolution = autoResolutions.find(r => r.symbol === group.symbol)
        return resolution || group
      }))

      // Trigger portfolio aggregation to reflect changes
      await triggerAggregation('NOK')
      
      onDuplicatesResolved?.()
      
    } catch (error) {
      console.error('Error auto-resolving duplicates:', error)
      setError(error instanceof Error ? error.message : 'Failed to auto-resolve duplicates')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRefresh = async () => {
    await refreshAggregation()
    await fetchDuplicateData()
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Duplikat Manager
          </CardTitle>
          <CardDescription>
            Administrer og løs duplikate beholdninger på tvers av meglere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Laster duplikat data...</span>
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
            <Users className="w-5 h-5" />
            Duplikat Manager
          </CardTitle>
          <CardDescription>
            Administrer og løs duplikate beholdninger på tvers av meglere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Feil ved lasting av duplikat data: {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchDuplicateData} 
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

  if (duplicateGroups.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Duplikat Manager
          </CardTitle>
          <CardDescription>
            Administrer og løs duplikate beholdninger på tvers av meglere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Ingen duplikater funnet! Ditt portfolio er allerede optimalt konsolidert.
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
          <Users className="w-5 h-5" />
          Duplikat Manager
        </CardTitle>
        <CardDescription>
          Administrer og løs duplikate beholdninger på tvers av meglere
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Krever handling</span>
            </div>
            <div className="text-2xl font-bold text-red-900 mt-1">
              {unresolvedGroups.length}
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Løst</span>
            </div>
            <div className="text-2xl font-bold text-green-900 mt-1">
              {resolvedGroups.length}
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">Total verdi</span>
            </div>
            <div className="text-lg font-bold text-blue-900 mt-1">
              {formatCurrency(duplicateGroups.reduce((sum, g) => sum + g.totalMarketValue, 0))}
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <Building2 className="w-4 h-4" />
              <span className="font-medium">Meglere påvirket</span>
            </div>
            <div className="text-2xl font-bold text-amber-900 mt-1">
              {new Set(duplicateGroups.flatMap(g => g.duplicateHoldings.map(h => h.brokerId))).size}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isProcessing || isAggregating}
            >
              {isAggregating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Oppdater data
            </Button>
            
            {unresolvedGroups.length > 0 && (
              <Button
                onClick={handleAutoResolve}
                disabled={isProcessing || unresolvedGroups.filter(g => g.detectionConfidence >= 90).length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4 mr-2" />
                )}
                Auto-løs ({unresolvedGroups.filter(g => g.detectionConfidence >= 90).length})
              </Button>
            )}
          </div>
        </div>

        {/* Duplicates Table */}
        {unresolvedGroups.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Duplikater som krever handling
            </h3>
            
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Selskap</TableHead>
                    <TableHead>Antall kontoer</TableHead>
                    <TableHead>Total mengde</TableHead>
                    <TableHead>Total verdi</TableHead>
                    <TableHead>Tillit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unresolvedGroups.map((group) => (
                    <TableRow key={group.symbol}>
                      <TableCell>
                        <div className="font-mono font-medium">{group.symbol}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{group.companyName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{group.duplicateHoldings.length} kontoer</Badge>
                          <div className="flex -space-x-1">
                            {group.duplicateHoldings.slice(0, 3).map((holding, index) => (
                              <div
                                key={index}
                                className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium"
                                title={holding.brokerName}
                              >
                                {holding.brokerId.charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {group.duplicateHoldings.length > 3 && (
                              <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-xs font-medium text-white">
                                +{group.duplicateHoldings.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono">{group.totalQuantity.toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(group.totalMarketValue)}</div>
                      </TableCell>
                      <TableCell>
                        {getConfidenceBadge(group.detectionConfidence)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(group.status)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveGroup(group)}
                          disabled={isProcessing}
                        >
                          Løs
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Resolved Duplicates */}
        {resolvedGroups.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Løste duplikater ({resolvedGroups.length})
            </h3>
            
            <div className="space-y-3">
              {resolvedGroups.map((group) => (
                <div key={group.symbol} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-mono font-medium">{group.symbol}</div>
                      <div className="text-sm text-gray-600">{group.companyName}</div>
                    </div>
                    <Badge variant="outline">{group.duplicateHoldings.length} kontoer</Badge>
                    {getStatusBadge(group.status)}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(group.totalMarketValue)}</div>
                    {group.resolution && (
                      <div className="text-xs text-gray-500">
                        {new Date(group.resolution.resolvedAt).toLocaleDateString('nb-NO')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Resolution Modal */}
      {selectedGroup && (
        <DuplicateResolutionModal
          open={showResolutionModal}
          onOpenChange={setShowResolutionModal}
          duplicateGroup={selectedGroup}
          onResolve={handleResolutionComplete}
          isProcessing={isProcessing}
        />
      )}
    </Card>
  )
}