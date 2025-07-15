// Conflict Resolution System for Multi-Broker Portfolio Aggregation
// Resolves data conflicts when the same security exists across multiple brokers

import { BrokerageHolding, BrokerId } from '@/lib/integrations/brokers/types'
import { createClient } from '@/lib/supabase/client'

interface ConflictResolutionResult {
  preferredHolding: BrokerageHolding
  preferredSource: BrokerId
  reason: string
  confidence: number
  alternatives: BrokerageHolding[]
  resolutionRules: ResolutionRule[]
}

interface ResolutionRule {
  type: 'data_quality' | 'broker_priority' | 'timestamp' | 'manual' | 'fallback'
  weight: number
  description: string
  applied: boolean
}

interface DataQualityScore {
  brokerId: BrokerId
  score: number
  factors: {
    priceAccuracy: number
    costBasisAvailable: number
    timestampRecency: number
    metadataCompleteness: number
    historicalReliability: number
  }
}

interface BrokerReliabilityMetrics {
  brokerId: BrokerId
  reliability: number
  dataQuality: number
  apiStability: number
  updateFrequency: number
  lastSuccessfulSync: string
  errorRate: number
}

export class ConflictResolutionService {
  private supabase = createClient()
  
  // Broker reliability rankings (based on API quality and data accuracy)
  private brokerReliabilityRankings: Record<BrokerId, number> = {
    [BrokerId.INTERACTIVE_BROKERS]: 0.95, // Most comprehensive, real-time data
    [BrokerId.SCHWAB]: 0.90,             // High quality, professional platform
    [BrokerId.PLAID]: 0.85,              // Good aggregation, some delay
    [BrokerId.NORDNET]: 0.80             // Good but Nordic-focused
  }

  /**
   * Resolve conflicts between duplicate holdings from multiple brokers
   */
  async resolveConflicts(duplicateHoldings: BrokerageHolding[]): Promise<ConflictResolutionResult> {
    console.log(`[ConflictResolution] Resolving conflicts for ${duplicateHoldings.length} duplicate holdings`)
    
    try {
      // 1. Calculate data quality scores for each holding
      const qualityScores = await this.calculateDataQualityScores(duplicateHoldings)
      
      // 2. Get broker reliability metrics
      const reliabilityMetrics = await this.getBrokerReliabilityMetrics(duplicateHoldings)
      
      // 3. Apply resolution rules in order of priority
      const resolutionRules = this.defineResolutionRules()
      let bestHolding = duplicateHoldings[0]
      let bestScore = 0
      let appliedRules: ResolutionRule[] = []
      
      // Apply each resolution rule
      for (const rule of resolutionRules) {
        const result = this.applyResolutionRule(rule, duplicateHoldings, qualityScores, reliabilityMetrics)
        
        if (result.score > bestScore) {
          bestHolding = result.holding
          bestScore = result.score
          appliedRules = [...appliedRules, { ...rule, applied: true }]
        } else {
          appliedRules.push({ ...rule, applied: false })
        }
      }
      
      // 4. Create resolution result
      const result: ConflictResolutionResult = {
        preferredHolding: bestHolding,
        preferredSource: bestHolding.metadata?.brokerId || BrokerId.PLAID,
        reason: this.generateResolutionReason(appliedRules, bestHolding),
        confidence: bestScore,
        alternatives: duplicateHoldings.filter(h => h !== bestHolding),
        resolutionRules: appliedRules
      }
      
      // 5. Log resolution decision
      await this.logResolutionDecision(result)
      
      console.log(`[ConflictResolution] Resolved conflict: ${result.preferredSource} selected with ${result.confidence} confidence`)
      
      return result
      
    } catch (error) {
      console.error('[ConflictResolution] Error during conflict resolution:', error)
      
      // Fallback to simple broker priority
      const fallbackHolding = this.selectByBrokerPriority(duplicateHoldings)
      
      return {
        preferredHolding: fallbackHolding,
        preferredSource: fallbackHolding.metadata?.brokerId || BrokerId.PLAID,
        reason: 'Fallback to broker priority due to resolution error',
        confidence: 0.5,
        alternatives: duplicateHoldings.filter(h => h !== fallbackHolding),
        resolutionRules: []
      }
    }
  }

