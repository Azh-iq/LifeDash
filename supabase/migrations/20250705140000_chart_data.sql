-- Portfolio Performance Tracking and Chart Data Migration for LifeDash
-- Creates comprehensive tables for performance tracking, chart data, and analytics
-- Migration: 20250705140000_chart_data.sql

-- =============================================================================
-- PORTFOLIO SNAPSHOTS TABLE (Enhanced for Chart Data)
-- =============================================================================

-- Create enhanced portfolio_snapshots table for daily portfolio value snapshots
-- This table stores historical portfolio values for performance tracking and charts
CREATE TABLE IF NOT EXISTS public.portfolio_snapshots_enhanced (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  snapshot_time TIME DEFAULT CURRENT_TIME,
  
  -- Core portfolio metrics
  total_value DECIMAL(20,8) NOT NULL,
  total_cost DECIMAL(20,8) NOT NULL,
  cash_balance DECIMAL(20,8) DEFAULT 0,
  margin_balance DECIMAL(20,8) DEFAULT 0,
  available_cash DECIMAL(20,8) DEFAULT 0,
  
  -- Performance metrics
  unrealized_pnl DECIMAL(20,8) GENERATED ALWAYS AS (total_value - total_cost) STORED,
  unrealized_pnl_percent DECIMAL(10,4) GENERATED ALWAYS AS (
    CASE 
      WHEN total_cost > 0 
      THEN ((total_value - total_cost) / total_cost) * 100
      ELSE 0 
    END
  ) STORED,
  
  -- Daily change metrics
  day_change DECIMAL(20,8),
  day_change_percent DECIMAL(10,4),
  previous_close_value DECIMAL(20,8),
  
  -- Volatility and risk metrics
  volatility_1d DECIMAL(10,6),
  volatility_7d DECIMAL(10,6),
  volatility_30d DECIMAL(10,6),
  beta DECIMAL(10,6),
  sharpe_ratio DECIMAL(10,6),
  sortino_ratio DECIMAL(10,6),
  max_drawdown_percent DECIMAL(10,4),
  
  -- Dividend and income tracking
  dividends_received DECIMAL(20,8) DEFAULT 0,
  interest_earned DECIMAL(20,8) DEFAULT 0,
  fees_paid DECIMAL(20,8) DEFAULT 0,
  
  -- Asset allocation breakdown (JSON for flexible categories)
  allocation_breakdown JSONB,
  sector_allocation JSONB,
  geographic_allocation JSONB,
  
  -- Benchmark comparisons
  benchmark_return_1d DECIMAL(10,4),
  benchmark_return_7d DECIMAL(10,4),
  benchmark_return_30d DECIMAL(10,4),
  benchmark_return_ytd DECIMAL(10,4),
  alpha_1d DECIMAL(10,6),
  alpha_7d DECIMAL(10,6),
  alpha_30d DECIMAL(10,6),
  
  -- Currency and metadata
  currency currency_code NOT NULL,
  data_source data_source DEFAULT 'CALCULATED',
  calculation_method TEXT DEFAULT 'market_close',
  
  -- Market conditions at snapshot time
  market_hours BOOLEAN DEFAULT true,
  market_status TEXT CHECK (market_status IN ('open', 'closed', 'pre_market', 'after_market')),
  
  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_portfolio_values CHECK (
    total_value >= 0 AND 
    total_cost >= 0 AND 
    cash_balance >= 0 AND
    available_cash >= 0
  ),
  CONSTRAINT valid_allocation_data CHECK (
    allocation_breakdown IS NULL OR jsonb_typeof(allocation_breakdown) = 'object'
  ),
  CONSTRAINT valid_sector_data CHECK (
    sector_allocation IS NULL OR jsonb_typeof(sector_allocation) = 'object'
  ),
  CONSTRAINT valid_geographic_data CHECK (
    geographic_allocation IS NULL OR jsonb_typeof(geographic_allocation) = 'object'
  ),
  
  -- Unique constraint for portfolio and date
  UNIQUE(portfolio_id, snapshot_date)
);

-- =============================================================================
-- ACCOUNT PERFORMANCE HISTORY TABLE
-- =============================================================================

