// Nordnet CSV Parser
// Specialized parser for Nordnet CSV export files with intelligent field mapping

import { CSVParser } from '@/lib/utils/csv/parser'
import {
  NordnetCSVRow,
  NordnetParseResult,
  NordnetImportConfig,
  NordnetValidationResult,
  NORDNET_TRANSACTION_TYPES,
  NORDNET_PORTFOLIO_PATTERNS,
  NORDNET_CURRENCIES,
  NORWEGIAN_CHARS,
  ISIN_PATTERN,
  NORDNET_DATE_FORMATS,
} from './types'

export class NordnetCSVParser {
  private static readonly NORDNET_HEADERS = [
    'Id',
    'Bokføringsdag',
    'Handelsdag',
    'Oppgjørsdag',
    'Portefølje',
    'Transaksjonstype',
    'Verdipapir',
    'ISIN',
    'Antall',
    'Kurs',
    'Rente',
    'Totale Avgifter',
    'Valuta',
    'Beløp',
    'Kjøpsverdi',
    'Resultat',
    'Totalt antall',
    'Saldo',
    'Vekslingskurs',
    'Transaksjonstekst',
    'Makuleringsddato',
    'Sluttseddelnummer',
    'Verifikasjonsnummer',
    'Kurtasje',
    'Valutakurs',
    'Innledende rente',
  ]

  private static readonly REQUIRED_HEADERS = [
    'Id',
    'Bokføringsdag',
    'Transaksjonstype',
    'Portefølje',
    'Beløp',
    'Valuta',
  ]

  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  private static readonly SUPPORTED_EXTENSIONS = ['.csv', '.txt']

  /**
   * Validates if a file is likely a Nordnet CSV export
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds 50MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      }
    }

    // Check file extension
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    if (!this.SUPPORTED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `Unsupported file type. Please upload a CSV file (.csv or .txt)`,
      }
    }

    // Check filename patterns that suggest Nordnet export
    const filename = file.name.toLowerCase()
    const nordnetPatterns = [
      /nordnet/i,
      /transaksjoner/i,
      /transactions/i,
      /rapport/i,
      /export/i,
      /\d{8,12}.*\.csv$/i, // Numeric ID pattern
    ]

    const hasNordnetPattern = nordnetPatterns.some(pattern =>
      pattern.test(filename)
    )
    if (!hasNordnetPattern) {
      return {
        valid: true,
        error: `File name doesn't match typical Nordnet export patterns. Please verify this is a Nordnet CSV export file.`,
      }
    }

    return { valid: true }
  }

  /**
   * Detects the encoding of the CSV file
   */
  private static async detectEncoding(file: File): Promise<string> {
    try {
      // Read first 2KB to detect encoding (increased for better detection)
      const buffer = await file.slice(0, 2048).arrayBuffer()
      const bytes = new Uint8Array(buffer)

      // Check for BOM markers first - these are definitive indicators
      if (
        bytes.length >= 3 &&
        bytes[0] === 0xef &&
        bytes[1] === 0xbb &&
        bytes[2] === 0xbf
      ) {
        return 'utf-8'
      }

      // UTF-16 Little Endian BOM (most common for Norwegian Nordnet exports)
      if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
        return 'utf-16le'
      }

      // UTF-16 Big Endian BOM
      if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
        return 'utf-16be'
      }

      // Priority order: Windows-1252 first for Nordic banking exports
      // This is what Nordnet typically uses for Norwegian CSV files
      const encodings = ['windows-1252', 'iso-8859-1', 'utf-8']

      for (const encoding of encodings) {
        try {
          const decoder = new TextDecoder(encoding, { fatal: true })
          const text = decoder.decode(bytes)

          // Check for garbled text indicators (signs of wrong encoding)
          const hasGarbledText = this.detectGarbledText(text)
          if (hasGarbledText) {
            continue // Skip this encoding, it's producing garbled text
          }

          // Check for proper Norwegian characters (should be readable)
          const norwegianScore = this.calculateNorwegianScore(text)

          // Check for Nordnet-specific headers and content
          const nordnetScore = this.calculateNordnetScore(text)

          // Combined score for this encoding
          const totalScore = norwegianScore + nordnetScore

          // If we have a good score, use this encoding
          if (totalScore >= 2) {
            return encoding
          }

          // Special check for Windows-1252 with proper Norwegian characters
          if (encoding === 'windows-1252' && totalScore >= 1) {
            return encoding
          }
        } catch {
          continue // This encoding failed, try next
        }
      }