  /**
   * Calculate data quality scores for each holding
   */
  private async calculateDataQualityScores(holdings: BrokerageHolding[]): Promise<DataQualityScore[]> {
    const scores: DataQualityScore[] = []
    
    for (const holding of holdings) {
      const brokerId = holding.metadata?.brokerId || BrokerId.PLAID
      
      const score: DataQualityScore = {
        brokerId,
        score: 0,
        factors: {
          priceAccuracy: this.evaluatePriceAccuracy(holding),
          costBasisAvailable: holding.costBasis ? 1.0 : 0.0,
          timestampRecency: this.evaluateTimestampRecency(holding),
          metadataCompleteness: this.evaluateMetadataCompleteness(holding),
          historicalReliability: this.brokerReliabilityRankings[brokerId] || 0.5
        }
      }
      
      // Calculate weighted score
      score.score = (
        score.factors.priceAccuracy * 0.25 +
        score.factors.costBasisAvailable * 0.20 +
        score.factors.timestampRecency * 0.15 +
        score.factors.metadataCompleteness * 0.15 +
        score.factors.historicalReliability * 0.25
      )
      
      scores.push(score)
    }
    
    return scores
  }

  /**
   * Evaluate price accuracy based on market price vs expected range
   */
  private evaluatePriceAccuracy(holding: BrokerageHolding): number {
    // Simple validation: price should be positive and reasonable
    if (holding.marketPrice <= 0) return 0.0
    if (holding.marketPrice > 10000) return 0.5 // Suspicious high price
    
    // Check if market value matches price * quantity
    const calculatedValue = holding.marketPrice * holding.quantity
    const valueDifference = Math.abs(calculatedValue - holding.marketValue)
    const tolerance = holding.marketValue * 0.01 // 1% tolerance
    
    return valueDifference <= tolerance ? 1.0 : 0.7
  }

  /**
   * Evaluate timestamp recency (newer data is better)
   */
  private evaluateTimestampRecency(holding: BrokerageHolding): number {
    const lastUpdated = holding.metadata?.lastUpdated
    if (!lastUpdated) return 0.3
    
    const ageInHours = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60)
    
