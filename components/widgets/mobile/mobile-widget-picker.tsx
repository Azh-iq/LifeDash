'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Plus,
  TrendingUp,
  Bitcoin,
  Palette,
  MoreHorizontal,
  Star,
  Filter,
  X,
  ChevronRight,
  Smartphone,
  Tablet,
  Monitor,
  Zap,
  Eye,
  Settings,
  Clock,
  Users,
  Award,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useResponsiveLayout } from '@/lib/hooks/use-responsive-layout'
import { WidgetType, WidgetCategory, WidgetSize } from '../widget-types'

interface MobileWidgetPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWidgetSelect: (widgetType: WidgetType) => void
  maxWidgets: number
  currentWidgetCount: number
}

// Widget definitions for mobile
const mobileWidgets: Record<
  WidgetType,
  {
    id: WidgetType
    name: string
    description: string
    category: WidgetCategory
    size: WidgetSize
    icon: React.ComponentType<any>
    features: string[]
    mobileOptimized: boolean
    popularity: number
    new: boolean
    premium: boolean
  }
> = {
  'stock-chart': {
    id: 'stock-chart',
    name: 'Aksjekart',
    description: 'Interaktivt aksjekart med tekniske indikatorer',
    category: 'stocks',
    size: 'large',
    icon: TrendingUp,
    features: ['Real-time priser', 'Tekniske indikatorer', 'Zoom og pan'],
    mobileOptimized: true,
    popularity: 95,
    new: false,
    premium: false,
  },
  'portfolio-performance': {
    id: 'portfolio-performance',
    name: 'Portfolio Ytelse',
    description: 'Oversikt over porteføljens ytelse og statistikk',
    category: 'stocks',
    size: 'medium',
    icon: TrendingUp,
    features: ['Avkastning', 'Volatilitet', 'Sharpe ratio'],
    mobileOptimized: true,
    popularity: 90,
    new: false,
    premium: false,
  },
  'holdings-table': {
    id: 'holdings-table',
    name: 'Beholdninger',
    description: 'Tabell over alle dine aksjebeholdninger',
    category: 'stocks',
    size: 'large',
    icon: Eye,
    features: ['Sortérbar tabell', 'Søk og filter', 'Eksport'],
    mobileOptimized: true,
    popularity: 85,
    new: false,
    premium: false,
  },
  'stock-news': {
    id: 'stock-news',
    name: 'Aksjenyheter',
    description: 'Siste nyheter om dine aksjer',
    category: 'stocks',
    size: 'medium',
    icon: Users,
    features: ['Personaliserte nyheter', 'Sentiment analyse', 'Favoritter'],
    mobileOptimized: true,
    popularity: 80,
    new: true,
    premium: false,
  },
  'crypto-tracker': {
    id: 'crypto-tracker',
    name: 'Krypto Tracker',
    description: 'Følg kryptovalutaer og DeFi posisjoner',
    category: 'crypto',
    size: 'medium',
    icon: Bitcoin,
    features: ['Real-time priser', 'DeFi protokoller', 'Yield farming'],
    mobileOptimized: true,
    popularity: 75,
    new: false,
    premium: false,
  },
  'art-portfolio': {
    id: 'art-portfolio',
    name: 'Kunst Portfolio',
    description: 'Spor verdien av kunstsamlingen din',
    category: 'art',
    size: 'large',
    icon: Palette,
    features: ['Verdsettelse', 'Markedsanalyse', 'Galleri visning'],
    mobileOptimized: false,
    popularity: 60,
    new: false,
    premium: true,
  },
  'market-overview': {
    id: 'market-overview',
    name: 'Markedsoversikt',
    description: 'Oversikt over globale markeder',
    category: 'stocks',
    size: 'hero',
    icon: TrendingUp,
    features: ['Globale indekser', 'Sektorer', 'Heatmap'],
    mobileOptimized: true,
    popularity: 70,
    new: false,
    premium: false,
  },
  'quick-stats': {
    id: 'quick-stats',
    name: 'Hurtigstatistikk',
    description: 'Viktige nøkkeltall for porteføljen',
    category: 'stocks',
    size: 'small',
    icon: Zap,
    features: ['Totalt verdi', 'Daglig endring', 'Ytelse'],
    mobileOptimized: true,
    popularity: 88,
    new: false,
    premium: false,
  },
  watchlist: {
    id: 'watchlist',
    name: 'Overvåkningsliste',
    description: 'Følg med på aksjer du vurderer',
    category: 'stocks',
    size: 'medium',
    icon: Star,
    features: ['Prisalarmer', 'Notater', 'Teknisk analyse'],
    mobileOptimized: true,
    popularity: 82,
    new: false,
    premium: false,
  },
  'recent-transactions': {
    id: 'recent-transactions',
    name: 'Siste Transaksjoner',
    description: 'Oversikt over nylige kjøp og salg',
    category: 'stocks',
    size: 'medium',
    icon: Clock,
    features: ['Transaksjonslogg', 'Kategorisering', 'Eksport'],
    mobileOptimized: true,
    popularity: 78,
    new: false,
    premium: false,
  },
}

