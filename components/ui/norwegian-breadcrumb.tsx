'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home,
  TrendingUp,
  PieChart,
  Settings,
  DollarSign,
  Wrench,
  Heart,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb'

interface BreadcrumbSegment {
  label: string
  href: string
  icon?: React.ElementType
  isActive?: boolean
}

interface NorwegianBreadcrumbProps {
  className?: string
  maxItems?: number
  showIcons?: boolean
  showHomeIcon?: boolean
  enableHoverEffects?: boolean
  customRoutes?: Record<string, { label: string; icon?: React.ElementType }>
  onBreadcrumbClick?: (href: string, segment: BreadcrumbSegment) => void
}

// Norwegian route mapping with icons
const NORWEGIAN_ROUTES: Record<
  string,
  { label: string; icon?: React.ElementType }
> = {
  '': { label: 'Dashboard', icon: Home },
  dashboard: { label: 'Dashboard', icon: Home },
  investments: { label: 'Investeringer', icon: TrendingUp },
  stocks: { label: 'Aksjer', icon: TrendingUp },
  portfolio: { label: 'Portefølje', icon: PieChart },
  economy: { label: 'Økonomi', icon: DollarSign },
  tools: { label: 'Verktøy', icon: Wrench },
  hobby: { label: 'Hobby prosjekter', icon: Heart },
  settings: { label: 'Innstillinger', icon: Settings },
  setup: { label: 'Oppsett', icon: Settings },
  analysis: { label: 'Analyse', icon: TrendingUp },
  transactions: { label: 'Transaksjoner', icon: DollarSign },
  performance: { label: 'Ytelse', icon: TrendingUp },
  holdings: { label: 'Beholdninger', icon: PieChart },
  reports: { label: 'Rapporter', icon: TrendingUp },
  alerts: { label: 'Varsler', icon: Settings },
  profile: { label: 'Profil', icon: Settings },
}

// Animation variants for smooth transitions
const breadcrumbVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
}

const iconVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  hover: { scale: 1.1, rotate: 5 },
}

// Responsive breadcrumb item with hover effects
const BreadcrumbItemWithHover = React.forwardRef<
  HTMLLIElement,
  {
    segment: BreadcrumbSegment
    showIcon?: boolean
    enableHoverEffects?: boolean
    onClick?: (href: string, segment: BreadcrumbSegment) => void
    className?: string
  }
>(
  (
    { segment, showIcon = true, enableHoverEffects = true, onClick, className },
    ref
  ) => {
    const Icon = segment.icon

    const handleClick = React.useCallback(
      (e: React.MouseEvent) => {
        if (onClick && !segment.isActive) {
          e.preventDefault()
          onClick(segment.href, segment)
        }
      },
      [onClick, segment]
    )

    return (
      <BreadcrumbItem ref={ref} className={cn('group', className)}>
        {segment.isActive ? (
          <BreadcrumbPage className="flex items-center gap-2 font-medium text-purple-600">
            {showIcon && Icon && (
              <motion.div
                variants={iconVariants}
                initial="initial"
                animate="animate"
                className="flex-shrink-0"
              >
                <Icon className="h-4 w-4" />
              </motion.div>
            )}
            <span className="truncate">{segment.label}</span>
          </BreadcrumbPage>
        ) : (
          <BreadcrumbLink
            href={segment.href}
            onClick={handleClick}
            className={cn(
              'flex items-center gap-2 transition-all duration-200',
              'text-gray-600 hover:text-purple-600',
              enableHoverEffects &&
                'group-hover:translate-x-0.5 group-hover:scale-105',
              'rounded-md px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
            )}
          >
            {showIcon && Icon && (
              <motion.div
                variants={iconVariants}
                initial="initial"
                animate="animate"
                whileHover={enableHoverEffects ? 'hover' : undefined}
                className="flex-shrink-0"
              >
                <Icon className="h-4 w-4" />
              </motion.div>
            )}
            <span className="truncate font-medium">{segment.label}</span>
          </BreadcrumbLink>
        )}
      </BreadcrumbItem>
    )
  }
)

BreadcrumbItemWithHover.displayName = 'BreadcrumbItemWithHover'

// Mobile-optimized breadcrumb with collapse functionality
const MobileBreadcrumb = React.forwardRef<
  HTMLElement,
  {
    segments: BreadcrumbSegment[]
    showIcons?: boolean
    onBreadcrumbClick?: (href: string, segment: BreadcrumbSegment) => void
    className?: string
  }
