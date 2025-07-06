/**
 * Demo page for MobilePortfolioDashboard component
 * This demonstrates the component with mock data for development and testing
 */

'use client'

import { useState } from 'react'
import { MobilePortfolioDashboard } from './mobile-portfolio-dashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Mock portfolio IDs for demo
const DEMO_PORTFOLIOS = [
  {
    id: 'demo-investment',
    name: 'Investeringsportefølje',
    type: 'INVESTMENT',
    description: 'Hovedinvesteringer i norske og internasjonale aksjer'
  },
  {
    id: 'demo-retirement', 
    name: 'Pensjonsportefølje',
    type: 'RETIREMENT',
    description: 'Langsiktig pensjonssparing med diversifiserte investeringer'
  },
  {
    id: 'demo-trading',
    name: 'Trading portefølje', 
    type: 'TRADING',
    description: 'Aktiv trading med høyere risiko og volatilitet'
  }
]

interface DemoControlsProps {
  selectedPortfolio: string
  onPortfolioChange: (portfolioId: string) => void
  showNavigation: boolean
  onNavigationToggle: (show: boolean) => void
  showTopBar: boolean
  onTopBarToggle: (show: boolean) => void
  initialView: 'overview' | 'holdings' | 'charts'
  onViewChange: (view: 'overview' | 'holdings' | 'charts') => void
}

function DemoControls({
  selectedPortfolio,
  onPortfolioChange,
  showNavigation,
  onNavigationToggle,
  showTopBar,
  onTopBarToggle,
  initialView,
  onViewChange
}: DemoControlsProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <h3 className="text-lg font-semibold">Demo Kontroller</h3>
        <p className="text-sm text-gray-600">
          Test forskjellige konfigurasjoner av mobile dashboard
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Portfolio Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Velg Portefølje</label>
          <div className="grid grid-cols-1 gap-2">
            {DEMO_PORTFOLIOS.map((portfolio) => (
              <div
                key={portfolio.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedPortfolio === portfolio.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onPortfolioChange(portfolio.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{portfolio.name}</div>
                    <div className="text-xs text-gray-500">{portfolio.description}</div>
                  </div>
                  <Badge variant="secondary">{portfolio.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Initial View */}
        <div>
          <label className="block text-sm font-medium mb-2">Startvisning</label>
          <div className="flex space-x-2">
            {[
              { value: 'overview', label: 'Oversikt' },
              { value: 'holdings', label: 'Beholdninger' },
              { value: 'charts', label: 'Grafer' }
            ].map((view) => (
              <Button
                key={view.value}
                variant={initialView === view.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onViewChange(view.value as any)}
              >
                {view.label}
              </Button>
            ))}
          </div>
        </div>

        {/* UI Options */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showNavigation"
              checked={showNavigation}
              onChange={(e) => onNavigationToggle(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="showNavigation" className="text-sm">
              Vis navigasjon
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showTopBar"
              checked={showTopBar}
              onChange={(e) => onTopBarToggle(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="showTopBar" className="text-sm">
              Vis toppbar
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function MobilePortfolioDashboardDemo() {
  const [selectedPortfolio, setSelectedPortfolio] = useState(DEMO_PORTFOLIOS[0].id)
  const [showNavigation, setShowNavigation] = useState(true)
  const [showTopBar, setShowTopBar] = useState(true)
  const [initialView, setInitialView] = useState<'overview' | 'holdings' | 'charts'>('overview')
  const [key, setKey] = useState(0) // Force re-render when config changes

  const handleConfigChange = () => {
    setKey(prev => prev + 1) // Force component re-mount with new props
  }

  const handlePortfolioChange = (portfolioId: string) => {
    setSelectedPortfolio(portfolioId)
    handleConfigChange()
  }

  const handleNavigationToggle = (show: boolean) => {
    setShowNavigation(show)
    handleConfigChange()
  }

  const handleTopBarToggle = (show: boolean) => {
    setShowTopBar(show)
    handleConfigChange()
  }

  const handleViewChange = (view: 'overview' | 'holdings' | 'charts') => {
    setInitialView(view)
    handleConfigChange()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Demo Controls - Only show on larger screens */}
      <div className="hidden md:block p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mobile Portfolio Dashboard Demo
          </h1>
          <p className="text-gray-600">
            Test og utforsk den mobile porteføljedashboard komponenten med ulike konfigurasjoner.
            Reduser nettleservinduet til mobil størrelse for beste opplevelse.
          </p>
        </div>

        <DemoControls
          selectedPortfolio={selectedPortfolio}
          onPortfolioChange={handlePortfolioChange}
          showNavigation={showNavigation}
          onNavigationToggle={handleNavigationToggle}
          showTopBar={showTopBar}
          onTopBarToggle={handleTopBarToggle}
          initialView={initialView}
          onViewChange={handleViewChange}
        />
      </div>

      {/* Mobile Dashboard Container */}
      <div className="md:max-w-md md:mx-auto md:shadow-2xl md:rounded-lg md:overflow-hidden">
        <MobilePortfolioDashboard
          key={key}
          portfolioId={selectedPortfolio}
          initialView={initialView}
          showNavigation={showNavigation}
          showTopBar={showTopBar}
          className="min-h-screen md:min-h-[800px]"
        />
      </div>

      {/* Mobile Demo Info */}
      <div className="md:hidden p-4 bg-blue-50 border-t border-blue-200">
        <div className="text-center text-sm text-blue-700">
          <p className="font-medium">Demo Modus</p>
          <p>Portfolie: {DEMO_PORTFOLIOS.find(p => p.id === selectedPortfolio)?.name}</p>
          <p className="mt-2 text-xs">
            For å endre innstillinger, åpne på desktop eller tablet
          </p>
        </div>
      </div>
    </div>
  )
}

export default MobilePortfolioDashboardDemo