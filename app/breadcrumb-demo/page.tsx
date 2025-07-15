'use client'

import { WireframeBreadcrumb } from '@/components/ui/wireframe-breadcrumb'
import { DashboardLayout, DashboardHeader, DashboardContent } from '@/components/layout/dashboard-layout'

/**
 * Breadcrumb Demo Page
 * 
 * This page demonstrates how to integrate the WireframeBreadcrumb component
 * into LifeDash pages according to wireframe specifications.
 */
export default function BreadcrumbDemoPage() {
  return (
    <DashboardLayout>
      {/* Add breadcrumb navigation at the top */}
      <WireframeBreadcrumb />
      
      <DashboardHeader
        title="Breadcrumb Demo"
        subtitle="Demonstrating the WireframeBreadcrumb component integration"
      />
      
      <DashboardContent>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Wireframe Breadcrumb Integration
            </h2>
            <p className="text-gray-600 mb-6">
              This page demonstrates how the WireframeBreadcrumb component integrates 
              with the LifeDash layout system. The breadcrumb automatically generates 
              navigation based on the current URL path.
            </p>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Current Path Analysis</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  URL: <code className="bg-gray-200 px-2 py-1 rounded">/breadcrumb-demo</code>
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Generated breadcrumb: <strong>Dashboard › Breadcrumb-demo</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Wireframe Compliance
            </h2>
            <p className="text-gray-600 mb-4">
              The breadcrumb component follows the exact styling specifications from the wireframes:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                Background: white
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                Padding: 12px 24px
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                Border-bottom: 1px solid #e5e7eb
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                Font-size: 14px
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                Link color: #6b7280 (gray-500)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                Current page color: #6366f1 (indigo-600)
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Integration Examples
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Basic Usage
                </h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
{`// Auto-generated breadcrumb
<WireframeBreadcrumb />

// In your layout or page
import { WireframeBreadcrumb } from '@/components/ui/wireframe-breadcrumb'

export default function MyPage() {
  return (
    <DashboardLayout>
      <WireframeBreadcrumb />
      <DashboardHeader title="My Page" />
      <DashboardContent>
        {/* Your content */}
      </DashboardContent>
    </DashboardLayout>
  )
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Custom Breadcrumb Items
                </h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
{`// Custom breadcrumb items
const customItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Investeringer', href: '/investments' },
  { label: 'Aksjer', href: '/stocks', isActive: true }
]

<WireframeBreadcrumb items={customItems} />`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Expected Breadcrumb Patterns
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded border">
                <strong>Dashboard page:</strong> Dashboard
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <strong>Investments page:</strong> Dashboard › Investeringer
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <strong>Stocks page:</strong> Dashboard › Investeringer › Aksjer
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <strong>This demo page:</strong> Dashboard › Breadcrumb-demo
              </div>
            </div>
          </div>
        </div>
      </DashboardContent>
    </DashboardLayout>
  )
}