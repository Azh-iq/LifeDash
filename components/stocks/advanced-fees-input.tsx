'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronDown, ChevronUp, HelpCircle, Calculator } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface AdvancedFees {
  commission: number
  currencyExchange: number
  otherFees: number
  total: number
}

export interface BrokerDefaults {
  [key: string]: {
    commission: number
    currencyExchange?: number
    description: string
  }
}

// Norwegian broker defaults
const BROKER_DEFAULTS: BrokerDefaults = {
  nordnet_nok: {
    commission: 99,
    description: 'Nordnet - Norske aksjer (Fast kurtasje)',
  },
  nordnet_usd: {
    commission: 0.99,
    currencyExchange: 25,
    description: 'Nordnet - Utenlandske aksjer (+ valutaveksling)',
  },
  dnb_nok: {
    commission: 149,
    description: 'DNB - Norske aksjer',
  },
  dnb_usd: {
    commission: 149,
    currencyExchange: 50,
    description: 'DNB - Utenlandske aksjer',
  },
  handelsbanken_nok: {
    commission: 199,
    description: 'Handelsbanken - Norske aksjer',
  },
  handelsbanken_usd: {
    commission: 199,
    currencyExchange: 35,
    description: 'Handelsbanken - Utenlandske aksjer',
  },
}

interface AdvancedFeesInputProps {
  fees: AdvancedFees
  onChange: (fees: AdvancedFees) => void
  currency: string
  symbol: string
  className?: string
  disabled?: boolean
}

export default function AdvancedFeesInput({
  fees,
  onChange,
  currency,
  symbol,
  className,
  disabled = false,
}: AdvancedFeesInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDefaults, setShowDefaults] = useState(false)

  // Auto-calculate total when individual fees change
  useEffect(() => {
    const total = fees.commission + fees.currencyExchange + fees.otherFees
    if (total !== fees.total) {
      onChange({ ...fees, total })
    }
  }, [
    fees.commission,
    fees.currencyExchange,
    fees.otherFees,
    fees.total,
    onChange,
  ])

  // Get broker defaults based on currency
  const getBrokerDefaults = () => {
    const isNorwegian = currency === 'NOK' || symbol.includes('.OL')
    const defaultKey = isNorwegian ? '_nok' : '_usd'

    return Object.entries(BROKER_DEFAULTS)
      .filter(([key]) => key.includes(defaultKey))
      .map(([key, value]) => ({
        key,
        broker: key.split('_')[0],
        ...value,
      }))
  }

  const handleIndividualFeeChange = (
    feeType: 'commission' | 'currencyExchange' | 'otherFees',
    value: string
  ) => {
    const numValue = parseFloat(value) || 0
    onChange({
      ...fees,
      [feeType]: numValue,
    })
  }

  const applyBrokerDefault = (brokerKey: string) => {
    const defaultFees = BROKER_DEFAULTS[brokerKey]
    if (defaultFees) {
      onChange({
        commission: defaultFees.commission,
        currencyExchange: defaultFees.currencyExchange || 0,
        otherFees: 0,
        total: defaultFees.commission + (defaultFees.currencyExchange || 0),
      })
      setShowDefaults(false)
    }
  }

  const resetFees = () => {
    onChange({
      commission: 0,
      currencyExchange: 0,
      otherFees: 0,
      total: 0,
    })
  }

  const isNonZeroFees = fees.total > 0
  const isNorwegianStock = currency === 'NOK' || symbol.includes('.OL')

  return (
    <div className={className}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Gebyrer</Label>
            <div className="flex items-center gap-2">
              {isNonZeroFees && (
                <Badge variant="secondary" className="text-xs">
                  {fees.total.toFixed(2)} {currency}
                </Badge>
              )}
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 p-1 hover:bg-gray-100"
                  disabled={disabled}
                >
                  <span className="text-xs text-gray-600">
                    {isExpanded ? 'Enkel visning' : 'Avanserte gebyrer'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {/* Simple fees input (when collapsed) */}
          {!isExpanded && (
            <Input
              type="number"
              min="0"
              step="0.01"
              value={fees.total.toString()}
              onChange={e =>
                onChange({ ...fees, total: parseFloat(e.target.value) || 0 })
              }
              placeholder="0.00"
              className="font-mono"
              disabled={disabled}
            />
          )}

          {/* Advanced fees breakdown (when expanded) */}
          <CollapsibleContent className="space-y-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Commission/Kurtasje */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="commission" className="text-sm">
                        Kurtasje
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Meglerprovision for kjøp/salg av aksjer</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="commission"
                      type="number"
                      min="0"
                      step="0.01"
                      value={fees.commission.toString()}
                      onChange={e =>
                        handleIndividualFeeChange('commission', e.target.value)
                      }
                      placeholder="99.00"
                      className="font-mono"
                      disabled={disabled}
                    />
                    <p className="text-xs text-gray-500">
                      {isNorwegianStock ? 'Typisk: 99 NOK' : 'Typisk: $0.99'}
                    </p>
                  </div>

                  {/* Currency Exchange */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="currencyExchange" className="text-sm">
                        Valutaveksling
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Gebyr for valutaveksling (utenlandske aksjer)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="currencyExchange"
                      type="number"
                      min="0"
                      step="0.01"
                      value={fees.currencyExchange.toString()}
                      onChange={e =>
                        handleIndividualFeeChange(
                          'currencyExchange',
                          e.target.value
                        )
                      }
                      placeholder="25.00"
                      className="font-mono"
                      disabled={disabled}
                    />
                    <p className="text-xs text-gray-500">
                      {isNorwegianStock
                        ? 'Gjelder ikke norske aksjer'
                        : 'Typisk: 25-50 NOK'}
                    </p>
                  </div>

                  {/* Other Fees */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="otherFees" className="text-sm">
                        Andre gebyrer
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Markedsgebyrer, clearing, etc.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="otherFees"
                      type="number"
                      min="0"
                      step="0.01"
                      value={fees.otherFees.toString()}
                      onChange={e =>
                        handleIndividualFeeChange('otherFees', e.target.value)
                      }
                      placeholder="0.00"
                      className="font-mono"
                      disabled={disabled}
                    />
                    <p className="text-xs text-gray-500">Valgfritt</p>
                  </div>
                </div>

                {/* Total calculation */}
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Total gebyrer:
                    </span>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {fees.total.toFixed(2)} {currency}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Broker defaults and quick actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDefaults(!showDefaults)}
                className="text-xs"
                disabled={disabled}
              >
                <Calculator className="mr-1 h-3 w-3" />
                Megler-standarder
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetFees}
                className="text-xs"
                disabled={disabled}
              >
                Nullstill gebyrer
              </Button>
            </div>

            {/* Broker defaults panel */}
            {showDefaults && (
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Vanlige gebyrer for{' '}
                      {isNorwegianStock ? 'norske' : 'utenlandske'} aksjer:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {getBrokerDefaults().map(broker => (
                        <div
                          key={broker.key}
                          className="flex items-center justify-between rounded border bg-white p-2"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium capitalize">
                              {broker.broker}
                            </p>
                            <p className="text-xs text-gray-600">
                              Kurtasje: {broker.commission}{' '}
                              {isNorwegianStock ? 'NOK' : 'USD'}
                              {broker.currencyExchange &&
                                ` + ${broker.currencyExchange} NOK valutaveksling`}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => applyBrokerDefault(broker.key)}
                            className="text-xs"
                          >
                            Bruk
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  )
}
