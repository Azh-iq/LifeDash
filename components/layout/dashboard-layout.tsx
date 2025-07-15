'use client'

import React, { ReactNode } from 'react'
import { SidebarNavigation } from './sidebar-navigation'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: ReactNode
  className?: string
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarNavigation />
      <div className={cn("ml-60", className)}>
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

export function DashboardContent({ children, className }: DashboardContentProps) {
  return (
    <main className={cn("p-6", className)}>
      {children}
    </main>
  )
}