-- Create account_performance_history table for account-level performance tracking
CREATE TABLE IF NOT EXISTS public.account_performance_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  
  -- Date and time tracking
  performance_date DATE NOT NULL,
  performance_time TIME DEFAULT CURRENT_TIME,
  
  -- Account value metrics
  total_value DECIMAL(20,8) NOT NULL,
  total_cost DECIMAL(20,8) NOT NULL,
  cash_balance DECIMAL(20,8) DEFAULT 0,
  margin_used DECIMAL(20,8) DEFAULT 0,
  buying_power DECIMAL(20,8) DEFAULT 0,
  
  -- Performance calculations
  unrealized_pnl DECIMAL(20,8) GENERATED ALWAYS AS (total_value - total_cost) STORED,
  unrealized_pnl_percent DECIMAL(10,4) GENERATED ALWAYS AS (
    CASE 
      WHEN total_cost > 0 
      THEN ((total_value - total_cost) / total_cost) * 100
      ELSE 0 
    END
  ) STORED,
  
  -- Daily performance
  day_change DECIMAL(20,8),
  day_change_percent DECIMAL(10,4),
  
  -- Rolling performance periods
  return_1w DECIMAL(10,4),
  return_1m DECIMAL(10,4),
  return_3m DECIMAL(10,4),
  return_6m DECIMAL(10,4),
  return_1y DECIMAL(10,4),
  return_ytd DECIMAL(10,4),
  return_inception DECIMAL(10,4),
  
  -- Risk metrics
  volatility_30d DECIMAL(10,6),
  beta DECIMAL(10,6),
  sharpe_ratio DECIMAL(10,6),
  max_drawdown DECIMAL(10,4),
  
  -- Transaction flow
  deposits_ytd DECIMAL(20,8) DEFAULT 0,
  withdrawals_ytd DECIMAL(20,8) DEFAULT 0,
  net_deposits_ytd DECIMAL(20,8) GENERATED ALWAYS AS (deposits_ytd - withdrawals_ytd) STORED,
  
  -- Dividend and income
  dividends_ytd DECIMAL(20,8) DEFAULT 0,
  interest_ytd DECIMAL(20,8) DEFAULT 0,
  fees_ytd DECIMAL(20,8) DEFAULT 0,
  
  -- Holdings summary
  total_positions INTEGER DEFAULT 0,
  long_positions INTEGER DEFAULT 0,
  short_positions INTEGER DEFAULT 0,
  
  -- Currency and metadata
  currency currency_code NOT NULL,
  data_source data_source DEFAULT 'CALCULATED',
  
  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_account_values CHECK (
    total_value >= 0 AND 
    total_cost >= 0 AND 
    cash_balance >= 0 AND
    buying_power >= 0
  ),
  CONSTRAINT valid_positions CHECK (
    total_positions >= 0 AND
    long_positions >= 0 AND
    short_positions >= 0 AND
    total_positions >= (long_positions + short_positions)
  ),
  
  -- Unique constraint for account and date
  UNIQUE(account_id, performance_date)
);

-- =============================================================================
-- ASSET ALLOCATION HISTORY TABLE
-- =============================================================================

-- Create asset_allocation_history table for tracking allocation changes over time
CREATE TABLE IF NOT EXISTS public.asset_allocation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Date and time tracking
  allocation_date DATE NOT NULL,
  allocation_time TIME DEFAULT CURRENT_TIME,
  
  -- Asset class breakdown
  asset_class asset_class NOT NULL,
  sector TEXT,
  industry TEXT,
  geographic_region TEXT,
  
  -- Allocation metrics
  market_value DECIMAL(20,8) NOT NULL,
  cost_basis DECIMAL(20,8) NOT NULL,
  allocation_percent DECIMAL(8,4) NOT NULL,
  target_percent DECIMAL(8,4),
  deviation_percent DECIMAL(8,4) GENERATED ALWAYS AS (
    CASE 
      WHEN target_percent IS NOT NULL 
      THEN allocation_percent - target_percent
      ELSE NULL 
    END
  ) STORED,
  
  -- Performance metrics for this allocation
  unrealized_pnl DECIMAL(20,8) GENERATED ALWAYS AS (market_value - cost_basis) STORED,
  unrealized_pnl_percent DECIMAL(10,4) GENERATED ALWAYS AS (
    CASE 
      WHEN cost_basis > 0 
      THEN ((market_value - cost_basis) / cost_basis) * 100
      ELSE 0 
    END
  ) STORED,
  
  -- Day change for this allocation
  day_change DECIMAL(20,8),
  day_change_percent DECIMAL(10,4),
  
  -- Holdings count
  number_of_holdings INTEGER DEFAULT 0,
  largest_holding_percent DECIMAL(8,4),
  
  -- Currency and metadata
  currency currency_code NOT NULL,
  data_source data_source DEFAULT 'CALCULATED',
  
  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_allocation_values CHECK (
    market_value >= 0 AND 
    cost_basis >= 0 AND 
    allocation_percent >= 0 AND
    allocation_percent <= 100
  ),
  CONSTRAINT valid_target_allocation CHECK (
    target_percent IS NULL OR (target_percent >= 0 AND target_percent <= 100)
  ),
  CONSTRAINT valid_holdings_count CHECK (number_of_holdings >= 0),
  
  -- Unique constraint for portfolio, date, and asset class
  UNIQUE(portfolio_id, allocation_date, asset_class, sector, industry, geographic_region)
);

