'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransactionStatusProps {
  isProcessing: boolean
  isSuccess: boolean
  error: string | null
  className?: string
}

export function TransactionStatus({ 
  isProcessing, 
  isSuccess, 
  error,
  className 
}: TransactionStatusProps) {
  return (
    <AnimatePresence mode="wait">
      {isProcessing && (
        <motion.div
          key="processing"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            'flex items-center gap-3 rounded-lg bg-blue-50 p-4 border border-blue-200',
            className
          )}
        >
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">Behandler transaksjon...</p>
            <p className="text-sm text-blue-600">Beholdningene vil oppdateres automatisk</p>
          </div>
        </motion.div>
      )}
      
      {isSuccess && !isProcessing && (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            'flex items-center gap-3 rounded-lg bg-green-50 p-4 border border-green-200',
            className
          )}
        >
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-900">Transaksjon fullført!</p>
            <p className="text-sm text-green-600">Beholdningene er oppdatert</p>
          </div>
        </motion.div>
      )}
      
      {error && !isProcessing && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            'flex items-center gap-3 rounded-lg bg-red-50 p-4 border border-red-200',
            className
          )}
        >
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-900">Transaksjon feilet</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface HoldingUpdateIndicatorProps {
  holding: {
    symbol: string
    quantity: number
    currentPrice: number
    changePercent: number
  }
  isOptimistic?: boolean
  className?: string
}

export function HoldingUpdateIndicator({ 
  holding, 
  isOptimistic = false,
  className 
}: HoldingUpdateIndicatorProps) {
  const isPositive = holding.changePercent >= 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg border',
        isOptimistic ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-green-600" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-600" />
        )}
        <span className="font-medium">{holding.symbol}</span>
      </div>
      
      <div className="flex items-center gap-1 text-sm">
        <span>{holding.quantity} aksjer</span>
        <span className="text-gray-400">•</span>
        <span
          className={cn(
            'font-medium',
            isPositive ? 'text-green-600' : 'text-red-600'
          )}
        >
          {isPositive ? '+' : ''}{holding.changePercent.toFixed(2)}%
        </span>
      </div>
      
      {isOptimistic && (
        <div className="flex items-center gap-1 text-xs text-blue-600">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span>Oppdaterer...</span>
        </div>
      )}
    </motion.div>
  )
}