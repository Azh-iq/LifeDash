'use client'

import React, { useState, useEffect } from 'react'
import {
  WidgetRegistryProvider,
  useWidgetRegistry,
  useWidgetActions,
  useActiveWidgets,
  useActiveLayout,
  useWidgetStore,
  WidgetRenderer,
  WidgetCatalog,
  WidgetCreator,
  WidgetContainer,
  getWidgetSystemInfo,
  validateWidgetLayout,
  getWidgetAnalytics,
  WIDGET_CONSTANTS,
} from './index'
import { WidgetType } from '@/lib/types/widget.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Widget dashboard demo component
const WidgetDashboardDemo: React.FC = () => {
  const actions = useWidgetActions()
  const widgets = useActiveWidgets()
  const editMode = useWidgetStore(state => state.editMode)
  const activeLayout = useActiveLayout()
  const [selectedWidgetType, setSelectedWidgetType] =
    useState<WidgetType | null>(null)
  const [showCreator, setShowCreator] = useState(false)
  const [systemInfo, setSystemInfo] = useState(getWidgetSystemInfo())

  useEffect(() => {
    // Initialize default layout if none exists
    if (!activeLayout) {
      actions.createLayout('default')
      actions.setActiveLayout('default')
    }
  }, [activeLayout, actions])

  useEffect(() => {
    // Update system info
    setSystemInfo(getWidgetSystemInfo())
  }, [widgets])

  const handleWidgetSelect = (type: WidgetType) => {
    setSelectedWidgetType(type)
    setShowCreator(true)
  }

  const handleWidgetCreate = (widget: any) => {
    if (activeLayout) {
      actions.addWidget(widget)
    }
    setShowCreator(false)
    setSelectedWidgetType(null)
  }

  const handleAddSampleWidget = () => {
    if (!activeLayout) return

    try {
      const sampleWidget = {
        id: `widget-${Date.now()}`,
        type: 'HERO_PORTFOLIO_CHART' as WidgetType,
        category: 'STOCKS' as const,
        size: 'LARGE' as const,
        title: 'Demo Portfolio Chart',
        description: 'Example portfolio performance chart',
        position: { row: 1, column: 1, rowSpan: 2, columnSpan: 2 },
        userId: 'demo-user',
        portfolioId: 'demo-portfolio',
        configuration: {
          chartType: 'line',
          showVolume: true,
          timeframe: '1M',
        },
        visible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      actions.addWidget(sampleWidget)
    } catch (error) {
      console.error('Failed to create sample widget:', error)
    }
  }

  const layoutAnalytics = activeLayout ? getWidgetAnalytics(activeLayout) : null
  const layoutValidation = activeLayout
    ? validateWidgetLayout(activeLayout)
    : null

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Widget System Demo</h1>
          <p className="text-gray-600">
            LifeDash Widget Registry v{WIDGET_CONSTANTS.VERSION}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={editMode ? 'default' : 'outline'}
            onClick={() => actions.setEditMode(!editMode)}
          >
            {editMode ? 'Exit Edit' : 'Edit Mode'}
          </Button>
          <Dialog open={showCreator} onOpenChange={setShowCreator}>
            <DialogTrigger asChild>
              <Button>Add Widget</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Add New Widget</DialogTitle>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                <WidgetCatalog onWidgetSelect={handleWidgetSelect} />
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={handleAddSampleWidget}>Add Sample</Button>
        </div>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  systemInfo.initialized ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm">
                {systemInfo.initialized ? 'Initialized' : 'Not Initialized'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Available Widgets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemInfo.totalWidgets}</div>
            <div className="text-sm text-gray-600">
              {systemInfo.categories} categories
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Active Widgets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{widgets.length}</div>
            <div className="text-sm text-gray-600">
              {layoutValidation?.validWidgets || 0} valid
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Layout Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  layoutValidation?.invalidWidgets === 0
                    ? 'bg-green-500'
                    : 'bg-yellow-500'
                }`}
              />
              <span className="text-sm">
                {layoutValidation?.invalidWidgets === 0
                  ? 'Valid'
                  : 'Has Issues'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Widget Dashboard */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Widget Layout */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Widget Layout</CardTitle>
            </CardHeader>
            <CardContent>
              {widgets.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <p>No widgets in this layout</p>
                  <p className="mt-2 text-sm">
                    Click "Add Widget" to get started
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {widgets.map(widget => (
                    <WidgetContainer
                      key={widget.id}
                      widget={widget}
                      onError={error => {
                        console.error('Widget error:', error)
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Layout Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              {layoutAnalytics ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">By Category</div>
                    {Object.entries(layoutAnalytics.widgetsByCategory).map(
                      ([category, count]) => (
                        <div
                          key={category}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm">{category}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      )
                    )}
                  </div>

                  <div>
                    <div className="text-sm text-gray-600">By Size</div>
                    {Object.entries(layoutAnalytics.widgetsBySize).map(
                      ([size, count]) => (
                        <div
                          key={size}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm">{size}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      )
                    )}
                  </div>

                  {layoutAnalytics.totalErrors > 0 && (
                    <Alert>
                      <AlertDescription>
                        {layoutAnalytics.totalErrors} validation errors
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No analytics available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => actions.setSelectedWidget(null)}
              >
                Clear Selection
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => actions.clearError()}
                disabled={!activeLayout}
              >
                Clear Errors
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (activeLayout) {
                    widgets.forEach(widget => {
                      actions.removeWidget(widget.id)
                    })
                  }
                }}
                disabled={widgets.length === 0}
              >
                Clear All
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Widget Creator Modal */}
      {showCreator && selectedWidgetType && (
        <Dialog open={showCreator} onOpenChange={setShowCreator}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Widget</DialogTitle>
            </DialogHeader>
            <WidgetCreator
              type={selectedWidgetType}
              userId="demo-user"
              portfolioId="demo-portfolio"
              onWidgetCreate={handleWidgetCreate}
              onCancel={() => {
                setShowCreator(false)
                setSelectedWidgetType(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Registry information component
const WidgetRegistryInfo: React.FC = () => {
  const { state } = useWidgetRegistry()
  const [categories, setCategories] = useState<string[]>([])
  const [widgets, setWidgets] = useState<any[]>([])

  useEffect(() => {
    setCategories(Array.from(state.categories.keys()))
    setWidgets(Array.from(state.widgets.values()))
  }, [state])

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="mb-4 text-xl font-bold">Widget Registry Information</h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Categories ({categories.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map(category => {
                  const categoryWidgets = state.categories.get(category) || []
                  return (
                    <div
                      key={category}
                      className="flex items-center justify-between"
                    >
                      <span>{category}</span>
                      <Badge variant="outline">{categoryWidgets.length}</Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registry Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Initialized</span>
                  <Badge
                    variant={state.initialized ? 'default' : 'destructive'}
                  >
                    {state.initialized ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Loading</span>
                  <Badge variant={state.loading ? 'default' : 'outline'}>
                    {state.loading ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Widgets</span>
                  <Badge variant="outline">{widgets.length}</Badge>
                </div>
                {state.error && (
                  <Alert>
                    <AlertDescription>{state.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Widgets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {widgets.map(widget => (
              <div key={widget.type} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-medium">{widget.displayName}</h4>
                  <Badge variant="outline">{widget.category}</Badge>
                </div>
                <p className="mb-2 text-sm text-gray-600">
                  {widget.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    {widget.recommendedSize}
                  </Badge>
                  {widget.features.exportable && (
                    <Badge variant="outline" className="text-xs">
                      Exportable
                    </Badge>
                  )}
                  {widget.features.realTimeUpdates && (
                    <Badge variant="outline" className="text-xs">
                      Real-time
                    </Badge>
                  )}
                  {widget.features.configurable && (
                    <Badge variant="outline" className="text-xs">
                      Configurable
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main demo component
const WidgetSystemDemo: React.FC = () => {
  return (
    <WidgetRegistryProvider>
      <div className="min-h-screen bg-gray-50">
        <Tabs defaultValue="dashboard" className="w-full">
          <div className="border-b bg-white">
            <div className="container mx-auto">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="catalog">Widget Catalog</TabsTrigger>
                <TabsTrigger value="registry">Registry Info</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="dashboard" className="mt-0">
            <WidgetDashboardDemo />
          </TabsContent>

          <TabsContent value="catalog" className="mt-0">
            <div className="p-6">
              <h2 className="mb-4 text-xl font-bold">Widget Catalog</h2>
              <WidgetCatalog
                onWidgetSelect={type => console.log('Selected:', type)}
              />
            </div>
          </TabsContent>

          <TabsContent value="registry" className="mt-0">
            <WidgetRegistryInfo />
          </TabsContent>
        </Tabs>
      </div>
    </WidgetRegistryProvider>
  )
}

export default WidgetSystemDemo
