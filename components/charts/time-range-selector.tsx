'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Types
export interface TimeRange {
  value: string
  label: string
  days: number
  description: string
}

interface TimeRangeSelectorProps {
  selectedRange: string
  onRangeChange: (range: string) => void
  className?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'buttons' | 'tabs'
  disabled?: boolean
  customRanges?: TimeRange[]
}

// Default time ranges
const DEFAULT_TIME_RANGES: TimeRange[] = [
  {
    value: '1W',
    label: '1U',
    days: 7,
    description: 'Siste uke',
  },
  {
    value: '1M',
    label: '1M',
    days: 30,
    description: 'Siste måned',
  },
  {
    value: '3M',
    label: '3M',
    days: 90,
    description: 'Siste 3 måneder',
  },
  {
    value: '6M',
    label: '6M',
    days: 180,
    description: 'Siste 6 måneder',
  },
  {
    value: '1Y',
    label: '1Å',
    days: 365,
    description: 'Siste år',
  },
  {
    value: 'ALL',
    label: 'Alle',
    days: -1,
    description: 'Alle tider',
  },
]

// Button variant for time range selector
export const TimeRangeSelector = ({
  selectedRange,
  onRangeChange,
  className,
  size = 'default',
  variant = 'buttons',
  disabled = false,
  customRanges,
}: TimeRangeSelectorProps) => {
  const ranges = customRanges || DEFAULT_TIME_RANGES

  const getButtonSize = () => {
    switch (size) {
      case 'sm':
        return 'h-8 px-3 text-xs'
      case 'lg':
        return 'h-12 px-6 text-base'
      default:
        return 'h-10 px-4 text-sm'
    }
  }

  if (variant === 'tabs') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800',
          className
        )}
      >
        {ranges.map(range => (
          <button
            key={range.value}
            onClick={() => onRangeChange(range.value)}
            disabled={disabled}
            className={cn(
              'relative rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
              'hover:bg-white hover:shadow-sm dark:hover:bg-neutral-700',
              'focus:ring-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              selectedRange === range.value
                ? 'text-primary-600 dark:text-primary-400 bg-white shadow-sm dark:bg-neutral-700'
                : 'text-neutral-600 dark:text-neutral-400'
            )}
            title={range.description}
          >
            {range.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {ranges.map(range => (
        <Button
          key={range.value}
          variant={selectedRange === range.value ? 'primary' : 'ghost'}
          size={size}
          onClick={() => onRangeChange(range.value)}
          disabled={disabled}
          className={cn(
            getButtonSize(),
            'font-medium transition-all duration-200',
            selectedRange === range.value
              ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm'
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
          )}
          title={range.description}
        >
          {range.label}
        </Button>
      ))}
    </div>
  )
}

// Compact variant for mobile
export const CompactTimeRangeSelector = ({
  selectedRange,
  onRangeChange,
  className,
  disabled = false,
  customRanges,
}: Omit<TimeRangeSelectorProps, 'size' | 'variant'>) => {
  const ranges = customRanges || DEFAULT_TIME_RANGES
  const [isOpen, setIsOpen] = useState(false)

  const selectedRangeData = ranges.find(r => r.value === selectedRange)

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="h-8 px-3 text-xs"
      >
        {selectedRangeData?.label || 'Velg periode'}
        <svg
          className={cn(
            'ml-2 h-4 w-4 transition-transform',
            isOpen && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          {ranges.map(range => (
            <button
              key={range.value}
              onClick={() => {
                onRangeChange(range.value)
                setIsOpen(false)
              }}
              className={cn(
                'w-full px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800',
                'first:rounded-t-lg last:rounded-b-lg',
                selectedRange === range.value &&
                  'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{range.label}</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {range.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Hook for time range logic
export const useTimeRange = (initialRange: string = '1M') => {
  const [selectedRange, setSelectedRange] = useState(initialRange)

  const getRangeData = (range: string): TimeRange | undefined => {
    return DEFAULT_TIME_RANGES.find(r => r.value === range)
  }

  const getDateRange = (range: string): { startDate: Date; endDate: Date } => {
    const endDate = new Date()
    let startDate = new Date()

    const rangeData = getRangeData(range)
    if (rangeData && rangeData.days > 0) {
      startDate = new Date(
        endDate.getTime() - rangeData.days * 24 * 60 * 60 * 1000
      )
    } else if (range === 'ALL') {
      // Set to a very early date for "ALL"
      startDate = new Date('2000-01-01')
    }

    return { startDate, endDate }
  }

  const handleRangeChange = (range: string) => {
    setSelectedRange(range)
  }

  return {
    selectedRange,
    setSelectedRange: handleRangeChange,
    getRangeData,
    getDateRange,
  }
}

// Utility function to format time range for display
export const formatTimeRangeDescription = (range: string): string => {
  const rangeData = DEFAULT_TIME_RANGES.find(r => r.value === range)
  return rangeData?.description || 'Ukjent periode'
}

// Export default time ranges for use in other components
export { DEFAULT_TIME_RANGES }

export default TimeRangeSelector
