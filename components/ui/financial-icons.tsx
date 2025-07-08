'use client'

import { 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  CreditCard, 
  Banknote, 
  Receipt, 
  DollarSign,
  Euro,
  PieChart,
  BarChart3,
  Wallet,
  Building2,
  Calendar,
  Search,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Target,
  TrendingDown as TrendingDownIcon,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Financial icon mapping for easy access
export const FinancialIcons = {
  // Transaction types
  buy: TrendingUp,
  sell: TrendingDown,
  profit: ArrowUpRight,
  loss: ArrowDownRight,
  
  // Financial instruments
  calculator: Calculator,
  creditCard: CreditCard,
  banknote: Banknote,
  receipt: Receipt,
  wallet: Wallet,
  
  // Currencies
  dollar: DollarSign,
  euro: Euro,
  nok: Banknote, // Norwegian Krone
  
  // Analytics
  pieChart: PieChart,
  barChart: BarChart3,
  percent: Percent,
  target: Target,
  
  // UI elements
  building: Building2,
  calendar: Calendar,
  search: Search,
  plus: Plus,
  minus: Minus,
  
  // Status indicators
  success: CheckCircle,
  warning: AlertCircle,
  info: Info,
} as const

interface FinancialIconProps {
  name: keyof typeof FinancialIcons
  className?: string
  size?: number
  strokeWidth?: number
}

export function FinancialIcon({ 
  name, 
  className, 
  size = 20, 
  strokeWidth = 2 
}: FinancialIconProps) {
  const IconComponent = FinancialIcons[name]
  
  return (
    <IconComponent 
      size={size} 
      strokeWidth={strokeWidth}
      className={cn("text-current", className)} 
    />
  )
}

// Specialized financial icon components with animations
interface AnimatedFinancialIconProps {
  className?: string
  size?: number
  strokeWidth?: number
}

export function BuyIcon({ className, size = 20, strokeWidth = 2 }: AnimatedFinancialIconProps) {
  return (
    <TrendingUp 
      size={size} 
      strokeWidth={strokeWidth}
      className={cn(
        "text-green-600 transition-all duration-300 hover:scale-110 hover:text-green-500",
        className
      )} 
    />
  )
}

export function SellIcon({ className, size = 20, strokeWidth = 2 }: AnimatedFinancialIconProps) {
  return (
    <TrendingDown 
      size={size} 
      strokeWidth={strokeWidth}
      className={cn(
        "text-red-600 transition-all duration-300 hover:scale-110 hover:text-red-500",
        className
      )} 
    />
  )
}

export function CalculatorIcon({ className, size = 20, strokeWidth = 2 }: AnimatedFinancialIconProps) {
  return (
    <Calculator 
      size={size} 
      strokeWidth={strokeWidth}
      className={cn(
        "text-purple-600 transition-all duration-300 hover:scale-110 hover:text-purple-500",
        className
      )} 
    />
  )
}

export function CurrencyIcon({ 
  currency, 
  className, 
  size = 16, 
  strokeWidth = 2 
}: { 
  currency: string
  className?: string
  size?: number
  strokeWidth?: number
}) {
  const getCurrencyIcon = (curr: string): LucideIcon => {
    switch (curr.toUpperCase()) {
      case 'USD': return DollarSign
      case 'EUR': return Euro
      case 'NOK': 
      default: return Banknote
    }
  }
  
  const IconComponent = getCurrencyIcon(currency)
  
  return (
    <IconComponent 
      size={size} 
      strokeWidth={strokeWidth}
      className={cn(
        "text-gray-600 transition-all duration-200 hover:text-gray-800",
        className
      )} 
    />
  )
}

export function StatusIcon({ 
  status, 
  className, 
  size = 16, 
  strokeWidth = 2 
}: { 
  status: 'success' | 'warning' | 'error' | 'info'
  className?: string
  size?: number
  strokeWidth?: number
}) {
  const getStatusIcon = (status: string): LucideIcon => {
    switch (status) {
      case 'success': return CheckCircle
      case 'warning': return AlertCircle
      case 'error': return AlertCircle
      case 'info': return Info
      default: return Info
    }
  }
  
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      case 'info': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }
  
  const IconComponent = getStatusIcon(status)
  
  return (
    <IconComponent 
      size={size} 
      strokeWidth={strokeWidth}
      className={cn(
        getStatusColor(status),
        "transition-all duration-200",
        className
      )} 
    />
  )
}

// Enhanced icon with floating animation
export function FloatingIcon({ 
  icon: Icon, 
  className, 
  size = 20, 
  strokeWidth = 2 
}: { 
  icon: LucideIcon
  className?: string
  size?: number
  strokeWidth?: number
}) {
  return (
    <Icon 
      size={size} 
      strokeWidth={strokeWidth}
      className={cn(
        "animate-bounce transition-all duration-500 hover:scale-110",
        className
      )} 
    />
  )
}

export default FinancialIcon