-- =============================================================================
-- BENCHMARK DATA TABLE
-- =============================================================================

-- Create benchmark_data table for storing market benchmark data
CREATE TABLE IF NOT EXISTS public.benchmark_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Benchmark identification
  benchmark_symbol TEXT NOT NULL,
  benchmark_name TEXT NOT NULL,
  benchmark_type TEXT NOT NULL CHECK (benchmark_type IN ('INDEX', 'ETF', 'SECTOR', 'CUSTOM')),
  
  -- Date and time
  price_date DATE NOT NULL,
  price_time TIME DEFAULT CURRENT_TIME,
  
  -- Price data
  open_price DECIMAL(20,8),
  high_price DECIMAL(20,8),
  low_price DECIMAL(20,8),
  close_price DECIMAL(20,8) NOT NULL,
  adjusted_close DECIMAL(20,8),
  volume BIGINT,
  
  -- Performance metrics
  day_change DECIMAL(20,8),
  day_change_percent DECIMAL(10,4),
  
  -- Rolling returns
  return_1w DECIMAL(10,4),
  return_1m DECIMAL(10,4),
  return_3m DECIMAL(10,4),
  return_6m DECIMAL(10,4),
  return_1y DECIMAL(10,4),
  return_ytd DECIMAL(10,4),
  return_3y DECIMAL(10,4),
  return_5y DECIMAL(10,4),
  
  -- Volatility metrics
  volatility_30d DECIMAL(10,6),
  volatility_1y DECIMAL(10,6),
  
  -- Market cap and fundamentals (for index benchmarks)
  market_cap DECIMAL(20,8),
  pe_ratio DECIMAL(10,4),
  dividend_yield DECIMAL(8,4),
  
  -- Currency and metadata
  currency currency_code NOT NULL,
  data_source data_source DEFAULT 'MARKET_DATA_PROVIDER',
  provider_name TEXT,
  
  -- Market information
  exchange TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_benchmark_prices CHECK (
    close_price > 0 AND
    (open_price IS NULL OR open_price > 0) AND
    (high_price IS NULL OR high_price > 0) AND
    (low_price IS NULL OR low_price > 0) AND
    (adjusted_close IS NULL OR adjusted_close > 0)
  ),
  CONSTRAINT valid_benchmark_volume CHECK (volume IS NULL OR volume >= 0),
  CONSTRAINT valid_benchmark_cap CHECK (market_cap IS NULL OR market_cap >= 0),
  
  -- Unique constraint for benchmark and date
  UNIQUE(benchmark_symbol, price_date)
);

-- =============================================================================
-- PERFORMANCE METRICS TABLE
-- =============================================================================

