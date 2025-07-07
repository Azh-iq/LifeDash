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
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Norwegian Breadcrumb Component Demo
        </h1>
        <p className="mx-auto max-w-2xl text-gray-600">
          Demonstrasjon av den norske brødsmule-komponenten med alle funksjoner
          og konfigurasjonsmuligheter.
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
                Automatisk generering av brødsmule-navigasjon basert på
                gjeldende URL-sti.
              </p>
              <div className="rounded-lg border bg-gray-50 p-4">
                <NorwegianBreadcrumb />
              </div>
              <div className="font-mono text-xs text-gray-500">
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
                Bruk customRoutes for å definere egne etiketter og ikoner for
                spesifikke ruter.
              </p>
              <div className="rounded-lg border bg-gray-50 p-4">
                <NorwegianBreadcrumb
                  customRoutes={customRoutes}
                  onBreadcrumbClick={handleBreadcrumbClick}
                />
              </div>
              <div className="rounded bg-gray-100 p-2 text-xs text-gray-500">
                <strong>customRoutes:</strong> Definerer tilpassede etiketter og
                ikoner
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
                <h4 className="text-sm font-semibold">Uten ikoner</h4>
                <div className="rounded-lg border bg-gray-50 p-3">
                  <NorwegianBreadcrumb showIcons={false} />
                </div>
              </div>

              {/* Without Home Icon */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Uten hjemmeikon</h4>
                <div className="rounded-lg border bg-gray-50 p-3">
                  <NorwegianBreadcrumb showHomeIcon={false} />
                </div>
              </div>

              {/* Without Hover Effects */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Uten hover-effekter</h4>
                <div className="rounded-lg border bg-gray-50 p-3">
                  <NorwegianBreadcrumb enableHoverEffects={false} />
                </div>
              </div>

              {/* Limited Items */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">
                  Begrenset antall elementer (maxItems=3)
                </h4>
                <div className="rounded-lg border bg-gray-50 p-3">
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
                Komponenten tilpasser seg automatisk til mobile enheter med
                kollapsbar funksjonalitet.
              </p>
              <div className="rounded-lg border bg-gray-50 p-4">
                <div className="mb-2 text-xs text-gray-500">
                  Endre vindusstørrelse for å se mobil versjon
                </div>
                <NorwegianBreadcrumb className="w-full" />
              </div>
              <div className="rounded bg-blue-50 p-2 text-xs text-gray-500">
                <strong>Mobil:</strong> Viser forkortet versjon med "..." for
                lange stier
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
                <h4 className="text-sm font-semibold">Grunnleggende bruk</h4>
                <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-xs">
                  {`import { NorwegianBreadcrumb } from '@/components/ui/norwegian-breadcrumb'

<NorwegianBreadcrumb />`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Med tilpassede ruter</h4>
                <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-xs">
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
                <h4 className="text-sm font-semibold">Alle alternativer</h4>
                <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-xs">
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-purple-600">
                  Automatisk
                </h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Automatisk rute-oppdaging</li>
                  <li>• Norske etiketter</li>
                  <li>• Responsive design</li>
                  <li>• Mobiloptimalisert</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-purple-600">
                  Tilpassbar
                </h4>
                <ul className="space-y-1 text-sm text-gray-600">
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
                Test navigasjon ved å klikke på knappene nedenfor for å simulere
                forskjellige sider.
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
