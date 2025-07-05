// Test script for Nordnet CSV Parser
// This script validates the parsing functionality with sample data

import { NordnetCSVParser } from './csv-parser'
import { NordnetFieldMapper } from './field-mapping'
import { NordnetTransactionTransformer } from './transaction-transformer'

// Test data as would be read from the sample CSV file
const sampleCSVText = `Id	Bokføringsdag	Handelsdag	Oppgjørsdag	Portefølje	Transaksjonstype	Verdipapir	ISIN	Antall	Kurs	Rente	Totale Avgifter	Valuta	Beløp	Valuta	Kjøpsverdi	Valuta	Resultat	Valuta	Totalt antall	Saldo	Vekslingskurs	Transaksjonstekst	Makuleringsddato	Sluttseddelnummer	Verifikasjonsnummer	Kurtasje	Valuta	Valutakurs	Innledende rente
213948411	2025-06-24	2025-06-24	2025-06-25	551307769	KJØPT	Hims & Hers Health A	US4330001060	66	42,7597	0	99	NOK	-28706,04	NOK	2831,91	USD	0	USD	131	179,97	10,1366				99	NOK	10,1366	0
213948412	2025-06-25	2025-06-25	2025-06-26	551307769	SALG	Apple Inc	US0378331005	50	180,25	0	99	NOK	9012,50	NOK	9012,50	USD	450,75	USD	0	9012,50	10,1366				99	NOK	10,1366	0
213948413	2025-06-26	2025-06-26	2025-06-27	551307769	Utbetaling aksjelån	Microsoft Corporation	US5949181045	0	0	0	0	NOK	120,00	NOK	0	USD	0	USD	100	120,00	10,1366	Kvartalsvis utbytte			0	NOK	10,1366	0
213948414	2025-06-27	2025-06-27	2025-06-28	551307769	Overføring via Trustly				0	0	0	0	NOK	50000,00	NOK	0	NOK	0	NOK	0	50000,00	1,0000	Innskudd fra bankkonto			0	NOK	1,0000	0
213948415	2025-06-28	2025-06-28	2025-06-29	551307769	FORSIKRINGSKOSTNAD				0	0	0	25	NOK	-25,00	NOK	0	NOK	0	NOK	0	49975,00	1,0000	Månedsavgift depot			25	NOK	1,0000	0`

export class NordnetParserTester {
  static async runTests(): Promise<void> {
    console.log('🧪 Starting Nordnet CSV Parser Tests...\n')

    try {
      // Test 1: CSV Structure Validation
      await this.testCSVStructureValidation()

      // Test 2: Data Parsing
      await this.testDataParsing()

      // Test 3: Field Mapping
      await this.testFieldMapping()

      // Test 4: Data Transformation
      await this.testDataTransformation()

      // Test 5: Transaction Type Validation
      await this.testTransactionTypeValidation()

      // Test 6: Currency and Portfolio Detection
      await this.testCurrencyAndPortfolioDetection()

      console.log('✅ All tests completed successfully!')

    } catch (error) {
      console.error('❌ Test failed:', error)
      throw error
    }
  }

  private static async testCSVStructureValidation(): Promise<void> {
    console.log('📋 Test 1: CSV Structure Validation')

    // Create a mock file object
    const mockFile = {
      name: 'nordnet-export.csv',
      size: sampleCSVText.length,
      type: 'text/csv'
    } as File

    const validation = NordnetCSVParser.validateFile(mockFile)
    console.log('  File validation:', validation.valid ? '✅ Valid' : '❌ Invalid')
    if (!validation.valid) {
      console.log('  Error:', validation.error)
    }

    // Parse the CSV text directly
    const parseResult = NordnetCSVParser.parseCSVText(sampleCSVText.replace(/\t/g, '\t'))
    console.log(`  Headers found: ${parseResult.headers.length}`)
    console.log(`  Rows parsed: ${parseResult.totalRows}`)
    console.log(`  Errors: ${parseResult.errors.length}`)
    console.log(`  Sample headers: ${parseResult.headers.slice(0, 5).join(', ')}...`)

    if (parseResult.errors.length > 0) {
      console.log('  Parse errors:', parseResult.errors)
    }

    console.log('')
  }

  private static async testDataParsing(): Promise<void> {
    console.log('🔍 Test 2: Data Parsing')

    const parseResult = NordnetCSVParser.parseCSVText(sampleCSVText)
    
    if (parseResult.totalRows > 0) {
      const firstRow = parseResult.rows[0]
      console.log('  First row data:')
      console.log(`    Id: ${firstRow['Id']}`)
      console.log(`    Bokføringsdag: ${firstRow['Bokføringsdag']}`)
      console.log(`    Transaksjonstype: ${firstRow['Transaksjonstype']}`)
      console.log(`    Verdipapir: ${firstRow['Verdipapir']}`)
      console.log(`    ISIN: ${firstRow['ISIN']}`)
      console.log(`    Antall: ${firstRow['Antall']}`)
      console.log(`    Beløp: ${firstRow['Beløp']}`)
      console.log(`    Valuta: ${firstRow['Valuta']}`)
    }

    console.log('')
  }

