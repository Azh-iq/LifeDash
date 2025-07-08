'use client'

import { cn } from '@/lib/utils'
import { BuyIcon, SellIcon } from './financial-icons'

interface AnimatedTransactionButtonsProps {
  value: 'BUY' | 'SELL'
  onChange: (value: 'BUY' | 'SELL') => void
  disabled?: boolean
  className?: string
}

export function AnimatedTransactionButtons({
  value,
  onChange,
  disabled = false,
  className,
}: AnimatedTransactionButtonsProps) {
  return (
    <div className={cn('flex w-full gap-3', className)}>
      {/* Buy Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('BUY')}
        className={cn(
          // Base styles
          'group relative flex-1 transform-gpu rounded-xl px-6 py-4 text-sm font-semibold transition-all duration-300',
          'flex items-center justify-center gap-2 overflow-hidden',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',

          // Buy button styles - inspired by uiverse.io modern buttons
          value === 'BUY'
            ? [
                // Active state - green gradient with glow
                'bg-gradient-to-r from-green-500 via-green-600 to-green-700',
                'text-white shadow-lg shadow-green-500/50',
                'border-2 border-green-400',
                'hover:from-green-400 hover:via-green-500 hover:to-green-600',
                'hover:scale-105 hover:shadow-xl hover:shadow-green-500/60',
                'focus:ring-green-500',
              ]
            : [
                // Inactive state - subtle with hover effects
                'border-2 border-green-200/50 bg-white/50 backdrop-blur-sm',
                'text-green-700 hover:text-green-800',
                'hover:border-green-300/70 hover:bg-green-50/80',
                'hover:scale-102 hover:shadow-md',
                'focus:ring-green-300',
              ],

          // Disabled state
          disabled &&
            'cursor-not-allowed opacity-50 hover:scale-100 hover:shadow-none'
        )}
      >
        {/* Animated background gradient overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-300',
            value === 'BUY'
              ? 'from-green-400/20 via-green-500/20 to-green-600/20 group-hover:opacity-100'
              : 'from-green-100/50 via-green-200/50 to-green-300/50 group-hover:opacity-100'
          )}
        />

        {/* Content */}
        <div className="relative z-10 flex items-center gap-2">
          <BuyIcon
            size={18}
            strokeWidth={2.5}
            className={cn(
              'transition-transform duration-300 group-hover:scale-110',
              value === 'BUY' ? 'text-white' : 'text-green-600'
            )}
          />
          <span className="font-bold tracking-wide">Kjøp</span>
        </div>

        {/* Shine effect */}
        <div
          className={cn(
            'absolute inset-0 opacity-0 transition-opacity duration-500',
            'bg-gradient-to-r from-transparent via-white/20 to-transparent',
            'translate-x-[-100%] -skew-x-12 transform group-hover:translate-x-[100%] group-hover:opacity-100'
          )}
        />
      </button>

      {/* Sell Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('SELL')}
        className={cn(
          // Base styles
          'group relative flex-1 transform-gpu rounded-xl px-6 py-4 text-sm font-semibold transition-all duration-300',
          'flex items-center justify-center gap-2 overflow-hidden',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',

          // Sell button styles - inspired by uiverse.io modern buttons
          value === 'SELL'
            ? [
                // Active state - red gradient with glow
                'bg-gradient-to-r from-red-500 via-red-600 to-red-700',
                'text-white shadow-lg shadow-red-500/50',
                'border-2 border-red-400',
                'hover:from-red-400 hover:via-red-500 hover:to-red-600',
                'hover:scale-105 hover:shadow-xl hover:shadow-red-500/60',
                'focus:ring-red-500',
              ]
            : [
                // Inactive state - subtle with hover effects
                'border-2 border-red-200/50 bg-white/50 backdrop-blur-sm',
                'text-red-700 hover:text-red-800',
                'hover:border-red-300/70 hover:bg-red-50/80',
                'hover:scale-102 hover:shadow-md',
                'focus:ring-red-300',
              ],

          // Disabled state
          disabled &&
            'cursor-not-allowed opacity-50 hover:scale-100 hover:shadow-none'
        )}
      >
        {/* Animated background gradient overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-300',
            value === 'SELL'
              ? 'from-red-400/20 via-red-500/20 to-red-600/20 group-hover:opacity-100'
              : 'from-red-100/50 via-red-200/50 to-red-300/50 group-hover:opacity-100'
          )}
        />

        {/* Content */}
        <div className="relative z-10 flex items-center gap-2">
          <SellIcon
            size={18}
            strokeWidth={2.5}
            className={cn(
              'transition-transform duration-300 group-hover:scale-110',
              value === 'SELL' ? 'text-white' : 'text-red-600'
            )}
          />
          <span className="font-bold tracking-wide">Salg</span>
        </div>

        {/* Shine effect */}
        <div
          className={cn(
            'absolute inset-0 opacity-0 transition-opacity duration-500',
            'bg-gradient-to-r from-transparent via-white/20 to-transparent',
            'translate-x-[-100%] -skew-x-12 transform group-hover:translate-x-[100%] group-hover:opacity-100'
          )}
        />
      </button>
    </div>
  )
}

