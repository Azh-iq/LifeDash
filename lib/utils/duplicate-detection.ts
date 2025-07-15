// Duplicate Detection System for Multi-Broker Portfolio Aggregation
// Identifies duplicate securities across different brokers using multiple matching strategies

import { BrokerageHolding } from '@/lib/integrations/brokers/types'
import { createClient } from '@/lib/supabase/client'

interface SecurityIdentifiers {
  symbol: string
  isin?: string
  cusip?: string
  sedol?: string
  name?: string
  exchange?: string
  normalizedSymbol: string
  normalizedName?: string
}

interface DuplicateMatch {
  confidence: number
  matchType: 'exact' | 'isin' | 'cusip' | 'symbol' | 'fuzzy'
  reason: string
}

interface DuplicateGroup {
  holdings: BrokerageHolding[]
  primarySymbol: string
  confidence: number
  matchType: string
  identifiers: SecurityIdentifiers
}

export class DuplicateDetectionService {
  private supabase = createClient()

  /**
   * Detect duplicate holdings across brokers
   */
  async detectDuplicates(holdings: BrokerageHolding[]): Promise<BrokerageHolding[][]> {
    console.log(`[DuplicateDetection] Analyzing ${holdings.length} holdings for duplicates`)
    
    // Extract security identifiers for each holding
    const identifiedHoldings = await this.extractSecurityIdentifiers(holdings)
    
    // Group holdings by various matching strategies
    const duplicateGroups = this.groupDuplicateHoldings(identifiedHoldings)
    
    // Filter and rank duplicate groups
    const validGroups = this.filterAndRankGroups(duplicateGroups)
    
    console.log(`[DuplicateDetection] Found ${validGroups.length} duplicate groups`)
    
    return validGroups.map(group => group.holdings)
  }

  /**
   * Extract security identifiers from holdings and database
   */
  private async extractSecurityIdentifiers(holdings: BrokerageHolding[]): Promise<(BrokerageHolding & { identifiers: SecurityIdentifiers })[]> {
    const identifiedHoldings: (BrokerageHolding & { identifiers: SecurityIdentifiers })[] = []
    
    for (const holding of holdings) {
      try {
        // Get additional identifiers from database
        const { data: stockData } = await this.supabase
          .from('stocks')
          .select('symbol, name, isin, cusip, exchange, metadata')
          .eq('symbol', holding.symbol)
          .single()

        const identifiers: SecurityIdentifiers = {
          symbol: holding.symbol,
          isin: stockData?.isin || holding.metadata?.isin,
          cusip: stockData?.cusip || holding.metadata?.cusip,
          sedol: stockData?.metadata?.sedol,
          name: stockData?.name || holding.metadata?.name,
          exchange: stockData?.exchange || holding.metadata?.exchange,
          normalizedSymbol: this.normalizeSymbol(holding.symbol),
          normalizedName: stockData?.name ? this.normalizeName(stockData.name) : undefined
        }

        identifiedHoldings.push({
          ...holding,
          identifiers
        })
      } catch (error) {
        console.warn(`[DuplicateDetection] Error extracting identifiers for ${holding.symbol}:`, error)
        
        // Fallback to basic identifiers
        identifiedHoldings.push({
          ...holding,
          identifiers: {
            symbol: holding.symbol,
            normalizedSymbol: this.normalizeSymbol(holding.symbol),
            isin: holding.metadata?.isin,
            cusip: holding.metadata?.cusip,
            name: holding.metadata?.name,
            exchange: holding.metadata?.exchange,
            normalizedName: holding.metadata?.name ? this.normalizeName(holding.metadata.name) : undefined
          }
        })
      }
    }

    return identifiedHoldings
  }

  /**
   * Group holdings by various matching strategies
   */
  private groupDuplicateHoldings(holdings: (BrokerageHolding & { identifiers: SecurityIdentifiers })[]): DuplicateGroup[] {
    const groups: DuplicateGroup[] = []
    const processedHoldings = new Set<string>()

    // Strategy 1: Exact ISIN matching (highest confidence)
    this.groupByISIN(holdings, groups, processedHoldings)
    
    // Strategy 2: CUSIP matching (high confidence)
    this.groupByCUSIP(holdings, groups, processedHoldings)
    
    // Strategy 3: Normalized symbol matching (medium confidence)
    this.groupByNormalizedSymbol(holdings, groups, processedHoldings)
    
    // Strategy 4: Fuzzy company name matching (lower confidence)
    this.groupByFuzzyName(holdings, groups, processedHoldings)

    return groups
  }

