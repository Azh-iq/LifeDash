'use client'

import { StockPrice } from '@/lib/hooks/use-stock-prices'

// Realistic base prices for common Norwegian and US stocks
const BASE_STOCK_PRICES: { [symbol: string]: { price: number; currency: string } } = {
  // Norwegian stocks (NOK)
  'EQNR.OL': { price: 280.50, currency: 'NOK' },
  'DNB.OL': { price: 185.20, currency: 'NOK' },
  'TEL.OL': { price: 120.80, currency: 'NOK' },
  'NHY.OL': { price: 61.75, currency: 'NOK' },
  'SALM.OL': { price: 520.00, currency: 'NOK' },
  'MOWI.OL': { price: 210.50, currency: 'NOK' },
  'YAR.OL': { price: 385.50, currency: 'NOK' },
  'AKER.OL': { price: 425.00, currency: 'NOK' },
  
  // US stocks (USD)
  'AAPL': { price: 190.50, currency: 'USD' },
  'TSLA': { price: 242.80, currency: 'USD' },
  'MSFT': { price: 410.20, currency: 'USD' },
  'GOOGL': { price: 140.75, currency: 'USD' },
  'AMZN': { price: 145.30, currency: 'USD' },
  'NVDA': { price: 875.25, currency: 'USD' },
  'META': { price: 485.60, currency: 'USD' },
  'NFLX': { price: 490.20, currency: 'USD' },
}

// Store for maintaining price continuity between calls
let priceCache: { [symbol: string]: { price: number; lastUpdate: number; trend: number } } = {}

/**
 * Generate realistic stock price with small variations
 */
function generateRealisticPrice(symbol: string): StockPrice {
  const baseData = BASE_STOCK_PRICES[symbol]
  if (!baseData) {
    throw new Error(`Unknown symbol: ${symbol}`)
  }

  const now = Date.now()
  const cached = priceCache[symbol]
  
  let currentPrice: number
  let trend: number
  
  if (cached && now - cached.lastUpdate < 30000) { // Use cached price for 30 seconds
    currentPrice = cached.price
    trend = cached.trend
  } else {
    // Initialize or update price
    const basePrice = baseData.price
    
    if (!cached) {
      // First time - start near base price with slight variation
      currentPrice = basePrice * (0.98 + Math.random() * 0.04)
      trend = (Math.random() - 0.5) * 0.002 // Initial trend
    } else {
      // Update existing price with realistic movement
      const timeDelta = (now - cached.lastUpdate) / 1000 / 60 // minutes
      const volatility = symbol.includes('.OL') ? 0.015 : 0.02 // Norwegian stocks less volatile
      
      // Mean reversion towards base price
      const meanReversion = (basePrice - cached.price) * 0.001
      
      // Random walk with trend
      const randomChange = (Math.random() - 0.5) * volatility * Math.sqrt(timeDelta)
      
      // Update trend (trend persistence with some randomness)
      trend = cached.trend * 0.9 + (Math.random() - 0.5) * 0.001
      
      currentPrice = cached.price * (1 + meanReversion + randomChange + trend)
      
      // Prevent extreme movements
      currentPrice = Math.max(basePrice * 0.8, Math.min(basePrice * 1.2, currentPrice))
    }
    
    // Cache the new price
    priceCache[symbol] = {
      price: currentPrice,
      lastUpdate: now,
      trend: trend
    }
  }
  
  // Calculate daily change (simulated)
  const previousClose = baseData.price * (0.995 + Math.random() * 0.01)
  const change = currentPrice - previousClose
  const changePercent = (change / previousClose) * 100
  
  // Determine market state based on time (Norwegian time)
  const norwayTime = new Date().toLocaleString("en-US", {timeZone: "Europe/Oslo"})
  const hour = new Date(norwayTime).getHours()
  const isNorwegianStock = symbol.includes('.OL')
  
  let marketState: 'REGULAR' | 'CLOSED' | 'PRE' | 'POST'
  if (isNorwegianStock) {
    // Oslo Stock Exchange: 9:00-16:30 CET
    marketState = (hour >= 9 && hour < 17) ? 'REGULAR' : 'CLOSED'
  } else {
    // US markets: 9:30-16:00 EST (15:30-22:00 CET)
    marketState = (hour >= 15 && hour < 22) ? 'REGULAR' : 'CLOSED'
  }
  
  return {
    symbol,
    price: Math.round(currentPrice * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    volume: Math.floor(Math.random() * 1000000) + 100000,
    timestamp: new Date().toISOString(),
    currency: baseData.currency,
    marketState,
    source: 'mock_api'
  }
}

/**
 * Mock implementation to replace Yahoo Finance API
 */
export async function fetchMockStockPrices(symbols: string[]): Promise<{
  success: boolean
  data: StockPrice[]
  errors: Array<{ code: string; message: string; timestamp: string }>
  fromCache: boolean
}> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))
  
  const data: StockPrice[] = []
  const errors: Array<{ code: string; message: string; timestamp: string }> = []
  
  for (const symbol of symbols) {
    try {
      const price = generateRealisticPrice(symbol)
      data.push(price)
    } catch (error) {
      errors.push({
        code: 'SYMBOL_NOT_FOUND',
        message: `No data available for symbol: ${symbol}`,
        timestamp: new Date().toISOString()
      })
    }
  }
  
  return {
    success: true,
    data,
    errors,
    fromCache: false
  }
}

/**
 * Get list of supported symbols
 */
export function getSupportedSymbols(): string[] {
  return Object.keys(BASE_STOCK_PRICES)
}

/**
 * Check if a symbol is supported
 */
export function isSymbolSupported(symbol: string): boolean {
  return symbol in BASE_STOCK_PRICES
}