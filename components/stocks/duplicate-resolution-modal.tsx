'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { AlertTriangle, CheckCircle, Building2, TrendingUp, Users } from 'lucide-react'

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
}

interface DuplicateResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  duplicateGroup: DuplicateGroup | null
  onResolve: (resolution: DuplicateResolution) => void
}

interface DuplicateResolution {
  action: 'merge' | 'separate' | 'ignore'
  preferredSource?: string
  reason: string
}

const resolutionOptions = [
  {
    value: 'merge',
    label: 'Slå sammen til én beholdning',
    description: 'Kombinér alle beholdninger til en konsolidert visning',
    icon: <Users className="w-4 h-4" />
  },
  {
    value: 'separate',
    label: 'Hold separate',
    description: 'Vis hver beholdning separat',
    icon: <Building2 className="w-4 h-4" />
  },
  {
    value: 'ignore',
    label: 'Ignorer duplikat',
    description: 'Ikke vis duplikat-varsel for denne aksjen',
    icon: <CheckCircle className="w-4 h-4" />
  }
]

export function DuplicateResolutionModal({
  isOpen,
  onClose,
  duplicateGroup,
  onResolve
}: DuplicateResolutionModalProps) {
  const [selectedAction, setSelectedAction] = useState<string>('merge')
  const [preferredSource, setPreferredSource] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!duplicateGroup) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
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

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 95) return <Badge variant="default" className="bg-green-100 text-green-800">Høy tillit</Badge>
    if (confidence >= 80) return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Middels tillit</Badge>
    return <Badge variant="destructive">Lav tillit</Badge>
  }

  const handleResolve = async () => {
    setIsProcessing(true)
    
    const resolution: DuplicateResolution = {
      action: selectedAction as any,
      preferredSource: selectedAction === 'merge' ? preferredSource : undefined,
      reason: `Bruker valgte: ${resolutionOptions.find(o => o.value === selectedAction)?.label}`
    }

    try {
      await onResolve(resolution)
      onClose()
    } catch (error) {
      console.error('Error resolving duplicate:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Duplikat oppdaget: {duplicateGroup.symbol}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Detection Summary */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Samme aksje funnet i {duplicateGroup.duplicateHoldings.length} forskjellige kontoer. 
              Deteksjonstillit: {getConfidenceBadge(duplicateGroup.detectionConfidence)}
            </AlertDescription>
          </Alert>

          {/* Stock Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{duplicateGroup.companyName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {duplicateGroup.totalQuantity}
                  </div>
                  <div className="text-sm text-gray-600">Totalt antall</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(duplicateGroup.totalMarketValue)}
                  </div>
                  <div className="text-sm text-gray-600">Total verdi</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(duplicateGroup.avgCostBasis)}
                  </div>
                  <div className="text-sm text-gray-600">Gjennomsnittlig kostnad</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Holdings Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Beholdninger per megler</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Megler</TableHead>
                    <TableHead>Konto</TableHead>
                    <TableHead className="text-right">Antall</TableHead>
                    <TableHead className="text-right">Verdi</TableHead>
                    <TableHead className="text-right">Kostnad</TableHead>
                    <TableHead className="text-right">Sist oppdatert</TableHead>
                    <TableHead className="text-center">Tillit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {duplicateGroup.duplicateHoldings.map((holding, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{holding.brokerName}</TableCell>
                      <TableCell className="text-gray-600">{holding.accountName}</TableCell>
                      <TableCell className="text-right">{holding.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(holding.marketValue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(holding.costBasis)}</TableCell>
                      <TableCell className="text-right text-sm text-gray-600">
                        {new Date(holding.lastUpdated).toLocaleDateString('nb-NO')}
                      </TableCell>
                      <TableCell className="text-center">
                        {getConfidenceBadge(holding.confidence)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Resolution Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Velg løsning</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedAction} onValueChange={setSelectedAction}>
                {resolutionOptions.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer">
                        {option.icon}
                        <span className="font-medium">{option.label}</span>
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>

              {/* Preferred Source Selection */}
              {selectedAction === 'merge' && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-3">Velg foretrukken datakilde:</h4>
                  <RadioGroup value={preferredSource} onValueChange={setPreferredSource}>
                    {duplicateGroup.duplicateHoldings.map((holding, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <RadioGroupItem value={holding.brokerId} id={holding.brokerId} />
                        <Label htmlFor={holding.brokerId} className="flex items-center gap-2 cursor-pointer">
                          <span>{holding.brokerName}</span>
                          <span className="text-sm text-gray-600">({holding.accountName})</span>
                          {getConfidenceBadge(holding.confidence)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Avbryt
          </Button>
          <Button 
            onClick={handleResolve} 
            disabled={isProcessing || (selectedAction === 'merge' && !preferredSource)}
          >
            {isProcessing ? 'Behandler...' : 'Løs duplikat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}