'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { FinancialIcon, CurrencyIcon } from './financial-icons'

interface TransactionSummaryProps {
  type: 'BUY' | 'SELL'
  symbol: string
  stockName: string
  quantity: number | string
  pricePerShare: number | string
  fees: number
  totalAmount: number
  currency: string
  variant?: 'light' | 'dark' | 'dark-orange'
  className?: string
}

export function ModernTransactionSummary({
  type,
  symbol,
  stockName,
  quantity,
  pricePerShare,
  fees,
  totalAmount,
  currency,
  variant = 'light',
  className,
}: TransactionSummaryProps) {
  const isBuy = type === 'BUY'
  
  const getThemeClasses = () => {
    switch (variant) {
      case 'dark':
        return {
          card: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700',
          title: 'text-purple-400',
          label: 'text-slate-400',
          value: 'text-slate-100',
          total: 'text-white',
          glow: 'shadow-lg shadow-purple-500/20',
        }
      case 'dark-orange':
        return {
          card: 'bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 border-stone-700',
          title: 'text-orange-400',
          label: 'text-stone-400',
          value: 'text-stone-100',
          total: 'text-white',
          glow: 'shadow-lg shadow-orange-500/30',
        }
      default:
        return {
          card: 'bg-gradient-to-br from-purple-50 via-white to-indigo-50 border-purple-200',
          title: 'text-purple-900',
          label: 'text-gray-600',
          value: 'text-gray-900',
          total: 'text-purple-900',
          glow: 'shadow-lg shadow-purple-500/10',
        }
    }
  }

  const theme = getThemeClasses()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-xl border-2 p-6",
        theme.card,
        theme.glow,
        "backdrop-blur-sm",
        className
      )}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r",
          variant === 'dark-orange' 
            ? "from-orange-600/10 via-transparent to-amber-600/10"
            : variant === 'dark'
            ? "from-purple-600/10 via-transparent to-indigo-600/10"
            : "from-purple-500/10 via-transparent to-indigo-500/10"
        )} />
        <motion.div
          className={cn(
            "absolute -top-4 -right-4 w-24 h-24 rounded-full blur-xl",
            variant === 'dark-orange' ? "bg-orange-500/20" : "bg-purple-500/20"
          )}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 mb-4">
        <motion.h4 
          className={cn("text-lg font-bold flex items-center gap-2", theme.title)}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <FinancialIcon 
            name={isBuy ? 'buy' : 'sell'} 
            className={cn(
              "transition-transform duration-300",
              variant === 'dark-orange' ? "text-orange-400" : "text-purple-600"
            )}
            size={20}
          />
          Transaksjonssammendrag
        </motion.h4>
      </div>

      {/* Transaction Details Grid */}
      <div className="relative z-10 space-y-3">
        {/* Transaction Type */}
        <motion.div 
          className="flex justify-between items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className={cn("text-sm font-medium", theme.label)}>Type:</span>
          <Badge
            variant={isBuy ? 'default' : 'destructive'}
            className={cn(
              "font-bold px-3 py-1 shadow-sm",
              isBuy 
                ? variant === 'dark-orange'
                  ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white"
                  : "bg-gradient-to-r from-green-600 to-green-700 text-white"
                : "bg-gradient-to-r from-red-600 to-red-700 text-white"
            )}
          >
            {isBuy ? 'Kjøp' : 'Salg'}
          </Badge>
        </motion.div>

        {/* Stock Information */}
        <motion.div 
          className="flex justify-between items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className={cn("text-sm font-medium", theme.label)}>Aksje:</span>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                "font-mono text-xs border-2",
                variant === 'dark-orange' 
                  ? "border-orange-300/50 text-orange-300"
                  : variant === 'dark'
                  ? "border-purple-300/50 text-purple-300"
                  : "border-purple-300 text-purple-700"
              )}
            >
              {symbol || '—'}
            </Badge>
            <span className={cn("text-sm font-medium truncate max-w-32", theme.value)}>
              {stockName || 'Ikke valgt'}
            </span>
          </div>
        </motion.div>

        {/* Quantity */}
        <motion.div 
          className="flex justify-between items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <span className={cn("text-sm font-medium", theme.label)}>Antall:</span>
          <div className="flex items-center gap-1">
            <motion.span 
              className={cn("font-semibold", theme.value)}
              key={quantity}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {quantity || '0'}
            </motion.span>
            <span className={cn("text-xs", theme.label)}>aksjer</span>
          </div>
        </motion.div>

        {/* Price per Share */}
        <motion.div 
          className="flex justify-between items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <span className={cn("text-sm font-medium", theme.label)}>Pris per aksje:</span>
          <div className="flex items-center gap-1">
            <motion.span 
              className={cn("font-semibold", theme.value)}
              key={pricePerShare}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {pricePerShare || '0'}
            </motion.span>
            <CurrencyIcon currency={currency} size={14} />
          </div>
        </motion.div>

        {/* Fees */}
        <motion.div 
          className="flex justify-between items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <span className={cn("text-sm font-medium", theme.label)}>Gebyrer:</span>
          <div className="flex items-center gap-1">
            <motion.span 
              className={cn("font-semibold", theme.value)}
              key={fees}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {fees.toFixed(2)}
            </motion.span>
            <CurrencyIcon currency={currency} size={14} />
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div 
          className={cn(
            "w-full h-px my-4",
            variant === 'dark-orange' 
              ? "bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"
              : variant === 'dark'
              ? "bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"
              : "bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"
          )}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        />

        {/* Total Amount */}
        <motion.div 
          className="flex justify-between items-center pt-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <span className={cn("text-base font-bold", theme.label)}>
            Total beløp:
          </span>
          <div className="flex items-center gap-2">
            <motion.span 
              className={cn(
                "text-xl font-bold",
                theme.total,
                variant === 'dark-orange' && "text-orange-400"
              )}
              key={totalAmount}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
            >
              {totalAmount.toFixed(2)}
            </motion.span>
            <CurrencyIcon 
              currency={currency} 
              size={18} 
              className={cn(
                variant === 'dark-orange' ? "text-orange-400" : "text-current"
              )}
            />
          </div>
        </motion.div>
      </div>

      {/* Bottom accent line */}
      <motion.div 
        className={cn(
          "absolute bottom-0 left-0 h-1 bg-gradient-to-r",
          variant === 'dark-orange'
            ? "from-orange-500 via-amber-500 to-orange-600"
            : "from-purple-500 via-indigo-500 to-pink-500"
        )}
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
      />
    </motion.div>
  )
}

// Simplified version for loading states
export function TransactionSummarySkeleton({ variant = 'light' }: { variant?: 'light' | 'dark' | 'dark-orange' }) {
  const getSkeletonClasses = () => {
    switch (variant) {
      case 'dark':
      case 'dark-orange':
        return 'bg-slate-800 animate-pulse'
      default:
        return 'bg-gray-200 animate-pulse'
    }
  }

  return (
    <div className={cn(
      "rounded-xl border-2 p-6",
      variant === 'dark-orange' 
        ? "bg-stone-900 border-stone-700"
        : variant === 'dark'
        ? "bg-slate-900 border-slate-700"
        : "bg-gray-50 border-gray-200"
    )}>
      <div className={cn("h-6 w-48 rounded mb-4", getSkeletonClasses())} />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className={cn("h-4 w-20 rounded", getSkeletonClasses())} />
            <div className={cn("h-4 w-16 rounded", getSkeletonClasses())} />
          </div>
        ))}
        <div className="pt-2 flex justify-between items-center">
          <div className={cn("h-5 w-24 rounded", getSkeletonClasses())} />
          <div className={cn("h-6 w-20 rounded", getSkeletonClasses())} />
        </div>
      </div>
    </div>
  )
}