    if (ageInHours < 1) return 1.0    // Very recent
    if (ageInHours < 24) return 0.8   // Within a day
    if (ageInHours < 168) return 0.6  // Within a week
    return 0.3                        // Older than a week
  }

  /**
   * Evaluate metadata completeness
   */
  private evaluateMetadataCompleteness(holding: BrokerageHolding): number {
    let completeness = 0
    const metadata = holding.metadata || {}
    
    // Check for important fields
    if (metadata.isin) completeness += 0.2
    if (metadata.cusip) completeness += 0.2
    if (metadata.name) completeness += 0.2
    if (metadata.exchange) completeness += 0.2
    if (metadata.accountName) completeness += 0.1
    if (metadata.brokerId) completeness += 0.1
    
    return Math.min(completeness, 1.0)
  }

  /**
   * Get broker reliability metrics
   */
  private async getBrokerReliabilityMetrics(holdings: BrokerageHolding[]): Promise<BrokerReliabilityMetrics[]> {
    const metrics: BrokerReliabilityMetrics[] = []
    
    for (const holding of holdings) {
      const brokerId = holding.metadata?.brokerId || BrokerId.PLAID
      
      // In a real implementation, this would query actual metrics from the database
      const metric: BrokerReliabilityMetrics = {
        brokerId,
        reliability: this.brokerReliabilityRankings[brokerId] || 0.5,
        dataQuality: this.brokerReliabilityRankings[brokerId] || 0.5,
        apiStability: this.brokerReliabilityRankings[brokerId] || 0.5,
        updateFrequency: this.getBrokerUpdateFrequency(brokerId),
        lastSuccessfulSync: holding.metadata?.lastUpdated || new Date().toISOString(),
        errorRate: this.getBrokerErrorRate(brokerId)
      }
      
      metrics.push(metric)
    }
    
    return metrics
  }

  /**
   * Define resolution rules in order of priority
   */
  private defineResolutionRules(): ResolutionRule[] {
    return [
      {
        type: 'data_quality',
        weight: 0.4,
        description: 'Select holding with highest data quality score',
        applied: false
      },
      {
        type: 'broker_priority',
        weight: 0.3,
        description: 'Prefer brokers with better API reliability',
        applied: false
      },
      {
        type: 'timestamp',
        weight: 0.2,
        description: 'Prefer more recently updated data',
        applied: false
      },
      {
        type: 'manual',
        weight: 0.1,
        description: 'Apply user-defined preferences',
        applied: false
      },
      {
        type: 'fallback',
        weight: 0.05,
        description: 'Default to first available holding',
        applied: false
      }
    ]
  }

  /**
   * Apply a specific resolution rule
   */
  private applyResolutionRule(
    rule: ResolutionRule,
    holdings: BrokerageHolding[],
    qualityScores: DataQualityScore[],
    reliabilityMetrics: BrokerReliabilityMetrics[]
  ): { holding: BrokerageHolding; score: number } {
    
    switch (rule.type) {
      case 'data_quality':
        return this.applyDataQualityRule(holdings, qualityScores, rule.weight)
      
      case 'broker_priority':
        return this.applyBrokerPriorityRule(holdings, reliabilityMetrics, rule.weight)
      
      case 'timestamp':
        return this.applyTimestampRule(holdings, rule.weight)
      
      case 'manual':
        return this.applyManualRule(holdings, rule.weight)
      
      case 'fallback':
        return this.applyFallbackRule(holdings, rule.weight)
      
      default:
        return { holding: holdings[0], score: 0 }
    }
  }

  /**
   * Apply data quality rule
   */
  private applyDataQualityRule(
    holdings: BrokerageHolding[],
    qualityScores: DataQualityScore[],
    weight: number
  ): { holding: BrokerageHolding; score: number } {
    let bestHolding = holdings[0]
    let bestScore = 0
    
    for (let i = 0; i < holdings.length; i++) {
      const holding = holdings[i]
      const score = qualityScores[i]?.score || 0
      
      if (score > bestScore) {
        bestHolding = holding
        bestScore = score
      }
    }
    
    return { holding: bestHolding, score: bestScore * weight }
  }

  /**
   * Apply broker priority rule
   */
  private applyBrokerPriorityRule(
    holdings: BrokerageHolding[],
    reliabilityMetrics: BrokerReliabilityMetrics[],
    weight: number
  ): { holding: BrokerageHolding; score: number } {
    let bestHolding = holdings[0]
    let bestScore = 0
    
    for (let i = 0; i < holdings.length; i++) {
      const holding = holdings[i]
      const brokerId = holding.metadata?.brokerId || BrokerId.PLAID
      const reliability = this.brokerReliabilityRankings[brokerId] || 0.5
      
      if (reliability > bestScore) {
        bestHolding = holding
        bestScore = reliability
      }
    }
    
    return { holding: bestHolding, score: bestScore * weight }
  }

  /**
   * Apply timestamp rule (prefer newer data)
   */
  private applyTimestampRule(
    holdings: BrokerageHolding[],
    weight: number
  ): { holding: BrokerageHolding; score: number } {
    let bestHolding = holdings[0]
    let bestTimestamp = 0
    
    for (const holding of holdings) {
      const timestamp = holding.metadata?.lastUpdated 
        ? new Date(holding.metadata.lastUpdated).getTime()
        : 0
      
      if (timestamp > bestTimestamp) {
        bestHolding = holding
        bestTimestamp = timestamp
      }
    }
    
    const recencyScore = this.evaluateTimestampRecency(bestHolding)
    return { holding: bestHolding, score: recencyScore * weight }
  }

  /**
   * Apply manual rule (user preferences)
   */
  private applyManualRule(
    holdings: BrokerageHolding[],
    weight: number
  ): { holding: BrokerageHolding; score: number } {
    // In a real implementation, this would check user preferences
    // For now, return no preference
    return { holding: holdings[0], score: 0 }
  }

  /**
   * Apply fallback rule
   */
  private applyFallbackRule(
    holdings: BrokerageHolding[],
    weight: number
  ): { holding: BrokerageHolding; score: number } {
    return { holding: holdings[0], score: weight }
  }

  /**
   * Select by broker priority (fallback method)
   */
  private selectByBrokerPriority(holdings: BrokerageHolding[]): BrokerageHolding {
    const priorityOrder = [
      BrokerId.INTERACTIVE_BROKERS,
      BrokerId.SCHWAB,
      BrokerId.PLAID,
      BrokerId.NORDNET
    ]
    
    for (const brokerId of priorityOrder) {
      const holding = holdings.find(h => h.metadata?.brokerId === brokerId)
      if (holding) return holding
    }
    
    return holdings[0]
  }

  /**
   * Generate human-readable resolution reason
   */
  private generateResolutionReason(rules: ResolutionRule[], selectedHolding: BrokerageHolding): string {
    const appliedRules = rules.filter(r => r.applied)
    const brokerId = selectedHolding.metadata?.brokerId || 'unknown'
    
    if (appliedRules.length === 0) {
      return `Selected ${brokerId} as fallback option`
    }
    
    const primaryRule = appliedRules[0]
    const reasons: string[] = []
    
    switch (primaryRule.type) {
      case 'data_quality':
        reasons.push(`${brokerId} has highest data quality score`)
        break
      case 'broker_priority':
        reasons.push(`${brokerId} has highest reliability rating`)
        break
      case 'timestamp':
        reasons.push(`${brokerId} has most recent data`)
        break
      case 'manual':
        reasons.push(`${brokerId} selected by user preference`)
        break
      default:
        reasons.push(`${brokerId} selected by default`)
    }
    
    return reasons.join(', ')
  }

  /**
   * Log resolution decision for audit trail
   */
  private async logResolutionDecision(result: ConflictResolutionResult): Promise<void> {
    try {
      const logEntry = {
        resolution_id: crypto.randomUUID(),
        preferred_source: result.preferredSource,
        reason: result.reason,
        confidence: result.confidence,
        alternatives: result.alternatives.map(h => h.metadata?.brokerId).filter(Boolean),
        applied_rules: result.resolutionRules.filter(r => r.applied).map(r => r.type),
        created_at: new Date().toISOString()
      }
      
      // In a real implementation, this would store to a conflict_resolutions table
      console.log('[ConflictResolution] Resolution logged:', logEntry)
      
    } catch (error) {
      console.error('[ConflictResolution] Error logging resolution:', error)
    }
  }

  /**
   * Get broker update frequency
   */
  private getBrokerUpdateFrequency(brokerId: BrokerId): number {
    const frequencies: Record<BrokerId, number> = {
      [BrokerId.INTERACTIVE_BROKERS]: 0.95, // Real-time
      [BrokerId.SCHWAB]: 0.90,             // Near real-time
      [BrokerId.PLAID]: 0.70,              // Daily updates
      [BrokerId.NORDNET]: 0.75             // Regular updates
    }
    
    return frequencies[brokerId] || 0.5
  }

  /**
   * Get broker error rate
   */
  private getBrokerErrorRate(brokerId: BrokerId): number {
    const errorRates: Record<BrokerId, number> = {
      [BrokerId.INTERACTIVE_BROKERS]: 0.02, // 2% error rate
      [BrokerId.SCHWAB]: 0.03,             // 3% error rate
      [BrokerId.PLAID]: 0.05,              // 5% error rate
      [BrokerId.NORDNET]: 0.04             // 4% error rate
    }
    
    return errorRates[brokerId] || 0.1
  }

  /**
   * Get user preferences for conflict resolution
   */
  async getUserPreferences(userId: string): Promise<any> {
    const { data } = await this.supabase
      .from('user_preferences')
      .select('conflict_resolution_preferences')
      .eq('user_id', userId)
      .single()
    
    return data?.conflict_resolution_preferences || {}
  }

  /**
   * Set user preferences for conflict resolution
   */
  async setUserPreferences(userId: string, preferences: any): Promise<void> {
    await this.supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        conflict_resolution_preferences: preferences,
        updated_at: new Date().toISOString()
      })
  }
}