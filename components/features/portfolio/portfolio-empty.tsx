'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PortfolioForm, QuickPortfolioForm } from './portfolio-form'
import type { Portfolio } from '@/lib/hooks/use-portfolio'

interface PortfolioEmptyProps {
  onPortfolioCreated?: (portfolio: Portfolio) => void
}

export function PortfolioEmpty({ onPortfolioCreated }: PortfolioEmptyProps) {
  const [showForm, setShowForm] = useState(false)
  const [showQuickCreate, setShowQuickCreate] = useState(false)

  const handleSuccess = (portfolio: Portfolio) => {
    onPortfolioCreated?.(portfolio)
    setShowForm(false)
    setShowQuickCreate(false)
  }

  return (
    <>
      <div className="text-center py-12">
        {/* Hero Section */}
        <div className="max-w-md mx-auto">
          {/* Icon */}
          <div className="mx-auto w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <svg 
              className="w-12 h-12 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
              />
            </svg>
          </div>

          {/* Title and Description */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Start Your Investment Journey
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Create your first portfolio to track investments, monitor performance, and achieve your financial goals. 
            Whether you're saving for retirement or building wealth, we'll help you stay organized.
          </p>

          {/* Primary Actions */}
          <div className="space-y-3 mb-8">
            <Button 
              onClick={() => setShowForm(true)}
              size="lg"
              className="w-full sm:w-auto px-8"
            >
              Create Your First Portfolio
            </Button>
            <div className="text-sm text-gray-500">
              or{' '}
              <button 
                onClick={() => setShowQuickCreate(!showQuickCreate)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                quick create
              </button>
            </div>
          </div>

          {/* Quick Create Form */}
          {showQuickCreate && (
            <div className="mb-8">
              <QuickPortfolioForm onSuccess={handleSuccess} />
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="max-w-4xl mx-auto mt-16">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            What you can do with portfolios:
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="p-6 text-left">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Track Performance</h4>
              <p className="text-sm text-gray-600">
                Monitor your investments in real-time with detailed analytics and performance metrics.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6 text-left">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Organize by Goals</h4>
              <p className="text-sm text-gray-600">
                Separate investments for retirement, trading, and long-term wealth building.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6 text-left">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Smart Insights</h4>
              <p className="text-sm text-gray-600">
                Get personalized recommendations and insights to optimize your portfolio.
              </p>
            </Card>
          </div>
        </div>

        {/* Getting Started Steps */}
        <div className="max-w-2xl mx-auto mt-16">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Getting started is easy:
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-4 text-left">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Create a Portfolio</h4>
                <p className="text-sm text-gray-600">Give it a name and choose the type that matches your investment strategy.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 text-left">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Add Your Holdings</h4>
                <p className="text-sm text-gray-600">Track stocks, ETFs, and other investments with automatic price updates.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 text-left">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Monitor & Optimize</h4>
                <p className="text-sm text-gray-600">Watch your performance and get insights to make smarter investment decisions.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary CTA */}
        <div className="mt-12">
          <Button 
            onClick={() => setShowForm(true)}
            variant="outline"
            size="lg"
          >
            Start Building Your Portfolio
          </Button>
        </div>
      </div>

      {/* Portfolio Form Modal */}
      <PortfolioForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleSuccess}
        mode="create"
      />
    </>
  )
}

// Simplified empty state for when portfolios exist but list is filtered/empty
export function PortfolioEmptyFiltered({ 
  onCreateNew 
}: { 
  onCreateNew?: () => void 
}) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolios found</h3>
      <p className="text-gray-600 mb-4">
        Try adjusting your filters or create a new portfolio.
      </p>
      {onCreateNew && (
        <Button onClick={onCreateNew} variant="outline">
          Create New Portfolio
        </Button>
      )}
    </div>
  )
}