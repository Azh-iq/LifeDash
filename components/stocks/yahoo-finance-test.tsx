'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStockPrices } from '@/lib/hooks/use-stock-prices'
import { formatCurrency, formatPercentage } from '@/lib/utils/format'
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react'

const TEST_SYMBOLS = ['EQNR.OL', 'DNB.OL', 'AAPL', 'TSLA', 'MSFT']

export default function YahooFinanceTest() {
  const [testSymbols, setTestSymbols] = useState<string[]>([])
  
  const { prices, loading, error, lastUpdate, marketStatus, refresh } = useStockPrices(testSymbols, {
    refreshInterval: 30,
    enabled: testSymbols.length > 0
  })

  const handleStartTest = () => {
    setTestSymbols(TEST_SYMBOLS)
  }

  const handleStopTest = () => {
    setTestSymbols([])
  }

  return (
    <div className="space-y-6 p-6 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Yahoo Finance API Test</h3>
        <div className="flex gap-2">
          <Button
            onClick={handleStartTest}
            disabled={loading || testSymbols.length > 0}
            size="sm"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Start Test
          </Button>
          <Button
            onClick={handleStopTest}
            disabled={testSymbols.length === 0}
            variant="outline"
            size="sm"
          >
            Stop Test
          </Button>
          <Button
            onClick={refresh}
            disabled={testSymbols.length === 0 || loading}
            variant="outline"
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Market Status */}
      <div className="flex items-center gap-4">
        <Badge variant={marketStatus.isOpen ? "default" : "secondary"}>
          Market: {marketStatus.isOpen ? 'Open' : 'Closed'}
        </Badge>
        {lastUpdate && (
          <span className="text-sm text-gray-500">
            Last update: {new Date(lastUpdate).toLocaleTimeString('no-NO')}
          </span>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && testSymbols.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Fetching stock prices...</span>
        </div>
      )}

      {/* Results */}
      {testSymbols.length > 0 && Object.keys(prices).length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Live Prices:</h4>
          <div className="grid gap-3">
            {Object.values(prices).map((price) => (
              <div
                key={price.symbol}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold">{price.symbol}</span>
                  <Badge variant="outline" className="text-xs">
                    {price.currency}
                  </Badge>
                  <Badge variant={price.marketState === 'REGULAR' ? 'default' : 'secondary'} className="text-xs">
                    {price.marketState}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono font-bold">
                      {formatCurrency(price.price, price.currency)}
                    </div>
                    <div className={`text-sm flex items-center gap-1 ${
                      price.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {price.change >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {formatCurrency(Math.abs(price.change), price.currency)} 
                      ({formatPercentage(price.changePercent)})
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {testSymbols.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Click "Start Test" to fetch real-time prices from Yahoo Finance API</p>
          <p className="text-sm mt-2">Test symbols: {TEST_SYMBOLS.join(', ')}</p>
        </div>
      )}
    </div>
  )
}