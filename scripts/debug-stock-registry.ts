// Debug stock registry
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const serviceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQzIfVcfC-e4RDP3q5sI6Y'
const supabase = createClient(supabaseUrl, serviceKey)

async function debugStockRegistry() {
  console.log('🔍 Debugging stock registry...')

  try {
    // Test specific symbol
    console.log('\n1. Testing EQNR.OL query...')
    const { data: eqnrData, error: eqnrError } = await supabase
      .from('stock_registry')
      .select('*')
      .eq('symbol', 'EQNR.OL')

    console.log('EQNR.OL result:', eqnrData)
    console.log('EQNR.OL error:', eqnrError)

    // Get first few Norwegian stocks
    console.log('\n2. Getting Norwegian stocks...')
    const { data: norwegianStocks, error: norError } = await supabase
      .from('stock_registry')
      .select('symbol, name, exchange')
      .ilike('symbol', '%.OL')
      .limit(5)

    console.log('Norwegian stocks:', norwegianStocks)
    console.log('Norwegian error:', norError)

    // Get first few US stocks
    console.log('\n3. Getting US stocks...')
    const { data: usStocks, error: usError } = await supabase
      .from('stock_registry')
      .select('symbol, name, exchange')
      .eq('exchange', 'NASDAQ')
      .limit(5)

    console.log('US stocks:', usStocks)
    console.log('US error:', usError)

    // Test creating a stock
    console.log('\n4. Testing stock creation...')
    if (norwegianStocks && norwegianStocks.length > 0) {
      const testStock = norwegianStocks[0]
      console.log('Using test stock:', testStock)

      const { data: newStock, error: createError } = await supabase
        .from('stocks')
        .insert({
          symbol: testStock.symbol,
          name: testStock.name,
          exchange: testStock.exchange,
          currency: 'NOK',
          asset_class: 'STOCK',
        })
        .select()

      console.log('Created stock:', newStock)
      console.log('Create error:', createError)
    }
  } catch (error) {
    console.error('Debug error:', error)
  }
}

debugStockRegistry()
