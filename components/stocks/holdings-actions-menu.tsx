'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  MoreHorizontal,
  ShoppingCart,
  Banknote,
  BarChart3,
  Edit,
  Bell,
  StickyNote,
  TrendingUp,
  Trash2,
  Building2,
  Merge,
  Settings,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HoldingWithMetrics } from '@/lib/hooks/use-portfolio-state'

export interface HoldingsActionsMenuProps {
  holding: HoldingWithMetrics
  onBuyMore: (holding: HoldingWithMetrics) => void
  onSell: (holding: HoldingWithMetrics) => void
  onViewDetails: (holding: HoldingWithMetrics) => void
  onEditPosition: (holding: HoldingWithMetrics) => void
  onSetAlert: (holding: HoldingWithMetrics) => void
  onAddNote: (holding: HoldingWithMetrics) => void
  onViewHistory: (holding: HoldingWithMetrics) => void
  onRemovePosition: (holding: HoldingWithMetrics) => void
  disabled?: boolean
  // Multi-broker specific actions
  onViewBrokerBreakdown?: (holding: HoldingWithMetrics) => void
  onMergeHoldings?: (holding: HoldingWithMetrics) => void
  onResolveConflict?: (holding: HoldingWithMetrics) => void
  onSyncBrokers?: (holding: HoldingWithMetrics) => void
  isConsolidated?: boolean
  isDuplicate?: boolean
  brokerCount?: number
}

export function HoldingsActionsMenu({
  holding,
  onBuyMore,
  onSell,
  onViewDetails,
  onEditPosition,
  onSetAlert,
  onAddNote,
  onViewHistory,
  onRemovePosition,
  disabled = false,
  // Multi-broker specific props
  onViewBrokerBreakdown,
  onMergeHoldings,
  onResolveConflict,
  onSyncBrokers,
  isConsolidated = false,
  isDuplicate = false,
  brokerCount = 1,
}: HoldingsActionsMenuProps) {
  const handleAction = (action: () => void) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation() // Prevent row click
      action()
    }
  }

  // Check if selling is disabled (no quantity)
  const canSell = holding.quantity > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-purple-50 dark:hover:bg-purple-900/20"
          disabled={disabled}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Åpne handlingsmeny</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Primary Actions */}
        <DropdownMenuItem
          onClick={handleAction(() => onBuyMore(holding))}
          className="cursor-pointer focus:bg-green-50 dark:focus:bg-green-900/20"
        >
          <ShoppingCart className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-green-700 dark:text-green-300">Kjøp mer</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleAction(() => onSell(holding))}
          className={cn(
            'cursor-pointer focus:bg-red-50 dark:focus:bg-red-900/20',
            !canSell && 'cursor-not-allowed opacity-50'
          )}
          disabled={!canSell}
        >
          <Banknote className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
          <span className="text-red-700 dark:text-red-300">Selg</span>
          {!canSell && (
            <span className="ml-auto text-xs text-gray-500">
              (Ingen beholdning)
            </span>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleAction(() => onViewDetails(holding))}
          className="cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-900/20"
        >
          <BarChart3 className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span className="text-purple-700 dark:text-purple-300">
            Vis detaljer
          </span>
        </DropdownMenuItem>

        {/* Multi-broker specific actions */}
        {(isConsolidated || brokerCount > 1) && (
          <DropdownMenuItem
            onClick={handleAction(() => onViewBrokerBreakdown?.(holding))}
            className="cursor-pointer focus:bg-indigo-50 dark:focus:bg-indigo-900/20"
          >
            <Building2 className="mr-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-indigo-700 dark:text-indigo-300">
              Megler-sammendrag
            </span>
            {brokerCount > 1 && (
              <span className="ml-auto text-xs text-gray-500">
                ({brokerCount} meglere)
              </span>
            )}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Secondary Actions */}
        <DropdownMenuItem
          onClick={handleAction(() => onEditPosition(holding))}
          className="cursor-pointer focus:bg-gray-50 dark:focus:bg-gray-800"
        >
          <Edit className="mr-2 h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">
            Rediger posisjon
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleAction(() => onSetAlert(holding))}
          className="cursor-pointer focus:bg-yellow-50 dark:focus:bg-yellow-900/20"
        >
          <Bell className="mr-2 h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-yellow-700 dark:text-yellow-300">
            Sett varsel
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleAction(() => onAddNote(holding))}
          className="cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20"
        >
          <StickyNote className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-blue-700 dark:text-blue-300">
            Legg til notat
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Advanced Actions */}
        <DropdownMenuItem
          onClick={handleAction(() => onViewHistory(holding))}
          className="cursor-pointer focus:bg-indigo-50 dark:focus:bg-indigo-900/20"
        >
          <TrendingUp className="mr-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-indigo-700 dark:text-indigo-300">
            Transaksjonshistorikk
          </span>
        </DropdownMenuItem>

        {/* Multi-broker management actions */}
        {(isConsolidated || brokerCount > 1) && (
          <>
            <DropdownMenuSeparator />
            
            {isDuplicate && (
              <DropdownMenuItem
                onClick={handleAction(() => onMergeHoldings?.(holding))}
                className="cursor-pointer focus:bg-orange-50 dark:focus:bg-orange-900/20"
              >
                <Merge className="mr-2 h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="text-orange-700 dark:text-orange-300">
                  Slå sammen duplikater
                </span>
              </DropdownMenuItem>
            )}

            {isDuplicate && (
              <DropdownMenuItem
                onClick={handleAction(() => onResolveConflict?.(holding))}
                className="cursor-pointer focus:bg-yellow-50 dark:focus:bg-yellow-900/20"
              >
                <Settings className="mr-2 h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-yellow-700 dark:text-yellow-300">
                  Løs konflikt
                </span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={handleAction(() => onSyncBrokers?.(holding))}
              className="cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20"
            >
              <RefreshCw className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300">
                Synkroniser meglere
              </span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleAction(() => onRemovePosition(holding))}
          className="cursor-pointer focus:bg-red-50 dark:focus:bg-red-900/20"
        >
          <Trash2 className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
          <span className="text-red-700 dark:text-red-300">Fjern posisjon</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Animation wrapper for enhanced interaction feedback
export function AnimatedHoldingsActionsMenu(props: HoldingsActionsMenuProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.1 }}
    >
      <HoldingsActionsMenu {...props} />
    </motion.div>
  )
}
