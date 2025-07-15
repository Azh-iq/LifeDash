import { HoldingWithMetrics } from '@/lib/hooks/use-portfolio-state'

export interface ConsolidatedHoldingSource {
  account_id: string
  broker_id: string
  quantity: number
  market_value: number
  cost_basis: number
  last_updated: string
  connection_id: string
}

export interface ConsolidatedHolding {
  id: string
  user_id: string
  symbol: string
  asset_class: string
  currency: string
  
  // Consolidated totals
  total_quantity: number
  total_market_value: number
  total_cost_basis: number
  avg_market_price: number
  
  // Multi-broker metadata
  account_count: number
  connection_ids: string[]
  broker_ids: string[]
  last_updated: string
  
  // Duplicate detection
  is_duplicate: boolean
  duplicate_group_id?: string
  
  // Source details for breakdown
  source_details: ConsolidatedHoldingSource[]
  
  // Calculated metrics
  total_pnl: number
  total_pnl_percent: number
  daily_change?: number
  daily_change_percent?: number
  
  // Stock information
  stocks?: {
    id: string
    symbol: string
    name: string
    sector?: string
    industry?: string
    country?: string
  }
  
  // Consolidation metadata
  consolidation_metadata?: {
    preferred_source?: string
    resolution_reason?: string
    confidence_score?: number
    applied_rules?: string[]
    last_consolidated?: string
  }
  
  // Conflict resolution
  has_conflicts?: boolean
  conflict_details?: {
    price_variance?: number
    quantity_mismatch?: boolean
    source_discrepancies?: string[]
  }
}

export interface BrokerPerformanceData {
  user_id: string
  broker_id: string
  account_count: number
  unique_holdings: number
  total_portfolio_value: number
  total_cost_basis: number
  total_unrealized_pnl: number
  avg_return_percent: number
  last_sync_time: string
  connection_status: string
  last_synced_at: string
}

export interface PortfolioAggregationResult {
  id: string
  user_id: string
  aggregation_status: 'pending' | 'running' | 'completed' | 'failed'
  total_holdings_count: number
  consolidated_holdings_count: number
  duplicates_detected: number
  conflicts_resolved: number
  base_currency: string
  aggregation_summary: {
    total_portfolio_value?: number
    total_cost_basis?: number
    total_pnl?: number
    broker_breakdown?: Record<string, number>
    top_holdings?: Array<{
      symbol: string
      value: number
      percentage: number
    }>
  }
  errors: string[]
  warnings: string[]
  started_at: string
  completed_at?: string
}

export interface UserAggregationPreferences {
  id: string
  user_id: string
  base_currency: string
  broker_priority_order: string[]
  conflict_resolution_preferences: {
    price_source_priority?: string[]
    quantity_resolution_method?: 'sum' | 'priority' | 'manual'
    auto_merge_identical?: boolean
    manual_review_threshold?: number
  }
  duplicate_detection_settings: {
    symbol_matching_method?: 'exact' | 'fuzzy'
    merge_threshold?: number
    ignore_brokers?: string[]
    custom_rules?: Array<{
      condition: string
      action: 'merge' | 'separate' | 'ignore'
    }>
  }
  created_at: string
  updated_at: string
}

export interface ConflictResolutionLog {
  id: string
  user_id: string
  symbol: string
  preferred_source: string
  alternative_sources: string[]
  resolution_reason: string
  confidence_score: number
  applied_rules: string[]
  metadata: Record<string, any>
  created_at: string
}

export interface DuplicateDetectionOverride {
  id: string
  user_id: string
  symbol: string
  broker_sources: string[]
  override_type: 'merge' | 'separate' | 'ignore'
  reason?: string
  created_at: string
  updated_at: string
}

// Convert ConsolidatedHolding to NorwegianHolding format for table display
export function convertConsolidatedToNorwegian(
  consolidated: ConsolidatedHolding
): {
  id: string
  broker: string
  brokerIds: string[]
  stock: string
  stockSymbol: string
  quantity: number
  costBasis: number
  currentPrice: number
  change: number
  changePercent: number
  pnl: number
  pnlPercent: number
  marketValue: number
  country: 'NO' | 'US' | 'EU' | 'OTHER'
  // Multi-broker specific fields
  isConsolidated: boolean
  isDuplicate: boolean
  brokerCount: number
  accountCount: number
  hasConflicts: boolean
  lastUpdated: string
  sourceDetails: ConsolidatedHoldingSource[]
} {
  // Determine primary broker (first in priority order or most recent)
  const primaryBroker = consolidated.broker_ids[0] || 'Unknown'
  
  // Determine country from symbol
  const country = consolidated.symbol.includes('.OL') ? 'NO' : 'US'
  
  return {
    id: consolidated.id,
    broker: primaryBroker,
    brokerIds: consolidated.broker_ids,
    stock: consolidated.stocks?.name || consolidated.symbol,
    stockSymbol: consolidated.symbol,
    quantity: consolidated.total_quantity,
    costBasis: consolidated.total_cost_basis / consolidated.total_quantity,
    currentPrice: consolidated.avg_market_price,
    change: consolidated.daily_change || 0,
    changePercent: consolidated.daily_change_percent || 0,
    pnl: consolidated.total_pnl,
    pnlPercent: consolidated.total_pnl_percent,
    marketValue: consolidated.total_market_value,
    country: country as 'NO' | 'US' | 'EU' | 'OTHER',
    // Multi-broker specific fields
    isConsolidated: consolidated.account_count > 1,
    isDuplicate: consolidated.is_duplicate,
    brokerCount: consolidated.broker_ids.length,
    accountCount: consolidated.account_count,
    hasConflicts: consolidated.has_conflicts || false,
    lastUpdated: consolidated.last_updated,
    sourceDetails: consolidated.source_details,
  }
}

// Convert regular HoldingWithMetrics to consolidated format for compatibility
export function convertRegularToConsolidated(
  holding: HoldingWithMetrics
): ConsolidatedHolding {
  const symbol = holding.symbol || ''
  
  return {
    id: holding.id,
    user_id: holding.user_id || '',
    symbol,
    asset_class: holding.asset_class || 'stock',
    currency: holding.currency || 'NOK',
    
    total_quantity: holding.quantity || 0,
    total_market_value: holding.current_value || 0,
    total_cost_basis: holding.cost_basis || 0,
    avg_market_price: holding.current_price || 0,
    
    account_count: 1,
    connection_ids: [],
    broker_ids: ['nordnet'], // Default broker
    last_updated: holding.last_updated || new Date().toISOString(),
    
    is_duplicate: false,
    
    source_details: [{
      account_id: holding.account_id || '',
      broker_id: 'nordnet',
      quantity: holding.quantity || 0,
      market_value: holding.current_value || 0,
      cost_basis: holding.cost_basis || 0,
      last_updated: holding.last_updated || new Date().toISOString(),
      connection_id: '',
    }],
    
    total_pnl: holding.gain_loss || 0,
    total_pnl_percent: holding.gain_loss_percent || 0,
    daily_change: holding.daily_change || 0,
    daily_change_percent: holding.daily_change_percent || 0,
    
    stocks: holding.stocks ? {
      id: holding.stocks.id,
      symbol: holding.stocks.symbol,
      name: holding.stocks.name,
      sector: holding.stocks.sector,
      industry: holding.stocks.industry,
      country: holding.stocks.country,
    } : undefined,
    
    has_conflicts: false,
  }
}