// Category information
const categories = {
  stocks: {
    name: 'Aksjer',
    icon: TrendingUp,
    color: 'bg-blue-100 text-blue-800',
    description: 'Widgets for aksjehandel og analyse',
  },
  crypto: {
    name: 'Krypto',
    icon: Bitcoin,
    color: 'bg-amber-100 text-amber-800',
    description: 'Kryptovaluta og DeFi widgets',
  },
  art: {
    name: 'Kunst',
    icon: Palette,
    color: 'bg-pink-100 text-pink-800',
    description: 'Kunst og samleobjekter',
  },
  other: {
    name: 'Annet',
    icon: MoreHorizontal,
    color: 'bg-green-100 text-green-800',
    description: 'Andre investeringstyper',
  },
}

// Size information
const sizes = {
  small: { name: 'Liten', description: 'Kompakt widget', icon: '1x1' },
  medium: { name: 'Medium', description: 'Standard størrelse', icon: '2x2' },
  large: { name: 'Stor', description: 'Utvidet widget', icon: '3x2' },
  hero: { name: 'Hero', description: 'Stor fremhevet widget', icon: '4x2' },
}

// Norwegian translations
const translations = {
  title: 'Legg til Widget',
  description: 'Velg en widget for å tilpasse ditt dashboard',
  search: 'Søk widgets...',
  categories: 'Kategorier',
  popular: 'Populære',
  new: 'Nye',
  all: 'Alle',
  filter: 'Filter',
  clearFilter: 'Fjern filter',
  addWidget: 'Legg til',
  preview: 'Forhåndsvisning',
  features: 'Funksjoner',
  mobileOptimized: 'Mobile optimert',
  premium: 'Premium',
  free: 'Gratis',
  popularity: 'Popularitet',
  noResults: 'Ingen resultater',
  noResultsDesc: 'Prøv å endre søket eller filteret',
  maxWidgetsReached: 'Maksimalt antall widgets nådd',
  deviceCompatibility: 'Enhetskompatibilitet',
  touchOptimized: 'Berøringsoptimert',
  gestureSupport: 'Bevegelssstøtte',
  responsive: 'Responsiv',
  loading: 'Laster...',
  error: 'Feil ved lasting av widgets',
}

/**
 * Mobile Widget Picker Component
 *
 * Features:
 * - Touch-optimized widget selection
 * - Category-based browsing
 * - Search and filtering
 * - Mobile-specific widget recommendations
 * - Device compatibility indicators
 * - Gesture-friendly interface
 * - Preview functionality
 * - Feature highlights
 */
