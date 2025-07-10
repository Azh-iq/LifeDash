'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Plus,
  Search,
  Eye,
  Save,
  RotateCcw,
  Heart,
  Star,
  Share2,
  Download,
  Trash2,
  Edit,
  Filter,
  Bell,
  Info,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import {
  ModernButton,
  ModernCard,
  ModernSearchInput,
  ModernLoading,
  ModernTooltip,
  ModernWidgetAction,
} from './modern-ui-components'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface ModernComponentsDemoProps {
  className?: string
}

export const ModernComponentsDemo: React.FC<ModernComponentsDemoProps> = ({
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVariant, setSelectedVariant] = useState<
    'primary' | 'secondary' | 'ghost' | 'destructive'
  >('primary')
  const [loading, setLoading] = useState(false)
  const [glassmorphism, setGlassmorphism] = useState(true)

  const handleLoadingTest = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 3000))
    setLoading(false)
  }

  return (
    <div className={cn('mx-auto max-w-6xl space-y-8 p-6', className)}>
      {/* Header */}
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Modern UI Components Demo
        </h1>
        <p className="mx-auto max-w-2xl text-gray-600">
          Showcase of modern UI components with glassmorphism effects, smooth
          animations, and mobile-responsive design
        </p>

        {/* Glassmorphism Toggle */}
        <div className="flex items-center justify-center gap-4">
          <span className="text-sm font-medium">Glassmorphism:</span>
          <ModernButton
            variant={glassmorphism ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setGlassmorphism(!glassmorphism)}
          >
            {glassmorphism ? 'På' : 'Av'}
          </ModernButton>
        </div>
      </div>

      {/* Background for glassmorphism effect */}
      {glassmorphism && (
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 opacity-30" />
      )}

      {/* Modern Buttons Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">
            Modern Buttons
          </h2>
          <Badge variant="secondary">Glassmorphism + Animations</Badge>
        </div>

        {/* Variant Selector */}
        <div className="flex flex-wrap gap-2">
          {(['primary', 'secondary', 'ghost', 'destructive'] as const).map(
            variant => (
              <ModernButton
                key={variant}
                variant={selectedVariant === variant ? 'primary' : 'ghost'}
                size="sm"
                glassmorphism={glassmorphism}
                onClick={() => setSelectedVariant(variant)}
              >
                {variant}
              </ModernButton>
            )
          )}
        </div>

        {/* Button Examples */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ModernButton
            variant={selectedVariant}
            size="sm"
            glassmorphism={glassmorphism}
          >
            <Plus className="mr-2 h-4 w-4" />
            Small Button
          </ModernButton>

          <ModernButton
            variant={selectedVariant}
            size="md"
            glassmorphism={glassmorphism}
          >
            <Settings className="mr-2 h-4 w-4" />
            Medium Button
          </ModernButton>

          <ModernButton
            variant={selectedVariant}
            size="lg"
            glassmorphism={glassmorphism}
          >
            <Save className="mr-2 h-4 w-4" />
            Large Button
          </ModernButton>

          <ModernButton
            variant={selectedVariant}
            size="md"
            glassmorphism={glassmorphism}
            disabled
          >
            <XCircle className="mr-2 h-4 w-4" />
            Disabled
          </ModernButton>

          <ModernButton
            variant={selectedVariant}
            size="md"
            glassmorphism={glassmorphism}
            loading={loading}
            onClick={handleLoadingTest}
          >
            <Download className="mr-2 h-4 w-4" />
            Loading Test
          </ModernButton>

          <ModernButton
            variant={selectedVariant}
            size="md"
            glassmorphism={glassmorphism}
            className="w-full"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Full Width
          </ModernButton>
        </div>
      </section>

      <Separator />

      {/* Modern Cards Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">Modern Cards</h2>
          <Badge variant="secondary">Interactive + Glassmorphism</Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Static Card */}
          <ModernCard glassmorphism={glassmorphism}>
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <Star className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Static Card</h3>
                  <p className="text-sm text-gray-600">Not interactive</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                This card has glassmorphism effects but no hover interactions.
              </p>
            </div>
          </ModernCard>

          {/* Interactive Card */}
          <ModernCard glassmorphism={glassmorphism} interactive>
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Heart className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Interactive Card
                  </h3>
                  <p className="text-sm text-gray-600">Hover for effects</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                This card responds to hover with animations and glassmorphism
                effects.
              </p>
            </div>
          </ModernCard>

          {/* Loading Card */}
          <ModernCard glassmorphism={glassmorphism} loading>
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <Bell className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Loading Card</h3>
                  <p className="text-sm text-gray-600">Shows loading state</p>
                </div>
              </div>
            </div>
          </ModernCard>
        </div>
      </section>

      <Separator />

      {/* Modern Search Input Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">
            Modern Search Input
          </h2>
          <Badge variant="secondary">Glassmorphism + Focus Effects</Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Basic Search</h3>
            <ModernSearchInput
              placeholder="Search widgets..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              glassmorphism={glassmorphism}
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">With Clear Button</h3>
            <ModernSearchInput
              placeholder="Search with clear..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              glassmorphism={glassmorphism}
              icon={<Search className="h-4 w-4" />}
              onClear={searchTerm ? () => setSearchTerm('') : undefined}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Modern Loading States Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">
            Modern Loading States
          </h2>
          <Badge variant="secondary">Multiple Variants</Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <ModernCard glassmorphism={glassmorphism}>
            <div className="p-6 text-center">
              <h3 className="mb-4 font-medium text-gray-900">Spinner</h3>
              <ModernLoading
                size="md"
                variant="spinner"
                message="Loading..."
                glassmorphism={glassmorphism}
              />
            </div>
          </ModernCard>

          <ModernCard glassmorphism={glassmorphism}>
            <div className="p-6 text-center">
              <h3 className="mb-4 font-medium text-gray-900">Dots</h3>
              <ModernLoading
                size="md"
                variant="dots"
                message="Processing..."
                glassmorphism={glassmorphism}
              />
            </div>
          </ModernCard>

          <ModernCard glassmorphism={glassmorphism}>
            <div className="p-6 text-center">
              <h3 className="mb-4 font-medium text-gray-900">Pulse</h3>
              <ModernLoading
                size="md"
                variant="pulse"
                message="Updating..."
                glassmorphism={glassmorphism}
              />
            </div>
          </ModernCard>
        </div>
      </section>

      <Separator />

      {/* Modern Tooltips Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">
            Modern Tooltips
          </h2>
          <Badge variant="secondary">Glassmorphism + Positioning</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <ModernTooltip
            content="This tooltip appears on top"
            side="top"
            glassmorphism={glassmorphism}
          >
            <ModernButton
              variant="secondary"
              size="sm"
              glassmorphism={glassmorphism}
            >
              <Info className="mr-2 h-4 w-4" />
              Top
            </ModernButton>
          </ModernTooltip>

          <ModernTooltip
            content="This tooltip appears on the right"
            side="right"
            glassmorphism={glassmorphism}
          >
            <ModernButton
              variant="secondary"
              size="sm"
              glassmorphism={glassmorphism}
            >
              <Info className="mr-2 h-4 w-4" />
              Right
            </ModernButton>
          </ModernTooltip>

          <ModernTooltip
            content="This tooltip appears on the bottom"
            side="bottom"
            glassmorphism={glassmorphism}
          >
            <ModernButton
              variant="secondary"
              size="sm"
              glassmorphism={glassmorphism}
            >
              <Info className="mr-2 h-4 w-4" />
              Bottom
            </ModernButton>
          </ModernTooltip>

          <ModernTooltip
            content="This tooltip appears on the left"
            side="left"
            glassmorphism={glassmorphism}
          >
            <ModernButton
              variant="secondary"
              size="sm"
              glassmorphism={glassmorphism}
            >
              <Info className="mr-2 h-4 w-4" />
              Left
            </ModernButton>
          </ModernTooltip>
        </div>
      </section>

      <Separator />

      {/* Modern Widget Actions Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">
            Modern Widget Actions
          </h2>
          <Badge variant="secondary">Compact + Tooltips</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <ModernWidgetAction
            icon={<Settings className="h-4 w-4" />}
            label="Configure widget"
            onClick={() => console.log('Configure')}
            variant="secondary"
            glassmorphism={glassmorphism}
          />

          <ModernWidgetAction
            icon={<Edit className="h-4 w-4" />}
            label="Edit widget"
            onClick={() => console.log('Edit')}
            variant="secondary"
            glassmorphism={glassmorphism}
          />

          <ModernWidgetAction
            icon={<Share2 className="h-4 w-4" />}
            label="Share widget"
            onClick={() => console.log('Share')}
            variant="secondary"
            glassmorphism={glassmorphism}
          />

          <ModernWidgetAction
            icon={<Download className="h-4 w-4" />}
            label="Download widget"
            onClick={() => console.log('Download')}
            variant="secondary"
            glassmorphism={glassmorphism}
          />

          <ModernWidgetAction
            icon={<Trash2 className="h-4 w-4" />}
            label="Delete widget"
            onClick={() => console.log('Delete')}
            variant="destructive"
            glassmorphism={glassmorphism}
          />
        </div>
      </section>

      <Separator />

      {/* Mobile Responsiveness Test */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">
            Mobile Responsiveness
          </h2>
          <Badge variant="secondary">Responsive Design</Badge>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            All components are designed to be mobile-responsive. Try resizing
            your browser window or view on mobile devices.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ModernCard glassmorphism={glassmorphism} interactive>
              <div className="p-4">
                <h3 className="mb-2 font-medium text-gray-900">Mobile Card</h3>
                <p className="mb-4 text-sm text-gray-600">
                  This card adapts to different screen sizes with responsive
                  padding and layout.
                </p>
                <div className="flex gap-2">
                  <ModernButton
                    variant="primary"
                    size="sm"
                    glassmorphism={glassmorphism}
                    className="flex-1"
                  >
                    Action 1
                  </ModernButton>
                  <ModernButton
                    variant="secondary"
                    size="sm"
                    glassmorphism={glassmorphism}
                    className="flex-1"
                  >
                    Action 2
                  </ModernButton>
                </div>
              </div>
            </ModernCard>

            <ModernCard glassmorphism={glassmorphism} interactive>
              <div className="p-4">
                <h3 className="mb-2 font-medium text-gray-900">
                  Touch-Friendly
                </h3>
                <p className="mb-4 text-sm text-gray-600">
                  All interactive elements have proper touch targets for mobile
                  devices.
                </p>
                <ModernSearchInput
                  placeholder="Mobile search..."
                  glassmorphism={glassmorphism}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
            </ModernCard>

            <ModernCard glassmorphism={glassmorphism} interactive>
              <div className="p-4">
                <h3 className="mb-2 font-medium text-gray-900">
                  Adaptive Layout
                </h3>
                <p className="mb-4 text-sm text-gray-600">
                  Components automatically adjust their layout based on
                  available space.
                </p>
                <div className="flex flex-wrap gap-2">
                  <ModernWidgetAction
                    icon={<Heart className="h-4 w-4" />}
                    label="Like"
                    onClick={() => {}}
                    variant="secondary"
                    glassmorphism={glassmorphism}
                  />
                  <ModernWidgetAction
                    icon={<Share2 className="h-4 w-4" />}
                    label="Share"
                    onClick={() => {}}
                    variant="secondary"
                    glassmorphism={glassmorphism}
                  />
                </div>
              </div>
            </ModernCard>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ModernComponentsDemo