-- Create performance_metrics table for calculated performance metrics
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Entity reference (can be portfolio, account, or holding)
  entity_type TEXT NOT NULL CHECK (entity_type IN ('PORTFOLIO', 'ACCOUNT', 'HOLDING', 'ASSET_CLASS')),
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Date and time
  calculation_date DATE NOT NULL,
  calculation_time TIME DEFAULT CURRENT_TIME,
  
  -- Time period for calculation
  period_type TEXT NOT NULL CHECK (period_type IN ('1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ITD', 'ALL')),
  start_date DATE,
  end_date DATE,
  
  -- Return metrics
  total_return DECIMAL(20,8),
  total_return_percent DECIMAL(10,4),
  annualized_return DECIMAL(10,4),
  compound_annual_growth_rate DECIMAL(10,4),
  
  -- Risk metrics
  volatility DECIMAL(10,6),
  downside_deviation DECIMAL(10,6),
  value_at_risk_95 DECIMAL(20,8),
  value_at_risk_99 DECIMAL(20,8),
  maximum_drawdown DECIMAL(10,4),
  maximum_drawdown_duration INTEGER, -- Days
  
  -- Risk-adjusted returns
  sharpe_ratio DECIMAL(10,6),
  sortino_ratio DECIMAL(10,6),
  treynor_ratio DECIMAL(10,6),
  information_ratio DECIMAL(10,6),
  calmar_ratio DECIMAL(10,6),
  
  -- Benchmark comparison
  benchmark_symbol TEXT,
  benchmark_return DECIMAL(10,4),
  alpha DECIMAL(10,6),
  beta DECIMAL(10,6),
  correlation DECIMAL(10,6),
  tracking_error DECIMAL(10,6),
  
  -- Advanced metrics
  skewness DECIMAL(10,6),
  kurtosis DECIMAL(10,6),
  up_capture_ratio DECIMAL(10,6),
  down_capture_ratio DECIMAL(10,6),
  
  -- Trade analysis (for active strategies)
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(8,4) GENERATED ALWAYS AS (
    CASE 
      WHEN total_trades > 0 
      THEN (winning_trades::DECIMAL / total_trades) * 100
      ELSE 0 
    END
  ) STORED,
  
  -- Profit metrics
  gross_profit DECIMAL(20,8),
  gross_loss DECIMAL(20,8),
  net_profit DECIMAL(20,8) GENERATED ALWAYS AS (gross_profit - gross_loss) STORED,
  profit_factor DECIMAL(10,4) GENERATED ALWAYS AS (
    CASE 
      WHEN gross_loss > 0 
      THEN gross_profit / gross_loss
      ELSE NULL 
    END
  ) STORED,
  
  -- Currency and metadata
  currency currency_code NOT NULL,
  data_source data_source DEFAULT 'CALCULATED',
  calculation_method TEXT DEFAULT 'time_weighted',
  
  -- Confidence and data quality
  confidence_score DECIMAL(5,2) DEFAULT 100.00,
  data_points_used INTEGER,
  
  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_metrics_values CHECK (
    (total_trades IS NULL OR total_trades >= 0) AND
    (winning_trades IS NULL OR winning_trades >= 0) AND
    (losing_trades IS NULL OR losing_trades >= 0) AND
    (total_trades IS NULL OR total_trades >= (winning_trades + losing_trades)) AND
    (confidence_score >= 0 AND confidence_score <= 100) AND
    (data_points_used IS NULL OR data_points_used >= 0)
  ),
  CONSTRAINT valid_date_range CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date),
  
  -- Unique constraint for entity, date, and period
  UNIQUE(entity_type, entity_id, calculation_date, period_type)
);

-- =============================================================================
-- PARTITIONING SETUP
-- =============================================================================

-- Create partitioned tables for large datasets
-- Portfolio snapshots partitioned by date
CREATE TABLE IF NOT EXISTS public.portfolio_snapshots_partitioned (
  LIKE public.portfolio_snapshots_enhanced INCLUDING ALL
) PARTITION BY RANGE (snapshot_date);

-- Account performance partitioned by date
CREATE TABLE IF NOT EXISTS public.account_performance_partitioned (
  LIKE public.account_performance_history INCLUDING ALL
) PARTITION BY RANGE (performance_date);

-- Benchmark data partitioned by date
CREATE TABLE IF NOT EXISTS public.benchmark_data_partitioned (
  LIKE public.benchmark_data INCLUDING ALL
) PARTITION BY RANGE (price_date);

