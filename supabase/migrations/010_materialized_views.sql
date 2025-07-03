-- Materialized Views for Performance Optimization in LifeDash
-- These views pre-calculate expensive queries to improve UI responsiveness

-- =============================================================================
-- PORTFOLIO PERFORMANCE MATERIALIZED VIEWS
-- =============================================================================

-- Materialized view for current portfolio values and performance
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_portfolio_current_performance AS
SELECT 
    p.id as portfolio_id,
    p.user_id,
    p.name as portfolio_name,
    p.currency,
    p.created_at as portfolio_created_at,
    
    -- Current values
    COALESCE(SUM(h.market_value), 0) as total_market_value,
    COALESCE(SUM(h.total_cost), 0) as total_cost_basis,
    COALESCE(SUM(h.quantity * h.current_price), 0) - COALESCE(SUM(h.total_cost), 0) as unrealized_pnl,
    
    -- Performance metrics
    CASE 
        WHEN COALESCE(SUM(h.total_cost), 0) > 0 
        THEN ((COALESCE(SUM(h.market_value), 0) - COALESCE(SUM(h.total_cost), 0)) / COALESCE(SUM(h.total_cost), 0)) * 100
        ELSE 0 
    END as unrealized_pnl_percent,
    
    -- Daily change
    COALESCE(SUM(h.day_change), 0) as total_day_change,
    CASE 
        WHEN COALESCE(SUM(h.market_value - h.day_change), 0) > 0 
        THEN (COALESCE(SUM(h.day_change), 0) / COALESCE(SUM(h.market_value - h.day_change), 0)) * 100
        ELSE 0 
    END as day_change_percent,
    
    -- Asset allocation
    COUNT(DISTINCT h.stock_id) as number_of_holdings,
    COUNT(DISTINCT a.id) as number_of_accounts,
    
    -- Cash balances (from accounts)
    COALESCE(SUM(a.opening_balance), 0) as total_cash,
    
    -- Last updated
    NOW() as calculated_at,
    MAX(h.last_price_update) as last_price_update

FROM public.portfolios p
LEFT JOIN public.accounts a ON a.portfolio_id = p.id AND a.is_active = true
LEFT JOIN public.holdings h ON h.account_id = a.id AND h.is_active = true AND h.quantity > 0
GROUP BY p.id, p.user_id, p.name, p.currency, p.created_at;