  private static async testFieldMapping(): Promise<void> {
    console.log('🗺️ Test 3: Field Mapping')

    const parseResult = NordnetCSVParser.parseCSVText(sampleCSVText)
    
    // Test auto-detection
    const autoMappings = NordnetFieldMapper.autoDetectMappings(parseResult.headers)
    console.log(`  Auto-detected mappings: ${autoMappings.length}`)
    
    // Test validation
    const validation = NordnetFieldMapper.validateMappings(autoMappings, parseResult.headers)
    console.log(`  Mapping validation: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`)
    
    if (validation.errors.length > 0) {
      console.log('  Mapping errors:', validation.errors)
    }

    if (validation.warnings.length > 0) {
      console.log('  Mapping warnings:', validation.warnings)
    }

    // Show some key mappings
    const keyMappings = autoMappings.filter(m => 
      ['id', 'booking_date', 'transaction_type', 'amount'].includes(m.internalField)
    )
    
    console.log('  Key mappings:')
    for (const mapping of keyMappings) {
      console.log(`    ${mapping.csvField} → ${mapping.internalField} (${mapping.dataType})`)
    }

    console.log('')
  }

  private static async testDataTransformation(): Promise<void> {
    console.log('🔄 Test 4: Data Transformation')

    const parseResult = NordnetCSVParser.parseCSVText(sampleCSVText)
    const mappings = NordnetFieldMapper.autoDetectMappings(parseResult.headers)

    if (parseResult.totalRows > 0) {
      const firstRow = parseResult.rows[0]
      const transformed = NordnetFieldMapper.transformRow(firstRow, mappings)
      
      console.log('  Transformed data:')
      console.log(`    ID: ${transformed.id}`)
      console.log(`    Booking Date: ${transformed.booking_date}`)
      console.log(`    Transaction Type: ${transformed.transaction_type} → ${transformed.internal_transaction_type}`)
      console.log(`    Security: ${transformed.security_name}`)
      console.log(`    ISIN: ${transformed.isin}`)
      console.log(`    Quantity: ${transformed.quantity}`)
      console.log(`    Price: ${transformed.price}`)
      console.log(`    Amount: ${transformed.amount}`)
      console.log(`    Currency: ${transformed.currency}`)
      console.log(`    Portfolio: ${transformed.portfolio_name} → ${transformed.account_name}`)
      console.log(`    Needs Stock Lookup: ${transformed.needs_stock_lookup}`)
      
      console.log(`  Validation Errors: ${transformed.validation_errors.length}`)
      if (transformed.validation_errors.length > 0) {
        transformed.validation_errors.forEach(error => console.log(`    - ${error}`))
      }
      
      console.log(`  Validation Warnings: ${transformed.validation_warnings.length}`)
      if (transformed.validation_warnings.length > 0) {
        transformed.validation_warnings.forEach(warning => console.log(`    - ${warning}`))
      }
    }

    console.log('')
  }

  private static async testTransactionTypeValidation(): Promise<void> {
    console.log('📊 Test 5: Transaction Type Validation')

    const parseResult = NordnetCSVParser.parseCSVText(sampleCSVText)
    
    // Extract unique transaction types
    const transactionTypes = Array.from(new Set(
      parseResult.rows.map(row => row['Transaksjonstype'])
    )).filter(Boolean)

    console.log(`  Found transaction types: ${transactionTypes.length}`)
    
    const validation = NordnetCSVParser.validateTransactionTypes(transactionTypes)
    
    console.log(`  Recognized types: ${validation.recognized.length}`)
    validation.recognized.forEach(type => console.log(`    ✅ ${type}`))
    
    console.log(`  Unrecognized types: ${validation.unrecognized.length}`)
    validation.unrecognized.forEach(type => {
      const suggestion = validation.suggestions[type]
      console.log(`    ❓ ${type}${suggestion ? ` (suggest: ${suggestion})` : ''}`)
    })

    console.log('')
  }

  private static async testCurrencyAndPortfolioDetection(): Promise<void> {
    console.log('💰 Test 6: Currency and Portfolio Detection')

    const parseResult = NordnetCSVParser.parseCSVText(sampleCSVText)
    
    // Extract unique values
    const portfolios = Array.from(new Set(
      parseResult.rows.map(row => row['Portefølje'])
    )).filter(Boolean)
    
    const currencies = Array.from(new Set(
      parseResult.rows.map(row => row['Valuta'])
    )).filter(Boolean)

    console.log(`  Portfolios found: ${portfolios.length}`)
    portfolios.forEach(portfolio => console.log(`    📁 ${portfolio}`))
    
    console.log(`  Currencies found: ${currencies.length}`)
    currencies.forEach(currency => console.log(`    💱 ${currency}`))

    // Validate portfolios
    const portfolioValidation = NordnetCSVParser.validatePortfolios(portfolios)
    console.log(`  Valid portfolios: ${portfolioValidation.valid.length}`)
    console.log(`  Invalid portfolios: ${portfolioValidation.invalid.length}`)
    
    for (const [portfolio, pattern] of Object.entries(portfolioValidation.patterns)) {
      console.log(`    ${portfolio} → ${pattern}`)
    }

    // Validate currencies
    const currencyValidation = NordnetCSVParser.validateCurrencies(currencies)
    console.log(`  Recognized currencies: ${currencyValidation.recognized.length}`)
    console.log(`  Unrecognized currencies: ${currencyValidation.unrecognized.length}`)

    console.log('')
  }

  static generateSampleFile(): void {
    console.log('📁 Generating sample Nordnet CSV file...')
    const sampleData = NordnetCSVParser.generateSampleCSV()
    console.log('Sample CSV data:')
    console.log(sampleData)
    console.log('')
  }
}

// Export test function for use in development
export async function testNordnetParser(): Promise<void> {
  await NordnetParserTester.runTests()
}

// For direct execution in development
if (typeof window === 'undefined' && require.main === module) {
  testNordnetParser().catch(console.error)
}