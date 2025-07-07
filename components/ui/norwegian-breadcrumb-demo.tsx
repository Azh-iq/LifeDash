'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { NorwegianBreadcrumb } from './norwegian-breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Settings, Star, Target } from 'lucide-react'

/**
 * Demo component showcasing the Norwegian Breadcrumb component
 * 
 * This file demonstrates all the features and usage patterns of the NorwegianBreadcrumb:
 * - Basic usage with automatic route detection
 * - Custom route mapping
 * - Different configuration options
 * - Click handlers and navigation
 * - Mobile responsive behavior
 * - Purple theme integration
 * - Animation effects
 */

const NorwegianBreadcrumbDemo = () => {
  const router = useRouter()

  // Example custom routes for demonstration
  const customRoutes = {
    'custom-section': { label: 'Tilpasset Seksjon', icon: Settings },
    'special-page': { label: 'Spesialside', icon: Star },
    'target-area': { label: 'Målområde', icon: Target },
  }

  const handleBreadcrumbClick = (href: string, segment: any) => {
    console.log('Breadcrumb clicked:', { href, segment })
    // Custom navigation logic can be added here
    // For example, analytics tracking, custom transitions, etc.
    router.push(href)
  }

  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Norwegian Breadcrumb Component Demo
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Demonstrasjon av den norske brødsmule-komponenten med alle funksjoner og konfigurasjonsmuligheter.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Basic Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Standard Brødsmule
              <Badge variant="secondary">Standard</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Automatisk generering av brødsmule-navigasjon basert på gjeldende URL-sti.
              </p>
              <div className="border rounded-lg p-4 bg-gray-50">
                <NorwegianBreadcrumb />
              </div>
              <div className="text-xs text-gray-500 font-mono">
                Eksempel: /dashboard → /investeringer → /aksjer
              </div>
            </div>
          </CardContent>
        </Card>

        {/* With Custom Routes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Med Tilpassede Ruter
              <Badge variant="outline">Tilpasset</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Bruk customRoutes for å definere egne etiketter og ikoner for spesifikke ruter.
              </p>
              <div className="border rounded-lg p-4 bg-gray-50">
                <NorwegianBreadcrumb
                  customRoutes={customRoutes}
                  onBreadcrumbClick={handleBreadcrumbClick}
                />
              </div>
              <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                <strong>customRoutes:</strong> Definerer tilpassede etiketter og ikoner
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Konfigurasjonsalternativer
              <Badge variant="destructive">Konfigurasjon</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              
              {/* Without Icons */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Uten ikoner</h4>
                <div className="border rounded-lg p-3 bg-gray-50">
                  <NorwegianBreadcrumb showIcons={false} />
                </div>
              </div>

              {/* Without Home Icon */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Uten hjemmeikon</h4>
                <div className="border rounded-lg p-3 bg-gray-50">
                  <NorwegianBreadcrumb showHomeIcon={false} />
                </div>
              </div>

              {/* Without Hover Effects */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Uten hover-effekter</h4>
                <div className="border rounded-lg p-3 bg-gray-50">
                  <NorwegianBreadcrumb enableHoverEffects={false} />
                </div>
              </div>

              {/* Limited Items */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Begrenset antall elementer (maxItems=3)</h4>
                <div className="border rounded-lg p-3 bg-gray-50">
                  <NorwegianBreadcrumb maxItems={3} />
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Mobile Responsive */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Mobil Responsivt
              <Badge variant="secondary">Responsivt</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Komponenten tilpasser seg automatisk til mobile enheter med kollapsbar funksjonalitet.
              </p>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="text-xs text-gray-500 mb-2">
                  Endre vindusstørrelse for å se mobil versjon
                </div>
                <NorwegianBreadcrumb className="w-full" />
              </div>
              <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                <strong>Mobil:</strong> Viser forkortet versjon med "..." for lange stier
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Code Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Kode Eksempler
              <Badge variant="outline">Utviklere</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Grunnleggende bruk</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`import { NorwegianBreadcrumb } from '@/components/ui/norwegian-breadcrumb'

<NorwegianBreadcrumb />`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Med tilpassede ruter</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`const customRoutes = {
  'min-side': { label: 'Min Side', icon: User },
  'innstillinger': { label: 'Innstillinger', icon: Settings }
}

<NorwegianBreadcrumb 
  customRoutes={customRoutes}
  onBreadcrumbClick={(href, segment) => {
    console.log('Navigering:', href)
    router.push(href)
  }}
/>`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Alle alternativer</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`<NorwegianBreadcrumb
  className="my-breadcrumb"
  maxItems={5}
  showIcons={true}
  showHomeIcon={true}
  enableHoverEffects={true}
  customRoutes={customRoutes}
  onBreadcrumbClick={handleClick}
/>`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Funksjoner Oversikt
              <Badge variant="default">Funksjoner</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-purple-600">Automatisk</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Automatisk rute-oppdaging</li>
                  <li>• Norske etiketter</li>
                  <li>• Responsive design</li>
                  <li>• Mobiloptimalisert</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-purple-600">Tilpassbar</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Egendefinerte ruter</li>
                  <li>• Ikoner og effekter</li>
                  <li>• Klikk-behandlere</li>
                  <li>• Lilla temaintegrasjon</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Navigasjonstest
              <Badge variant="secondary">Test</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Test navigasjon ved å klikke på knappene nedenfor for å simulere forskjellige sider.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                >
                  Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/investments')}
                >
                  Investeringer
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/investments/stocks')}
                >
                  Aksjer
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/investments/stocks/setup')}
                >
                  Aksjeoppsett
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/economy')}
                >
                  Økonomi
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/tools')}
                >
                  Verktøy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default NorwegianBreadcrumbDemo