      // Fallback: Try UTF-8 with stricter validation
      try {
        const decoder = new TextDecoder('utf-8', { fatal: true })
        const text = decoder.decode(bytes)

        // Only accept UTF-8 if it doesn't contain replacement characters
        if (!text.includes('\uFFFD')) {
          return 'utf-8'
        }
      } catch {
        // UTF-8 decode failed
      }

      // Final fallback to Windows-1252 for Nordic banking files
      return 'windows-1252'
    } catch (error) {
      console.warn('Error detecting encoding:', error)
      return 'windows-1252' // Default to Windows-1252 for Norwegian files
    }
  }

  /**
   * Detects garbled text patterns that indicate wrong encoding
   */
  private static detectGarbledText(text: string): boolean {
    // Check for common garbled patterns
    const garbledPatterns = [
      /[��]/g, // Replacement characters
      /\s[A-Z]\s[a-z]\s[a-z]/g, // Spaced out letters like "B o k f"
      /[�]/g, // Question mark diamonds
      /\uFFFD/g, // Unicode replacement character
      /[A-Z]\s[a-z]\s[a-z]\s[a-z]/g, // More spaced patterns
    ]

    return garbledPatterns.some(pattern => pattern.test(text))
  }

  /**
   * Calculates a score for Norwegian character presence and readability
   */
  private static calculateNorwegianScore(text: string): number {
    let score = 0

    // Check for proper Norwegian characters
    const norwegianChars = /[æøåÆØÅ]/g
    const norwegianMatches = text.match(norwegianChars)
    if (norwegianMatches) {
      score += Math.min(norwegianMatches.length, 3) // Up to 3 points for Norwegian chars
    }

    // Check for Norwegian words common in financial contexts
    const norwegianWords = [
      'Bokføringsdag',
      'Handelsdag',
      'Oppgjørsdag',
      'Portefølje',
      'Transaksjonstype',
      'Verdipapir',
      'Kjøpsverdi',
      'Beløp',
      'Totale',
      'Avgifter',
      'Valuta',
      'Kurtasje',
      'Overføring',
    ]

    const foundWords = norwegianWords.filter(word => text.includes(word)).length

    if (foundWords >= 5) score += 2
    else if (foundWords >= 3) score += 1

    return score
  }

  /**
   * Calculates a score for Nordnet-specific content
   */
  private static calculateNordnetScore(text: string): number {
    let score = 0

    // Check for Nordnet-specific headers
    const nordnetHeaders = this.NORDNET_HEADERS.filter(header =>
      text.includes(header)
    )

    if (nordnetHeaders.length >= 10) score += 3
    else if (nordnetHeaders.length >= 6) score += 2
    else if (nordnetHeaders.length >= 3) score += 1

    // Check for transaction types
    const transactionTypes = ['KJØPT', 'SALG', 'UTBETALING']
    const foundTypes = transactionTypes.filter(type =>
      text.includes(type)
    ).length

    if (foundTypes >= 2) score += 1

    // Check for typical Nordnet patterns
    if (/\d{6,12}/.test(text)) score += 1 // Portfolio IDs
    if (/[A-Z]{2}[A-Z0-9]{9}[0-9]/.test(text)) score += 1 // ISIN codes
    if (/NOK|SEK|DKK|EUR|USD/.test(text)) score += 1 // Nordic currencies

    return score
  }

  /**
   * Detects the delimiter used in the CSV
   */
  private static detectDelimiter(text: string): string {
    const delimiters = ['\t', ';', ',', '|']
    let bestDelimiter = ','
    let maxColumns = 0

    for (const delimiter of delimiters) {
      const firstLine = text.split('\n')[0]
      const columns = firstLine.split(delimiter).length

      if (columns > maxColumns) {
        maxColumns = columns
        bestDelimiter = delimiter
      }
    }

    return bestDelimiter
  }

  /**
   * Normalizes Norwegian characters to ASCII equivalents
   */
  private static normalizeNorwegianText(text: string): string {
    let normalized = text
    for (const [norwegian, ascii] of Object.entries(NORWEGIAN_CHARS)) {
      normalized = normalized.replace(new RegExp(norwegian, 'g'), ascii)
    }
    return normalized
  }

  /**
   * Enhanced Norwegian character detection that works with UTF-16 encoding
   */
  private static hasNorwegianCharacters(text: string): boolean {
    // Check for Norwegian characters (æ, ø, å and their uppercase variants)
    const norwegianPattern = /[æøåÆØÅ]/

    // Also check for Norwegian words that are common in Nordnet exports
    const norwegianWords = [
      'Bokføringsdag',
      'Handelsdag',
      'Oppgjørsdag',
      'Portefølje',
      'Transaksjonstype',
      'Verdipapir',
      'Kjøpsverdi',
      'Beløp',
      'Totale',
      'Avgifter',
      'Valuta',
      'Kurtasje',
      'Overføring',
    ]

    return (
      norwegianPattern.test(text) ||
      norwegianWords.some(word => text.includes(word))
    )
  }

  /**
   * Validates that the CSV has the expected Nordnet structure
   */
  private static validateNordnetStructure(
    headers: string[]
  ): NordnetValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // Check for required headers
    const missingRequired = this.REQUIRED_HEADERS.filter(
      required =>
        !headers.some(header =>
          header.toLowerCase().includes(required.toLowerCase())
        )
    )

    if (missingRequired.length > 0) {
      errors.push(
        `Missing required Nordnet headers: ${missingRequired.join(', ')}`
      )
    }

    // Check for expected Nordnet headers
    const expectedHeaders = this.NORDNET_HEADERS
    const foundHeaders = headers.filter(header =>
      expectedHeaders.some(
        expected =>
          header.toLowerCase().includes(expected.toLowerCase()) ||
          expected.toLowerCase().includes(header.toLowerCase())
      )
    )

    if (foundHeaders.length < expectedHeaders.length * 0.6) {
      warnings.push(
        `Only ${foundHeaders.length} out of ${expectedHeaders.length} expected Nordnet headers found`
      )
      suggestions.push('Verify this is a Nordnet CSV export file')
    }

    // Check for suspicious patterns
    if (headers.some(header => /[^\x00-\x7F]/.test(header))) {
      warnings.push(
        'Non-ASCII characters detected in headers - encoding issues may occur'
      )
    }

    // Check header count
    if (headers.length < 10) {
      errors.push('Too few columns for a typical Nordnet export')
    } else if (headers.length > 50) {
      warnings.push('Unusually many columns - may include extra data')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    }
  }

  /**
   * Parses a Nordnet CSV file
   */
  static async parseFile(
    file: File,
    config?: Partial<NordnetImportConfig>
  ): Promise<NordnetParseResult> {
    const validation = this.validateFile(file)
    if (!validation.valid) {
      return {
        headers: [],
        rows: [],
        totalRows: 0,
        errors: [validation.error!],
        warnings: [],
        detectedEncoding: 'utf-8',
        detectedDelimiter: ',',
        hasNorwegianCharacters: false,
        portfolios: [],
        transactionTypes: [],
        currencies: [],
        isinCodes: [],
      }
    }

    try {
      // Detect encoding
      const encoding = await this.detectEncoding(file)

      // Read file with detected encoding
      const fileBuffer = await file.arrayBuffer()
      let bufferToUse = fileBuffer

      // Handle BOM removal for UTF-16
      if (encoding === 'utf-16le' || encoding === 'utf-16be') {
        const bytes = new Uint8Array(fileBuffer)
        if (
          bytes.length >= 2 &&
          ((bytes[0] === 0xff && bytes[1] === 0xfe) ||
            (bytes[0] === 0xfe && bytes[1] === 0xff))
        ) {
          // Skip BOM bytes
          bufferToUse = fileBuffer.slice(2)
        }
      }

      const decoder = new TextDecoder(encoding)
      let text = decoder.decode(bufferToUse)

      // Detect delimiter
      const delimiter = this.detectDelimiter(text)

      // Check for Norwegian characters using enhanced detection
      const hasNorwegianChars = this.hasNorwegianCharacters(text)

      // Skip rows if configured
      if (config?.skipRows && config.skipRows > 0) {
        const lines = text.split('\n')
        text = lines.slice(config.skipRows).join('\n')
      }

      // Parse CSV using custom delimiter
      const csvResult = this.parseCSVWithDelimiter(text, delimiter)

      // Validate structure
      const structureValidation = this.validateNordnetStructure(
        csvResult.headers
      )

      if (!structureValidation.isValid) {
        return {
          ...csvResult,
          errors: [...csvResult.errors, ...structureValidation.errors],
          warnings: [...csvResult.warnings, ...structureValidation.warnings],
          detectedEncoding: encoding,
          detectedDelimiter: delimiter,
          hasNorwegianCharacters: hasNorwegianChars,
          portfolios: [],
          transactionTypes: [],
          currencies: [],
          isinCodes: [],
        }
      }

      // Extract unique values for analysis
      const portfolios = this.extractUniqueValues(csvResult.rows, 'Portefølje')
      const transactionTypes = this.extractUniqueValues(
        csvResult.rows,
        'Transaksjonstype'
      )
      const currencies = this.extractUniqueValues(csvResult.rows, 'Valuta')
      const isinCodes = this.extractUniqueValues(csvResult.rows, 'ISIN').filter(
        isin => isin && isin.length > 0 && ISIN_PATTERN.test(isin)
      )

      // Add structure validation warnings
      const allWarnings = [
        ...csvResult.warnings,
        ...structureValidation.warnings,
      ]

      // Add suggestions as warnings
      if (structureValidation.suggestions.length > 0) {
        allWarnings.push(...structureValidation.suggestions)
      }

      return {
        headers: csvResult.headers,
        rows: csvResult.rows as NordnetCSVRow[],
        totalRows: csvResult.totalRows,
        errors: csvResult.errors,
        warnings: allWarnings,
        detectedEncoding: encoding,
        detectedDelimiter: delimiter,
        hasNorwegianCharacters: hasNorwegianChars,
        portfolios,
        transactionTypes,
        currencies,
        isinCodes,
      }
    } catch (error) {
      return {
        headers: [],
        rows: [],
        totalRows: 0,
        errors: [
          `Failed to parse Nordnet CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        warnings: [],
        detectedEncoding: 'utf-8',
        detectedDelimiter: ',',
        hasNorwegianCharacters: false,
        portfolios: [],
        transactionTypes: [],
        currencies: [],
        isinCodes: [],
      }
    }
  }

  /**
   * Parses CSV text with a specific delimiter
   */
  private static parseCSVWithDelimiter(text: string, delimiter: string) {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
    const errors: string[] = []
    const warnings: string[] = []

    if (lines.length === 0) {
      return {
        headers: [],
        rows: [],
        totalRows: 0,
        errors: ['File is empty or contains no valid data'],
        warnings: [],
      }
    }

    // Parse headers
    const headers = this.parseCSVLine(lines[0], delimiter)
    if (headers.length === 0) {
      return {
        headers: [],
        rows: [],
        totalRows: 0,
        errors: ['No headers found in the first row'],
        warnings: [],
      }
    }

    // Parse data rows
    const rows: any[] = []
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i], delimiter)
        if (values.length === 0) continue // Skip empty rows

        // Create row object
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })

        // Basic validation for Nordnet-specific fields
        if (row['Id'] && row['Bokføringsdag'] && row['Transaksjonstype']) {
          rows.push(row)
        } else {
          warnings.push(`Row ${i + 1}: Missing required fields, skipping`)
        }
      } catch (error) {
        errors.push(
          `Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`
        )
      }
    }

    return {
      headers,
      rows,
      totalRows: rows.length,
      errors,
      warnings,
    }
  }

  /**
   * Parses a single CSV line with delimiter
   */
  private static parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"'
          i += 2
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
          i++
        }
      } else if (char === delimiter && !inQuotes) {
        // Field separator
        result.push(current.trim())
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }

    // Add the last field
    result.push(current.trim())

    return result
  }

  /**
   * Extracts unique values from a specific column
   */
  private static extractUniqueValues(
    rows: any[],
    columnName: string
  ): string[] {
    const values = new Set<string>()

    for (const row of rows) {
      const value = row[columnName]
      if (value && typeof value === 'string' && value.trim() !== '') {
        values.add(value.trim())
      }
    }

    return Array.from(values).sort()
  }

  /**
   * Validates transaction types against known Nordnet types
   */
  static validateTransactionTypes(transactionTypes: string[]): {
    recognized: string[]
    unrecognized: string[]
    suggestions: { [key: string]: string }
  } {
    const recognized: string[] = []
    const unrecognized: string[] = []
    const suggestions: { [key: string]: string } = {}

    for (const type of transactionTypes) {
      if (type in NORDNET_TRANSACTION_TYPES) {
        recognized.push(type)
      } else {
        unrecognized.push(type)

        // Try to find similar transaction types
        const similar = Object.keys(NORDNET_TRANSACTION_TYPES).find(
          knownType =>
            knownType.toLowerCase().includes(type.toLowerCase()) ||
            type.toLowerCase().includes(knownType.toLowerCase())
        )

        if (similar) {
          suggestions[type] = similar
        }
      }
    }

    return { recognized, unrecognized, suggestions }
  }

  /**
   * Validates currencies against known Nordnet currencies
   */
  static validateCurrencies(currencies: string[]): {
    recognized: string[]
    unrecognized: string[]
  } {
    const recognized = currencies.filter(currency =>
      NORDNET_CURRENCIES.includes(currency as any)
    )

    const unrecognized = currencies.filter(
      currency => !NORDNET_CURRENCIES.includes(currency as any)
    )

    return { recognized, unrecognized }
  }

  /**
   * Validates portfolio names against known patterns
   */
  static validatePortfolios(portfolios: string[]): {
    valid: string[]
    invalid: string[]
    patterns: { [key: string]: string }
  } {
    const valid: string[] = []
    const invalid: string[] = []
    const patterns: { [key: string]: string } = {}

    for (const portfolio of portfolios) {
      let isValid = false

      // Check against known patterns
      for (const [patternName, pattern] of Object.entries(
        NORDNET_PORTFOLIO_PATTERNS
      )) {
        if (pattern.test(portfolio)) {
          valid.push(portfolio)
          patterns[portfolio] = patternName
          isValid = true
          break
        }
      }

      if (!isValid) {
        invalid.push(portfolio)
      }
    }

    return { valid, invalid, patterns }
  }

  /**
   * Generates a sample Nordnet CSV for testing
   */
  static generateSampleCSV(): string {
    const headers = this.NORDNET_HEADERS.join('\t')
    const sampleRows = [
      [
        '213948411',
        '2025-06-24',
        '2025-06-24',
        '2025-06-25',
        '551307769',
        'KJØPT',
        'Hims & Hers Health A',
        'US4330001060',
        '66',
        '42.7597',
        '0',
        '99',
        'NOK',
        '-28706.04',
        '2831.91',
        '0',
        '131',
        '179.97',
        '10.1366',
        '',
        '',
        '',
        '',
        '99',
        '10.1366',
        '0',
      ],
      [
        '213948412',
        '2025-06-25',
        '2025-06-25',
        '2025-06-26',
        '551307769',
        'SALG',
        'Apple Inc',
        'US0378331005',
        '50',
        '180.25',
        '0',
        '99',
        'NOK',
        '9012.50',
        '9012.50',
        '450.75',
        '0',
        '9012.50',
        '10.1366',
        '',
        '',
        '',
        '',
        '99',
        '10.1366',
        '0',
      ],
    ]

    return [headers, ...sampleRows.map(row => row.join('\t'))].join('\n')
  }
}
