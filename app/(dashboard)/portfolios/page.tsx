'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { PortfolioForm } from '@/components/features/portfolio/portfolio-form'
import { PortfolioEmpty } from '@/components/features/portfolio/portfolio-empty'
import { usePortfolios, type Portfolio } from '@/lib/hooks/use-portfolio'
import { deletePortfolio } from '@/lib/actions/portfolio/crud'
import { AmountDisplay } from '@/components/shared/currency/amount-display'
import { cn } from '@/lib/utils'

const portfolioTypeColors = {
  INVESTMENT: 'bg-blue-100 text-blue-800',
  RETIREMENT: 'bg-green-100 text-green-800',
  SAVINGS: 'bg-yellow-100 text-yellow-800',
  TRADING: 'bg-purple-100 text-purple-800',
}

const portfolioTypeLabels = {
  INVESTMENT: 'Investment',
  RETIREMENT: 'Retirement',
  SAVINGS: 'Savings',
  TRADING: 'Trading',
}

export default function PortfoliosPage() {
  const router = useRouter()
  const { portfolios, loading, error, refresh } = usePortfolios()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null)
  const [deletingPortfolio, setDeletingPortfolio] = useState<Portfolio | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handlePortfolioClick = (portfolio: Portfolio) => {
    router.push(`/portfolios/${portfolio.id}` as any)
  }

  const handleEditPortfolio = (portfolio: Portfolio, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingPortfolio(portfolio)
  }

  const handleDeletePortfolio = async () => {
    if (!deletingPortfolio) return

    setDeleteLoading(true)
    try {
      const result = await deletePortfolio(deletingPortfolio.id)
      if (result.success) {
        setDeletingPortfolio(null)
        refresh()
      } else {
        console.error('Failed to delete portfolio:', result.error)
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const calculateGainLossPercentage = (portfolio: Portfolio) => {
    if (portfolio.total_cost === 0) return 0
    return ((portfolio.total_value - portfolio.total_cost) / portfolio.total_cost) * 100
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Portfolios</h1>
              <p className="text-gray-600">Manage and track your investment portfolios</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading portfolios</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refresh}>Try Again</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Portfolios</h1>
            <p className="text-gray-600">
              {portfolios.length > 0 
                ? `Manage and track your ${portfolios.length} investment portfolios`
                : 'Manage and track your investment portfolios'
              }
            </p>
          </div>
          {portfolios.length > 0 && (
            <Button onClick={() => setShowCreateForm(true)}>
              Create Portfolio
            </Button>
          )}
        </div>

        {/* Portfolio Grid or Empty State */}
        {portfolios.length === 0 ? (
          <PortfolioEmpty onPortfolioCreated={refresh} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((portfolio) => {
              const gainLossPercentage = calculateGainLossPercentage(portfolio)
              const isPositive = portfolio.total_gain_loss >= 0

              return (
                <Card
                  key={portfolio.id}
                  className="p-6 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handlePortfolioClick(portfolio)}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {portfolio.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {portfolio.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Badge className={portfolioTypeColors[portfolio.type]}>
                        {portfolioTypeLabels[portfolio.type]}
                      </Badge>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleEditPortfolio(portfolio, e)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Value */}
                  <div className="space-y-2 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Value</p>
                      <AmountDisplay 
                        amount={portfolio.total_value} 
                        size="lg" 
                        className="font-semibold"
                      />
                    </div>
                    
                    {portfolio.total_cost > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Gain/Loss</span>
                        <div className={cn(
                          'flex items-center space-x-1',
                          isPositive ? 'text-green-600' : 'text-red-600'
                        )}>
                          <AmountDisplay 
                            amount={portfolio.total_gain_loss} 
                            showSign 
                            className="font-medium"
                          />
                          <span className="font-medium">
                            ({isPositive ? '+' : ''}{gainLossPercentage.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Portfolio Stats */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Holdings</span>
                      <span className="font-medium">{portfolio.holdings_count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Created</span>
                      <span className="text-gray-900">{formatTimeAgo(portfolio.created_at)}</span>
                    </div>
                    {portfolio.is_public && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Visibility</span>
                        <Badge variant="secondary" className="text-xs">Public</Badge>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-4 pt-4 border-t">
                    <div className="flex justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingPortfolio(portfolio)
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                      <span className="text-sm text-gray-500">
                        Click to view →
                      </span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Create Portfolio Form */}
        <PortfolioForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSuccess={refresh}
          mode="create"
        />

        {/* Edit Portfolio Form */}
        <PortfolioForm
          portfolio={editingPortfolio}
          isOpen={!!editingPortfolio}
          onClose={() => setEditingPortfolio(null)}
          onSuccess={refresh}
          mode="edit"
        />

        {/* Delete Confirmation Modal */}
        <Modal
          open={!!deletingPortfolio}
          onOpenChange={(open) => !open && setDeletingPortfolio(null)}
        >
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Portfolio</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "<strong>{deletingPortfolio?.name}</strong>"? 
              This will permanently remove the portfolio and all its data.
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeletingPortfolio(null)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePortfolio}
                loading={deleteLoading}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Portfolio'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}