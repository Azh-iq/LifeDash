#!/usr/bin/env node
/**
 * Test script to verify the holdings filter functionality
 */

import { fetchUserHoldingsForSale } from '../lib/actions/holdings/fetch-holdings'

async function testHoldingsFilter() {
  try {
    console.log('Testing holdings filter functionality...')
    
    // Test fetching holdings without portfolio filter
    console.log('\n1. Testing fetchUserHoldingsForSale without portfolio filter:')
    const allHoldings = await fetchUserHoldingsForSale()
    console.log('Result:', allHoldings)
    
    // Test fetching holdings with portfolio filter
    console.log('\n2. Testing fetchUserHoldingsForSale with portfolio filter:')
    const portfolioHoldings = await fetchUserHoldingsForSale('test-portfolio-id')
    console.log('Result:', portfolioHoldings)
    
    console.log('\n✅ Holdings filter test completed successfully!')
  } catch (error) {
    console.error('❌ Holdings filter test failed:', error)
  }
}

testHoldingsFilter()