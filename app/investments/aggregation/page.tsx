'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { NorwegianBreadcrumb } from '@/components/ui/norwegian-breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import MultiBrokerAggregation from '@/components/portfolio/multi-broker-aggregation'
import { CrossBrokerAnalytics } from '@/components/analytics/cross-broker-analytics'
import { BrokerPerformanceGrid } from '@/components/analytics/broker-performance-grid'
import { DuplicateManager } from '@/components/portfolio/duplicate-manager'
import { BarChart3, Activity, Target, TrendingUp, Copy } from 'lucide-react'

type ViewMode = 'overview' | 'analytics' | 'performance' | 'duplicates' | 'risk'

export default function AggregationPage() {
  const [activeView, setActiveView] = useState<ViewMode>('overview')

  const views = [
    {
      id: 'overview' as ViewMode,
      label: 'Oversikt',
      icon: TrendingUp,
      description: 'Portfolio aggregering og status'
    },
    {
      id: 'analytics' as ViewMode,
      label: 'Analytics',
      icon: BarChart3,
      description: 'Avansert cross-broker analyse'
    },
    {
      id: 'performance' as ViewMode,
      label: 'Ytelse',
      icon: Activity,
      description: 'Megler ytelse sammenligning'
    },
    {
      id: 'duplicates' as ViewMode,
      label: 'Duplikater',
      icon: Copy,
      description: 'Duplikat deteksjon og løsning'
    },
    {
      id: 'risk' as ViewMode,
      label: 'Risiko',
      icon: Target,
      description: 'Risiko vurdering og diversifisering'
    }
  ]

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return <MultiBrokerAggregation />
      case 'analytics':
        return <CrossBrokerAnalytics />
      case 'performance':
        return <BrokerPerformanceGrid />
      case 'duplicates':
        return <DuplicateManager onDuplicatesResolved={() => {
          // Optionally refresh other views when duplicates are resolved
          console.log('Duplicates resolved, consider refreshing aggregation data')
        }} />
      case 'risk':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Risiko Analyse Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <div className="text-6xl mb-4">🎯</div>
                <div className="text-lg mb-2">Dedikert risiko analyse kommer snart</div>
                <div className="text-sm">Bruk Analytics-fanen for risiko metrics</div>
              </div>
            </CardContent>
          </Card>
        )
      default:
        return <MultiBrokerAggregation />
    }
  }

  return (
    <DashboardLayout>
      <NorwegianBreadcrumb />
      
      <div className="p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="border-b">
          <div className="flex space-x-8">
            {views.map((view) => {
              const Icon = view.icon
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeView === view.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {view.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Active View Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            {(() => {
              const activeViewData = views.find(v => v.id === activeView)
              const Icon = activeViewData?.icon || TrendingUp
              return <Icon className="w-5 h-5 text-blue-600" />
            })()}
            <div>
              <h3 className="font-medium text-blue-900">
                {views.find(v => v.id === activeView)?.label}
              </h3>
              <p className="text-sm text-blue-700">
                {views.find(v => v.id === activeView)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </DashboardLayout>
  )
}