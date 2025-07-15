'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { ArrowLeft, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NorwegianBreadcrumb } from '@/components/ui/norwegian-breadcrumb'
import { LoadingState } from '@/components/ui/loading-states'
import { BrokerConnectionCard } from '@/components/brokers/broker-connection-card'
import AddBrokerModal from '@/components/brokers/add-broker-modal'
import { toast } from 'sonner'

interface BrokerConnection {
  id: string
  broker_id: string
  display_name: string
  status: 'connected' | 'disconnected' | 'error' | 'expired' | 'pending'
  last_synced_at?: string
  error_message?: string
  created_at: string
}

export default function BrokerConnectionsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [connections, setConnections] = useState<BrokerConnection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      setUser(session.user)
      await loadConnections()
    }

    checkAuth()
  }, [router])

  const loadConnections = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('brokerage_connections')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading connections:', error)
        toast.error('Kunne ikke laste tilkoblinger')
        return
      }

      setConnections(data || [])
    } catch (error) {
      console.error('Error loading connections:', error)
      toast.error('Kunne ikke laste tilkoblinger')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadConnections()
    setIsRefreshing(false)
    toast.success('Tilkoblinger oppdatert')
  }

  const handleConnectionAdded = (connection: any) => {
    setShowAddModal(false)
    loadConnections() // Refresh the list
    toast.success(`${connection.display_name} ble tilkoblet`)
  }

  const handleSync = async (connectionId: string) => {
    try {
      const response = await fetch('/api/brokers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId })
      })

      if (!response.ok) {
        throw new Error('Synkronisering feilet')
      }

      toast.success('Synkronisering startet')
      setTimeout(() => loadConnections(), 2000) // Refresh after 2 seconds
    } catch (error) {
      console.error('Sync error:', error)
      toast.error('Synkronisering feilet')
    }
  }

  const handleDisconnect = async (connectionId: string) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('brokerage_connections')
        .update({ status: 'disconnected' })
        .eq('id', connectionId)

      if (error) {
        throw error
      }

      toast.success('Tilkobling fjernet')
      loadConnections()
    } catch (error) {
      console.error('Disconnect error:', error)
      toast.error('Kunne ikke fjerne tilkobling')
    }
  }

  const getBrokerIcon = (brokerId: string) => {
    const icons: Record<string, string> = {
      'plaid': '🇺🇸',
      'schwab': '🏦', 
      'interactive_brokers': '🌍',
      'nordnet': '🇳🇴'
    }
    return icons[brokerId] || '🔗'
  }

  const getBrokerName = (brokerId: string) => {
    const names: Record<string, string> = {
      'plaid': 'Plaid (USA Meglere)',
      'schwab': 'Charles Schwab',
      'interactive_brokers': 'Interactive Brokers', 
      'nordnet': 'Nordnet'
    }
    return names[brokerId] || brokerId
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="flex min-h-screen items-center justify-center">
          <LoadingState
            variant="widget"
            size="lg"
            text="Laster tilkoblinger..."
            className="text-center"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <NorwegianBreadcrumb />
      </div>

      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tilbake
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Megler Tilkoblinger
              </h1>
              <p className="text-gray-600">
                Administrer dine tilkoblinger til meglere og banker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Oppdater
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ny Tilkobling
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {connections.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
              <Plus className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Ingen tilkoblinger ennå
            </h3>
            <p className="mb-6 text-gray-600">
              Kom i gang ved å koble til din første megler eller bank
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Legg til første tilkobling
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {connections.map((connection) => (
              <BrokerConnectionCard
                key={connection.id}
                connection={{
                  id: connection.id,
                  broker_id: connection.broker_id,
                  display_name: connection.display_name,
                  status: connection.status,
                  last_synced_at: connection.last_synced_at,
                  error_message: connection.error_message,
                  created_at: connection.created_at,
                  icon: getBrokerIcon(connection.broker_id),
                  broker_name: getBrokerName(connection.broker_id)
                }}
                onSync={() => handleSync(connection.id)}
                onDisconnect={() => handleDisconnect(connection.id)}
              />
            ))}
          </div>
        )}

        {/* Stats Section */}
        {connections.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{connections.length}</p>
              <p className="text-sm text-gray-600">Totale tilkoblinger</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {connections.filter(c => c.status === 'connected').length}
              </p>
              <p className="text-sm text-gray-600">Aktive</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-red-600">
                {connections.filter(c => c.status === 'error').length}
              </p>
              <p className="text-sm text-gray-600">Feil</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {connections.filter(c => c.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-600">Venter</p>
            </div>
          </div>
        )}
      </main>

      {/* Add Broker Modal */}
      <AddBrokerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleConnectionAdded}
      />
    </div>
  )
}