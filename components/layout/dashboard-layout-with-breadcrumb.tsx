'use client'

import React, { ReactNode } from 'react'
import { SidebarNavigation } from './sidebar-navigation'
import { WireframeBreadcrumb } from '../ui/wireframe-breadcrumb'
import { cn } from '@/lib/utils'

interface DashboardLayoutWithBreadcrumbProps {
  children: ReactNode
  className?: string
}

/**
 * Enhanced Dashboard Layout with integrated WireframeBreadcrumb
 * 
 * This layout component demonstrates how to integrate the WireframeBreadcrumb
 * component into the LifeDash layout system according to wireframe specifications.
 */
export function DashboardLayoutWithBreadcrumb({ 
  children, 
  className 
}: DashboardLayoutWithBreadcrumbProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarNavigation />
      <div className={cn("ml-60", className)}>
        {/* Wireframe-compliant breadcrumb navigation */}
        <WireframeBreadcrumb />
        {children}
      </div>
    </div>
  )
}

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

/**
 * Dashboard Header - remains unchanged for compatibility
 */
export function DashboardHeader({ title, subtitle, actions }: DashboardHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

interface DashboardContentProps {
  children: ReactNode
  className?: string
}

/**
 * Dashboard Content - remains unchanged for compatibility
 */
export function DashboardContent({ children, className }: DashboardContentProps) {
  return (
    <main className={cn("p-6", className)}>
      {children}
    </main>
  )
}

// Export individual components for compatibility
export { DashboardLayoutWithBreadcrumb as DashboardLayout }