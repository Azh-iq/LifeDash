'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { StockSearch, StockSearchResult } from './stock-search'
import AdvancedFeesInput, { AdvancedFees } from './advanced-fees-input'
import { AnimatedTransactionButtons } from '@/components/ui/animated-transaction-buttons'
import {
  EnhancedInput,
  FinancialInput,
  DateInput,
} from '@/components/ui/enhanced-input'
import { ModernTransactionSummary } from '@/components/ui/modern-transaction-summary'
import { FinancialIcon } from '@/components/ui/financial-icons'
import { cn } from '@/lib/utils'
import { fetchRealStockPrice, type StockPrice } from '@/lib/utils/finnhub-api'
import { RefreshCw, Activity, DollarSign, AlertCircle } from 'lucide-react'

export interface TransactionData {
  type: 'BUY' | 'SELL'
  symbol: string
  stockName: string
  quantity: number
  pricePerShare: number
  totalAmount: number
  fees: number
  advancedFees: AdvancedFees
  currency: string
  date: string
  accountId?: string
  notes?: string
}

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (transaction: TransactionData) => Promise<void>
  initialSymbol?: string
  accounts?: Array<{ id: string; name: string; platform: string }>
  portfolioId?: string
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  initialSymbol = '',
  accounts = [],
  portfolioId,
}: AddTransactionModalProps) {
  // Form state
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY')
  const [symbol, setSymbol] = useState(initialSymbol)
  const [stockName, setStockName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [pricePerShare, setPricePerShare] = useState('')
  const [fees, setFees] = useState('0')
  const [advancedFees, setAdvancedFees] = useState<AdvancedFees>({
    commission: 0,
    currencyExchange: 0,
    otherFees: 0,
    total: 0,
  })
  const [currency, setCurrency] = useState('NOK')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [accountId, setAccountId] = useState('')
  const [notes, setNotes] = useState('')

  // Holdings data for sell transactions
  const [selectedHolding, setSelectedHolding] = useState<{
    quantity: number
    account_id: string
    account_name: string
    average_cost: number
  } | null>(null)
  const [maxQuantity, setMaxQuantity] = useState<number>(0)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Price fetching state
  const [isFetchingPrice, setIsFetchingPrice] = useState(false)
  const [currentPrice, setCurrentPrice] = useState<StockPrice | null>(null)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [isLivePrice, setIsLivePrice] = useState(false)
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null)

  // Price cache (1-2 minutes)
  const priceCache = useRef<
    Map<string, { price: StockPrice; timestamp: number }>
  >(new Map())
  const PRICE_CACHE_TTL = 2 * 60 * 1000 // 2 minutes

  // Calculated values
  const quantityNum = parseFloat(quantity) || 0
  const priceNum = parseFloat(pricePerShare) || 0
  const feesNum = advancedFees.total || parseFloat(fees) || 0
  const totalAmount =
    quantityNum * priceNum + (type === 'BUY' ? feesNum : -feesNum)

  // Fetch current stock price
  const fetchCurrentPrice = useCallback(
    async (symbol: string, useCache: boolean = true) => {
      if (!symbol) return

      // Check cache first
      const cacheKey = symbol.toUpperCase()
      if (useCache && priceCache.current.has(cacheKey)) {
        const cached = priceCache.current.get(cacheKey)!
        const isExpired = Date.now() - cached.timestamp > PRICE_CACHE_TTL
        if (!isExpired) {
          setCurrentPrice(cached.price)
          setPricePerShare(cached.price.price.toFixed(2))
          setIsLivePrice(true)
          setLastPriceUpdate(new Date(cached.timestamp))
          return
        }
      }

      setIsFetchingPrice(true)
      setPriceError(null)

      try {
        const result = await fetchRealStockPrice(symbol, { useCache: false })

        if (result.success && result.data) {
          setCurrentPrice(result.data)
          setPricePerShare(result.data.price.toFixed(2))
          setIsLivePrice(true)
          setLastPriceUpdate(new Date())

          // Cache the price
          priceCache.current.set(cacheKey, {
            price: result.data,
            timestamp: Date.now(),
          })

          // Clear any existing errors
          setErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors.pricePerShare
            return newErrors
          })
        } else {
          const errorMessage =
            result.errors[0]?.message || 'Kunne ikke hente aktuell pris'
          setPriceError(errorMessage)
        }
      } catch (error) {
        setPriceError('Feil ved henting av pris')
      } finally {
        setIsFetchingPrice(false)
      }
    },
    []
  )

  // Apply default fees based on account platform
  const applyDefaultFees = useCallback(
    (accountId: string) => {
      const account = accounts.find(acc => acc.id === accountId)
      if (!account) return

      // Determine if it's a Norwegian or foreign stock
      const isNorwegian = currency === 'NOK' || symbol.includes('.OL')
      const platform = account.platform.toLowerCase()

      let defaultFees: AdvancedFees = {
        commission: 0,
        currencyExchange: 0,
        otherFees: 0,
        total: 0,
      }

      // Set default fees based on platform and currency
      if (platform === 'nordnet') {
        if (isNorwegian) {
          defaultFees = {
            commission: 99,
            currencyExchange: 0,
            otherFees: 0,
            total: 99,
          }
        } else {
          defaultFees = {
            commission: 0.99,
            currencyExchange: 25,
            otherFees: 0,
            total: 25.99,
          }
        }
      } else if (platform === 'dnb') {
        if (isNorwegian) {
          defaultFees = {
            commission: 149,
            currencyExchange: 0,
            otherFees: 0,
            total: 149,
          }
        } else {
          defaultFees = {
            commission: 149,
            currencyExchange: 50,
            otherFees: 0,
            total: 199,
          }
        }
      } else if (platform === 'handelsbanken') {
        if (isNorwegian) {
          defaultFees = {
            commission: 199,
            currencyExchange: 0,
            otherFees: 0,
            total: 199,
          }
        } else {
          defaultFees = {
            commission: 199,
            currencyExchange: 35,
            otherFees: 0,
            total: 234,
          }
        }
      }

      setAdvancedFees(defaultFees)
    },
    [accounts, currency, symbol]
  )

  // Handle account selection
  const handleAccountSelect = useCallback(
    (accountId: string) => {
      setAccountId(accountId)
      applyDefaultFees(accountId)
    },
    [applyDefaultFees]
  )

  // Apply default fees when account, currency, or symbol changes
  useEffect(() => {
    if (accountId && currency && symbol) {
      applyDefaultFees(accountId)
    }
  }, [accountId, currency, symbol, applyDefaultFees])

  // Handle stock selection from search
  const handleStockSelect = useCallback(
    async (stock: StockSearchResult) => {
      setSymbol(stock.symbol)
      setStockName(stock.name)
      setCurrency(stock.currency)

      // Handle holdings data for sell transactions
      if (type === 'SELL' && stock.quantity && stock.account_id) {
        setSelectedHolding({
          quantity: stock.quantity,
          account_id: stock.account_id,
          account_name: stock.account_name || 'Unknown Account',
          average_cost: stock.average_cost || 0,
        })
        setMaxQuantity(stock.quantity)

        // Pre-select the account for sell transactions
        if (stock.account_id) {
          setAccountId(stock.account_id)
          applyDefaultFees(stock.account_id)
        }
      } else {
        setSelectedHolding(null)
        setMaxQuantity(0)
      }

      // Clear symbol-related errors
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.symbol
        delete newErrors.stockName
        delete newErrors.quantity
        return newErrors
      })

      // Reset price state
      setCurrentPrice(null)
      setPriceError(null)
      setIsLivePrice(false)
      setLastPriceUpdate(null)

      // Fetch current price for the selected stock
      await fetchCurrentPrice(stock.symbol)
    },
    [fetchCurrentPrice, type]
  )

  // Handle manual price refresh
  const handlePriceRefresh = useCallback(async () => {
    if (!symbol) return
    await fetchCurrentPrice(symbol, false) // Skip cache
  }, [symbol, fetchCurrentPrice])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSymbol(initialSymbol)
      setStockName('')
      setQuantity('')
      setPricePerShare('')
      setFees('0')
      setAdvancedFees({
        commission: 0,
        currencyExchange: 0,
        otherFees: 0,
        total: 0,
      })
      setCurrency('NOK')
      setDate(new Date().toISOString().split('T')[0])
      setAccountId(accounts.length > 0 ? accounts[0].id : '')
      setNotes('')
      setErrors({})

      // Reset holdings data
      setSelectedHolding(null)
      setMaxQuantity(0)

      // Reset price-related state
      setCurrentPrice(null)
      setPriceError(null)
      setIsLivePrice(false)
      setLastPriceUpdate(null)
      setIsFetchingPrice(false)
    }
  }, [isOpen, initialSymbol, accounts])

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!symbol.trim()) {
      newErrors.symbol = 'Aksjesymbol er påkrevd'
    }

    if (!stockName.trim()) {
      newErrors.stockName = 'Aksjenavn er påkrevd'
    }

    if (!quantity || quantityNum <= 0) {
      newErrors.quantity = 'Antall må være større enn 0'
    }

    // Additional validation for sell transactions
    if (type === 'SELL' && maxQuantity > 0 && quantityNum > maxQuantity) {
      newErrors.quantity = `Du kan ikke selge mer enn ${maxQuantity} aksjer`
    }

    if (!pricePerShare || priceNum <= 0) {
      newErrors.pricePerShare = 'Pris per aksje må være større enn 0'
    }

    if (feesNum < 0) {
      newErrors.fees = 'Gebyrer kan ikke være negative'
    }

    if (
      advancedFees.commission < 0 ||
      advancedFees.currencyExchange < 0 ||
      advancedFees.otherFees < 0
    ) {
      newErrors.fees = 'Gebyrer kan ikke være negative'
    }

    if (!date) {
      newErrors.date = 'Dato er påkrevd'
    }

    if (accounts.length > 0 && !accountId) {
      newErrors.accountId = 'Konto må velges'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [
    symbol,
    stockName,
    quantity,
    quantityNum,
    pricePerShare,
    priceNum,
    feesNum,
    date,
    accountId,
    accounts,
    type,
    maxQuantity,
  ])

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateForm()) {
        return
      }

      setIsSubmitting(true)

      try {
        const transactionData: TransactionData = {
          type,
          symbol: symbol.trim().toUpperCase(),
          stockName: stockName.trim(),
          quantity: quantityNum,
          pricePerShare: priceNum,
          totalAmount,
          fees: feesNum,
          advancedFees,
          currency,
          date,
          accountId: accountId || undefined,
          notes: notes.trim() || undefined,
        }

        await onSubmit(transactionData)
        onClose()
      } catch (error) {
        setErrors({
          submit:
            error instanceof Error
              ? error.message
              : 'En feil oppstod ved lagring av transaksjonen',
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      validateForm,
      type,
      symbol,
      stockName,
      quantityNum,
      priceNum,
      totalAmount,
      feesNum,
      advancedFees,
      currency,
      date,
      accountId,
      notes,
      onSubmit,
      onClose,
    ]
  )

  // Handle transaction type change
  const handleTypeChange = useCallback((newType: 'BUY' | 'SELL') => {
    setType(newType)

    // Clear holdings data when switching away from SELL
    if (newType !== 'SELL') {
      setSelectedHolding(null)
      setMaxQuantity(0)
    }

    // Reset form when switching transaction type
    setSymbol('')
    setStockName('')
    setQuantity('')
    setSelectedHolding(null)
    setMaxQuantity(0)

    // Clear errors
    setErrors({})
  }, [])

  // Handle quantity change with validation for sell transactions
  const handleQuantityChange = useCallback(
    (value: string) => {
      setQuantity(value)

      // Validate quantity for sell transactions
      if (type === 'SELL' && maxQuantity > 0) {
        const quantityNum = parseFloat(value)
        if (quantityNum > maxQuantity) {
          setErrors(prev => ({
            ...prev,
            quantity: `Du kan ikke selge mer enn ${maxQuantity} aksjer`,
          }))
        } else {
          setErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors.quantity
            return newErrors
          })
        }
      }
    },
    [type, maxQuantity]
  )

  // Handle "Max" button click
  const handleMaxQuantity = useCallback(() => {
    if (type === 'SELL' && maxQuantity > 0) {
      setQuantity(maxQuantity.toString())
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.quantity
        return newErrors
      })
    }
  }, [type, maxQuantity])

  // Auto-format symbol
  const handleSymbolChange = useCallback((value: string) => {
    const formatted = value.toUpperCase()
    setSymbol(formatted)

    // Auto-detect Norwegian stocks and set currency
    if (formatted.includes('.OL')) {
      setCurrency('NOK')
    } else if (formatted.length > 0 && !formatted.includes('.')) {
      setCurrency('USD')
    }
  }, [])

  // Theme variant - revert to light theme for stability
  const themeVariant = 'light' as const

  return (
    <Dialog open={isOpen} onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FinancialIcon name={type === 'BUY' ? 'buy' : 'sell'} size={20} />
            Legg til {type === 'BUY' ? 'kjøp' : 'salg'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type */}
          {/* Transaction Type */}
          <div className="space-y-2">
            <Label>Transaksjonstype</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === 'BUY' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTypeChange('BUY')}
                className={
                  type === 'BUY' ? 'bg-green-600 hover:bg-green-700' : ''
                }
              >
                <FinancialIcon name="buy" size={16} className="mr-1" />
                Kjøp
              </Button>
              <Button
                type="button"
                variant={type === 'SELL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTypeChange('SELL')}
                className={type === 'SELL' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                <FinancialIcon name="sell" size={16} className="mr-1" />
                Salg
              </Button>
            </div>
          </div>

          <Separator />

          {/* Stock Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Velg aksje *</Label>
              <StockSearch
                value={symbol ? `${symbol} - ${stockName}` : ''}
                onSelect={handleStockSelect}
                placeholder={
                  type === 'SELL'
                    ? 'Søk i dine beholdninger...'
                    : 'Søk etter aksjer (Apple, Equinor, Tesla...)'
                }
                className={errors.symbol ? 'border-red-500' : ''}
                holdingsOnly={type === 'SELL'}
                portfolioId={portfolioId}
              />
              {errors.symbol && (
                <p className="text-sm text-red-600">{errors.symbol}</p>
              )}
              {symbol && stockName && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Badge variant="outline">{symbol}</Badge>
                  <span>{stockName}</span>
                  <Badge variant="secondary">{currency}</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Details - Fixed Alignment */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex min-h-[24px] items-center justify-between">
                <Label htmlFor="quantity" className="text-sm font-medium">
                  Antall aksjer *
                </Label>
                {type === 'SELL' && selectedHolding && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      Eier: {selectedHolding.quantity}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleMaxQuantity}
                      className="h-6 px-2 py-1 text-xs"
                    >
                      Max
                    </Button>
                  </div>
                )}
              </div>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="1"
                max={type === 'SELL' ? maxQuantity : undefined}
                value={quantity}
                onChange={e => handleQuantityChange(e.target.value)}
                placeholder="100"
                className={cn(
                  'h-12 text-lg',
                  errors.quantity ? 'border-red-500' : ''
                )}
              />
              {errors.quantity && (
                <p className="text-sm text-red-600">{errors.quantity}</p>
              )}
              {type === 'SELL' && selectedHolding && (
                <div className="text-sm text-gray-600">
                  Konto: {selectedHolding.account_name} | Snittspris:{' '}
                  {selectedHolding.average_cost.toFixed(2)} {currency}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex min-h-[24px] items-center justify-between">
                <Label htmlFor="pricePerShare" className="text-sm font-medium">
                  Pris per aksje *
                </Label>
                <div className="flex items-center gap-2">
                  {isLivePrice && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge
                            variant="secondary"
                            className="border-green-300 bg-green-100 px-2 py-1 text-xs text-green-800"
                          >
                            <Activity className="mr-1 h-3 w-3" />
                            Live
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Oppdatert:{' '}
                            {lastPriceUpdate?.toLocaleTimeString('nb-NO')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {symbol && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handlePriceRefresh}
                            disabled={isFetchingPrice || !symbol}
                            className="h-6 w-6 border-blue-300 p-0 hover:bg-blue-50"
                          >
                            <RefreshCw
                              className={cn(
                                'h-4 w-4 text-blue-600',
                                isFetchingPrice && 'animate-spin'
                              )}
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Hent aktuell pris</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              <div className="relative">
                <Input
                  id="pricePerShare"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricePerShare}
                  onChange={e => {
                    setPricePerShare(e.target.value)
                    // Mark as manual entry if user types
                    if (e.target.value !== currentPrice?.price.toFixed(2)) {
                      setIsLivePrice(false)
                    }
                  }}
                  placeholder={isFetchingPrice ? 'Henter pris...' : '150.50'}
                  className={cn(
                    'h-12 text-lg',
                    errors.pricePerShare ? 'border-red-500' : '',
                    isFetchingPrice && 'opacity-50'
                  )}
                  disabled={isFetchingPrice}
                />
                {isFetchingPrice && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 transform">
                    <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              {errors.pricePerShare && (
                <p className="text-sm text-red-600">{errors.pricePerShare}</p>
              )}
              {priceError && (
                <p className="flex items-center gap-1 text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  {priceError}
                </p>
              )}
              {currentPrice && isLivePrice && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    Endring: {currentPrice.change > 0 ? '+' : ''}
                    {currentPrice.change.toFixed(2)} (
                    {currentPrice.changePercent.toFixed(2)}%)
                  </span>
                  <Badge
                    variant={
                      currentPrice.change >= 0 ? 'default' : 'destructive'
                    }
                    className="text-xs"
                  >
                    {currentPrice.marketState === 'REGULAR' ? 'Åpen' : 'Lukket'}
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex min-h-[24px] items-center justify-between">
                <Label htmlFor="currency" className="text-sm font-medium">
                  Valuta *
                </Label>
              </div>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOK">NOK (Norske kroner)</SelectItem>
                  <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Account Selection - Moved above fees */}
          {accounts.length > 0 && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <FinancialIcon
                  name="building"
                  size={18}
                  className="text-blue-600"
                />
                Konto *
              </Label>
              <Select value={accountId} onValueChange={handleAccountSelect}>
                <SelectTrigger
                  className={cn(
                    'h-12 border-2 transition-colors',
                    errors.accountId && 'border-red-500'
                  )}
                >
                  <SelectValue placeholder="Velg konto" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <FinancialIcon name="wallet" size={16} />
                        {account.name} ({account.platform})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountId && (
                <p className="text-sm text-red-600 duration-300 animate-in slide-in-from-left-2">
                  {errors.accountId}
                </p>
              )}
            </div>
          )}

          {/* Advanced Fees */}
          <div className="space-y-4">
            <AdvancedFeesInput
              fees={advancedFees}
              onChange={setAdvancedFees}
              currency={currency}
              symbol={symbol}
              disabled={isSubmitting}
              accountPlatform={
                accounts.find(acc => acc.id === accountId)?.platform
              }
            />
            {errors.fees && (
              <p className="text-sm text-red-600">{errors.fees}</p>
            )}
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="notes">Notater (valgfritt)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Tilleggsinfo om transaksjonen..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Dato *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className={errors.date ? 'border-red-500' : ''}
              />
              {errors.date && (
                <p className="text-sm text-red-600">{errors.date}</p>
              )}
            </div>
          </div>

          <Separator className="h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent" />

          {/* Modern Transaction Summary */}
          <ModernTransactionSummary
            type={type}
            symbol={symbol}
            stockName={stockName}
            quantity={quantity}
            pricePerShare={pricePerShare}
            fees={feesNum}
            totalAmount={totalAmount}
            currency={currency}
            variant={themeVariant}
          />

          {/* Error Message */}
          {errors.submit && (
            <Alert variant="destructive">
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-12 border-2 border-gray-300 px-6 py-3 text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-800"
            >
              <FinancialIcon name="minus" size={16} className="mr-2" />
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !symbol ||
                !stockName ||
                !quantity ||
                !pricePerShare
              }
              className={cn(
                'h-12 transform-gpu px-8 py-3 font-bold text-white transition-all duration-300',
                'bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700',
                'hover:from-purple-500 hover:via-purple-600 hover:to-indigo-600',
                'hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none',
                'border-2 border-purple-500 hover:border-purple-400',
                'focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
              )}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Lagrer...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FinancialIcon
                    name={type === 'BUY' ? 'plus' : 'minus'}
                    size={16}
                    className="text-white"
                  />
                  Legg til {type === 'BUY' ? 'kjøp' : 'salg'}
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
