'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ChartBarIcon, 
  PresentationChartLineIcon,
  CogIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon 
} from '@heroicons/react/24/outline'
import { AnimatedCard } from '@/components/animated'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  PortfolioPerformanceChart,
  AssetAllocationChart,
  PerformanceComparisonChart,
  ChartControls,
  TimeRangeSelector,
  useChartConfig,
  CHART_PRESETS
} from '@/components/charts'
import { usePortfolioState } from '@/lib/hooks/use-portfolio-state'
import { useRealtimeUpdates } from '@/lib/hooks/use-realtime-updates'

interface PortfolioChartSectionProps {
  portfolioId: string
}

export default function PortfolioChartSection({ portfolioId }: PortfolioChartSectionProps) {
  const [activeTab, setActiveTab] = useState('performance')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  const { portfolio, loading, error } = usePortfolioState(portfolioId)
  const { priceUpdates, isConnected } = useRealtimeUpdates(portfolioId)
  
  const {
    config,
    updateConfig,
    resetConfig,
    presets
  } = useChartConfig('standard')

  // Handle fullscreen mode
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isFullscreen])

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-6"
      >
        <AnimatedCard className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="flex space-x-2">
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-80 bg-gray-200 rounded animate-pulse" />
          </div>
        </AnimatedCard>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-6"
      >
        <AnimatedCard className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center space-x-2 text-red-600">
            <ChartBarIcon className="h-5 w-5" />
            <p>Kunne ikke laste inn diagramdata: {error}</p>
          </div>
        </AnimatedCard>
      </motion.div>
    )
  }

  const chartTabs = [
    {
      id: 'performance',
      label: 'Ytelse',
      icon: <PresentationChartLineIcon className="h-4 w-4" />,
      description: 'Porteføljeytelse over tid'
    },
    {
      id: 'allocation',
      label: 'Fordeling',
      icon: <ChartBarIcon className="h-4 w-4" />,
      description: 'Aktivafordeling'
    },
    {
      id: 'comparison',
      label: 'Sammenligning',
      icon: <ChartBarIcon className="h-4 w-4" />,
      description: 'Sammenlign med referanseindekser'
    }
  ]

  const ChartContent = ({ className = '' }) => (
    <div className={`space-y-4 ${className}`}>
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="grid w-full grid-cols-3">
              {chartTabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          <Badge variant="outline" className={isConnected ? 'text-green-600' : 'text-gray-500'}>
            {isConnected ? 'Live' : 'Offline'}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <TimeRangeSelector
            value={config.timeRange}
            onChange={(timeRange) => updateConfig({ timeRange })}
            size="sm"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="hover:bg-gray-50"
          >
            <CogIcon className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="hover:bg-gray-50"
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="h-4 w-4" />
            ) : (
              <ArrowsPointingOutIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Chart Settings */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-4 bg-gray-50">
            <ChartControls
              config={config}
              onConfigChange={updateConfig}
              onReset={resetConfig}
              presets={presets}
            />
          </Card>
        </motion.div>
      )}

      {/* Charts */}
      <div className="min-h-[400px]">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="performance" className="mt-0">
            <PortfolioPerformanceChart
              portfolioId={portfolioId}
              config={config}
              height={isFullscreen ? 600 : 400}
              className="w-full"
            />
          </TabsContent>
          
          <TabsContent value="allocation" className="mt-0">
            <AssetAllocationChart
              portfolioId={portfolioId}
              config={config}
              height={isFullscreen ? 600 : 400}
              className="w-full"
            />
          </TabsContent>
          
          <TabsContent value="comparison" className="mt-0">
            <PerformanceComparisonChart
              portfolioId={portfolioId}
              config={config}
              height={isFullscreen ? 600 : 400}
              className="w-full"
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Chart Description */}
      <div className="text-sm text-gray-600">
        {chartTabs.find(tab => tab.id === activeTab)?.description}
      </div>
    </div>
  )

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-6"
      >
        <AnimatedCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Porteføljeanalyse
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Sist oppdatert: {new Date().toLocaleTimeString('nb-NO', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
          
          <ChartContent />
        </AnimatedCard>
      </motion.div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-white z-50 overflow-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {portfolio?.name} - Porteføljeanalyse
              </h2>
              <Button
                variant="outline"
                onClick={() => setIsFullscreen(false)}
                className="hover:bg-gray-50"
              >
                <ArrowsPointingInIcon className="h-4 w-4 mr-2" />
                Lukk fullskjerm
              </Button>
            </div>
            
            <ChartContent className="h-full" />
          </div>
        </motion.div>
      )}
    </>
  )
}