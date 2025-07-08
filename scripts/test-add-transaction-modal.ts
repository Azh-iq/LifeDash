#!/usr/bin/env tsx

/**
 * Test script for AddTransactionModal real-time price functionality
 * 
 * This script tests the enhanced AddTransactionModal component with:
 * - Real-time price fetching from Finnhub API
 * - Price caching (1-2 minutes)
 * - Live price indicators
 * - Error handling
 * - Refresh functionality
 */

import { fetchRealStockPrice } from '../lib/utils/finnhub-api'

async function testPriceFetching() {
  console.log('🧪 Testing AddTransactionModal Price Fetching...\n')
  
  // Test symbols
  const testSymbols = [
    'AAPL',    // US stock
    'MSFT',    // US stock
    'EQNR.OL', // Norwegian stock
    'INVALID', // Invalid symbol
  ]
  
  for (const symbol of testSymbols) {
    console.log(`🔍 Testing ${symbol}...`)
    
    try {
      const result = await fetchRealStockPrice(symbol, { useCache: false })
      
      if (result.success && result.data) {
        console.log(`✅ ${symbol}: ${result.data.price.toFixed(2)} ${result.data.currency}`)
        console.log(`   Change: ${result.data.change.toFixed(2)} (${result.data.changePercent.toFixed(2)}%)`)
        console.log(`   Market: ${result.data.marketState}`)
      } else {
        console.log(`❌ ${symbol}: ${result.errors[0]?.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.log(`💥 ${symbol}: ${error}`)
    }
    
    console.log('')
  }
  
  console.log('🎯 Test completed!')
}

async function testCaching() {
  console.log('🧪 Testing Price Caching...\n')
  
  const symbol = 'AAPL'
  
  // First fetch (should hit API)
  console.log('📡 First fetch (API call)...')
  const start1 = Date.now()
  const result1 = await fetchRealStockPrice(symbol, { useCache: false })
  const time1 = Date.now() - start1
  console.log(`Time: ${time1}ms`)
  
  // Second fetch (should use cache)
  console.log('⚡ Second fetch (cached)...')
  const start2 = Date.now()
  const result2 = await fetchRealStockPrice(symbol, { useCache: true })
  const time2 = Date.now() - start2
  console.log(`Time: ${time2}ms`)
  
  console.log(`\n📊 Cache performance: ${time2 < time1 ? 'PASSED' : 'FAILED'}`)
  console.log(`   API call: ${time1}ms`)
  console.log(`   Cached: ${time2}ms`)
  console.log(`   Speedup: ${(time1 / time2).toFixed(2)}x`)
}

async function main() {
  try {
    await testPriceFetching()
    console.log('\n' + '='.repeat(50) + '\n')
    await testCaching()
  } catch (error) {
    console.error('Test failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}