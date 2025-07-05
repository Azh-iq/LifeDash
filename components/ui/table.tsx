'use client'

import React, { forwardRef, useState, useMemo } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const tableVariants = cva('w-full caption-bottom text-sm border-collapse', {
  variants: {
    variant: {
      default: 'border-neutral-200 dark:border-neutral-700',
      bordered: 'border border-neutral-200 dark:border-neutral-700',
      striped: 'border-neutral-200 dark:border-neutral-700',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const Table = forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & VariantProps<typeof tableVariants>
>(({ className, variant, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn(tableVariants({ variant }), className)}
      {...props}
    />
  </div>
))
Table.displayName = 'Table'

const TableHeader = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      'border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900',
      className
    )}
    {...props}
  />
))
TableHeader.displayName = 'TableHeader'

const TableBody = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      'divide-y divide-neutral-200 dark:divide-neutral-700',
      className
    )}
    {...props}
  />
))
TableBody.displayName = 'TableBody'

const TableFooter = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t border-neutral-200 bg-neutral-50 font-medium dark:border-neutral-700 dark:bg-neutral-900',
      className
    )}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

const TableRow = forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    clickable?: boolean
    selected?: boolean
  }
>(({ className, clickable, selected, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'transition-colors duration-200',
      clickable &&
        'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800',
      selected && 'bg-primary-50 dark:bg-primary-900/20',
      className
    )}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

const TableHead = forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    sortable?: boolean
    sortDirection?: 'asc' | 'desc' | null
    onSort?: () => void
  }
>(({ className, sortable, sortDirection, onSort, children, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-medium text-neutral-700 dark:text-neutral-300',
      sortable &&
        'cursor-pointer select-none hover:text-neutral-900 dark:hover:text-neutral-100',
      className
    )}
    onClick={sortable ? onSort : undefined}
    {...props}
  >
    <div className="flex items-center gap-2">
      {children}
      {sortable && (
        <div className="flex flex-col">
          <svg
            className={cn(
              'h-3 w-3 transition-colors duration-200',
              sortDirection === 'asc' ? 'text-primary-600' : 'text-neutral-400'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
          <svg
            className={cn(
              '-mt-1 h-3 w-3 transition-colors duration-200',
              sortDirection === 'desc' ? 'text-primary-600' : 'text-neutral-400'
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
        </div>
      )}
    </div>
  </th>
))
TableHead.displayName = 'TableHead'

const TableCell = forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    numeric?: boolean
  }
>(({ className, numeric, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'p-4 align-middle text-neutral-900 dark:text-neutral-100',
      numeric && 'text-right tabular-nums',
      className
    )}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn(
      'mt-4 text-sm text-neutral-500 dark:text-neutral-400',
      className
    )}
    {...props}
  />
))
TableCaption.displayName = 'TableCaption'

// Sortable Table Hook
type SortConfig = {
  key: string
  direction: 'asc' | 'desc'
}

export function useSortableTable<T extends Record<string, any>>(
  data: T[],
  initialSort?: SortConfig
) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(
    initialSort || null
  )

  const sortedData = useMemo(() => {
    if (!sortConfig) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [data, sortConfig])

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const getSortDirection = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null
    return sortConfig.direction
  }

  return {
    sortedData,
    requestSort,
    getSortDirection,
    sortConfig,
  }
}

// Financial Table Component
interface FinancialTableProps<T extends Record<string, any>> {
  data: T[]
  columns: Array<{
    key: string
    label: string
    sortable?: boolean
    numeric?: boolean
    render?: (value: any, row: T) => React.ReactNode
  }>
  caption?: string
  onRowClick?: (row: T) => void
  selectedRows?: Set<string>
  onRowSelect?: (rowId: string) => void
  loading?: boolean
  emptyMessage?: string
}

export function FinancialTable<T extends Record<string, any>>({
  data,
  columns,
  caption,
  onRowClick,
  selectedRows,
  onRowSelect,
  loading = false,
  emptyMessage = 'No data available',
}: FinancialTableProps<T>) {
  const { sortedData, requestSort, getSortDirection } = useSortableTable(data)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="mb-4 h-12 rounded bg-neutral-200 dark:bg-neutral-700" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="mb-2 h-16 rounded bg-neutral-100 dark:bg-neutral-800"
            />
          ))}
        </div>
      </div>
    )
  }

  if (sortedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg
          className="mb-4 h-12 w-12 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-neutral-500 dark:text-neutral-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map(column => (
            <TableHead
              key={column.key}
              sortable={column.sortable}
              sortDirection={getSortDirection(column.key)}
              onSort={() => column.sortable && requestSort(column.key)}
            >
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((row, index) => (
          <TableRow
            key={row.id || index}
            clickable={!!onRowClick}
            selected={selectedRows?.has(row.id)}
            onClick={() => onRowClick?.(row)}
          >
            {columns.map(column => (
              <TableCell key={column.key} numeric={column.numeric}>
                {column.render
                  ? column.render(row[column.key], row)
                  : row[column.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
      {caption && <TableCaption>{caption}</TableCaption>}
    </Table>
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  tableVariants,
}