-- Create initial partitions for the current year and next year
SELECT create_future_partitions('portfolio_snapshots_partitioned', 24);
SELECT create_future_partitions('account_performance_partitioned', 24);
SELECT create_future_partitions('benchmark_data_partitioned', 24);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Portfolio snapshots indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_enhanced_portfolio_id 
  ON public.portfolio_snapshots_enhanced(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_enhanced_date 
  ON public.portfolio_snapshots_enhanced(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_enhanced_portfolio_date 
  ON public.portfolio_snapshots_enhanced(portfolio_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_enhanced_value 
  ON public.portfolio_snapshots_enhanced(portfolio_id, total_value DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_enhanced_performance 
  ON public.portfolio_snapshots_enhanced(portfolio_id, unrealized_pnl_percent DESC);

-- Account performance indexes
CREATE INDEX IF NOT EXISTS idx_account_performance_history_account_id 
  ON public.account_performance_history(account_id);
CREATE INDEX IF NOT EXISTS idx_account_performance_history_user_id 
  ON public.account_performance_history(user_id);
CREATE INDEX IF NOT EXISTS idx_account_performance_history_date 
  ON public.account_performance_history(performance_date DESC);
CREATE INDEX IF NOT EXISTS idx_account_performance_history_account_date 
  ON public.account_performance_history(account_id, performance_date DESC);
CREATE INDEX IF NOT EXISTS idx_account_performance_history_portfolio_id 
  ON public.account_performance_history(portfolio_id);

-- Asset allocation history indexes
CREATE INDEX IF NOT EXISTS idx_asset_allocation_history_portfolio_id 
  ON public.asset_allocation_history(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_asset_allocation_history_user_id 
  ON public.asset_allocation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_allocation_history_date 
  ON public.asset_allocation_history(allocation_date DESC);
CREATE INDEX IF NOT EXISTS idx_asset_allocation_history_asset_class 
  ON public.asset_allocation_history(asset_class);
CREATE INDEX IF NOT EXISTS idx_asset_allocation_history_sector 
  ON public.asset_allocation_history(sector);
CREATE INDEX IF NOT EXISTS idx_asset_allocation_history_portfolio_date_class 
  ON public.asset_allocation_history(portfolio_id, allocation_date DESC, asset_class);

-- Benchmark data indexes
CREATE INDEX IF NOT EXISTS idx_benchmark_data_symbol 
  ON public.benchmark_data(benchmark_symbol);
CREATE INDEX IF NOT EXISTS idx_benchmark_data_date 
  ON public.benchmark_data(price_date DESC);
CREATE INDEX IF NOT EXISTS idx_benchmark_data_symbol_date 
  ON public.benchmark_data(benchmark_symbol, price_date DESC);
CREATE INDEX IF NOT EXISTS idx_benchmark_data_type 
  ON public.benchmark_data(benchmark_type);
CREATE INDEX IF NOT EXISTS idx_benchmark_data_active 
  ON public.benchmark_data(is_active) WHERE is_active = true;

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_entity 
  ON public.performance_metrics(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id 
  ON public.performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date 
  ON public.performance_metrics(calculation_date DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_period 
  ON public.performance_metrics(period_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_entity_date_period 
  ON public.performance_metrics(entity_type, entity_id, calculation_date DESC, period_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_benchmark 
  ON public.performance_metrics(benchmark_symbol) WHERE benchmark_symbol IS NOT NULL;

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_allocation_gin 
  ON public.portfolio_snapshots_enhanced USING GIN(allocation_breakdown);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_sector_gin 
  ON public.portfolio_snapshots_enhanced USING GIN(sector_allocation);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_geographic_gin 
  ON public.portfolio_snapshots_enhanced USING GIN(geographic_allocation);

-- =============================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- =============================================================================

-- Materialized view for portfolio performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_portfolio_performance_summary AS
SELECT 
    p.id as portfolio_id,
    p.user_id,
    p.name as portfolio_name,
    p.currency,
    
    -- Latest snapshot data
    ps.snapshot_date as last_snapshot_date,
    ps.total_value,
    ps.total_cost,
    ps.unrealized_pnl,
    ps.unrealized_pnl_percent,
    ps.day_change,
    ps.day_change_percent,
    
    -- Performance metrics
    pm_1d.total_return_percent as return_1d,
    pm_1w.total_return_percent as return_1w,
    pm_1m.total_return_percent as return_1m,
    pm_3m.total_return_percent as return_3m,
    pm_6m.total_return_percent as return_6m,
    pm_1y.total_return_percent as return_1y,
    pm_ytd.total_return_percent as return_ytd,
    pm_itd.total_return_percent as return_itd,
    
    -- Risk metrics
    pm_1y.volatility as volatility_1y,
    pm_1y.sharpe_ratio,
    pm_1y.maximum_drawdown,
    pm_1y.beta,
    pm_1y.alpha,
    
    -- Benchmark comparison
    pm_1y.benchmark_symbol,
    pm_1y.benchmark_return as benchmark_return_1y,
    
    NOW() as calculated_at

FROM public.portfolios p
LEFT JOIN LATERAL (
    SELECT * FROM public.portfolio_snapshots_enhanced 
    WHERE portfolio_id = p.id 
    ORDER BY snapshot_date DESC 
    LIMIT 1
) ps ON true
LEFT JOIN LATERAL (
    SELECT * FROM public.performance_metrics 
    WHERE entity_type = 'PORTFOLIO' AND entity_id = p.id AND period_type = '1D'
    ORDER BY calculation_date DESC 
    LIMIT 1
) pm_1d ON true
LEFT JOIN LATERAL (
    SELECT * FROM public.performance_metrics 
    WHERE entity_type = 'PORTFOLIO' AND entity_id = p.id AND period_type = '1W'
    ORDER BY calculation_date DESC 
    LIMIT 1
) pm_1w ON true
LEFT JOIN LATERAL (
    SELECT * FROM public.performance_metrics 
    WHERE entity_type = 'PORTFOLIO' AND entity_id = p.id AND period_type = '1M'
    ORDER BY calculation_date DESC 
    LIMIT 1
) pm_1m ON true
LEFT JOIN LATERAL (
    SELECT * FROM public.performance_metrics 
    WHERE entity_type = 'PORTFOLIO' AND entity_id = p.id AND period_type = '3M'
    ORDER BY calculation_date DESC 
    LIMIT 1
) pm_3m ON true
LEFT JOIN LATERAL (
    SELECT * FROM public.performance_metrics 
    WHERE entity_type = 'PORTFOLIO' AND entity_id = p.id AND period_type = '6M'
    ORDER BY calculation_date DESC 
    LIMIT 1
) pm_6m ON true
LEFT JOIN LATERAL (
    SELECT * FROM public.performance_metrics 
    WHERE entity_type = 'PORTFOLIO' AND entity_id = p.id AND period_type = '1Y'
    ORDER BY calculation_date DESC 
    LIMIT 1
) pm_1y ON true
LEFT JOIN LATERAL (
    SELECT * FROM public.performance_metrics 
    WHERE entity_type = 'PORTFOLIO' AND entity_id = p.id AND period_type = 'YTD'
    ORDER BY calculation_date DESC 
    LIMIT 1
) pm_ytd ON true
LEFT JOIN LATERAL (
    SELECT * FROM public.performance_metrics 
    WHERE entity_type = 'PORTFOLIO' AND entity_id = p.id AND period_type = 'ITD'
    ORDER BY calculation_date DESC 
    LIMIT 1
) pm_itd ON true;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_portfolio_performance_summary_portfolio_id 
  ON public.mv_portfolio_performance_summary(portfolio_id);

-- Materialized view for benchmark performance
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_benchmark_performance AS
SELECT 
    benchmark_symbol,
    benchmark_name,
    benchmark_type,
    currency,
    
    -- Latest price data
    MAX(price_date) as last_update_date,
    FIRST_VALUE(close_price) OVER (
        PARTITION BY benchmark_symbol 
        ORDER BY price_date DESC
    ) as current_price,
    FIRST_VALUE(day_change_percent) OVER (
        PARTITION BY benchmark_symbol 
        ORDER BY price_date DESC
    ) as day_change_percent,
    
    -- Performance metrics
    FIRST_VALUE(return_1w) OVER (
        PARTITION BY benchmark_symbol 
        ORDER BY price_date DESC
    ) as return_1w,
    FIRST_VALUE(return_1m) OVER (
        PARTITION BY benchmark_symbol 
        ORDER BY price_date DESC
    ) as return_1m,
    FIRST_VALUE(return_3m) OVER (
        PARTITION BY benchmark_symbol 
        ORDER BY price_date DESC
    ) as return_3m,
    FIRST_VALUE(return_6m) OVER (
        PARTITION BY benchmark_symbol 
        ORDER BY price_date DESC
    ) as return_6m,
    FIRST_VALUE(return_1y) OVER (
        PARTITION BY benchmark_symbol 
        ORDER BY price_date DESC
    ) as return_1y,
    FIRST_VALUE(return_ytd) OVER (
        PARTITION BY benchmark_symbol 
        ORDER BY price_date DESC
    ) as return_ytd,
    
    -- Risk metrics
    FIRST_VALUE(volatility_1y) OVER (
        PARTITION BY benchmark_symbol 
        ORDER BY price_date DESC
    ) as volatility_1y,
    
    NOW() as calculated_at

FROM public.benchmark_data
WHERE is_active = true
GROUP BY benchmark_symbol, benchmark_name, benchmark_type, currency, 
         close_price, day_change_percent, return_1w, return_1m, return_3m, 
         return_6m, return_1y, return_ytd, volatility_1y, price_date;

-- Create unique index on benchmark materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_benchmark_performance_symbol 
  ON public.mv_benchmark_performance(benchmark_symbol);

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_portfolio_snapshots_enhanced_updated_at
  BEFORE UPDATE ON public.portfolio_snapshots_enhanced
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_performance_history_updated_at
  BEFORE UPDATE ON public.account_performance_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_benchmark_data_updated_at
  BEFORE UPDATE ON public.benchmark_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_metrics_updated_at
  BEFORE UPDATE ON public.performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.portfolio_snapshots_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_allocation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmark_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Portfolio snapshots policies
CREATE POLICY "Users can view accessible portfolio snapshots" ON public.portfolio_snapshots_enhanced
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.portfolios p
      WHERE p.id = portfolio_id AND (p.user_id = auth.uid() OR p.is_public = true)
    )
  );

CREATE POLICY "Users can manage own portfolio snapshots" ON public.portfolio_snapshots_enhanced
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.portfolios p
      WHERE p.id = portfolio_id AND p.user_id = auth.uid()
    )
  );

-- Account performance policies
CREATE POLICY "Users can view own account performance" ON public.account_performance_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own account performance" ON public.account_performance_history
  FOR ALL USING (auth.uid() = user_id);

-- Asset allocation history policies
CREATE POLICY "Users can view accessible asset allocation history" ON public.asset_allocation_history
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.portfolios p
      WHERE p.id = portfolio_id AND p.is_public = true
    )
  );

CREATE POLICY "Users can manage own asset allocation history" ON public.asset_allocation_history
  FOR ALL USING (auth.uid() = user_id);

-- Benchmark data policies (public read access)
CREATE POLICY "Benchmark data is publicly readable" ON public.benchmark_data
  FOR SELECT USING (true);

CREATE POLICY "System can manage benchmark data" ON public.benchmark_data
  FOR ALL TO service_role USING (true);

-- Performance metrics policies
CREATE POLICY "Users can view own performance metrics" ON public.performance_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own performance metrics" ON public.performance_metrics
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to refresh performance materialized views
CREATE OR REPLACE FUNCTION refresh_performance_materialized_views()
RETURNS TEXT AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration INTERVAL;
    result TEXT;
BEGIN
    start_time := NOW();
    
    -- Refresh views in dependency order
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_portfolio_performance_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_benchmark_performance;
    
    end_time := NOW();
    duration := end_time - start_time;
    
    result := 'Performance materialized views refreshed successfully in ' || duration;
    
    -- Log the refresh
    INSERT INTO public.audit_logs (
        action, 
        resource_type, 
        success, 
        metadata,
        created_at
    ) VALUES (
        'CALCULATE'::audit_action,
        'performance_materialized_views',
        true,
        jsonb_build_object(
            'refresh_duration', duration,
            'refreshed_at', end_time,
            'views_refreshed', 2
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
        'performance_materialized_views',
        false,
        SQLERRM,
        NOW()
    );
    
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate portfolio performance metrics
CREATE OR REPLACE FUNCTION calculate_portfolio_performance_metrics(
    portfolio_uuid UUID,
    period_type TEXT DEFAULT '1M',
    benchmark_symbol TEXT DEFAULT 'SPY'
)
RETURNS TABLE (
    total_return_percent DECIMAL(10,4),
    volatility DECIMAL(10,6),
    sharpe_ratio DECIMAL(10,6),
    max_drawdown DECIMAL(10,4),
    alpha DECIMAL(10,6),
    beta DECIMAL(10,6)
) AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    portfolio_returns DECIMAL(10,4)[];
    benchmark_returns DECIMAL(10,4)[];
    risk_free_rate DECIMAL(10,4) := 0.02; -- 2% annual risk-free rate
BEGIN
    -- Determine date range based on period type
    end_date := CURRENT_DATE;
    
    CASE period_type
        WHEN '1D' THEN start_date := end_date - INTERVAL '1 day';
        WHEN '1W' THEN start_date := end_date - INTERVAL '1 week';
        WHEN '1M' THEN start_date := end_date - INTERVAL '1 month';
        WHEN '3M' THEN start_date := end_date - INTERVAL '3 months';
        WHEN '6M' THEN start_date := end_date - INTERVAL '6 months';
        WHEN '1Y' THEN start_date := end_date - INTERVAL '1 year';
        WHEN 'YTD' THEN start_date := date_trunc('year', end_date);
        WHEN 'ITD' THEN start_date := (
            SELECT MIN(snapshot_date) FROM public.portfolio_snapshots_enhanced 
            WHERE portfolio_id = portfolio_uuid
        );
        ELSE start_date := end_date - INTERVAL '1 month';
    END CASE;
    
    -- Get portfolio returns
    SELECT array_agg(day_change_percent ORDER BY snapshot_date) INTO portfolio_returns
    FROM public.portfolio_snapshots_enhanced
    WHERE portfolio_id = portfolio_uuid
      AND snapshot_date BETWEEN start_date AND end_date
      AND day_change_percent IS NOT NULL;
    
    -- Get benchmark returns
    SELECT array_agg(day_change_percent ORDER BY price_date) INTO benchmark_returns
    FROM public.benchmark_data
    WHERE benchmark_symbol = calculate_portfolio_performance_metrics.benchmark_symbol
      AND price_date BETWEEN start_date AND end_date
      AND day_change_percent IS NOT NULL;
    
    -- Calculate metrics (simplified implementation)
    -- In a real implementation, you would use proper statistical functions
    
    RETURN QUERY
    SELECT 
        COALESCE(
            (SELECT AVG(unnest) FROM unnest(portfolio_returns)) * 
            (CASE WHEN period_type = '1Y' THEN 252 ELSE 30 END), 
            0::DECIMAL(10,4)
        ) as total_return_percent,
        COALESCE(
            STDDEV(unnest) * SQRT(252) FROM unnest(portfolio_returns),
            0::DECIMAL(10,6)
        ) as volatility,
        COALESCE(
            (AVG(unnest) - risk_free_rate/252) / NULLIF(STDDEV(unnest), 0) * SQRT(252)
            FROM unnest(portfolio_returns),
            0::DECIMAL(10,6)
        ) as sharpe_ratio,
        0::DECIMAL(10,4) as max_drawdown, -- Placeholder
        0::DECIMAL(10,6) as alpha, -- Placeholder
        0::DECIMAL(10,6) as beta; -- Placeholder
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to insert popular benchmark data
CREATE OR REPLACE FUNCTION insert_standard_benchmarks()
RETURNS TEXT AS $$
BEGIN
    -- Insert standard benchmark symbols
    INSERT INTO public.benchmark_data (
        benchmark_symbol, benchmark_name, benchmark_type, price_date, 
        close_price, currency, data_source, is_active
    ) VALUES
    ('SPY', 'SPDR S&P 500 ETF Trust', 'ETF', CURRENT_DATE, 400.00, 'USD', 'MANUAL', true),
    ('QQQ', 'Invesco QQQ Trust', 'ETF', CURRENT_DATE, 350.00, 'USD', 'MANUAL', true),
    ('VTI', 'Vanguard Total Stock Market ETF', 'ETF', CURRENT_DATE, 220.00, 'USD', 'MANUAL', true),
    ('OSEBX', 'Oslo Børs Benchmark Index', 'INDEX', CURRENT_DATE, 1200.00, 'NOK', 'MANUAL', true),
    ('FTSE', 'FTSE 100 Index', 'INDEX', CURRENT_DATE, 7500.00, 'GBP', 'MANUAL', true)
    ON CONFLICT (benchmark_symbol, price_date) DO NOTHING;
    
    RETURN 'Standard benchmarks inserted successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

-- Table comments
COMMENT ON TABLE public.portfolio_snapshots_enhanced IS 'Enhanced daily portfolio value snapshots with comprehensive performance metrics';
COMMENT ON TABLE public.account_performance_history IS 'Account-level performance tracking and historical data';
COMMENT ON TABLE public.asset_allocation_history IS 'Historical asset allocation tracking over time';
COMMENT ON TABLE public.benchmark_data IS 'Market benchmark data for performance comparison (SPY, NASDAQ, OSEBX, etc.)';
COMMENT ON TABLE public.performance_metrics IS 'Calculated performance metrics with risk-adjusted returns';

-- Column comments
COMMENT ON COLUMN public.portfolio_snapshots_enhanced.allocation_breakdown IS 'JSON object with asset class allocation percentages';
COMMENT ON COLUMN public.portfolio_snapshots_enhanced.sector_allocation IS 'JSON object with sector allocation percentages';
COMMENT ON COLUMN public.portfolio_snapshots_enhanced.geographic_allocation IS 'JSON object with geographic allocation percentages';
COMMENT ON COLUMN public.performance_metrics.entity_type IS 'Type of entity: PORTFOLIO, ACCOUNT, HOLDING, or ASSET_CLASS';
COMMENT ON COLUMN public.performance_metrics.period_type IS 'Time period: 1D, 1W, 1M, 3M, 6M, 1Y, YTD, ITD, ALL';
COMMENT ON COLUMN public.benchmark_data.benchmark_type IS 'Type of benchmark: INDEX, ETF, SECTOR, or CUSTOM';

-- Function comments
COMMENT ON FUNCTION refresh_performance_materialized_views() IS 'Refreshes performance-related materialized views and logs the operation';
COMMENT ON FUNCTION calculate_portfolio_performance_metrics(UUID, TEXT, TEXT) IS 'Calculates comprehensive performance metrics for a portfolio';
COMMENT ON FUNCTION insert_standard_benchmarks() IS 'Inserts standard market benchmarks (SPY, QQQ, OSEBX, etc.)';

-- Materialized view comments
COMMENT ON MATERIALIZED VIEW public.mv_portfolio_performance_summary IS 'Portfolio performance summary with all key metrics';
COMMENT ON MATERIALIZED VIEW public.mv_benchmark_performance IS 'Benchmark performance data for comparison';

-- =============================================================================
-- INITIAL DATA SETUP
-- =============================================================================

-- Insert standard benchmarks
SELECT insert_standard_benchmarks();

-- Create initial partitions
SELECT create_future_partitions('portfolio_snapshots_partitioned', 36); -- 3 years
SELECT create_future_partitions('account_performance_partitioned', 36); -- 3 years  
SELECT create_future_partitions('benchmark_data_partitioned', 36); -- 3 years