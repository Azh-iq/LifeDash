// Multi-Broker Portfolio Aggregation Service
// Consolidates portfolio data from all connected brokers into unified views

import { createClient } from '@/lib/supabase/client'
import { BrokerId, BrokerageHolding, BrokerageAccount, PortfolioSummary, AssetAllocation } from '@/lib/integrations/brokers/types'
import { DuplicateDetectionService } from '@/lib/utils/duplicate-detection'
import { ConflictResolutionService } from '@/lib/services/conflict-resolution'
import { CurrencyConversionService } from '@/lib/utils/currency-conversion'

interface ConsolidatedHolding extends BrokerageHolding {
  brokerIds: BrokerId[]
  sources: {
    brokerId: BrokerId
    accountId: string
    quantity: number
    marketValue: number
    costBasis?: number
    lastUpdated: string
  }[]
  isDuplicate: boolean
  conflictResolution?: {
    preferredSource: BrokerId
    reason: string
    resolvedAt: string
  }
}

interface AggregationResult {
  success: boolean
  summary: PortfolioSummary
  consolidatedHoldings: ConsolidatedHolding[]
  duplicatesDetected: number
  conflictsResolved: number
  errors: string[]
  warnings: string[]
}

export class PortfolioAggregationService {
  private supabase = createClient()
  private duplicateDetector = new DuplicateDetectionService()
  private conflictResolver = new ConflictResolutionService()
  private currencyConverter = new CurrencyConversionService()

  /**
   * Aggregates portfolio data from all connected brokers for a user
   */
  async aggregatePortfolio(userId: string, baseCurrency: string = 'USD'): Promise<AggregationResult> {
    try {
      console.log(`[PortfolioAggregation] Starting aggregation for user ${userId}`)
      
      // 1. Get all active broker connections for user
      const connections = await this.getActiveConnections(userId)
      if (connections.length === 0) {
        return this.createEmptyResult('No active broker connections found')
      }

      // 2. Fetch holdings from all brokers
      const allHoldings = await this.fetchAllHoldings(connections)
      if (allHoldings.length === 0) {
        return this.createEmptyResult('No holdings found across all brokers')
      }

      // 3. Detect duplicates across brokers
      const duplicateGroups = await this.duplicateDetector.detectDuplicates(allHoldings)
      
      // 4. Resolve conflicts for duplicate holdings
      const consolidatedHoldings = await this.consolidateHoldings(allHoldings, duplicateGroups)
      
      // 5. Convert currencies to base currency
      const normalizedHoldings = await this.normalizeCurrencies(consolidatedHoldings, baseCurrency)
      
      // 6. Calculate aggregated portfolio summary
      const summary = await this.calculatePortfolioSummary(normalizedHoldings, baseCurrency)
      
      // 7. Store results in database
      await this.storeAggregatedData(userId, summary, normalizedHoldings)
      
      console.log(`[PortfolioAggregation] Completed aggregation for user ${userId}`)
      
      return {
        success: true,
        summary,
        consolidatedHoldings: normalizedHoldings,
        duplicatesDetected: duplicateGroups.length,
        conflictsResolved: consolidatedHoldings.filter(h => h.conflictResolution).length,
        errors: [],
        warnings: []
      }

    } catch (error) {
      console.error('[PortfolioAggregation] Error during aggregation:', error)
      return {
        success: false,
        summary: this.createEmptyPortfolioSummary(baseCurrency),
        consolidatedHoldings: [],
        duplicatesDetected: 0,
        conflictsResolved: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: []
      }
    }
  }

