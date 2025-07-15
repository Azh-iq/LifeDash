'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { NorwegianBreadcrumb } from '@/components/ui/norwegian-breadcrumb'
import { AutoSyncSettings } from '@/components/settings/auto-sync-settings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, RefreshCw, User, Shield, Bell, Database } from 'lucide-react'

type SettingsSection = 'sync' | 'profile' | 'security' | 'notifications' | 'data'

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('sync')

  const sections = [
    {
      id: 'sync' as SettingsSection,
      label: 'Synkronisering',
      icon: RefreshCw,
      description: 'Automatisk synkronisering av broker data'
    },
    {
      id: 'profile' as SettingsSection,
      label: 'Profil',
      icon: User,
      description: 'Personlig informasjon og kontoinnstillinger'
    },
    {
      id: 'security' as SettingsSection,
      label: 'Sikkerhet',
      icon: Shield,
      description: 'Passord og to-faktor autentisering'
    },
    {
      id: 'notifications' as SettingsSection,
      label: 'Notifikasjoner',
      icon: Bell,
      description: 'Email og push-notifikasjoner'
    },
    {
      id: 'data' as SettingsSection,
      label: 'Data & Eksport',
      icon: Database,
      description: 'Data eksport og backup innstillinger'
    }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'sync':
        return <AutoSyncSettings />
      case 'profile':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profil Innstillinger
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <div className="text-6xl mb-4">👤</div>
                <div className="text-lg mb-2">Profil innstillinger kommer snart</div>
                <div className="text-sm">Her kan du endre personlig informasjon</div>
              </div>
            </CardContent>
          </Card>
        )
      case 'security':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Sikkerhet Innstillinger
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <div className="text-6xl mb-4">🔒</div>
                <div className="text-lg mb-2">Sikkerhet innstillinger kommer snart</div>
                <div className="text-sm">Endre passord og sett opp 2FA</div>
              </div>
            </CardContent>
          </Card>
        )
      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifikasjon Innstillinger
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <div className="text-6xl mb-4">🔔</div>
                <div className="text-lg mb-2">Notifikasjon innstillinger kommer snart</div>
                <div className="text-sm">Konfigurer email og push notifikasjoner</div>
              </div>
            </CardContent>
          </Card>
        )
      case 'data':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data & Eksport Innstillinger
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <div className="text-6xl mb-4">💾</div>
                <div className="text-lg mb-2">Data innstillinger kommer snart</div>
                <div className="text-sm">Eksporter data og konfigurer backup</div>
              </div>
            </CardContent>
          </Card>
        )
      default:
        return <AutoSyncSettings />
    }
  }

  return (
    <DashboardLayout>
      <NorwegianBreadcrumb />
      
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Settings className="w-8 h-8" />
              Innstillinger
            </h1>
            <p className="text-gray-600 mt-1">Konfigurer LifeDash etter dine behov</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 space-y-2">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                      : 'hover:bg-gray-50 text-gray-700 border-2 border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div>
                    <div className="font-medium">{section.label}</div>
                    <div className="text-xs text-gray-500">{section.description}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}