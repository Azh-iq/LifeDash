'use client'

import * as React from 'react'
import { WireframeBreadcrumb, type BreadcrumbItem } from './wireframe-breadcrumb'

/**
 * Demo component showing different ways to use WireframeBreadcrumb
 */
export default function WireframeBreadcrumbDemo() {
  const [selectedItem, setSelectedItem] = React.useState<BreadcrumbItem | null>(null)

  // Example 1: Auto-generated breadcrumb (uses current pathname)
  const handleItemClick = (item: BreadcrumbItem) => {
    setSelectedItem(item)
    console.log('Breadcrumb item clicked:', item)
  }

  // Example 2: Custom breadcrumb items
  const customItems: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Investeringer', href: '/investments' },
    { label: 'Aksjer', href: '/stocks', isActive: true },
  ]

  // Example 3: Custom route mapping
  const customRouteMap = {
    dashboard: 'Hjem',
    investments: 'Mine Investeringer',
    stocks: 'Aksjeportefølje',
    crypto: 'Kryptovaluta',
    settings: 'Systeminnstillinger',
  }

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Wireframe Breadcrumb Demo
        </h1>

        {/* Example 1: Auto-generated breadcrumb */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            1. Auto-generated Breadcrumb
          </h2>
          <p className="text-gray-600">
            Automatically generates breadcrumb from current pathname using default Norwegian labels
          </p>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <WireframeBreadcrumb onItemClick={handleItemClick} />
          </div>
          {selectedItem && (
            <p className="text-sm text-gray-500">
              Last clicked: {selectedItem.label} → {selectedItem.href}
            </p>
          )}
        </section>

        {/* Example 2: Custom breadcrumb items */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            2. Custom Breadcrumb Items
          </h2>
          <p className="text-gray-600">
            Manually specified breadcrumb items with custom structure
          </p>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <WireframeBreadcrumb 
              items={customItems}
              onItemClick={handleItemClick}
            />
          </div>
        </section>

        {/* Example 3: Custom route mapping */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            3. Custom Route Mapping
          </h2>
          <p className="text-gray-600">
            Custom Norwegian labels for different routes
          </p>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <WireframeBreadcrumb 
              routeMap={customRouteMap}
              onItemClick={handleItemClick}
            />
          </div>
        </section>

        {/* Example 4: Custom separator */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            4. Custom Separator
          </h2>
          <p className="text-gray-600">
            Using a different separator between breadcrumb items
          </p>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <WireframeBreadcrumb 
              separator=" / "
              onItemClick={handleItemClick}
            />
          </div>
        </section>

        {/* Example 5: Styling variants */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            5. Different Breadcrumb Paths
          </h2>
          <p className="text-gray-600">
            Examples of different breadcrumb paths as seen in wireframes
          </p>
          
          <div className="space-y-2">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <WireframeBreadcrumb 
                items={[
                  { label: 'Dashboard', href: '/dashboard', isActive: true }
                ]}
              />
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <WireframeBreadcrumb 
                items={[
                  { label: 'Dashboard', href: '/dashboard' },
                  { label: 'Investeringer', href: '/investments', isActive: true }
                ]}
              />
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <WireframeBreadcrumb 
                items={[
                  { label: 'Dashboard', href: '/dashboard' },
                  { label: 'Investeringer', href: '/investments' },
                  { label: 'Aksjer', href: '/stocks', isActive: true }
                ]}
              />
            </div>
          </div>
        </section>

        {/* Code examples */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Usage Examples
          </h2>
          
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
{`// Basic usage - auto-generated from pathname
<WireframeBreadcrumb />

// With custom items
<WireframeBreadcrumb 
  items={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Investeringer', href: '/investments' },
    { label: 'Aksjer', href: '/stocks', isActive: true }
  ]}
/>

// With custom route mapping
<WireframeBreadcrumb 
  routeMap={{
    dashboard: 'Hjem',
    investments: 'Mine Investeringer',
    stocks: 'Aksjeportefølje'
  }}
/>

// With click handler
<WireframeBreadcrumb 
  onItemClick={(item) => {
    console.log('Navigating to:', item.href)
    router.push(item.href)
  }}
/>`}
            </pre>
          </div>
        </section>
      </div>
    </div>
  )
}