>(({ segments, showIcons = false, onBreadcrumbClick, className }, ref) => {
  const [isExpanded, setIsExpanded] = React.useState(false)

  if (segments.length <= 2) {
    return (
      <Breadcrumb ref={ref} className={cn('md:hidden', className)}>
        <BreadcrumbList className="flex-wrap gap-1">
          {segments.map((segment, index) => (
            <React.Fragment key={segment.href}>
              <BreadcrumbItemWithHover
                segment={segment}
                showIcon={showIcons}
                enableHoverEffects={false}
                onClick={onBreadcrumbClick}
              />
              {index < segments.length - 1 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3 w-3" />
                </BreadcrumbSeparator>
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  const visibleSegments = isExpanded
    ? segments
    : [segments[0], segments[segments.length - 1]]
  const hasHiddenSegments = segments.length > 2

  return (
    <Breadcrumb ref={ref} className={cn('md:hidden', className)}>
      <BreadcrumbList className="flex-wrap gap-1">
        {!isExpanded && hasHiddenSegments && (
          <>
            <BreadcrumbItemWithHover
              segment={segments[0]}
              showIcon={showIcons}
              enableHoverEffects={false}
              onClick={onBreadcrumbClick}
            />
            <BreadcrumbSeparator>
              <ChevronRight className="h-3 w-3" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <button
                onClick={() => setIsExpanded(true)}
                className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                aria-label="Vis alle brødsmule-ledd"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3 w-3" />
            </BreadcrumbSeparator>
          </>
        )}

        {visibleSegments.map((segment, index) => {
          const isLast = index === visibleSegments.length - 1
          const shouldShowSeparator =
            !isLast && (isExpanded || !hasHiddenSegments)

          return (
            <React.Fragment key={segment.href}>
              <BreadcrumbItemWithHover
                segment={segment}
                showIcon={showIcons}
                enableHoverEffects={false}
                onClick={onBreadcrumbClick}
              />
              {shouldShowSeparator && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3 w-3" />
                </BreadcrumbSeparator>
              )}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
})

MobileBreadcrumb.displayName = 'MobileBreadcrumb'

// Main Norwegian breadcrumb component
const NorwegianBreadcrumb = React.forwardRef<
  HTMLElement,
  NorwegianBreadcrumbProps
>(
  (
    {
      className,
      maxItems = 5,
      showIcons = true,
      showHomeIcon = true,
      enableHoverEffects = true,
      customRoutes,
      onBreadcrumbClick,
    },
    ref
  ) => {
    const pathname = usePathname()
    const segments = generateBreadcrumbSegments(pathname, customRoutes)

    // Apply maxItems limit for desktop
    const visibleSegments = React.useMemo(() => {
      if (segments.length <= maxItems) {
        return segments
      }

      // Keep first item (dashboard) and last few items
      const keepCount = maxItems - 1
      const firstSegment = segments[0]
      const lastSegments = segments.slice(-keepCount)

      return [firstSegment, ...lastSegments]
    }, [segments, maxItems])

    const hasHiddenSegments = segments.length > maxItems

    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {/* Desktop breadcrumb */}
        <Breadcrumb ref={ref} className="hidden md:flex">
          <BreadcrumbList className="flex-wrap gap-1.5">
            {hasHiddenSegments && (
              <>
                <BreadcrumbItemWithHover
                  segment={segments[0]}
                  showIcon={showIcons && showHomeIcon}
                  enableHoverEffects={enableHoverEffects}
                  onClick={onBreadcrumbClick}
                />
                <BreadcrumbSeparator className="text-purple-300">
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbEllipsis className="text-purple-400 hover:text-purple-600" />
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-purple-300">
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              </>
            )}

            {visibleSegments
              .slice(hasHiddenSegments ? 1 : 0)
              .map((segment, index) => {
                const isLast =
                  index ===
                  visibleSegments.slice(hasHiddenSegments ? 1 : 0).length - 1
                const shouldShowIcon =
                  showIcons && (showHomeIcon || segment.href !== '/dashboard')

                return (
                  <React.Fragment key={segment.href}>
                    <motion.div
                      variants={breadcrumbVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ delay: index * 0.1 }}
                    >
                      <BreadcrumbItemWithHover
                        segment={segment}
                        showIcon={shouldShowIcon}
                        enableHoverEffects={enableHoverEffects}
                        onClick={onBreadcrumbClick}
                      />
                    </motion.div>
                    {!isLast && (
                      <BreadcrumbSeparator className="text-purple-300">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.05 }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </motion.div>
                      </BreadcrumbSeparator>
                    )}
                  </React.Fragment>
                )
              })}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Mobile breadcrumb */}
        <MobileBreadcrumb
          segments={segments}
          showIcons={showIcons && showHomeIcon}
          onBreadcrumbClick={onBreadcrumbClick}
          className={className}
        />
      </div>
    )
  }
)

NorwegianBreadcrumb.displayName = 'NorwegianBreadcrumb'

export { NorwegianBreadcrumb }
export type { BreadcrumbSegment, NorwegianBreadcrumbProps }

// Utility function to generate breadcrumb segments manually
export const generateBreadcrumbSegments = (
  pathname: string,
  customRoutes?: Record<string, { label: string; icon?: React.ElementType }>
): BreadcrumbSegment[] => {
  const segments: BreadcrumbSegment[] = []
  const pathParts = pathname.split('/').filter(Boolean)

  // Always add dashboard as root
  segments.push({
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  })

  // Build segments from path parts
  let currentPath = ''

  pathParts.forEach((part, index) => {
    currentPath += `/${part}`
    const isLast = index === pathParts.length - 1

    // Get route info from custom routes or default mapping
    const routeInfo = customRoutes?.[part] || NORWEGIAN_ROUTES[part]

    if (routeInfo) {
      segments.push({
        label: routeInfo.label,
        href: currentPath,
        icon: routeInfo.icon,
        isActive: isLast,
      })
    } else {
      // Fallback for unknown routes - capitalize and clean up
      const cleanLabel = part
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      segments.push({
        label: cleanLabel,
        href: currentPath,
        isActive: isLast,
      })
    }
  })

  return segments
}

// Hook for using breadcrumb segments in other components
export const useBreadcrumbSegments = (
  pathname: string,
  customRoutes?: Record<string, { label: string; icon?: React.ElementType }>
): BreadcrumbSegment[] => {
  return React.useMemo(() => {
    return generateBreadcrumbSegments(pathname, customRoutes)
  }, [pathname, customRoutes])
}
