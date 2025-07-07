'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  fetchRealStockPrices, 
  testFinnhubConnection,
  getNorwegianStockSymbols,
  getUSStockSymbols,
  type StockPrice 
} from '@/lib/utils/finnhub-api'

export default function FinnhubTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<{
    connection?: { success: boolean; message: string; testData?: StockPrice }
    norwegianStocks?: { success: boolean; data: StockPrice[]; errors: any[] }
    usStocks?: { success: boolean; data: StockPrice[]; errors: any[] }
  }>({})

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const result = await testFinnhubConnection()
      setTestResults(prev => ({ ...prev, connection: result }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        connection: {
          success: false,
          message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }))
    }
    setIsLoading(false)
  }

  const testNorwegianStocks = async () => {
    setIsLoading(true)
    try {
      const symbols = ['EQNR.OL', 'DNB.OL']
      const result = await fetchRealStockPrices(symbols, { useCache: false })
      setTestResults(prev => ({ ...prev, norwegianStocks: result }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        norwegianStocks: {
          success: false,
          data: [],
          errors: [{
            code: 'TEST_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error'
          }]
        }
      }))
    }
    setIsLoading(false)
  }

  const testUSStocks = async () => {
    setIsLoading(true)
    try {
      const symbols = ['AAPL', 'TSLA']
      const result = await fetchRealStockPrices(symbols, { useCache: false })
      setTestResults(prev => ({ ...prev, usStocks: result }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        usStocks: {
          success: false,
          data: [],
          errors: [{
            code: 'TEST_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error'
          }]
        }
      }))
    }
    setIsLoading(false)
  }

  const formatPrice = (price: number, currency: string) => {
    return `${price.toFixed(2)} ${currency}`
  }

  const formatChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0
    return (
      <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
        {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
      </span>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Finnhub API Test
          <Badge variant="outline">Ekte Data</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Test */}
        <div className="space-y-2">
          <Button 
            onClick={testConnection} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Test API Connection
          </Button>
          {testResults.connection && (
            <div className={`p-3 rounded border ${
              testResults.connection.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <p className="text-sm font-medium">
                {testResults.connection.success ? '✅' : '❌'} {testResults.connection.message}
              </p>
              {testResults.connection.testData && (
                <div className="mt-2 text-xs">
                  <p><strong>AAPL:</strong> {formatPrice(testResults.connection.testData.price, testResults.connection.testData.currency)}</p>
                  <p><strong>Change:</strong> {formatChange(testResults.connection.testData.change, testResults.connection.testData.changePercent)}</p>
                  <p><strong>Market:</strong> {testResults.connection.testData.marketState}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Norwegian Stocks Test */}
        <div className="space-y-2">
          <Button 
            onClick={testNorwegianStocks} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Test Norske Aksjer (EQNR.OL, DNB.OL)
          </Button>
          {testResults.norwegianStocks && (
            <div className={`p-3 rounded border ${
              testResults.norwegianStocks.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <p className="text-sm font-medium mb-2">
                {testResults.norwegianStocks.success ? '✅' : '❌'} Norske Aksjer
              </p>
              {testResults.norwegianStocks.data.map(stock => (
                <div key={stock.symbol} className="text-xs mb-1">
                  <strong>{stock.symbol}:</strong> {formatPrice(stock.price, stock.currency)} - {formatChange(stock.change, stock.changePercent)}
                </div>
              ))}
              {testResults.norwegianStocks.errors.length > 0 && (
                <p className="text-xs text-red-600 mt-2">
                  Errors: {testResults.norwegianStocks.errors.map(e => e.message).join(', ')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* US Stocks Test */}
        <div className="space-y-2">
          <Button 
            onClick={testUSStocks} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Test Amerikanske Aksjer (AAPL, TSLA)
          </Button>
          {testResults.usStocks && (
            <div className={`p-3 rounded border ${
              testResults.usStocks.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <p className="text-sm font-medium mb-2">
                {testResults.usStocks.success ? '✅' : '❌'} Amerikanske Aksjer
              </p>
              {testResults.usStocks.data.map(stock => (
                <div key={stock.symbol} className="text-xs mb-1">
                  <strong>{stock.symbol}:</strong> {formatPrice(stock.price, stock.currency)} - {formatChange(stock.change, stock.changePercent)}
                </div>
              ))}
              {testResults.usStocks.errors.length > 0 && (
                <p className="text-xs text-red-600 mt-2">
                  Errors: {testResults.usStocks.errors.map(e => e.message).join(', ')}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="pt-2 border-t text-xs text-gray-500">
          <p><strong>API Info:</strong> Finnhub.io free tier (60 calls/minute)</p>
          <p><strong>Norwegian Support:</strong> {getNorwegianStockSymbols().join(', ')}</p>
          <p><strong>US Support:</strong> {getUSStockSymbols().slice(0, 4).join(', ')}...</p>
        </div>
      </CardContent>
    </Card>
  )
}