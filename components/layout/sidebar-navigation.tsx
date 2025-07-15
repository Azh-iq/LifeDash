'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Home, 
  BarChart3, 
  CreditCard, 
  TrendingUp, 
  Link as LinkIcon, 
  Settings,
  LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SidebarNavigationProps {
  className?: string
}

export function SidebarNavigation({ className }: SidebarNavigationProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      emoji: '🏠'
    },
    {
      title: 'Oversikt',
      href: '/investments',
      icon: BarChart3,
      emoji: '📊'
    },
    {
      title: 'Beholdninger',
      href: '/investments/stocks',
      icon: TrendingUp,
      emoji: '💰'
    },
    {
      title: 'Transaksjoner',
      href: '/transactions',
      icon: CreditCard,
      emoji: '💸'
    },
    {
      title: 'Analyse',
      href: '/analysis',
      icon: TrendingUp,
      emoji: '📈'
    },
    {
      title: 'Tilkoblinger',
      href: '/investments/connections',
      icon: LinkIcon,
      emoji: '🔗'
    },
    {
      title: 'Innstillinger',
      href: '/settings',
      icon: Settings,
      emoji: '⚙️'
    }
  ]

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200 z-50",
      className
    )}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-6 py-6">
          <div className="text-xl font-bold text-gray-900">
            Portfolio Manager
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-brand-500 text-white" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <span className="text-base">{item.emoji}</span>
                    <span>{item.title}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Sign Out Button */}
        <div className="p-3">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 w-full"
          >
            <LogOut className="h-4 w-4" />
            <span>Logg ut</span>
          </button>
        </div>
      </div>
    </div>
  )
}