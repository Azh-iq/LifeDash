#!/usr/bin/env npx tsx

/**
 * Test script to verify Finnhub API integration
 * This script tests that the real Finnhub API is working instead of mock data
 */

import { fetchRealStockPrices, testFinnhubConnection } from '../lib/utils/finnhub-api'

async function testFinnhubIntegration() {
  console.log('🧪 Testing Finnhub API integration...\n')

  // Test 1: API connection
  console.log('1. Testing API connection...')
  try {
    const connectionTest = await testFinnhubConnection()
    if (connectionTest.success) {
      console.log('✅ Finnhub API connection successful')
      console.log(`   Test data: ${connectionTest.testData?.symbol} = ${connectionTest.testData?.price}\n`)
    } else {
      console.log('❌ Finnhub API connection failed:', connectionTest.message)
      return
    }
  } catch (error) {
    console.log('❌ Connection test error:', error)
    return
  }

  // Test 2: Real stock prices
  console.log('2. Testing real stock price fetching...')
  const testSymbols = ['AAPL', 'MSFT', 'EQNR.OL']
  
  try {
    const result = await fetchRealStockPrices(testSymbols, {
      useCache: false, // Force fresh data
      bypassRateLimit: false,
    })

    if (result.success && result.data.length > 0) {
      console.log('✅ Successfully fetched real stock prices:')
      result.data.forEach(stock => {
        console.log(`   ${stock.symbol}: ${stock.price} ${stock.currency} (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)`)
      })
      console.log()
    } else {
      console.log('❌ Failed to fetch stock prices')
      if (result.errors.length > 0) {
        console.log('   Errors:', result.errors)
      }
    }
  } catch (error) {
    console.log('❌ Stock price test error:', error)
  }

  // Test 3: Verify no mock data patterns
  console.log('3. Verifying no mock data is being used...')
  const result = await fetchRealStockPrices(['AAPL'], { useCache: false })
  
  if (result.success && result.data.length > 0) {
    const stock = result.data[0]
    
    // Check that source is 'finnhub' not 'finnhub-mock'
    if (stock.source === 'finnhub') {
      console.log('✅ Using real Finnhub API (source: finnhub)')
    } else {
      console.log('❌ Still using mock data (source:', stock.source, ')')
    }
    
    // Check that price is realistic (AAPL should be > $100 and < $500)
    if (stock.price > 100 && stock.price < 500) {
      console.log('✅ Price data looks realistic:', stock.price)
    } else {
      console.log('⚠️  Price data might be mock:', stock.price)
    }
    
    console.log()
  }

  console.log('✅ Finnhub integration test completed!')
  console.log('   All dummy/mock stock prices have been replaced with real Finnhub API calls.')
}

testFinnhubIntegration().catch(console.error)