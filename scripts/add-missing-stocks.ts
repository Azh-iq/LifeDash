// Add missing stocks from stock_registry to stocks table
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

// Using service key to bypass RLS for stock creation
const serviceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQzIfVcfC-e4RDP3q5sI6Y'
const supabaseService = createClient(supabaseUrl, serviceKey)

async function addMissingStocks() {
  console.log('🔍 Adding missing stocks from registry to stocks table...')

  try {
    // Key stocks that should exist for our test transactions
    const requiredSymbols = [
      'EQNR.OL',
      'DNB.OL',
      'TEL.OL',
      'MOWI.OL',
      'YAR.OL',
      'SALM.OL', // Norwegian stocks
      'META',
      'AMZN',
      'V',
      'JNJ',
      'WMT',
      'HD', // US stocks
    ]

    for (const symbol of requiredSymbols) {
      console.log(`\n📈 Processing ${symbol}...`)

      // Check if stock exists in stocks table
      const { data: existingStock } = await supabaseService
        .from('stocks')
        .select('*')
        .eq('symbol', symbol)
        .single()

      if (existingStock) {
        console.log(`✅ ${symbol} already exists in stocks table`)
        continue
      }

      // Get stock data from registry
      const { data: registryStock } = await supabaseService
        .from('stock_registry')
        .select('*')
        .eq('symbol', symbol)
        .single()

      if (!registryStock) {
        console.log(`⚠️  ${symbol} not found in stock registry`)
        continue
      }

      // Create stock entry using service key to bypass RLS
      const { data: newStock, error: stockError } = await supabaseService
        .from('stocks')
        .insert({
          symbol: registryStock.symbol,
          name: registryStock.name,
          company_name: registryStock.company_name || registryStock.name,
          exchange: registryStock.exchange,
          currency: registryStock.currency,
          sector: registryStock.sector,
          industry: registryStock.industry,
          country_code: registryStock.country === 'NO' ? 'NO' : 'US',
          asset_class: 'STOCK',
          is_active: true,
          is_tradeable: true,
        })
        .select()
        .single()

      if (stockError) {
        console.error(`❌ Error creating stock ${symbol}:`, stockError.message)
        continue
      }

      console.log(`✅ Created stock: ${symbol} (${registryStock.name})`)
    }

    // Verify total stocks in table now
    const { count: stocksCount } = await supabaseService
      .from('stocks')
      .select('*', { count: 'exact', head: true })

    console.log(`\n📊 Total stocks in stocks table: ${stocksCount}`)
  } catch (error) {
    console.error('❌ Error adding missing stocks:', error)
    throw error
  }
}

// Run the script
if (require.main === module) {
  addMissingStocks()
    .then(() => {
      console.log('\n🎉 Missing stocks added successfully!')
      console.log(
        'You can now run the transaction script again to add more transactions'
      )
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Failed to add missing stocks:', error)
      process.exit(1)
    })
}

export { addMissingStocks }
