'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft, ExternalLink, Key, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AddBrokerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (connection: any) => void
}

type BrokerId = 'plaid' | 'schwab' | 'interactive_brokers' | 'nordnet'
type Step = 'select' | 'configure' | 'connecting' | 'success'

const brokers = [
  {
    id: 'plaid' as BrokerId,
    name: 'Plaid (USA Meglere)',
    icon: '🇺🇸',
    description: 'Koble til 1000+ amerikanske finansinstitusjoner',
    features: ['Fidelity', 'Robinhood', 'E*TRADE', 'TD Ameritrade', 'Charles Schwab'],
    authType: 'OAuth via Plaid Link',
    freeLimit: '200 API-kall per måned',
    difficulty: 'Enkel',
    setupTime: '2 minutter'
  },
  {
    id: 'schwab' as BrokerId,
    name: 'Charles Schwab',
    icon: '🏦',
    description: 'Direkte tilkobling til din Schwab-konto',
    features: ['Real-time data', 'Trading støtte', 'Alle kontotyper'],
    authType: 'OAuth 2.0',
    freeLimit: 'Gratis for individuelle utviklere',
    difficulty: 'Middels',
    setupTime: '5 minutter'
  },
  {
    id: 'interactive_brokers' as BrokerId,
    name: 'Interactive Brokers',
    icon: '🌍',
    description: 'Tilgang til globale markeder via IBKR',
    features: ['Globale markeder', 'Avanserte verktøy', 'Lave kostnader'],
    authType: 'TWS Gateway',
    freeLimit: 'Gratis for IBKR-kunder',
    difficulty: 'Avansert',
    setupTime: '10 minutter'
  },
  {
    id: 'nordnet' as BrokerId,
    name: 'Nordnet',
    icon: '🇳🇴',
    description: 'Nordiske markeder (Norge, Sverige, Danmark, Finland)',
    features: ['Nordiske aksjer', 'Fond og ETF', 'Pensjonssparing'],
    authType: 'SSH-nøkler',
    freeLimit: 'Gratis for Nordnet-kunder',
    difficulty: 'Middels',
    setupTime: '5 minutter'
  }
]

