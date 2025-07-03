'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { createPortfolio, updatePortfolio } from '@/lib/actions/portfolio/crud'
import { cn } from '@/lib/utils'
import type { Portfolio } from '@/lib/hooks/use-portfolio'

interface PortfolioFormProps {
  portfolio?: Portfolio | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: (portfolio: Portfolio) => void
  mode?: 'create' | 'edit'
}

const portfolioTypes = [
  { value: 'INVESTMENT', label: 'Investment', description: 'General investment portfolio' },
  { value: 'RETIREMENT', label: 'Retirement', description: '401(k), IRA, and retirement accounts' },
  { value: 'SAVINGS', label: 'Savings', description: 'Conservative savings and bonds' },
  { value: 'TRADING', label: 'Trading', description: 'Active trading and speculation' },
] as const

export function PortfolioForm({ 
  portfolio, 
  isOpen, 
  onClose, 
  onSuccess,
  mode = 'create' 
}: PortfolioFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: portfolio?.name || '',
    description: portfolio?.description || '',
    type: portfolio?.type || 'INVESTMENT',
    is_public: portfolio?.is_public || false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formDataObj = new FormData()
      formDataObj.append('name', formData.name)
      formDataObj.append('description', formData.description)
      formDataObj.append('type', formData.type)
      formDataObj.append('is_public', formData.is_public.toString())

      let result
      if (mode === 'edit' && portfolio) {
        formDataObj.append('id', portfolio.id)
        result = await updatePortfolio(formDataObj)
      } else {
        result = await createPortfolio(formDataObj)
      }

      if (result.success) {
        onSuccess?.(result.data)
        onClose()
        router.refresh()
      } else {
        setError(result.error || 'Failed to save portfolio')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null) // Clear error when user starts typing
  }

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'edit' ? 'Edit Portfolio' : 'Create New Portfolio'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {mode === 'edit' 
              ? 'Update your portfolio details below'
              : 'Set up a new portfolio to track your investments'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Portfolio Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Portfolio Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="My Investment Portfolio"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              className="w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Brief description of this portfolio's purpose..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Portfolio Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Portfolio Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {portfolioTypes.map((type) => (
                <div
                  key={type.value}
                  className={cn(
                    'relative border rounded-lg p-4 cursor-pointer transition-all',
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                  onClick={() => handleInputChange('type', type.value)}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={() => handleInputChange('type', type.value)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">{type.label}</h3>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="is_public"
                checked={formData.is_public}
                onChange={(e) => handleInputChange('is_public', e.target.checked)}
                className="mt-1 text-blue-600 focus:ring-blue-500 rounded"
              />
              <div>
                <label htmlFor="is_public" className="font-medium text-gray-900 cursor-pointer">
                  Make this portfolio public
                </label>
                <p className="text-sm text-gray-600">
                  Public portfolios can be viewed by other users (holdings remain private)
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading || !formData.name.trim()}
            >
              {loading 
                ? (mode === 'edit' ? 'Updating...' : 'Creating...') 
                : (mode === 'edit' ? 'Update Portfolio' : 'Create Portfolio')
              }
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

// Simplified inline form for quick creation
export function QuickPortfolioForm({ onSuccess }: { onSuccess?: (portfolio: Portfolio) => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', '')
      formData.append('type', 'INVESTMENT')
      formData.append('is_public', 'false')

      const result = await createPortfolio(formData)

      if (result.success) {
        onSuccess?.(result.data)
        setName('')
      } else {
        setError(result.error || 'Failed to create portfolio')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Quick Create</h3>
          <Input
            type="text"
            placeholder="Portfolio name..."
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError(null)
            }}
            className="w-full"
          />
        </div>
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        
        <Button
          type="submit"
          size="sm"
          loading={loading}
          disabled={loading || !name.trim()}
          className="w-full"
        >
          {loading ? 'Creating...' : 'Create Portfolio'}
        </Button>
      </form>
    </Card>
  )
}