// Alternative black theme with orange highlights version
export function AnimatedTransactionButtonsDark({
  value,
  onChange,
  disabled = false,
  className,
}: AnimatedTransactionButtonsProps) {
  return (
    <div className={cn('flex w-full gap-3', className)}>
      {/* Buy Button - Dark Theme */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('BUY')}
        className={cn(
          // Base styles
          'group relative flex-1 transform-gpu rounded-xl px-6 py-4 text-sm font-semibold transition-all duration-300',
          'flex items-center justify-center gap-2 overflow-hidden',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black',

          // Buy button styles - dark theme
          value === 'BUY'
            ? [
                // Active state - orange gradient with glow for dark theme
                'bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700',
                'text-black shadow-lg shadow-orange-500/50',
                'border-2 border-orange-400',
                'hover:from-orange-400 hover:via-orange-500 hover:to-orange-600',
                'hover:scale-105 hover:shadow-xl hover:shadow-orange-500/60',
                'focus:ring-orange-500',
              ]
            : [
                // Inactive state - dark with orange accents
                'border-2 border-orange-200/30 bg-gray-800/50 backdrop-blur-sm',
                'text-orange-300 hover:text-orange-200',
                'hover:border-orange-300/50 hover:bg-gray-700/60',
                'hover:scale-102 hover:shadow-md',
                'focus:ring-orange-400',
              ],

          // Disabled state
          disabled &&
            'cursor-not-allowed opacity-50 hover:scale-100 hover:shadow-none'
        )}
      >
        {/* Content */}
        <div className="relative z-10 flex items-center gap-2">
          <BuyIcon
            size={18}
            strokeWidth={2.5}
            className={cn(
              'transition-transform duration-300 group-hover:scale-110',
              value === 'BUY' ? 'text-black' : 'text-orange-300'
            )}
          />
          <span className="font-bold tracking-wide">Kjøp</span>
        </div>

        {/* Shine effect */}
        <div
          className={cn(
            'absolute inset-0 opacity-0 transition-opacity duration-500',
            'bg-gradient-to-r from-transparent via-orange-300/20 to-transparent',
            'translate-x-[-100%] -skew-x-12 transform group-hover:translate-x-[100%] group-hover:opacity-100'
          )}
        />
      </button>

      {/* Sell Button - Dark Theme */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('SELL')}
        className={cn(
          // Base styles
          'group relative flex-1 transform-gpu rounded-xl px-6 py-4 text-sm font-semibold transition-all duration-300',
          'flex items-center justify-center gap-2 overflow-hidden',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black',

          // Sell button styles - dark theme with red accent
          value === 'SELL'
            ? [
                // Active state - red for sell but adapted to dark theme
                'bg-gradient-to-r from-red-600 via-red-700 to-red-800',
                'text-white shadow-lg shadow-red-600/50',
                'border-2 border-red-500',
                'hover:from-red-500 hover:via-red-600 hover:to-red-700',
                'hover:scale-105 hover:shadow-xl hover:shadow-red-600/60',
                'focus:ring-red-500',
              ]
            : [
                // Inactive state - dark with red accents
                'border-2 border-red-200/30 bg-gray-800/50 backdrop-blur-sm',
                'text-red-300 hover:text-red-200',
                'hover:border-red-300/50 hover:bg-gray-700/60',
                'hover:scale-102 hover:shadow-md',
                'focus:ring-red-400',
              ],

          // Disabled state
          disabled &&
            'cursor-not-allowed opacity-50 hover:scale-100 hover:shadow-none'
        )}
      >
        {/* Content */}
        <div className="relative z-10 flex items-center gap-2">
          <SellIcon
            size={18}
            strokeWidth={2.5}
            className={cn(
              'transition-transform duration-300 group-hover:scale-110',
              value === 'SELL' ? 'text-white' : 'text-red-300'
            )}
          />
          <span className="font-bold tracking-wide">Salg</span>
        </div>

        {/* Shine effect */}
        <div
          className={cn(
            'absolute inset-0 opacity-0 transition-opacity duration-500',
            'bg-gradient-to-r from-transparent via-red-300/20 to-transparent',
            'translate-x-[-100%] -skew-x-12 transform group-hover:translate-x-[100%] group-hover:opacity-100'
          )}
        />
      </button>
    </div>
  )
}