  /**
   * Group by ISIN (International Securities Identification Number)
   */
  private groupByISIN(
    holdings: (BrokerageHolding & { identifiers: SecurityIdentifiers })[],
    groups: DuplicateGroup[],
    processedHoldings: Set<string>
  ): void {
    const isinGroups: Map<string, (BrokerageHolding & { identifiers: SecurityIdentifiers })[]> = new Map()

    holdings.forEach(holding => {
      const holdingId = this.getHoldingId(holding)
      if (processedHoldings.has(holdingId) || !holding.identifiers.isin) return

      const isin = holding.identifiers.isin
      if (!isinGroups.has(isin)) {
        isinGroups.set(isin, [])
      }
      isinGroups.get(isin)!.push(holding)
    })

    isinGroups.forEach((groupHoldings, isin) => {
      if (groupHoldings.length > 1) {
        const group: DuplicateGroup = {
          holdings: groupHoldings,
          primarySymbol: this.selectPrimarySymbol(groupHoldings),
          confidence: 0.95,
          matchType: 'isin',
          identifiers: this.mergeIdentifiers(groupHoldings.map(h => h.identifiers))
        }
        groups.push(group)
        
        // Mark as processed
        groupHoldings.forEach(h => processedHoldings.add(this.getHoldingId(h)))
      }
    })
  }

  /**
   * Group by CUSIP (Committee on Uniform Securities Identification Procedures)
   */
  private groupByCUSIP(
    holdings: (BrokerageHolding & { identifiers: SecurityIdentifiers })[],
    groups: DuplicateGroup[],
    processedHoldings: Set<string>
  ): void {
    const cusipGroups: Map<string, (BrokerageHolding & { identifiers: SecurityIdentifiers })[]> = new Map()

    holdings.forEach(holding => {
      const holdingId = this.getHoldingId(holding)
      if (processedHoldings.has(holdingId) || !holding.identifiers.cusip) return

      const cusip = holding.identifiers.cusip
      if (!cusipGroups.has(cusip)) {
        cusipGroups.set(cusip, [])
      }
      cusipGroups.get(cusip)!.push(holding)
    })

    cusipGroups.forEach((groupHoldings, cusip) => {
      if (groupHoldings.length > 1) {
        const group: DuplicateGroup = {
          holdings: groupHoldings,
          primarySymbol: this.selectPrimarySymbol(groupHoldings),
          confidence: 0.90,
          matchType: 'cusip',
          identifiers: this.mergeIdentifiers(groupHoldings.map(h => h.identifiers))
        }
        groups.push(group)
        
        // Mark as processed
        groupHoldings.forEach(h => processedHoldings.add(this.getHoldingId(h)))
      }
    })
  }

  /**
   * Group by normalized symbol (handles variations like AAPL vs AAPL.O)
   */
  private groupByNormalizedSymbol(
    holdings: (BrokerageHolding & { identifiers: SecurityIdentifiers })[],
    groups: DuplicateGroup[],
    processedHoldings: Set<string>
  ): void {
    const symbolGroups: Map<string, (BrokerageHolding & { identifiers: SecurityIdentifiers })[]> = new Map()

    holdings.forEach(holding => {
      const holdingId = this.getHoldingId(holding)
      if (processedHoldings.has(holdingId)) return

      const normalizedSymbol = holding.identifiers.normalizedSymbol
      if (!symbolGroups.has(normalizedSymbol)) {
        symbolGroups.set(normalizedSymbol, [])
      }
      symbolGroups.get(normalizedSymbol)!.push(holding)
    })

    symbolGroups.forEach((groupHoldings, normalizedSymbol) => {
      if (groupHoldings.length > 1) {
        // Additional validation for symbol matching
        const validated = this.validateSymbolMatch(groupHoldings)
        if (validated) {
          const group: DuplicateGroup = {
            holdings: groupHoldings,
            primarySymbol: this.selectPrimarySymbol(groupHoldings),
            confidence: 0.80,
            matchType: 'symbol',
            identifiers: this.mergeIdentifiers(groupHoldings.map(h => h.identifiers))
          }
          groups.push(group)
          
          // Mark as processed
          groupHoldings.forEach(h => processedHoldings.add(this.getHoldingId(h)))
        }
      }
    })
  }

  /**
   * Group by fuzzy company name matching
   */
  private groupByFuzzyName(
    holdings: (BrokerageHolding & { identifiers: SecurityIdentifiers })[],
    groups: DuplicateGroup[],
    processedHoldings: Set<string>
  ): void {
    const unprocessedHoldings = holdings.filter(h => !processedHoldings.has(this.getHoldingId(h)))
    
    for (let i = 0; i < unprocessedHoldings.length; i++) {
      const holding1 = unprocessedHoldings[i]
      const group: (BrokerageHolding & { identifiers: SecurityIdentifiers })[] = [holding1]
      
      for (let j = i + 1; j < unprocessedHoldings.length; j++) {
        const holding2 = unprocessedHoldings[j]
        
        if (this.isFuzzyNameMatch(holding1.identifiers, holding2.identifiers)) {
          group.push(holding2)
        }
      }
      
      if (group.length > 1) {
        const duplicateGroup: DuplicateGroup = {
          holdings: group,
          primarySymbol: this.selectPrimarySymbol(group),
          confidence: 0.60,
          matchType: 'fuzzy',
          identifiers: this.mergeIdentifiers(group.map(h => h.identifiers))
        }
        groups.push(duplicateGroup)
        
        // Mark as processed
        group.forEach(h => processedHoldings.add(this.getHoldingId(h)))
      }
    }
  }

