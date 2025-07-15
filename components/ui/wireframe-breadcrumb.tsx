'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href: string
  isActive?: boolean
}

interface WireframeBreadcrumbProps {
  /**
   * Custom breadcrumb items. If not provided, will auto-generate from pathname
   */
  items?: BreadcrumbItem[]
  /**
   * Custom class name for the breadcrumb container
   */
  className?: string
  /**
   * Custom route mappings for Norwegian labels
   */
  routeMap?: Record<string, string>
  /**
   * Custom separator between breadcrumb items
   */
  separator?: string
  /**
   * Click handler for breadcrumb items
   */
  onItemClick?: (item: BreadcrumbItem) => void
}

// Default Norwegian route mappings based on wireframe requirements
const DEFAULT_ROUTE_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  investments: 'Investeringer',
  investeringer: 'Investeringer',
  stocks: 'Aksjer',
  aksjer: 'Aksjer',
  portfolio: 'Portefølje',
  transactions: 'Transaksjoner',
  settings: 'Innstillinger',
  tools: 'Verktøy',
  reports: 'Rapporter',
  analysis: 'Analyse',
  holdings: 'Beholdninger',
  performance: 'Ytelse',
  alerts: 'Varsler',
  profile: 'Profil',
}

/**
 * Generate breadcrumb items from pathname
 */
const generateBreadcrumbItems = (
  pathname: string,
  routeMap: Record<string, string>
): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = []
  const pathParts = pathname.split('/').filter(Boolean)
  
  // Always start with Dashboard
  items.push({
    label: 'Dashboard',
    href: '/dashboard',
    isActive: pathParts.length === 0 || (pathParts.length === 1 && pathParts[0] === 'dashboard')
  })

  // Build breadcrumb items from path parts
  let currentPath = ''
  pathParts.forEach((part, index) => {
    // Skip 'dashboard' as it's already added
    if (part === 'dashboard') return
    
    currentPath += `/${part}`
    const isLast = index === pathParts.length - 1
    
    // Get Norwegian label from route map or capitalize the part
    const label = routeMap[part] || part.charAt(0).toUpperCase() + part.slice(1)
    
    items.push({
      label,
      href: currentPath,
      isActive: isLast
    })
  })

  return items
}

/**
 * Wireframe-compliant breadcrumb component
 * 
 * Matches the exact styling from wireframes:
 * - Background: white
 * - Padding: 12px 24px
 * - Border-bottom: 1px solid #e5e7eb
 * - Font-size: 14px
 * - Color: #6b7280 for links, #6366f1 for current page
 */
const WireframeBreadcrumb = React.forwardRef<
  HTMLDivElement,
  WireframeBreadcrumbProps
>(({ 
  items, 
  className, 
  routeMap = DEFAULT_ROUTE_MAP,
  separator = ' › ',
  onItemClick 
}, ref) => {
  const pathname = usePathname()
  
  // Generate breadcrumb items if not provided
  const breadcrumbItems = React.useMemo(() => {
    if (items) return items
    return generateBreadcrumbItems(pathname, routeMap)
  }, [items, pathname, routeMap])

  const handleItemClick = React.useCallback((item: BreadcrumbItem) => {
    if (onItemClick) {
      onItemClick(item)
    }
  }, [onItemClick])

  return (
    <div
      ref={ref}
      className={cn(
        // Exact wireframe styling
        'bg-white',
        'px-6 py-3', // 12px 24px padding
        'border-b border-gray-200', // 1px solid #e5e7eb
        'text-sm', // 14px font-size
        'text-gray-500', // #6b7280 base color
        className
      )}
    >
      <nav 
        aria-label="Breadcrumb navigation"
        className="flex items-center space-x-1"
      >
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.href}>
            {item.isActive ? (
              <span
                className={cn(
                  'text-indigo-600 font-semibold', // #6366f1 for active item
                  'cursor-default'
                )}
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'text-gray-500 hover:text-indigo-600', // #6b7280 → #6366f1 on hover
                  'transition-colors duration-200',
                  'no-underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-sm'
                )}
              >
                {item.label}
              </Link>
            )}
            
            {/* Separator */}
            {index < breadcrumbItems.length - 1 && (
              <span 
                className="text-gray-400 select-none" 
                aria-hidden="true"
              >
                {separator}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  )
})

WireframeBreadcrumb.displayName = 'WireframeBreadcrumb'

export { WireframeBreadcrumb, generateBreadcrumbItems }
export type { BreadcrumbItem, WireframeBreadcrumbProps }