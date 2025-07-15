// API endpoint for triggering multi-broker portfolio aggregation
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PortfolioAggregationService } from '@/lib/services/portfolio-aggregation'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { baseCurrency = 'USD', force = false } = body

    // Check if aggregation is already running
    if (!force) {
      const { data: existingAggregation } = await supabase
        .from('portfolio_aggregation_results')
        .select('aggregation_status, started_at')
        .eq('user_id', user.id)
        .single()

      if (existingAggregation?.aggregation_status === 'running') {
        const startedAt = new Date(existingAggregation.started_at)
        const now = new Date()
        const minutesAgo = (now.getTime() - startedAt.getTime()) / (1000 * 60)
        
        if (minutesAgo < 5) {
          return NextResponse.json(
            { 
              error: 'Aggregation already running',
              message: 'Please wait for the current aggregation to complete'
            },
            { status: 409 }
          )
        }
      }
    }

    // Update aggregation status to running
    await supabase
      .from('portfolio_aggregation_results')
      .upsert({
        user_id: user.id,
        aggregation_status: 'running',
        started_at: new Date().toISOString(),
        base_currency: baseCurrency
      })

    // Trigger aggregation
    const aggregationResult = await PortfolioAggregationService.triggerAggregation(
      user.id,
      baseCurrency
    )

    // Update aggregation status with results
    await supabase
      .from('portfolio_aggregation_results')
      .update({
        aggregation_status: aggregationResult.success ? 'completed' : 'failed',
        total_holdings_count: aggregationResult.consolidatedHoldings.length,
        consolidated_holdings_count: aggregationResult.consolidatedHoldings.filter(h => !h.isDuplicate).length,
        duplicates_detected: aggregationResult.duplicatesDetected,
        conflicts_resolved: aggregationResult.conflictsResolved,
        aggregation_summary: {
          totalValue: aggregationResult.summary.totalValue,
          totalCostBasis: aggregationResult.summary.totalCostBasis,
          totalGainLoss: aggregationResult.summary.totalGainLoss,
          totalGainLossPercent: aggregationResult.summary.totalGainLossPercent,
          assetAllocation: aggregationResult.summary.assetAllocation,
          topHoldings: aggregationResult.summary.topHoldings.slice(0, 10)
        },
        errors: aggregationResult.errors,
        warnings: aggregationResult.warnings,
        completed_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    return NextResponse.json({
      success: aggregationResult.success,
      message: aggregationResult.success 
        ? 'Portfolio aggregation completed successfully'
        : 'Portfolio aggregation failed',
      data: {
        summary: aggregationResult.summary,
        consolidatedHoldings: aggregationResult.consolidatedHoldings,
        duplicatesDetected: aggregationResult.duplicatesDetected,
        conflictsResolved: aggregationResult.conflictsResolved,
        baseCurrency
      },
      errors: aggregationResult.errors,
      warnings: aggregationResult.warnings
    })

  } catch (error) {
    console.error('[API] Portfolio aggregation error:', error)

    // Update aggregation status to failed
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await supabase
          .from('portfolio_aggregation_results')
          .update({
            aggregation_status: 'failed',
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            completed_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
      }
    } catch (updateError) {
      console.error('[API] Error updating aggregation status:', updateError)
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get aggregation status
    const { data: aggregationResult, error } = await supabase
      .from('portfolio_aggregation_results')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Get consolidated holdings
    const { data: consolidatedHoldings, error: holdingsError } = await supabase
      .from('consolidated_portfolio_holdings')
      .select('*')
      .eq('user_id', user.id)
      .order('total_market_value', { ascending: false })

    if (holdingsError) {
      throw holdingsError
    }

    // Get broker performance comparison
    const { data: brokerPerformance, error: performanceError } = await supabase
      .from('broker_performance_comparison')
      .select('*')
      .eq('user_id', user.id)

    if (performanceError) {
      throw performanceError
    }

    return NextResponse.json({
      success: true,
      data: {
        aggregationResult: aggregationResult || {
          aggregation_status: 'never_run',
          total_holdings_count: 0,
          consolidated_holdings_count: 0,
          duplicates_detected: 0,
          conflicts_resolved: 0,
          base_currency: 'USD'
        },
        consolidatedHoldings: consolidatedHoldings || [],
        brokerPerformance: brokerPerformance || []
      }
    })

  } catch (error) {
    console.error('[API] Get portfolio aggregation error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}