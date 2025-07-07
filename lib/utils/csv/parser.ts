export interface CSVRow {
  [key: string]: string
}

export interface CSVParseResult {
  headers: string[]
  rows: CSVRow[]
  totalRows: number
  errors: string[]
}

export interface ColumnMapping {
  csvColumn: string
  targetField: string
  required: boolean
  dataType: 'string' | 'number' | 'date' | 'boolean'
}

export interface ImportValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  processedRows: any[]
}

export class CSVParser {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly SUPPORTED_EXTENSIONS = ['.csv', '.txt']

  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds 10MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
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

    return { valid: true }
  }

  static async parseCSV(file: File): Promise<CSVParseResult> {
    const validation = this.validateFile(file)
    if (!validation.valid) {
      return {
        headers: [],
        rows: [],
        totalRows: 0,
        errors: [validation.error!],
      }
    }

    try {
      // Try to detect file encoding and parse accordingly
      const buffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(buffer)

      // Check for UTF-16 BOM (byte order mark)
      const hasUTF16LE_BOM =
        uint8Array.length >= 2 &&
        uint8Array[0] === 0xff &&
        uint8Array[1] === 0xfe
      const hasUTF16BE_BOM =
        uint8Array.length >= 2 &&
        uint8Array[0] === 0xfe &&
        uint8Array[1] === 0xff

      // Check for UTF-16 encoding by looking for null bytes in typical positions
      const hasNullBytes =
        uint8Array.length > 10 &&
        (uint8Array[2] === 0 || uint8Array[4] === 0 || uint8Array[6] === 0)

      let text: string

      if (hasUTF16LE_BOM || (hasNullBytes && !hasUTF16BE_BOM)) {
        // UTF-16 Little Endian (common for Windows/Nordnet exports)
        text = new TextDecoder('utf-16le').decode(buffer)
      } else if (hasUTF16BE_BOM) {
        // UTF-16 Big Endian
        text = new TextDecoder('utf-16be').decode(buffer)
      } else {
        // Default to UTF-8
        text = new TextDecoder('utf-8').decode(buffer)
      }

      // Remove BOM if present
      text = text.replace(/^\uFEFF/, '')

      return this.parseCSVText(text)
    } catch (error) {
      return {
        headers: [],
        rows: [],
        totalRows: 0,
        errors: [
          `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      }
    }
  }

  static parseCSVText(csvText: string): CSVParseResult {
    const errors: string[] = []
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '')

    if (lines.length === 0) {
      return {
        headers: [],
        rows: [],
        totalRows: 0,
        errors: ['File is empty or contains no valid data'],
      }
    }

    // Detect separator (tab or comma)
    const firstLine = lines[0]
    const tabCount = (firstLine.match(/\t/g) || []).length
    const commaCount = (firstLine.match(/,/g) || []).length
    const separator = tabCount > commaCount ? '\t' : ','

    // Parse headers
    const headers = this.parseCSVLine(lines[0], separator)
    if (headers.length === 0) {
      return {
        headers: [],
        rows: [],
        totalRows: 0,
        errors: ['No headers found in the first row'],
      }
    }

    // Check for duplicate headers
    const duplicateHeaders = headers.filter(
      (header, index) => headers.indexOf(header) !== index
    )
    if (duplicateHeaders.length > 0) {
      errors.push(`Duplicate headers found: ${duplicateHeaders.join(', ')}`)
    }

    // Parse data rows
    const rows: CSVRow[] = []
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i], separator)
        if (values.length === 0) continue // Skip empty rows

        // Create row object
        const row: CSVRow = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })

        // Warn about row length mismatch
        if (values.length !== headers.length) {
          errors.push(
            `Row ${i + 1}: Expected ${headers.length} columns, found ${values.length}`
          )
        }

        rows.push(row)
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
    }
  }

  private static parseCSVLine(line: string, separator: string = ','): string[] {
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
      } else if (char === separator && !inQuotes) {
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

  static validateAndTransformData(
    rows: CSVRow[],
    mappings: ColumnMapping[]
  ): ImportValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const processedRows: any[] = []

    // Check required mappings
    const requiredMappings = mappings.filter(m => m.required)
    const missingRequired = requiredMappings.filter(m => !m.csvColumn)

    if (missingRequired.length > 0) {
      errors.push(
        `Missing required field mappings: ${missingRequired.map(m => m.targetField).join(', ')}`
      )
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings, processedRows: [] }
    }

    // Process each row
    rows.forEach((row, index) => {
      const rowNumber = index + 1
      const processedRow: any = {}
      const rowErrors: string[] = []

      mappings.forEach(mapping => {
        if (!mapping.csvColumn) return

        const rawValue = row[mapping.csvColumn]
        let processedValue: any = rawValue

        // Type conversion and validation
        try {
          switch (mapping.dataType) {
            case 'number':
              if (
                rawValue === '' ||
                rawValue === null ||
                rawValue === undefined
              ) {
                processedValue = mapping.required ? null : 0
              } else {
                const num = parseFloat(rawValue.replace(/[,$]/g, ''))
                if (isNaN(num)) {
                  rowErrors.push(
                    `"${mapping.targetField}" must be a number, got "${rawValue}"`
                  )
                  processedValue = null
                } else {
                  processedValue = num
                }
              }
              break

            case 'date':
              if (
                rawValue === '' ||
                rawValue === null ||
                rawValue === undefined
              ) {
                processedValue = mapping.required ? null : null
              } else {
                const date = new Date(rawValue)
                if (isNaN(date.getTime())) {
                  rowErrors.push(
                    `"${mapping.targetField}" must be a valid date, got "${rawValue}"`
                  )
                  processedValue = null
                } else {
                  processedValue = date.toISOString()
                }
              }
              break

            case 'boolean':
              if (
                rawValue === '' ||
                rawValue === null ||
                rawValue === undefined
              ) {
                processedValue = mapping.required ? null : false
              } else {
                const lower = rawValue.toLowerCase().trim()
                if (['true', '1', 'yes', 'y'].includes(lower)) {
                  processedValue = true
                } else if (['false', '0', 'no', 'n'].includes(lower)) {
                  processedValue = false
                } else {
                  rowErrors.push(
                    `"${mapping.targetField}" must be true/false, got "${rawValue}"`
                  )
                  processedValue = null
                }
              }
              break

            case 'string':
            default:
              processedValue = rawValue?.toString().trim() || ''
              break
          }

          // Required field validation
          if (
            mapping.required &&
            (processedValue === null ||
              processedValue === '' ||
              processedValue === undefined)
          ) {
            rowErrors.push(`"${mapping.targetField}" is required but is empty`)
          }

          processedRow[mapping.targetField] = processedValue
        } catch (error) {
          rowErrors.push(
            `Error processing "${mapping.targetField}": ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      })

      if (rowErrors.length > 0) {
        errors.push(`Row ${rowNumber}: ${rowErrors.join(', ')}`)
      } else {
        processedRows.push(processedRow)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      processedRows,
    }
  }

  static generateSampleCSV(
    type: 'portfolio' | 'holdings' | 'transactions'
  ): string {
    switch (type) {
      case 'portfolio':
        return [
          'Portfolio Name,Description,Type,Public',
          'My Investment Portfolio,Long-term growth portfolio,INVESTMENT,false',
          'Retirement Fund,401k and IRA holdings,RETIREMENT,false',
          'Trading Account,Active trading portfolio,TRADING,true',
        ].join('\n')

      case 'holdings':
        return [
          'Portfolio,Symbol,Quantity,Average Cost,Purchase Date',
          'My Investment Portfolio,AAPL,100,150.00,2023-01-15',
          'My Investment Portfolio,GOOGL,50,2500.00,2023-02-01',
          'Retirement Fund,VTI,200,220.00,2023-01-01',
          'Trading Account,TSLA,25,800.00,2023-03-10',
        ].join('\n')

      case 'transactions':
        return [
          'Date,Type,Symbol,Quantity,Price,Portfolio,Notes',
          '2023-01-15,BUY,AAPL,100,150.00,My Investment Portfolio,Initial purchase',
          '2023-02-01,BUY,GOOGL,50,2500.00,My Investment Portfolio,Tech diversification',
          '2023-03-10,SELL,AAPL,25,165.00,My Investment Portfolio,Profit taking',
          '2023-03-15,DIVIDEND,VTI,0,5.50,Retirement Fund,Quarterly dividend',
        ].join('\n')

      default:
        return ''
    }
  }

  static detectDataType(
    values: string[]
  ): 'string' | 'number' | 'date' | 'boolean' {
    const nonEmptyValues = values.filter(v => v && v.trim() !== '').slice(0, 10) // Sample first 10 non-empty values

    if (nonEmptyValues.length === 0) return 'string'

    // Check for boolean
    const booleanPattern = /^(true|false|yes|no|y|n|1|0)$/i
    if (nonEmptyValues.every(v => booleanPattern.test(v.trim()))) {
      return 'boolean'
    }

    // Check for number
    const numberPattern = /^-?[\d,]+\.?\d*$/
    if (
      nonEmptyValues.every(v =>
        numberPattern.test(v.replace(/[$,]/g, '').trim())
      )
    ) {
      return 'number'
    }

    // Check for date
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}/, // MM-DD-YYYY
    ]

    if (
      nonEmptyValues.some(v =>
        datePatterns.some(pattern => pattern.test(v.trim()))
      )
    ) {
      const validDates = nonEmptyValues.filter(
        v => !isNaN(new Date(v).getTime())
      )
      if (validDates.length / nonEmptyValues.length > 0.7) {
        return 'date'
      }
    }

    return 'string'
  }
}
