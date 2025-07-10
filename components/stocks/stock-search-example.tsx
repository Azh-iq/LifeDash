/**
 * Example component showing how to use the enhanced StockSearch
 * with holdings filtering for sell transactions
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StockSearch, StockSearchResult } from './stock-search'

export function StockSearchExample() {
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(
    null
  )
  const [transactionType, setTransactionType] = useState<'BUY' | 'SELL'>('BUY')
  const [portfolioId] = useState('your-portfolio-id') // Replace with actual portfolio ID

  const handleStockSelect = (stock: StockSearchResult) => {
    setSelectedStock(stock)
    console.log('Selected stock:', stock)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Stock Search Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Transaction Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Transaction Type</label>
            <div className="flex gap-2">
              <Button
                variant={transactionType === 'BUY' ? 'default' : 'outline'}
                onClick={() => setTransactionType('BUY')}
              >
                Buy
              </Button>
              <Button
                variant={transactionType === 'SELL' ? 'default' : 'outline'}
                onClick={() => setTransactionType('SELL')}
              >
                Sell
              </Button>
            </div>
          </div>

          {/* Stock Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Stocks</label>
            <StockSearch
              onSelect={handleStockSelect}
              placeholder={
                transactionType === 'SELL'
                  ? 'Search your holdings...'
                  : 'Search stocks...'
              }
              holdingsOnly={transactionType === 'SELL'}
              portfolioId={portfolioId}
            />
          </div>

          {/* Selected Stock Information */}
          {selectedStock && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Selected Stock</label>
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="font-medium">{selectedStock.symbol}</div>
                <div className="text-sm text-gray-600">
                  {selectedStock.name}
                </div>
                <div className="text-sm text-gray-500">
                  {selectedStock.exchange} • {selectedStock.currency}
                </div>

                {/* Show holdings information if available */}
                {transactionType === 'SELL' && selectedStock.quantity && (
                  <div className="mt-2 border-t border-gray-200 pt-2">
                    <div className="text-sm text-gray-600">
                      Holdings: {selectedStock.quantity} shares
                    </div>
                    <div className="text-sm text-gray-600">
                      Average Cost: {selectedStock.average_cost?.toFixed(2)}{' '}
                      {selectedStock.currency}
                    </div>
                    <div className="text-sm text-gray-600">
                      Account: {selectedStock.account_name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode Information */}
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-gray-600">
            <strong>Current Mode:</strong>{' '}
            {transactionType === 'SELL' ? 'Holdings Only' : 'All Stocks'}
            <br />
            {transactionType === 'SELL'
              ? 'Only stocks you own are shown for sale transactions.'
              : 'All stocks from the registry are shown for buy transactions.'}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
