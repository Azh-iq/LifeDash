'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { usePortfolios, type Portfolio } from '@/lib/hooks/use-portfolio'
import { createPortfolio, updatePortfolio, deletePortfolio } from '@/lib/actions/portfolio/crud'
import { AmountDisplay } from '@/components/shared/currency/amount-display'
import { cn } from '@/lib/utils'

export default function TestPortfolioRealtimePage() {
  const { portfolios, loading, error, refresh } = usePortfolios()
  const [testPortfolio, setTestPortfolio] = useState<Portfolio | null>(null)
  const [newName, setNewName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)])
  }

  // Track portfolio changes
  useEffect(() => {
    if (testPortfolio) {
      const currentPortfolio = portfolios.find(p => p.id === testPortfolio.id)
      if (currentPortfolio && currentPortfolio.name !== testPortfolio.name) {
        addLog(`Portfolio name updated: "${testPortfolio.name}" → "${currentPortfolio.name}"`)
        setTestPortfolio(currentPortfolio)
      }
    }
  }, [portfolios, testPortfolio])

  const createTestPortfolio = async () => {
    setIsCreating(true)
    addLog('Creating test portfolio...')
    
    try {
      const formData = new FormData()
      formData.append('name', 'Test Portfolio')
      formData.append('description', 'Portfolio created for real-time testing')
      formData.append('type', 'INVESTMENT')
      formData.append('is_public', 'false')

      const result = await createPortfolio(formData)
      
      if (result.success) {
        setTestPortfolio(result.data)
        setNewName(result.data.name)
        addLog(`✅ Portfolio created: "${result.data.name}"`)
      } else {
        addLog(`❌ Failed to create portfolio: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ Error creating portfolio: ${error}`)
    } finally {
      setIsCreating(false)
    }
  }

  const updateTestPortfolio = async () => {
    if (!testPortfolio || !newName.trim()) return

    setIsUpdating(true)
    addLog(`Updating portfolio name to: "${newName}"`)
    
    try {
      const formData = new FormData()
      formData.append('id', testPortfolio.id)
      formData.append('name', newName)
      formData.append('description', testPortfolio.description || '')
      formData.append('type', testPortfolio.type)
      formData.append('is_public', testPortfolio.is_public.toString())

      const result = await updatePortfolio(formData)
      
      if (result.success) {
        addLog(`✅ Portfolio update initiated`)
        // The real-time subscription should update the UI automatically
      } else {
        addLog(`❌ Failed to update portfolio: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ Error updating portfolio: ${error}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteTestPortfolio = async () => {
    if (!testPortfolio) return

    setIsDeleting(true)
    addLog(`Deleting portfolio: "${testPortfolio.name}"`)
    
    try {
      const result = await deletePortfolio(testPortfolio.id)
      
      if (result.success) {
        addLog(`✅ Portfolio deleted successfully`)
        setTestPortfolio(null)
        setNewName('')
      } else {
        addLog(`❌ Failed to delete portfolio: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ Error deleting portfolio: ${error}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio Real-time Test</h1>
          <p className="text-gray-600">
            Test the real-time updates for portfolio CRUD operations
          </p>
        </div>

        {/* Test Controls */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Test Controls</h2>
              
              {!testPortfolio ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Create a test portfolio to begin testing real-time updates
                  </p>
                  <Button 
                    onClick={createTestPortfolio}
                    loading={isCreating}
                    disabled={isCreating}
                    className="w-full"
                  >
                    {isCreating ? 'Creating...' : 'Create Test Portfolio'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Portfolio Name
                    </label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Enter new name..."
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button 
                      onClick={updateTestPortfolio}
                      loading={isUpdating}
                      disabled={isUpdating || !newName.trim() || newName === testPortfolio.name}
                      className="flex-1"
                    >
                      {isUpdating ? 'Updating...' : 'Update Name'}
                    </Button>
                    <Button 
                      onClick={deleteTestPortfolio}
                      loading={isDeleting}
                      disabled={isDeleting}
                      variant="destructive"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Current Test Portfolio */}
            {testPortfolio && (
              <Card className="p-6">
                <h3 className="font-semibold mb-3">Current Test Portfolio</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{testPortfolio.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID:</span>
                    <span className="font-mono text-xs">{testPortfolio.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <Badge variant="secondary">{testPortfolio.type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span>{new Date(testPortfolio.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Activity Log */}
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Activity Log</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No activity yet...</p>
                ) : (
                  logs.map((log, index) => (
                    <div 
                      key={index} 
                      className="text-xs font-mono text-gray-700 py-1 border-b border-gray-100 last:border-0"
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
              {logs.length > 0 && (
                <button 
                  onClick={() => setLogs([])}
                  className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                >
                  Clear log
                </button>
              )}
            </Card>
          </div>

          {/* Right Column - All Portfolios */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">All Portfolios</h2>
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    loading ? 'bg-yellow-500 animate-pulse' : error ? 'bg-red-500' : 'bg-green-500'
                  )}></div>
                  <span className="text-xs text-gray-600">
                    {loading ? 'Loading' : error ? 'Error' : 'Connected'}
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="animate-pulse p-3 bg-gray-100 rounded-lg">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <p className="text-red-600 text-sm mb-2">{error}</p>
                  <Button size="sm" onClick={refresh}>Retry</Button>
                </div>
              ) : portfolios.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No portfolios found</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {portfolios.map((portfolio) => (
                    <div 
                      key={portfolio.id} 
                      className={cn(
                        'p-3 rounded-lg border transition-colors',
                        portfolio.id === testPortfolio?.id 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200'
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {portfolio.name}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {portfolio.holdings_count} holdings
                          </p>
                        </div>
                        <div className="text-right">
                          <AmountDisplay 
                            amount={portfolio.total_value} 
                            size="sm" 
                            className="font-medium"
                          />
                          {portfolio.id === testPortfolio?.id && (
                            <Badge variant="default" className="ml-2 text-xs">
                              Test
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Real-time Instructions */}
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Testing Instructions</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="font-medium text-blue-600">1.</span>
                  <span>Create a test portfolio using the button above</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium text-blue-600">2.</span>
                  <span>Change the portfolio name and click "Update Name"</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium text-blue-600">3.</span>
                  <span>Watch the portfolio list update in real-time without page refresh</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium text-blue-600">4.</span>
                  <span>Check the activity log for confirmation of updates</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium text-blue-600">5.</span>
                  <span>Delete the test portfolio to clean up</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}