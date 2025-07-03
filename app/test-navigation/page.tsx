'use client'

import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function TestNavigationPage() {
  const router = useRouter()

  const testRoutes = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Finance Overview', path: '/finance/overview' },
    { name: 'Finance Budgets', path: '/finance/budgets' },
    { name: 'Finance Transactions', path: '/finance/transactions' },
    { name: 'Health Fitness', path: '/health/fitness' },
    { name: 'Health Sleep', path: '/health/sleep' },
    { name: 'Health Nutrition', path: '/health/nutrition' },
    { name: 'Goals', path: '/goals' },
    { name: 'Settings', path: '/settings' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Navigation Test</h1>
          <p className="text-gray-600 mt-2">
            Test the responsive navigation system across different screen sizes.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testRoutes.map((route) => (
            <Card key={route.path} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{route.name}</h3>
                  <p className="text-sm text-gray-500">{route.path}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(route.path as any)}
                >
                  Visit
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Navigation Features</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Mobile-First Design</h4>
                <p className="text-sm text-gray-600">
                  Bottom navigation on mobile devices (&lt; 768px)
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Collapsible Sidebar</h4>
                <p className="text-sm text-gray-600">
                  Desktop sidebar that can be collapsed to save space
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Dynamic Breadcrumbs</h4>
                <p className="text-sm text-gray-600">
                  Contextual breadcrumbs that update based on current route
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Responsive Layout</h4>
                <p className="text-sm text-gray-600">
                  Adapts seamlessly between mobile and desktop breakpoints
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Testing Instructions</h2>
          <div className="space-y-3 text-sm">
            <p>
              <strong>Mobile (&lt; 768px):</strong> Navigation should appear at the bottom with 5 main sections.
            </p>
            <p>
              <strong>Tablet (768px - 1024px):</strong> Sidebar should be collapsible with full desktop features.
            </p>
            <p>
              <strong>Desktop (&gt; 1024px):</strong> Full sidebar with expandable sections and breadcrumbs.
            </p>
            <p>
              <strong>Interactions:</strong> Test sidebar toggle, menu expansion, and navigation transitions.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}