export function MobileWidgetPicker({
  open,
  onOpenChange,
  onWidgetSelect,
  maxWidgets,
  currentWidgetCount,
}: MobileWidgetPickerProps) {
  const { isMobile, isTablet, isDesktop, isTouch } = useResponsiveLayout()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<
    WidgetCategory | 'all'
  >('all')
  const [selectedSize, setSelectedSize] = useState<WidgetSize | 'all'>('all')
  const [sortBy, setSortBy] = useState<'popularity' | 'name' | 'new'>(
    'popularity'
  )
  const [showMobileOnly, setShowMobileOnly] = useState(isMobile)

  const canAddMoreWidgets = currentWidgetCount < maxWidgets

  // Filter and sort widgets
  const filteredWidgets = useMemo(() => {
    let widgets = Object.values(mobileWidgets)

    // Search filter
    if (searchTerm) {
      widgets = widgets.filter(
        widget =>
          widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          widget.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          widget.features.some(feature =>
            feature.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      widgets = widgets.filter(widget => widget.category === selectedCategory)
    }

    // Size filter
    if (selectedSize !== 'all') {
      widgets = widgets.filter(widget => widget.size === selectedSize)
    }

    // Mobile optimization filter
    if (showMobileOnly) {
      widgets = widgets.filter(widget => widget.mobileOptimized)
    }

    // Sort
    widgets.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.popularity - a.popularity
        case 'name':
          return a.name.localeCompare(b.name)
        case 'new':
          return (b.new ? 1 : 0) - (a.new ? 1 : 0)
        default:
          return 0
      }
    })

    return widgets
  }, [searchTerm, selectedCategory, selectedSize, showMobileOnly, sortBy])

  // Handle widget selection
  const handleWidgetSelect = useCallback(
    (widget: (typeof mobileWidgets)[keyof typeof mobileWidgets]) => {
      if (!canAddMoreWidgets) return
      onWidgetSelect(widget.id)
    },
    [canAddMoreWidgets, onWidgetSelect]
  )

  // Widget card component
  const WidgetCard = ({
    widget,
  }: {
    widget: (typeof mobileWidgets)[keyof typeof mobileWidgets]
  }) => {
    const IconComponent = widget.icon
    const categoryInfo = categories[widget.category]

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className={cn(
            'cursor-pointer transition-all duration-200 hover:shadow-md',
            !canAddMoreWidgets && 'cursor-not-allowed opacity-50',
            widget.mobileOptimized && 'ring-1 ring-green-200'
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'rounded-lg p-2',
                    categoryInfo.color
                      .replace('text-', 'bg-')
                      .replace('-800', '-100')
                  )}
                >
                  <IconComponent
                    className={cn(
                      'h-5 w-5',
                      categoryInfo.color
                        .replace('bg-', 'text-')
                        .replace('-100', '-600')
                    )}
                  />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">
                    {widget.name}
                  </CardTitle>
                  <p className="mt-1 text-xs text-gray-500">
                    {widget.description}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {widget.new && (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-xs text-green-800"
                  >
                    {translations.new}
                  </Badge>
                )}
                {widget.premium && (
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-xs text-purple-800"
                  >
                    {translations.premium}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn('text-xs', categoryInfo.color)}
                >
                  {categoryInfo.name}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {sizes[widget.size].name}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                {widget.mobileOptimized && (
                  <Smartphone className="h-3 w-3 text-green-600" />
                )}
                <span className="text-xs text-gray-500">
                  {widget.popularity}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {widget.features.slice(0, 3).map((feature, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-gray-100 text-xs text-gray-700"
                  >
                    {feature}
                  </Badge>
                ))}
                {widget.features.length > 3 && (
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-xs text-gray-700"
                  >
                    +{widget.features.length - 3} mer
                  </Badge>
                )}
              </div>

              <Button
                onClick={() => handleWidgetSelect(widget)}
                disabled={!canAddMoreWidgets}
                className="mt-3 w-full gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                {translations.addWidget}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Filter bar component
  const FilterBar = () => (
    <div className="mb-4 flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
        <Input
          placeholder={translations.search}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
          className="whitespace-nowrap"
        >
          {translations.all}
        </Button>

        {Object.entries(categories).map(([key, category]) => (
          <Button
            key={key}
            variant={selectedCategory === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(key as WidgetCategory)}
            className="gap-2 whitespace-nowrap"
          >
            <category.icon className="h-4 w-4" />
            {category.name}
          </Button>
        ))}

        {isMobile && (
          <Button
            variant={showMobileOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowMobileOnly(!showMobileOnly)}
            className="gap-2 whitespace-nowrap"
          >
            <Smartphone className="h-4 w-4" />
            Mobile
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn('h-[90vh] overflow-hidden', isMobile && 'h-[95vh]')}
      >
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg">{translations.title}</SheetTitle>
              <SheetDescription className="mt-1 text-sm">
                {translations.description}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {currentWidgetCount}/{maxWidgets}
              </Badge>
              {!canAddMoreWidgets && (
                <Badge variant="destructive" className="text-xs">
                  {translations.maxWidgetsReached}
                </Badge>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex h-full flex-col">
          <FilterBar />

          <ScrollArea className="flex-1">
            <div className="space-y-4 pb-6">
              <AnimatePresence mode="wait">
                {filteredWidgets.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-8 text-center"
                  >
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium">
                      {translations.noResults}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {translations.noResultsDesc}
                    </p>
                  </motion.div>
                ) : (
                  <div className="grid gap-4">
                    {filteredWidgets.map(widget => (
                      <WidgetCard key={widget.id} widget={widget} />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}
