'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href: string
  isActive?: boolean
}

interface BreadcrumbsProps {
  className?: string
  separator?: React.ReactNode
  maxItems?: number
}

// Route configuration for breadcrumb labels
const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/analytics': 'Analytics',
  '/finance': 'Finance',
  '/finance/overview': 'Overview',
  '/finance/budgets': 'Budgets',
  '/finance/transactions': 'Transactions',
  '/health': 'Health',
  '/health/fitness': 'Fitness',
  '/health/sleep': 'Sleep',
  '/health/nutrition': 'Nutrition',
  '/goals': 'Goals',
  '/settings': 'Settings',
  '/settings/profile': 'Profile',
  '/settings/security': 'Security',
  '/settings/notifications': 'Notifications',
  '/settings/appearance': 'Appearance',
  '/settings/integrations': 'Integrations',
}

// Special route patterns for dynamic segments
const dynamicRoutes: Record<string, (segment: string) => string> = {
  '/goals/': (id: string) => `Goal ${id.slice(0, 8)}...`,
  '/finance/transactions/': (id: string) => `Transaction ${id.slice(0, 8)}...`,
  '/health/fitness/': (id: string) => `Workout ${id.slice(0, 8)}...`,
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  // Always start with Dashboard for authenticated routes
  if (segments.length > 0 && segments[0] !== 'auth') {
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/dashboard',
      isActive: pathname === '/dashboard',
    })
  }

  // Build breadcrumbs from segments
  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === segments.length - 1

    // Skip dashboard since we already added it
    if (currentPath === '/dashboard') {
      return
    }

    let label = routeLabels[currentPath]

    // Handle dynamic routes
    if (!label) {
      const parentPath = segments.slice(0, index + 1).join('/')
      const dynamicPattern = Object.keys(dynamicRoutes).find(pattern => 
        currentPath.startsWith(pattern.slice(0, -1))
      )
      
      if (dynamicPattern) {
        label = dynamicRoutes[dynamicPattern](segment)
      } else {
        // Fallback: capitalize and format the segment
        label = segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      }
    }

    breadcrumbs.push({
      label,
      href: currentPath,
      isActive: isLast,
    })
  })

  return breadcrumbs
}

export function Breadcrumbs({ 
  className, 
  separator,
  maxItems = 4 
}: BreadcrumbsProps) {
  const pathname = usePathname()
  const breadcrumbs = generateBreadcrumbs(pathname)

  // Don't show breadcrumbs for auth pages or single-level routes
  if (pathname.startsWith('/auth') || breadcrumbs.length <= 1) {
    return null
  }

  // Handle overflow by showing first item, ellipsis, and last few items
  let displayBreadcrumbs = breadcrumbs
  if (breadcrumbs.length > maxItems) {
    const firstItem = breadcrumbs[0]
    const lastItems = breadcrumbs.slice(-(maxItems - 2))
    displayBreadcrumbs = [
      firstItem,
      { label: '...', href: '', isActive: false },
      ...lastItems,
    ]
  }

  const defaultSeparator = (
    <svg
      className="w-4 h-4 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  )

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-2', className)}>
      <ol className="flex items-center space-x-2">
        {displayBreadcrumbs.map((item, index) => (
          <li key={`${item.href}-${index}`} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 flex-shrink-0">
                {separator || defaultSeparator}
              </span>
            )}
            
            {item.label === '...' ? (
              <span className="text-gray-500 text-sm">...</span>
            ) : item.isActive ? (
              <span className="text-sm font-medium text-gray-900 truncate max-w-32 md:max-w-48">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href as any}
                className={cn(
                  'text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors',
                  'truncate max-w-32 md:max-w-48',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-1'
                )}
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Utility function to set custom breadcrumb labels
export function setBreadcrumbLabel(path: string, label: string) {
  routeLabels[path] = label
}

// Hook to get current breadcrumbs for custom implementations
export function useBreadcrumbs() {
  const pathname = usePathname()
  return generateBreadcrumbs(pathname)
}