  /**
   * Get all active broker connections for a user
   */
  private async getActiveConnections(userId: string) {
    const { data: connections, error } = await this.supabase
      .from('brokerage_connections')
      .select(`
        *,
        brokerage_accounts (
          id,
          broker_account_id,
          account_number,
          account_type,
          display_name,
          currency,
          is_active
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'connected')
      .eq('brokerage_accounts.is_active', true)

    if (error) {
      console.error('[PortfolioAggregation] Error fetching connections:', error)
      return []
    }

    return connections || []
  }

  /**
   * Fetch holdings from all connected brokers
   */
  private async fetchAllHoldings(connections: any[]): Promise<BrokerageHolding[]> {
    const allHoldings: BrokerageHolding[] = []
    
    for (const connection of connections) {
      try {
        const { data: holdings, error } = await this.supabase
          .from('portfolio_holdings')
          .select(`
            *,
            brokerage_accounts!inner (
              id,
              connection_id,
              broker_account_id,
              display_name
            ),
            stocks (
              symbol,
              name,
              isin,
              cusip,
              exchange,
              currency
            )
          `)
          .eq('brokerage_accounts.connection_id', connection.id)
          .gte('quantity', 0.00001) // Only active holdings

        if (error) {
          console.error(`[PortfolioAggregation] Error fetching holdings for ${connection.broker_id}:`, error)
          continue
        }

        // Transform to BrokerageHolding format
        const brokerHoldings = holdings?.map(holding => ({
          accountId: holding.brokerage_accounts.broker_account_id,
          symbol: holding.symbol,
          quantity: parseFloat(holding.quantity),
          marketValue: parseFloat(holding.market_value),
          costBasis: holding.cost_basis ? parseFloat(holding.cost_basis) : undefined,
          marketPrice: parseFloat(holding.market_price),
          currency: holding.currency,
          assetClass: holding.asset_class,
          institutionSecurityId: holding.institution_security_id,
          metadata: {
            ...holding.metadata,
            brokerId: connection.broker_id,
            connectionId: connection.id,
            accountName: holding.brokerage_accounts.display_name,
            isin: holding.stocks?.isin,
            cusip: holding.stocks?.cusip,
            exchange: holding.stocks?.exchange,
            lastUpdated: holding.last_updated
          }
        })) || []

        allHoldings.push(...brokerHoldings)
        
      } catch (error) {
        console.error(`[PortfolioAggregation] Error processing ${connection.broker_id}:`, error)
      }
    }

    return allHoldings
  }

  /**
   * Consolidate holdings by resolving duplicates and conflicts
   */
  private async consolidateHoldings(
    allHoldings: BrokerageHolding[],
    duplicateGroups: BrokerageHolding[][]
  ): Promise<ConsolidatedHolding[]> {
    const consolidatedHoldings: ConsolidatedHolding[] = []
    const processedHoldings = new Set<string>()

    // Process duplicate groups
    for (const group of duplicateGroups) {
      const consolidatedHolding = await this.consolidateDuplicateGroup(group)
      consolidatedHoldings.push(consolidatedHolding)
      
      // Mark holdings as processed
      group.forEach(holding => {
        processedHoldings.add(this.getHoldingId(holding))
      })
    }

    // Process remaining unique holdings
    for (const holding of allHoldings) {
      const holdingId = this.getHoldingId(holding)
      if (!processedHoldings.has(holdingId)) {
        consolidatedHoldings.push(this.createConsolidatedHolding(holding))
      }
    }

    return consolidatedHoldings
  }

  /**
   * Consolidate a group of duplicate holdings
   */
  private async consolidateDuplicateGroup(group: BrokerageHolding[]): Promise<ConsolidatedHolding> {
    // Use conflict resolution to determine the preferred source
    const resolution = await this.conflictResolver.resolveConflicts(group)
    const preferredHolding = resolution.preferredHolding
    
    // Create consolidated holding
    const consolidated: ConsolidatedHolding = {
      ...preferredHolding,
      brokerIds: group.map(h => h.metadata?.brokerId).filter(Boolean),
      sources: group.map(h => ({
        brokerId: h.metadata?.brokerId,
        accountId: h.accountId,
        quantity: h.quantity,
        marketValue: h.marketValue,
        costBasis: h.costBasis,
        lastUpdated: h.metadata?.lastUpdated || new Date().toISOString()
      })),
      isDuplicate: true,
      conflictResolution: {
        preferredSource: resolution.preferredSource,
        reason: resolution.reason,
        resolvedAt: new Date().toISOString()
      }
    }

    // Sum up quantities and values from all sources
    consolidated.quantity = group.reduce((sum, h) => sum + h.quantity, 0)
    consolidated.marketValue = group.reduce((sum, h) => sum + h.marketValue, 0)
    consolidated.costBasis = group.reduce((sum, h) => sum + (h.costBasis || 0), 0)
    
    return consolidated
  }

  /**
   * Create a consolidated holding from a single source
   */
  private createConsolidatedHolding(holding: BrokerageHolding): ConsolidatedHolding {
    return {
      ...holding,
      brokerIds: [holding.metadata?.brokerId].filter(Boolean),
      sources: [{
        brokerId: holding.metadata?.brokerId,
        accountId: holding.accountId,
        quantity: holding.quantity,
        marketValue: holding.marketValue,
        costBasis: holding.costBasis,
        lastUpdated: holding.metadata?.lastUpdated || new Date().toISOString()
      }],
      isDuplicate: false
    }
  }

  /**
   * Normalize all holdings to base currency
   */
  private async normalizeCurrencies(
    holdings: ConsolidatedHolding[],
    baseCurrency: string
  ): Promise<ConsolidatedHolding[]> {
    const normalizedHoldings: ConsolidatedHolding[] = []
    
    for (const holding of holdings) {
      if (holding.currency === baseCurrency) {
        normalizedHoldings.push(holding)
        continue
      }

      try {
        const rate = await this.currencyConverter.getExchangeRate(holding.currency, baseCurrency)
        
        const normalizedHolding: ConsolidatedHolding = {
          ...holding,
          marketValue: holding.marketValue * rate,
          costBasis: holding.costBasis ? holding.costBasis * rate : undefined,
          marketPrice: holding.marketPrice * rate,
          currency: baseCurrency,
          metadata: {
            ...holding.metadata,
            originalCurrency: holding.currency,
            exchangeRate: rate,
            exchangeRateDate: new Date().toISOString()
          }
        }
        
        normalizedHoldings.push(normalizedHolding)
      } catch (error) {
        console.error(`[PortfolioAggregation] Currency conversion error for ${holding.symbol}:`, error)
        // Keep original currency if conversion fails
        normalizedHoldings.push(holding)
      }
    }

    return normalizedHoldings
  }

  /**
   * Calculate aggregated portfolio summary
   */
  private async calculatePortfolioSummary(
    holdings: ConsolidatedHolding[],
    baseCurrency: string
  ): Promise<PortfolioSummary> {
    const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)
    const totalCostBasis = holdings.reduce((sum, h) => sum + (h.costBasis || 0), 0)
    const totalGainLoss = totalValue - totalCostBasis
    const totalGainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0

    // Calculate asset allocation
    const assetAllocation: AssetAllocation[] = []
    const assetBreakdown = holdings.reduce((acc, h) => {
      const assetClass = h.assetClass
      acc[assetClass] = (acc[assetClass] || 0) + h.marketValue
      return acc
    }, {} as Record<string, number>)

    Object.entries(assetBreakdown).forEach(([assetClass, value]) => {
      assetAllocation.push({
        assetClass: assetClass as any,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
        currency: baseCurrency
      })
    })

    // Get unique accounts
    const uniqueAccounts = new Set(holdings.flatMap(h => h.sources.map(s => s.accountId)))
    
    // Top holdings (by value)
    const topHoldings = holdings
      .sort((a, b) => b.marketValue - a.marketValue)
      .slice(0, 10)

    return {
      totalValue,
      totalCostBasis,
      totalGainLoss,
      totalGainLossPercent,
      currency: baseCurrency,
      asOfDate: new Date().toISOString(),
      accountSummaries: [], // Will be populated by separate function
      topHoldings,
      assetAllocation
    }
  }

  /**
   * Store aggregated data in database
   */
  private async storeAggregatedData(
    userId: string,
    summary: PortfolioSummary,
    holdings: ConsolidatedHolding[]
  ): Promise<void> {
    try {
      // Update portfolio summary
      await this.supabase
        .from('portfolio_summaries')
        .upsert({
          user_id: userId,
          total_value: summary.totalValue,
          total_cost_basis: summary.totalCostBasis,
          total_gain_loss: summary.totalGainLoss,
          total_gain_loss_percent: summary.totalGainLossPercent,
          currency: summary.currency,
          account_count: summary.accountSummaries.length,
          holding_count: holdings.length,
          last_updated: new Date().toISOString(),
          asset_allocation: summary.assetAllocation.reduce((acc, allocation) => {
            acc[allocation.assetClass] = {
              value: allocation.value,
              percentage: allocation.percentage
            }
            return acc
          }, {} as Record<string, any>),
          broker_breakdown: this.calculateBrokerBreakdown(holdings)
        })

      console.log(`[PortfolioAggregation] Stored aggregated data for user ${userId}`)
    } catch (error) {
      console.error('[PortfolioAggregation] Error storing aggregated data:', error)
    }
  }

  /**
   * Calculate broker breakdown for storage
   */
  private calculateBrokerBreakdown(holdings: ConsolidatedHolding[]): Record<string, any> {
    const brokerBreakdown: Record<string, { value: number, percentage: number }> = {}
    const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)
    
    holdings.forEach(holding => {
      holding.sources.forEach(source => {
        if (!brokerBreakdown[source.brokerId]) {
          brokerBreakdown[source.brokerId] = { value: 0, percentage: 0 }
        }
        brokerBreakdown[source.brokerId].value += source.marketValue
      })
    })

    // Calculate percentages
    Object.values(brokerBreakdown).forEach(breakdown => {
      breakdown.percentage = totalValue > 0 ? (breakdown.value / totalValue) * 100 : 0
    })

    return brokerBreakdown
  }

  /**
   * Helper functions
   */
  private getHoldingId(holding: BrokerageHolding): string {
    return `${holding.metadata?.brokerId}-${holding.accountId}-${holding.symbol}`
  }

  private createEmptyResult(message: string): AggregationResult {
    return {
      success: false,
      summary: this.createEmptyPortfolioSummary('USD'),
      consolidatedHoldings: [],
      duplicatesDetected: 0,
      conflictsResolved: 0,
      errors: [message],
      warnings: []
    }
  }

  private createEmptyPortfolioSummary(currency: string): PortfolioSummary {
    return {
      totalValue: 0,
      totalCostBasis: 0,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
      currency,
      asOfDate: new Date().toISOString(),
      accountSummaries: [],
      topHoldings: [],
      assetAllocation: []
    }
  }

  /**
   * Trigger aggregation for a user (can be called from API or scheduled jobs)
   */
  static async triggerAggregation(userId: string, baseCurrency: string = 'USD'): Promise<AggregationResult> {
    const service = new PortfolioAggregationService()
    return service.aggregatePortfolio(userId, baseCurrency)
  }
}