export default function AddBrokerModal({ isOpen, onClose, onSuccess }: AddBrokerModalProps) {
  const [step, setStep] = useState<Step>('select')
  const [selectedBroker, setSelectedBroker] = useState<BrokerId | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form states for different brokers
  const [plaidData, setPlaidData] = useState({ institutionName: '' })
  const [schwabData, setSchwabData] = useState({ accountType: '' })
  const [ibkrData, setIbkrData] = useState({ gatewayUrl: 'https://localhost:5000' })
  const [nordnetData, setNordnetData] = useState({
    apiKey: '',
    privateKey: '',
    country: 'no' as 'se' | 'no' | 'dk' | 'fi'
  })

  const handleBrokerSelect = (brokerId: BrokerId) => {
    setSelectedBroker(brokerId)
    setStep('configure')
    setError(null)
  }

  const handleBack = () => {
    setStep('select')
    setSelectedBroker(null)
    setError(null)
  }

  const handleClose = () => {
    setStep('select')
    setSelectedBroker(null)
    setError(null)
    setIsLoading(false)
    onClose()
  }

  const handleConnect = async () => {
    if (!selectedBroker) return
    
    setIsLoading(true)
    setError(null)
    setStep('connecting')

    try {
      switch (selectedBroker) {
        case 'plaid':
          await handlePlaidConnect()
          break
        case 'schwab':
          await handleSchwabConnect()
          break
        case 'interactive_brokers':
          await handleIBKRConnect()
          break
        case 'nordnet':
          await handleNordnetConnect()
          break
      }
    } catch (err: any) {
      setError(err.message || 'Tilkobling feilet')
      setStep('configure')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlaidConnect = async () => {
    // Create Link token
    const linkTokenResponse = await fetch('/api/brokers/plaid/link-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!linkTokenResponse.ok) {
      throw new Error('Kunne ikke generere Plaid Link token')
    }
    
    const { link_token } = await linkTokenResponse.json()
    
    // In a real implementation, you would load Plaid Link here
    // For now, we'll simulate the flow
    setStep('success')
    onSuccess({ broker_id: 'plaid', display_name: 'Plaid Connection' })
  }

  const handleSchwabConnect = async () => {
    // Get authorization URL
    const authResponse = await fetch('/api/brokers/schwab/auth', {
      method: 'GET'
    })
    
    if (!authResponse.ok) {
      throw new Error('Kunne ikke generere Schwab autorisasjons-URL')
    }
    
    const { auth_url } = await authResponse.json()
    
    // Redirect to Schwab OAuth
    window.location.href = auth_url
  }

  const handleIBKRConnect = async () => {
    // Check IBKR Gateway status
    const statusResponse = await fetch('/api/brokers/interactive-brokers/auth', {
      method: 'GET'
    })
    
    if (!statusResponse.ok) {
      throw new Error('Kunne ikke koble til IBKR Gateway')
    }
    
    const status = await statusResponse.json()
    
    if (!status.authenticated || !status.connected) {
      throw new Error(`IBKR Gateway er ikke autentisert. Gå til ${status.gateway_url} og logg inn først.`)
    }
    
    // Connect to IBKR
    const connectResponse = await fetch('/api/brokers/interactive-brokers/auth', {
      method: 'POST'
    })
    
    if (!connectResponse.ok) {
      throw new Error('IBKR-tilkobling feilet')
    }
    
    const result = await connectResponse.json()
    setStep('success')
    onSuccess(result)
  }

  const handleNordnetConnect = async () => {
    if (!nordnetData.apiKey || !nordnetData.privateKey) {
      throw new Error('API-nøkkel og privat nøkkel er påkrevd')
    }
    
    const connectResponse = await fetch('/api/brokers/nordnet/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nordnetData)
    })
    
    if (!connectResponse.ok) {
      const errorData = await connectResponse.json()
      throw new Error(errorData.error || 'Nordnet-tilkobling feilet')
    }
    
    const result = await connectResponse.json()
    setStep('success')
    onSuccess(result)
  }

  const renderConfigForm = () => {
    const broker = brokers.find(b => b.id === selectedBroker)
    if (!broker) return null

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-3">{broker.icon}</div>
          <h3 className="text-xl font-semibold">{broker.name}</h3>
          <p className="text-gray-600 text-sm">{broker.description}</p>
        </div>

        {selectedBroker === 'plaid' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Slik fungerer Plaid</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Klikk "Koble til" for å åpne Plaid Link</li>
                <li>2. Velg din bank eller megler</li>
                <li>3. Logg inn med dine vanlige påloggingsdetaljer</li>
                <li>4. Velg kontoene du vil koble til</li>
              </ol>
            </div>
          </div>
        )}

        {selectedBroker === 'schwab' && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium text-amber-900 mb-2">Krav for Schwab</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Aktiv Charles Schwab brokerage-konto</li>
                <li>• Godkjent developer-tilgang</li>
                <li>• Du vil bli omdirigert til Schwab for pålogging</li>
              </ul>
            </div>
          </div>
        )}

        {selectedBroker === 'interactive_brokers' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="gateway-url">Gateway URL</Label>
              <Input
                id="gateway-url"
                value={ibkrData.gatewayUrl}
                onChange={(e) => setIbkrData({ gatewayUrl: e.target.value })}
                placeholder="https://localhost:5000"
              />
            </div>
            
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">IBKR Gateway Setup</h4>
              <ol className="text-sm text-purple-800 space-y-1">
                <li>1. Last ned og start IBKR Client Portal Gateway</li>
                <li>2. Gå til Gateway URL og logg inn</li>
                <li>3. Sørg for at status viser "authenticated" og "connected"</li>
                <li>4. Kom tilbake hit og klikk "Koble til"</li>
              </ol>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.open(ibkrData.gatewayUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Åpne Gateway
              </Button>
            </div>
          </div>
        )}

        {selectedBroker === 'nordnet' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="country">Land</Label>
              <Select value={nordnetData.country} onValueChange={(value: any) => 
                setNordnetData({ ...nordnetData, country: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">🇳🇴 Norge</SelectItem>
                  <SelectItem value="se">🇸🇪 Sverige</SelectItem>
                  <SelectItem value="dk">🇩🇰 Danmark</SelectItem>
                  <SelectItem value="fi">🇫🇮 Finland</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="api-key">API-nøkkel</Label>
              <Input
                id="api-key"
                type="text"
                value={nordnetData.apiKey}
                onChange={(e) => setNordnetData({ ...nordnetData, apiKey: e.target.value })}
                placeholder="Din Nordnet API-nøkkel"
              />
            </div>
            
            <div>
              <Label htmlFor="private-key">SSH Privat Nøkkel (Ed25519)</Label>
              <Textarea
                id="private-key"
                value={nordnetData.privateKey}
                onChange={(e) => setNordnetData({ ...nordnetData, privateKey: e.target.value })}
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----
..."
                rows={4}
              />
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Nordnet API Setup</h4>
              <ol className="text-sm text-green-800 space-y-1">
                <li>1. Generer Ed25519 SSH-nøkkelpar</li>
                <li>2. Last opp public key til Nordnet-profilen din</li>
                <li>3. Få API-nøkkel fra Nordnet developer portal</li>
                <li>4. Lim inn private key og API-nøkkel over</li>
              </ol>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Tilkoblingsfeil</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
          <div className="flex items-center space-x-3">
            {step !== 'select' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-white hover:bg-white/20 p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h2 className="text-xl font-semibold">
                {step === 'select' && 'Koble til Megler'}
                {step === 'configure' && 'Konfigurer Tilkobling'}
                {step === 'connecting' && 'Kobler til...'}
                {step === 'success' && 'Tilkobling Vellykket!'}
              </h2>
              <p className="text-purple-100 text-sm">
                {step === 'select' && 'Velg en megler å koble til'}
                {step === 'configure' && 'Sett opp tilkobling til din megler'}
                {step === 'connecting' && 'Etablerer sikker tilkobling...'}
                {step === 'success' && 'Din megler er nå tilkoblet'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white hover:bg-white/20 p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {step === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid gap-4"
              >
                {brokers.map((broker) => (
                  <Card 
                    key={broker.id}
                    className="cursor-pointer transition-all hover:shadow-md hover:border-purple-200"
                    onClick={() => handleBrokerSelect(broker.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="text-3xl">{broker.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">{broker.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {broker.difficulty}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{broker.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="text-gray-500">Autentisering</p>
                              <p className="font-medium">{broker.authType}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Gratis grense</p>
                              <p className="font-medium">{broker.freeLimit}</p>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <p className="text-gray-500 text-xs mb-1">Støttede tjenester:</p>
                            <div className="flex flex-wrap gap-1">
                              {broker.features.map((feature, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}

            {step === 'configure' && (
              <motion.div
                key="configure"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {renderConfigForm()}
                
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                  <Button variant="outline" onClick={handleBack}>
                    Tilbake
                  </Button>
                  <Button 
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading ? 'Kobler til...' : 'Koble til'}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'connecting' && (
              <motion.div
                key="connecting"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Etablerer tilkobling...</h3>
                <p className="text-gray-600">Dette kan ta noen sekunder</p>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-8"
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tilkobling vellykket!</h3>
                <p className="text-gray-600 mb-6">
                  Din megler er nå tilkoblet og klar til bruk
                </p>
                <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">
                  Ferdig
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}