  /**
   * Normalize symbol by removing exchange suffixes and formatting
   */
  private normalizeSymbol(symbol: string): string {
    return symbol
      .toUpperCase()
      .replace(/\.O$/, '') // Remove .O suffix (NASDAQ)
      .replace(/\.N$/, '') // Remove .N suffix (NYSE)
      .replace(/\.L$/, '') // Remove .L suffix (London)
      .replace(/\.TO$/, '') // Remove .TO suffix (Toronto)
      .replace(/\.OL$/, '') // Remove .OL suffix (Oslo)
      .replace(/\.ST$/, '') // Remove .ST suffix (Stockholm)
      .replace(/\.CO$/, '') // Remove .CO suffix (Copenhagen)
      .replace(/\.HE$/, '') // Remove .HE suffix (Helsinki)
      .replace(/[-_\s]/g, '') // Remove dashes, underscores, spaces
      .trim()
  }

  /**
   * Normalize company name for fuzzy matching
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\b(inc|corp|corporation|company|co|ltd|limited|plc|ag|sa|nv|ab|asa|oyj)\b/g, '') // Remove common suffixes
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  /**
   * Validate symbol match with additional checks
   */
  private validateSymbolMatch(holdings: (BrokerageHolding & { identifiers: SecurityIdentifiers })[]): boolean {
    // Check if holdings are from different brokers (required for duplicates)
    const brokerIds = new Set(holdings.map(h => h.metadata?.brokerId))
    if (brokerIds.size <= 1) return false

    // Check if asset classes match
    const assetClasses = new Set(holdings.map(h => h.assetClass))
    if (assetClasses.size > 1) return false

    // Check if currencies are compatible
    const currencies = new Set(holdings.map(h => h.currency))
    if (currencies.size > 2) return false // Allow max 2 currencies (e.g., USD/CAD)

    return true
  }

  /**
   * Fuzzy name matching using Levenshtein distance
   */
  private isFuzzyNameMatch(id1: SecurityIdentifiers, id2: SecurityIdentifiers): boolean {
    if (!id1.normalizedName || !id2.normalizedName) return false
    
    const distance = this.levenshteinDistance(id1.normalizedName, id2.normalizedName)
    const maxLength = Math.max(id1.normalizedName.length, id2.normalizedName.length)
    const similarity = 1 - (distance / maxLength)
    
    return similarity >= 0.85 // 85% similarity threshold
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator  // substitution
        )
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  /**
   * Select primary symbol from a group of holdings
   */
  private selectPrimarySymbol(holdings: (BrokerageHolding & { identifiers: SecurityIdentifiers })[]): string {
    // Prefer symbols from major exchanges
    const majorExchanges = ['NYSE', 'NASDAQ', 'LSE', 'TSE', 'OSE']
    
    for (const exchange of majorExchanges) {
      const holding = holdings.find(h => h.identifiers.exchange === exchange)
      if (holding) return holding.symbol
    }
    
    // Fallback to shortest symbol or first one
    return holdings.sort((a, b) => a.symbol.length - b.symbol.length)[0].symbol
  }

  /**
   * Merge identifiers from multiple holdings
   */
  private mergeIdentifiers(identifiers: SecurityIdentifiers[]): SecurityIdentifiers {
    const merged: SecurityIdentifiers = {
      symbol: identifiers[0].symbol,
      normalizedSymbol: identifiers[0].normalizedSymbol
    }

    // Use first available identifier for each field
    for (const id of identifiers) {
      merged.isin = merged.isin || id.isin
      merged.cusip = merged.cusip || id.cusip
      merged.sedol = merged.sedol || id.sedol
      merged.name = merged.name || id.name
      merged.exchange = merged.exchange || id.exchange
      merged.normalizedName = merged.normalizedName || id.normalizedName
    }

    return merged
  }

  /**
   * Filter and rank duplicate groups
   */
  private filterAndRankGroups(groups: DuplicateGroup[]): DuplicateGroup[] {
    return groups
      .filter(group => group.holdings.length > 1 && group.confidence >= 0.60)
      .sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Get unique holding identifier
   */
  private getHoldingId(holding: BrokerageHolding): string {
    return `${holding.metadata?.brokerId}-${holding.accountId}-${holding.symbol}`
  }

  /**
   * Manual override for duplicate detection
   */
  async addManualDuplicate(holdings: BrokerageHolding[]): Promise<void> {
    // Store manual duplicate mapping in database
    const duplicateMapping = {
      holdings: holdings.map(h => ({
        brokerId: h.metadata?.brokerId,
        accountId: h.accountId,
        symbol: h.symbol
      })),
      createdAt: new Date().toISOString(),
      reason: 'manual_override'
    }

    // In a real implementation, this would store to a manual_duplicates table
    console.log('[DuplicateDetection] Manual duplicate mapping created:', duplicateMapping)
  }

  /**
   * Remove manual duplicate override
   */
  async removeManualDuplicate(holdings: BrokerageHolding[]): Promise<void> {
    // Remove manual duplicate mapping from database
    console.log('[DuplicateDetection] Manual duplicate mapping removed')
  }
}