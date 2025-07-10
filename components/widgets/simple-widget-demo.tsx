'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Simple widget types for demo
interface SimpleWidget {
  id: string
  title: string
  type: 'chart' | 'table' | 'metrics' | 'news'
  category: 'stocks' | 'crypto' | 'art' | 'other'
  size: 'small' | 'medium' | 'large'
  content: string
  created: Date
}

// Mock widget data
const mockWidgets: SimpleWidget[] = [
  {
    id: '1',
    title: 'Portfolio Performance',
    type: 'chart',
    category: 'stocks',
    size: 'large',
    content: 'Interactive portfolio chart showing performance over time',
    created: new Date(),
  },
  {
    id: '2',
    title: 'Holdings Summary',
    type: 'table',
    category: 'stocks',
    size: 'medium',
    content: 'Table showing current stock holdings with real-time prices',
    created: new Date(),
  },
  {
    id: '3',
    title: 'Key Metrics',
    type: 'metrics',
    category: 'stocks',
    size: 'small',
    content: 'Portfolio value, daily change, and performance metrics',
    created: new Date(),
  },
]

// Simple widget component
const SimpleWidgetCard: React.FC<{
  widget: SimpleWidget
  onRemove: (id: string) => void
}> = ({ widget, onRemove }) => {
  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{widget.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{widget.type}</Badge>
            <Badge variant="secondary">{widget.category}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(widget.id)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{widget.content}</p>
        <div className="mt-4 flex items-center justify-between">
          <Badge variant="outline">{widget.size}</Badge>
          <span className="text-xs text-gray-500">
            Created: {widget.created.toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// Widget creation form
const CreateWidgetForm: React.FC<{
  onSubmit: (widget: Omit<SimpleWidget, 'id' | 'created'>) => void
}> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'chart' as const,
    category: 'stocks' as const,
    size: 'medium' as const,
    content: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      title: '',
      type: 'chart',
      category: 'stocks',
      size: 'medium',
      content: '',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          className="w-full rounded-md border px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Type</label>
        <select
          value={formData.type}
          onChange={e =>
            setFormData({ ...formData, type: e.target.value as any })
          }
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="chart">Chart</option>
          <option value="table">Table</option>
          <option value="metrics">Metrics</option>
          <option value="news">News</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Category</label>
        <select
          value={formData.category}
          onChange={e =>
            setFormData({ ...formData, category: e.target.value as any })
          }
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="stocks">Stocks</option>
          <option value="crypto">Crypto</option>
          <option value="art">Art</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Size</label>
        <select
          value={formData.size}
          onChange={e =>
            setFormData({ ...formData, size: e.target.value as any })
          }
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Content</label>
        <textarea
          value={formData.content}
          onChange={e => setFormData({ ...formData, content: e.target.value })}
          className="w-full rounded-md border px-3 py-2"
          rows={3}
          required
        />
      </div>

      <Button type="submit" className="w-full">
        Create Widget
      </Button>
    </form>
  )
}

// Main demo component
const SimpleWidgetDemo: React.FC = () => {
  const [widgets, setWidgets] = useState<SimpleWidget[]>(mockWidgets)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const addWidget = (widgetData: Omit<SimpleWidget, 'id' | 'created'>) => {
    const newWidget: SimpleWidget = {
      ...widgetData,
      id: Date.now().toString(),
      created: new Date(),
    }
    setWidgets([...widgets, newWidget])
    setShowCreateForm(false)
  }

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id))
  }

  const getWidgetStats = () => {
    return {
      total: widgets.length,
      byType: widgets.reduce(
        (acc, widget) => {
          acc[widget.type] = (acc[widget.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ),
      byCategory: widgets.reduce(
        (acc, widget) => {
          acc[widget.category] = (acc[widget.category] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ),
    }
  }

  const stats = getWidgetStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <Tabs defaultValue="dashboard" className="w-full">
        <div className="border-b bg-white">
          <div className="container mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="widgets">Widgets</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="dashboard" className="mt-0 p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Widget System Demo</h1>
                <p className="text-gray-600">
                  Simple demonstration of widget management system
                </p>
              </div>
              <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                <DialogTrigger asChild>
                  <Button>Add Widget</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Widget</DialogTitle>
                  </DialogHeader>
                  <CreateWidgetForm onSubmit={addWidget} />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {widgets.map(widget => (
                <SimpleWidgetCard
                  key={widget.id}
                  widget={widget}
                  onRemove={removeWidget}
                />
              ))}
            </div>

            {widgets.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                <p>No widgets created yet</p>
                <p className="mt-2 text-sm">
                  Click "Add Widget" to create your first widget
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="widgets" className="mt-0 p-6">
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Available Widget Types</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {['chart', 'table', 'metrics', 'news'].map(type => (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="text-sm capitalize">{type}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {type === 'chart' && 'Interactive charts and graphs'}
                      {type === 'table' && 'Data tables and lists'}
                      {type === 'metrics' && 'Key performance indicators'}
                      {type === 'news' && 'News feeds and updates'}
                    </p>
                    <div className="mt-2">
                      <Badge variant="outline">
                        {stats.byType[type] || 0} active
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0 p-6">
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Widget Analytics</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Widgets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">By Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex justify-between">
                        <span className="capitalize">{type}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">By Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.byCategory).map(
                      ([category, count]) => (
                        <div key={category} className="flex justify-between">
                          <span className="capitalize">{category}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SimpleWidgetDemo
