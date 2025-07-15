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
  AlertCircle
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

// Mock data for demonstration - in real implementation this would come from aggregation API
const mockDuplicateGroups: DuplicateGroup[] = [
  {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    duplicateHoldings: [
      {
        brokerId: 'schwab',
        brokerName: 'Charles Schwab',
        accountId: 'schwab-001',
        accountName: 'Investment Account',
        quantity: 100,
        marketValue: 18500,
        costBasis: 15000,
        lastUpdated: '2025-01-15T14:30:00Z',
        confidence: 95
      },
      {
        brokerId: 'interactive_brokers',
        brokerName: 'Interactive Brokers',
        accountId: 'ibkr-001',
        accountName: 'Main Account',
        quantity: 50,
        marketValue: 9250,
        costBasis: 8000,
        lastUpdated: '2025-01-15T14:25:00Z',
        confidence: 98
      }
    ],
    totalQuantity: 150,
    totalMarketValue: 27750,
    avgCostBasis: 23000,
    detectionConfidence: 96,
    status: 'detected'
  },
  {
    symbol: 'MSFT',
    companyName: 'Microsoft Corporation',
    duplicateHoldings: [
      {
        brokerId: 'plaid',
        brokerName: 'Plaid (Fidelity)',
        accountId: 'plaid-fidelity-001',
        accountName: 'Retirement 401k',
        quantity: 75,
        marketValue: 31500,
        costBasis: 28000,
        lastUpdated: '2025-01-15T13:45:00Z',
        confidence: 92
      },
      {
        brokerId: 'nordnet',
        brokerName: 'Nordnet',
        accountId: 'nordnet-001',
        accountName: 'Aksjesparekonto',
        quantity: 25,
        marketValue: 10500,
        costBasis: 9500,
        lastUpdated: '2025-01-15T14:00:00Z',
        confidence: 88
      }
    ],
    totalQuantity: 100,
    totalMarketValue: 42000,
    avgCostBasis: 37500,
    detectionConfidence: 90,
    status: 'detected'
  },
  {
    symbol: 'GOOGL',
    companyName: 'Alphabet Inc.',
    duplicateHoldings: [
      {
        brokerId: 'schwab',
        brokerName: 'Charles Schwab',
        accountId: 'schwab-002',
        accountName: 'IRA Account',
        quantity: 20,
        marketValue: 34000,
        costBasis: 30000,
        lastUpdated: '2025-01-15T12:30:00Z',
        confidence: 85
      }
    ],
    totalQuantity: 20,
    totalMarketValue: 34000,
    avgCostBasis: 30000,
    detectionConfidence: 85,
    status: 'resolved',
    resolution: {
      action: 'separate',
      resolvedAt: '2025-01-14T16:00:00Z',
      reason: 'User chose to keep separate - single broker holding'
    }
  }
]

export function DuplicateManager({ className, onDuplicatesResolved }: DuplicateManagerProps) {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>(mockDuplicateGroups)
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null)
  const [showResolutionModal, setShowResolutionModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [autoResolveMode, setAutoResolveMode] = useState(false)

  const { triggerAggregation, isAggregating } = useMultiBrokerPortfolioState()

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
      // Update the group with resolution
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

      setDuplicateGroups(prev => 
        prev.map(group => {
          const autoResolved = autoResolutions.find(ar => ar.symbol === group.symbol)
          return autoResolved || group
        })
      )

      await triggerAggregation('NOK')
      onDuplicatesResolved?.()
      
    } catch (error) {
      console.error('Error auto-resolving duplicates:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getResolutionProgress = () => {
    const total = duplicateGroups.length
    const resolved = resolvedGroups.length
    return total > 0 ? (resolved / total) * 100 : 100
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Duplikat Behandling</h2>
          <p className="text-gray-600">Håndtér duplikater funnet på tvers av meglere</p>
        </div>
        <div className="flex items-center gap-2">
          {unresolvedGroups.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleAutoResolve}
              disabled={isProcessing || isAggregating}
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Settings className="w-4 h-4 mr-2" />
              )}
              Auto-løs høy tillit
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => triggerAggregation('NOK')}
            disabled={isAggregating}
          >
            {isAggregating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Oppdater
          </Button>
        </div>
      </div>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Behandlingsstatus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Behandlingsfremdrift</span>
              <span>{resolvedGroups.length} av {duplicateGroups.length} løst</span>
            </div>
            <Progress value={getResolutionProgress()} className="h-2" />
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">{unresolvedGroups.length}</div>
                <div className="text-sm text-gray-600">Krever handling</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {duplicateGroups.filter(g => g.status === 'resolved').length}
                </div>
                <div className="text-sm text-gray-600">Løst</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {duplicateGroups.filter(g => g.status === 'ignored').length}
                </div>
                <div className="text-sm text-gray-600">Ignorert</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unresolved Duplicates */}
      {unresolvedGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Duplikater som krever handling
            </CardTitle>
            <CardDescription>
              {unresolvedGroups.length} duplikat{unresolvedGroups.length !== 1 ? 'er' : ''} funnet på tvers av meglere
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aksje</TableHead>
                  <TableHead>Meglere</TableHead>
                  <TableHead className="text-right">Total verdi</TableHead>
                  <TableHead className="text-right">Antall</TableHead>
                  <TableHead className="text-center">Tillit</TableHead>
                  <TableHead className="text-center">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unresolvedGroups.map((group) => (
                  <TableRow key={group.symbol}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{group.symbol}</div>
                        <div className="text-sm text-gray-600">{group.companyName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {group.duplicateHoldings.map((holding, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {brokerDisplayNames[holding.brokerId] || holding.brokerId}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(group.totalMarketValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {group.totalQuantity}
                    </TableCell>
                    <TableCell className="text-center">
                      {getConfidenceBadge(group.detectionConfidence)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResolveGroup(group)}
                      >
                        Løs
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* No Duplicates Message */}
      {unresolvedGroups.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Ingen duplikater funnet</h3>
            <p className="text-gray-600">Alle beholdninger er unike på tvers av meglere</p>
          </CardContent>
        </Card>
      )}

      {/* Resolved Duplicates */}
      {resolvedGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Løste duplikater
            </CardTitle>
            <CardDescription>
              Tidligere behandlede duplikater
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aksje</TableHead>
                  <TableHead>Løsning</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Behandlet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolvedGroups.map((group) => (
                  <TableRow key={group.symbol}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{group.symbol}</div>
                        <div className="text-sm text-gray-600">{group.companyName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {group.resolution?.action === 'merge' && 'Slått sammen'}
                        {group.resolution?.action === 'separate' && 'Holdt separate'}
                        {group.resolution?.action === 'ignore' && 'Ignorert'}
                      </div>
                      {group.resolution?.preferredSource && (
                        <div className="text-xs text-gray-500">
                          Kilde: {brokerDisplayNames[group.resolution.preferredSource]}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(group.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {group.resolution?.resolvedAt && 
                          new Date(group.resolution.resolvedAt).toLocaleDateString('nb-NO')
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Resolution Modal */}
      <DuplicateResolutionModal
        isOpen={showResolutionModal}
        onClose={() => {
          setShowResolutionModal(false)
          setSelectedGroup(null)
        }}
        duplicateGroup={selectedGroup}
        onResolve={handleResolutionComplete}
      />
    </div>
  )
}