-- Create indexes for the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_portfolio_perf_portfolio_id 
    ON public.mv_portfolio_current_performance(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_mv_portfolio_perf_user_id 
    ON public.mv_portfolio_current_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_mv_portfolio_perf_market_value 
    ON public.mv_portfolio_current_performance(total_market_value DESC);

-- =============================================================================
-- STOCK PERFORMANCE SUMMARY
-- =============================================================================

-- Materialized view for stock performance across all portfolios
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_stock_performance_summary AS
SELECT 
    s.id as stock_id,
    s.symbol,
    s.name,
    s.exchange,
    s.currency,
    s.asset_class,
    s.sector,
    s.industry,
    
    -- Current price data
    p.close_price as current_price,
    p.volume as current_volume,
    p.date as price_date,
    
    -- Price changes
    p.close_price - LAG(p.close_price) OVER (PARTITION BY s.id ORDER BY p.date) as price_change,
    CASE 
        WHEN LAG(p.close_price) OVER (PARTITION BY s.id ORDER BY p.date) > 0
        THEN ((p.close_price - LAG(p.close_price) OVER (PARTITION BY s.id ORDER BY p.date)) / 
              LAG(p.close_price) OVER (PARTITION BY s.id ORDER BY p.date)) * 100
        ELSE 0 
    END as price_change_percent,
    
    -- Trading volumes
    p.volume,
    AVG(p.volume) OVER (PARTITION BY s.id ORDER BY p.date ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as avg_volume_30d,
    
    -- Price ranges
    MAX(p.high_price) OVER (PARTITION BY s.id ORDER BY p.date ROWS BETWEEN 51 PRECEDING AND CURRENT ROW) as high_52w,
    MIN(p.low_price) OVER (PARTITION BY s.id ORDER BY p.date ROWS BETWEEN 51 PRECEDING AND CURRENT ROW) as low_52w,
    
    -- Volatility (simplified)
    STDDEV(p.close_price) OVER (PARTITION BY s.id ORDER BY p.date ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as volatility_30d,
    
    -- Holdings aggregation
    COUNT(h.id) as total_holders,
    COALESCE(SUM(h.quantity), 0) as total_shares_held,
    COALESCE(SUM(h.market_value), 0) as total_market_value_held,
    
    NOW() as calculated_at

FROM public.stocks s
LEFT JOIN LATERAL (
    SELECT * FROM public.stock_prices sp 
    WHERE sp.stock_id = s.id 
    ORDER BY sp.date DESC 
    LIMIT 60  -- Last 60 days for calculations
) p ON true
LEFT JOIN public.holdings h ON h.stock_id = s.id AND h.is_active = true AND h.quantity > 0
WHERE s.is_active = true
GROUP BY s.id, s.symbol, s.name, s.exchange, s.currency, s.asset_class, s.sector, s.industry, 
         p.close_price, p.volume, p.date, p.high_price, p.low_price;

-- Create indexes for stock performance view
CREATE INDEX IF NOT EXISTS idx_mv_stock_perf_symbol 
    ON public.mv_stock_performance_summary(symbol);
CREATE INDEX IF NOT EXISTS idx_mv_stock_perf_sector 
    ON public.mv_stock_performance_summary(sector);
CREATE INDEX IF NOT EXISTS idx_mv_stock_perf_price_change 
    ON public.mv_stock_performance_summary(price_change_percent DESC);

-- =============================================================================
-- USER DASHBOARD SUMMARY
-- =============================================================================

-- Materialized view for user dashboard overview
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_user_dashboard_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    
    -- Portfolio counts and values
    COUNT(DISTINCT p.id) as total_portfolios,
    COUNT(DISTINCT a.id) as total_accounts,
    COUNT(DISTINCT h.id) FILTER (WHERE h.quantity > 0) as total_active_holdings,
    COUNT(DISTINCT h.stock_id) as unique_stocks_owned,
    
    -- Total values across all portfolios
    COALESCE(SUM(h.market_value), 0) as total_market_value,
    COALESCE(SUM(h.total_cost), 0) as total_cost_basis,
    COALESCE(SUM(h.market_value - h.total_cost), 0) as total_unrealized_pnl,
    
    -- Overall performance
    CASE 
        WHEN COALESCE(SUM(h.total_cost), 0) > 0 
        THEN ((COALESCE(SUM(h.market_value), 0) - COALESCE(SUM(h.total_cost), 0)) / COALESCE(SUM(h.total_cost), 0)) * 100
        ELSE 0 
    END as total_return_percent,
    
    -- Daily performance
    COALESCE(SUM(h.day_change), 0) as total_day_change,
    
    -- Transaction activity
    COUNT(t.id) FILTER (WHERE t.date >= CURRENT_DATE - INTERVAL '30 days') as transactions_last_30d,
    COUNT(t.id) FILTER (WHERE t.date >= CURRENT_DATE - INTERVAL '7 days') as transactions_last_7d,
    
    -- Recent activity
    MAX(t.date) as last_transaction_date,
    MAX(h.last_price_update) as last_price_update,
    
    -- Asset allocation summary
    COALESCE(SUM(h.market_value) FILTER (WHERE s.asset_class = 'STOCK'), 0) as stock_allocation,
    COALESCE(SUM(h.market_value) FILTER (WHERE s.asset_class = 'ETF'), 0) as etf_allocation,
    COALESCE(SUM(h.market_value) FILTER (WHERE s.asset_class = 'BOND'), 0) as bond_allocation,
    COALESCE(SUM(h.market_value) FILTER (WHERE s.asset_class = 'CRYPTOCURRENCY'), 0) as crypto_allocation,
    COALESCE(SUM(h.market_value) FILTER (WHERE s.asset_class = 'CASH'), 0) as cash_allocation,
    
    NOW() as calculated_at

FROM public.user_profiles u
LEFT JOIN public.portfolios p ON p.user_id = u.id
LEFT JOIN public.accounts a ON a.portfolio_id = p.id AND a.is_active = true
LEFT JOIN public.holdings h ON h.account_id = a.id AND h.is_active = true
LEFT JOIN public.stocks s ON s.id = h.stock_id
LEFT JOIN public.transactions t ON t.account_id = a.id
GROUP BY u.id, u.email, u.full_name;

-- Create indexes for dashboard view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dashboard_user_id 
    ON public.mv_user_dashboard_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_mv_dashboard_market_value 
    ON public.mv_user_dashboard_summary(total_market_value DESC);

-- =============================================================================
-- ASSET ALLOCATION ANALYSIS
-- =============================================================================

-- Materialized view for detailed asset allocation analysis
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_asset_allocation_analysis AS
SELECT 
    p.id as portfolio_id,
    p.user_id,
    p.name as portfolio_name,
    
    -- Asset class breakdown
    s.asset_class,
    s.sector,
    s.currency as asset_currency,
    
    -- Allocation values
    COALESCE(SUM(h.market_value), 0) as market_value,
    COALESCE(SUM(h.total_cost), 0) as cost_basis,
    COALESCE(SUM(h.quantity), 0) as total_quantity,
    
    -- Portfolio percentage
    CASE 
        WHEN portfolio_totals.total_portfolio_value > 0 
        THEN (COALESCE(SUM(h.market_value), 0) / portfolio_totals.total_portfolio_value) * 100
        ELSE 0 
    END as allocation_percentage,
    
    -- Performance
    COALESCE(SUM(h.market_value - h.total_cost), 0) as unrealized_pnl,
    CASE 
        WHEN COALESCE(SUM(h.total_cost), 0) > 0 
        THEN ((COALESCE(SUM(h.market_value), 0) - COALESCE(SUM(h.total_cost), 0)) / COALESCE(SUM(h.total_cost), 0)) * 100
        ELSE 0 
    END as return_percent,
    
    -- Holdings count
    COUNT(h.id) as number_of_holdings,
    
    NOW() as calculated_at

FROM public.portfolios p
LEFT JOIN public.accounts a ON a.portfolio_id = p.id AND a.is_active = true
LEFT JOIN public.holdings h ON h.account_id = a.id AND h.is_active = true AND h.quantity > 0
LEFT JOIN public.stocks s ON s.id = h.stock_id
LEFT JOIN LATERAL (
    SELECT 
        p2.id,
        COALESCE(SUM(h2.market_value), 0) as total_portfolio_value
    FROM public.portfolios p2
    LEFT JOIN public.accounts a2 ON a2.portfolio_id = p2.id AND a2.is_active = true
    LEFT JOIN public.holdings h2 ON h2.account_id = a2.id AND h2.is_active = true AND h2.quantity > 0
    WHERE p2.id = p.id
    GROUP BY p2.id
) portfolio_totals ON true
GROUP BY p.id, p.user_id, p.name, s.asset_class, s.sector, s.currency, portfolio_totals.total_portfolio_value;

-- Create indexes for asset allocation view
CREATE INDEX IF NOT EXISTS idx_mv_asset_alloc_portfolio 
    ON public.mv_asset_allocation_analysis(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_mv_asset_alloc_user 
    ON public.mv_asset_allocation_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_mv_asset_alloc_class 
    ON public.mv_asset_allocation_analysis(asset_class);

-- =============================================================================
-- PERFORMANCE TRACKING VIEW
-- =============================================================================

-- Materialized view for tracking portfolio performance over time
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_portfolio_performance_tracking AS
SELECT 
    p.id as portfolio_id,
    p.user_id,
    pp.date,
    pp.total_value,
    pp.total_cost,
    pp.daily_return,
    pp.daily_return_percent,
    pp.cumulative_return,
    pp.cumulative_return_percent,
    
    -- Moving averages
    AVG(pp.total_value) OVER (
        PARTITION BY p.id 
        ORDER BY pp.date 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as value_7d_avg,
    
    AVG(pp.total_value) OVER (
        PARTITION BY p.id 
        ORDER BY pp.date 
        ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
    ) as value_30d_avg,
    
    -- Performance metrics
    STDDEV(pp.daily_return_percent) OVER (
        PARTITION BY p.id 
        ORDER BY pp.date 
        ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
    ) as volatility_30d,
    
    -- Drawdown calculation
    pp.total_value - MAX(pp.total_value) OVER (
        PARTITION BY p.id 
        ORDER BY pp.date 
        ROWS UNBOUNDED PRECEDING
    ) as drawdown,
    
    NOW() as calculated_at

FROM public.portfolios p
LEFT JOIN public.portfolio_performance pp ON pp.portfolio_id = p.id
WHERE pp.date IS NOT NULL
ORDER BY p.id, pp.date;

-- Create indexes for performance tracking
CREATE INDEX IF NOT EXISTS idx_mv_perf_tracking_portfolio_date 
    ON public.mv_portfolio_performance_tracking(portfolio_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_mv_perf_tracking_user 
    ON public.mv_portfolio_performance_tracking(user_id);

-- =============================================================================
-- REFRESH FUNCTIONS
-- =============================================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS TEXT AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration INTERVAL;
    result TEXT;
BEGIN
    start_time := NOW();
    
    -- Refresh views in dependency order
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_portfolio_current_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_stock_performance_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_user_dashboard_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_asset_allocation_analysis;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_portfolio_performance_tracking;
    
    end_time := NOW();
    duration := end_time - start_time;
    
    result := 'All materialized views refreshed successfully in ' || duration;
    
    -- Log the refresh
    INSERT INTO public.audit_logs (
        action, 
        resource_type, 
        success, 
        metadata,
        created_at
    ) VALUES (
        'CALCULATE'::audit_action,
        'materialized_views',
        true,
        jsonb_build_object(
            'refresh_duration', duration,
            'refreshed_at', end_time,
            'views_refreshed', 5
        ),
        NOW()
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Log the error
    INSERT INTO public.audit_logs (
        action, 
        resource_type, 
        success, 
        error_message,
        created_at
    ) VALUES (
        'CALCULATE'::audit_action,
        'materialized_views',
        false,
        SQLERRM,
        NOW()
    );
    
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh specific materialized view
CREATE OR REPLACE FUNCTION refresh_materialized_view(view_name TEXT)
RETURNS TEXT AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration INTERVAL;
    result TEXT;
BEGIN
    start_time := NOW();
    
    -- Validate view name and refresh
    CASE view_name
        WHEN 'portfolio_performance' THEN
            REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_portfolio_current_performance;
        WHEN 'stock_performance' THEN
            REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_stock_performance_summary;
        WHEN 'dashboard_summary' THEN
            REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_user_dashboard_summary;
        WHEN 'asset_allocation' THEN
            REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_asset_allocation_analysis;
        WHEN 'performance_tracking' THEN
            REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_portfolio_performance_tracking;
        ELSE
            RAISE EXCEPTION 'Unknown materialized view: %', view_name;
    END CASE;
    
    end_time := NOW();
    duration := end_time - start_time;
    
    result := 'Materialized view ' || view_name || ' refreshed in ' || duration;
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to refresh materialized view %: %', view_name, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- MATERIALIZED VIEW ACCESS CONTROL
-- =============================================================================

-- Note: Materialized views don't support RLS directly. 
-- Access control should be implemented at the application level
-- or through security-definer functions that query these views.

-- Stock performance is public (no RLS needed)
COMMENT ON MATERIALIZED VIEW public.mv_stock_performance_summary IS 'Public stock performance data - no access restrictions';

-- =============================================================================
-- SCHEDULED REFRESH SETUP
-- =============================================================================

-- Create a function to set up scheduled refreshes (placeholder for cron extension)
CREATE OR REPLACE FUNCTION setup_materialized_view_refresh_schedule()
RETURNS TEXT AS $$
BEGIN
    -- This function serves as documentation for setting up scheduled refreshes
    -- In production, you would use pg_cron or similar to schedule these:
    -- 
    -- SELECT cron.schedule('refresh-portfolio-performance', '*/5 * * * *', 
    --                      'SELECT refresh_materialized_view(''portfolio_performance'')');
    -- 
    -- SELECT cron.schedule('refresh-stock-performance', '*/15 * * * *', 
    --                      'SELECT refresh_materialized_view(''stock_performance'')');
    -- 
    -- SELECT cron.schedule('refresh-dashboard-summary', '*/10 * * * *', 
    --                      'SELECT refresh_materialized_view(''dashboard_summary'')');
    
    RETURN 'Materialized view refresh schedule setup complete. Use pg_cron or external scheduler for production.';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON MATERIALIZED VIEW public.mv_portfolio_current_performance IS 'Real-time portfolio performance metrics for dashboard display';
COMMENT ON MATERIALIZED VIEW public.mv_stock_performance_summary IS 'Comprehensive stock performance data with technical indicators';
COMMENT ON MATERIALIZED VIEW public.mv_user_dashboard_summary IS 'User-level aggregated data for dashboard overview';
COMMENT ON MATERIALIZED VIEW public.mv_asset_allocation_analysis IS 'Detailed asset allocation breakdown by portfolio';
COMMENT ON MATERIALIZED VIEW public.mv_portfolio_performance_tracking IS 'Historical performance tracking with moving averages';

COMMENT ON FUNCTION refresh_all_materialized_views() IS 'Refreshes all materialized views and logs the operation';
COMMENT ON FUNCTION refresh_materialized_view(TEXT) IS 'Refreshes a specific materialized view by name';
COMMENT ON FUNCTION setup_materialized_view_refresh_schedule() IS 'Documentation for setting up scheduled refresh jobs';