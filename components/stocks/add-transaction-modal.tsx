'use client'

import { useState, useCallback, useEffect } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { StockSearch, StockSearchResult } from './stock-search'
import AdvancedFeesInput, { AdvancedFees } from './advanced-fees-input'
import { AnimatedTransactionButtons } from '@/components/ui/animated-transaction-buttons'
import { EnhancedInput, FinancialInput, DateInput } from '@/components/ui/enhanced-input'
import { ModernTransactionSummary } from '@/components/ui/modern-transaction-summary'
import { FinancialIcon } from '@/components/ui/financial-icons'
import { cn } from '@/lib/utils'

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
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  initialSymbol = '',
  accounts = [],
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

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Calculated values
  const quantityNum = parseFloat(quantity) || 0
  const priceNum = parseFloat(pricePerShare) || 0
  const feesNum = advancedFees.total || parseFloat(fees) || 0
  const totalAmount =
    quantityNum * priceNum + (type === 'BUY' ? feesNum : -feesNum)

  // Handle stock selection from search
  const handleStockSelect = useCallback((stock: StockSearchResult) => {
    setSymbol(stock.symbol)
    setStockName(stock.name)
    setCurrency(stock.currency)
    // Clear symbol-related errors
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.symbol
      delete newErrors.stockName
      return newErrors
    })
  }, [])

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

    if (!pricePerShare || priceNum <= 0) {
      newErrors.pricePerShare = 'Pris per aksje må være større enn 0'
    }

    if (feesNum < 0) {
      newErrors.fees = 'Gebyrer kan ikke være negative'
    }

    if (advancedFees.commission < 0 || advancedFees.currencyExchange < 0 || advancedFees.otherFees < 0) {
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
      currency,
      date,
      accountId,
      notes,
      onSubmit,
      onClose,
    ]
  )

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
            <FinancialIcon 
              name={type === 'BUY' ? 'buy' : 'sell'} 
              size={20} 
            />
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
                onClick={() => setType('BUY')}
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
                onClick={() => setType('SELL')}
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
                placeholder="Søk etter aksjer (Apple, Equinor, Tesla...)"
                className={errors.symbol ? 'border-red-500' : ''}
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

          {/* Transaction Details */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="quantity">Antall aksjer *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="100"
                className={errors.quantity ? 'border-red-500' : ''}
              />
              {errors.quantity && (
                <p className="text-sm text-red-600">{errors.quantity}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerShare">Pris per aksje *</Label>
              <Input
                id="pricePerShare"
                type="number"
                min="0"
                step="0.01"
                value={pricePerShare}
                onChange={e => setPricePerShare(e.target.value)}
                placeholder="150.50"
                className={errors.pricePerShare ? 'border-red-500' : ''}
              />
              {errors.pricePerShare && (
                <p className="text-sm text-red-600">{errors.pricePerShare}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Valuta</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
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

          {/* Advanced Fees */}
          <div className="space-y-4">
            <AdvancedFeesInput
              fees={advancedFees}
              onChange={setAdvancedFees}
              currency={currency}
              symbol={symbol}
              disabled={isSubmitting}
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

          {/* Account Selection */}
          {accounts.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold text-stone-200 flex items-center gap-2">
                <FinancialIcon name="building" size={18} className="text-orange-400" />
                Konto
              </Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger
                  className={cn(
                    "h-12 bg-stone-900 border-2 border-stone-700 hover:border-orange-600 focus:border-orange-500 transition-colors text-stone-200",
                    errors.accountId && "border-red-500"
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
                <p className="text-sm text-red-600 animate-in slide-in-from-left-2 duration-300">
                  {errors.accountId}
                </p>
              )}
            </div>
          )}

          <Separator className="bg-gradient-to-r from-transparent via-purple-300 to-transparent h-px" />

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
              className="px-6 py-3 h-12 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 hover:bg-gray-50 transition-all duration-200"
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
                "px-8 py-3 h-12 font-bold text-white transition-all duration-300 transform-gpu",
                "bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700",
                "hover:from-purple-500 hover:via-purple-600 hover:to-indigo-600",
                "hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none",
                "border-2 border-purple-500 hover:border-purple-400",
                "focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              )}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
