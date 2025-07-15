-- Multi-Broker Portfolio Aggregation Enhancement
-- Adds tables and views for portfolio consolidation across brokers

-- Currency exchange rates table already exists from 009_price_triggers.sql
-- Just add missing columns if needed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'currency_exchange_rates' AND column_name = 'source') THEN
    ALTER TABLE currency_exchange_rates ADD COLUMN source VARCHAR(50) NOT NULL DEFAULT 'manual';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'currency_exchange_rates' AND column_name = 'expires_at') THEN
    ALTER TABLE currency_exchange_rates ADD COLUMN expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour';
  END IF;
END
$$;

-- Conflict resolution logs for audit trail
CREATE TABLE IF NOT EXISTS conflict_resolution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  preferred_source VARCHAR(50) NOT NULL, -- Changed from broker_id enum
  alternative_sources TEXT[] NOT NULL,
  resolution_reason TEXT NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL,
  applied_rules JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Duplicate detection overrides (manual user settings)
CREATE TABLE IF NOT EXISTS duplicate_detection_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  broker_sources TEXT[] NOT NULL,
  override_type VARCHAR(20) NOT NULL, -- 'merge', 'separate', 'ignore'
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, symbol)
);

-- User preferences for conflict resolution
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  base_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  broker_priority_order TEXT[] DEFAULT ARRAY['interactive_brokers', 'schwab', 'plaid', 'nordnet'],
  conflict_resolution_preferences JSONB DEFAULT '{}',
  duplicate_detection_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enhanced portfolio holdings with consolidation metadata
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio_holdings' AND column_name = 'is_consolidated') THEN
    ALTER TABLE portfolio_holdings ADD COLUMN is_consolidated BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio_holdings' AND column_name = 'source_brokers') THEN
    ALTER TABLE portfolio_holdings ADD COLUMN source_brokers TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio_holdings' AND column_name = 'consolidation_metadata') THEN
    ALTER TABLE portfolio_holdings ADD COLUMN consolidation_metadata JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio_holdings' AND column_name = 'duplicate_group_id') THEN
    ALTER TABLE portfolio_holdings ADD COLUMN duplicate_group_id UUID;
  END IF;
END
$$;

-- Portfolio aggregation results cache
CREATE TABLE IF NOT EXISTS portfolio_aggregation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  aggregation_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  total_holdings_count INTEGER NOT NULL DEFAULT 0,
  consolidated_holdings_count INTEGER NOT NULL DEFAULT 0,
  duplicates_detected INTEGER NOT NULL DEFAULT 0,
  conflicts_resolved INTEGER NOT NULL DEFAULT 0,
  base_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  aggregation_summary JSONB DEFAULT '{}',
  errors JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  UNIQUE(user_id)
);

-- Materialized view for consolidated portfolio holdings
DROP MATERIALIZED VIEW IF EXISTS consolidated_portfolio_holdings;
CREATE MATERIALIZED VIEW consolidated_portfolio_holdings AS
SELECT 
  h.user_id,
  h.symbol,
  h.asset_class,
  h.currency,
  SUM(h.quantity) as total_quantity,
  SUM(h.market_value) as total_market_value,
  SUM(h.cost_basis) as total_cost_basis,
  AVG(h.market_price) as avg_market_price,
  COUNT(DISTINCT h.brokerage_account_id) as account_count,
  ARRAY_AGG(DISTINCT ba.connection_id) as connection_ids,
  ARRAY_AGG(DISTINCT bc.broker_id) as broker_ids,
  MAX(h.last_updated) as last_updated,
  CASE 
    WHEN COUNT(DISTINCT h.brokerage_account_id) > 1 THEN true 
    ELSE false 
  END as is_duplicate,
  JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT(
    'account_id', h.brokerage_account_id,
    'broker_id', bc.broker_id,
    'quantity', h.quantity,
    'market_value', h.market_value,
    'cost_basis', h.cost_basis,
    'last_updated', h.last_updated
  )) as source_details
FROM portfolio_holdings h
JOIN brokerage_accounts ba ON h.brokerage_account_id = ba.id
JOIN brokerage_connections bc ON ba.connection_id = bc.id
GROUP BY h.user_id, h.symbol, h.asset_class, h.currency;

-- Unique index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_consolidated_holdings_user_symbol 
  ON consolidated_portfolio_holdings(user_id, symbol);

-- Materialized view for broker performance comparison
DROP MATERIALIZED VIEW IF EXISTS broker_performance_comparison;
CREATE MATERIALIZED VIEW broker_performance_comparison AS
SELECT 
  bc.user_id,
  bc.broker_id,
  COUNT(DISTINCT ba.id) as account_count,
  COUNT(DISTINCT h.symbol) as unique_holdings,
  SUM(h.market_value) as total_portfolio_value,
  SUM(h.cost_basis) as total_cost_basis,
  SUM(h.market_value - h.cost_basis) as total_unrealized_pnl,
  AVG(CASE WHEN h.cost_basis > 0 THEN ((h.market_value - h.cost_basis) / h.cost_basis) * 100 ELSE 0 END) as avg_return_percent,
  MAX(h.last_updated) as last_sync_time,
  bc.status as connection_status,
  bc.last_synced_at
FROM brokerage_connections bc
JOIN brokerage_accounts ba ON bc.id = ba.connection_id
LEFT JOIN portfolio_holdings h ON ba.id = h.brokerage_account_id
WHERE bc.status = 'connected'
GROUP BY bc.user_id, bc.broker_id, bc.status, bc.last_synced_at;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_currency_exchange_rates_pair 
  ON currency_exchange_rates(from_currency, to_currency);

CREATE INDEX IF NOT EXISTS idx_currency_exchange_rates_expires 
  ON currency_exchange_rates(expires_at);

CREATE INDEX IF NOT EXISTS idx_conflict_resolution_logs_user_symbol 
  ON conflict_resolution_logs(user_id, symbol);

CREATE INDEX IF NOT EXISTS idx_duplicate_detection_overrides_user_symbol 
  ON duplicate_detection_overrides(user_id, symbol);

CREATE INDEX IF NOT EXISTS idx_portfolio_aggregation_results_user_status 
  ON portfolio_aggregation_results(user_id, aggregation_status);

CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_consolidation 
  ON portfolio_holdings(user_id, is_consolidated, duplicate_group_id);

-- RLS policies for new tables
ALTER TABLE currency_exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflict_resolution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_detection_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_aggregation_results ENABLE ROW LEVEL SECURITY;

-- Currency exchange rates - accessible to all (no user-specific data)
DROP POLICY IF EXISTS "Currency rates are publicly readable" ON currency_exchange_rates;
CREATE POLICY "Currency rates are publicly readable" ON currency_exchange_rates
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Service role can manage currency rates" ON currency_exchange_rates;
CREATE POLICY "Service role can manage currency rates" ON currency_exchange_rates
  FOR ALL TO service_role USING (true);

-- Conflict resolution logs
DROP POLICY IF EXISTS "Users can view own conflict resolution logs" ON conflict_resolution_logs;
CREATE POLICY "Users can view own conflict resolution logs" ON conflict_resolution_logs
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own conflict resolution logs" ON conflict_resolution_logs;
CREATE POLICY "Users can insert own conflict resolution logs" ON conflict_resolution_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Duplicate detection overrides
DROP POLICY IF EXISTS "Users can view own duplicate overrides" ON duplicate_detection_overrides;
CREATE POLICY "Users can view own duplicate overrides" ON duplicate_detection_overrides
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own duplicate overrides" ON duplicate_detection_overrides;
CREATE POLICY "Users can insert own duplicate overrides" ON duplicate_detection_overrides
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own duplicate overrides" ON duplicate_detection_overrides;
CREATE POLICY "Users can update own duplicate overrides" ON duplicate_detection_overrides
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own duplicate overrides" ON duplicate_detection_overrides;
CREATE POLICY "Users can delete own duplicate overrides" ON duplicate_detection_overrides
  FOR DELETE USING (user_id = auth.uid());

-- User preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- Portfolio aggregation results
DROP POLICY IF EXISTS "Users can view own aggregation results" ON portfolio_aggregation_results;
CREATE POLICY "Users can view own aggregation results" ON portfolio_aggregation_results
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own aggregation results" ON portfolio_aggregation_results;
CREATE POLICY "Users can insert own aggregation results" ON portfolio_aggregation_results
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own aggregation results" ON portfolio_aggregation_results;
CREATE POLICY "Users can update own aggregation results" ON portfolio_aggregation_results
  FOR UPDATE USING (user_id = auth.uid());

-- Functions for maintaining materialized views
CREATE OR REPLACE FUNCTION refresh_consolidated_holdings()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY consolidated_portfolio_holdings;
  REFRESH MATERIALIZED VIEW CONCURRENTLY broker_performance_comparison;
END;
$$;

-- Function to trigger portfolio aggregation
CREATE OR REPLACE FUNCTION trigger_portfolio_aggregation(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update aggregation status
  INSERT INTO portfolio_aggregation_results (
    user_id, aggregation_status, started_at
  )
  VALUES (
    p_user_id, 'pending', NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    aggregation_status = 'pending',
    started_at = NOW(),
    completed_at = NULL,
    errors = '[]',
    warnings = '[]';
  
  -- Notify the application to start aggregation
  PERFORM pg_notify('portfolio_aggregation_trigger', p_user_id::text);
END;
$$;

-- Function to update aggregation status
CREATE OR REPLACE FUNCTION update_aggregation_status(
  p_user_id UUID,
  p_status VARCHAR(20),
  p_summary JSONB DEFAULT '{}',
  p_errors JSONB DEFAULT '[]',
  p_warnings JSONB DEFAULT '[]'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE portfolio_aggregation_results
  SET 
    aggregation_status = p_status,
    aggregation_summary = p_summary,
    errors = p_errors,
    warnings = p_warnings,
    completed_at = CASE WHEN p_status IN ('completed', 'failed') THEN NOW() ELSE NULL END
  WHERE user_id = p_user_id;
END;
$$;

-- Function to clean up old aggregation results
CREATE OR REPLACE FUNCTION cleanup_old_aggregation_results()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Keep only the latest 10 results per user
  DELETE FROM portfolio_aggregation_results
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (
        PARTITION BY user_id ORDER BY started_at DESC
      ) as rn
      FROM portfolio_aggregation_results
    ) t WHERE rn > 10
  );
  
  -- Clean up old conflict resolution logs (keep last 30 days)
  DELETE FROM conflict_resolution_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Function to get user's aggregation preferences
CREATE OR REPLACE FUNCTION get_user_aggregation_preferences(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  preferences JSONB;
BEGIN
  SELECT JSONB_BUILD_OBJECT(
    'base_currency', COALESCE(base_currency, 'USD'),
    'broker_priority_order', COALESCE(broker_priority_order, ARRAY['interactive_brokers', 'schwab', 'plaid', 'nordnet']),
    'conflict_resolution_preferences', COALESCE(conflict_resolution_preferences, '{}'),
    'duplicate_detection_settings', COALESCE(duplicate_detection_settings, '{}')
  )
  INTO preferences
  FROM user_preferences
  WHERE user_id = p_user_id;
  
  -- Return default preferences if none exist
  IF preferences IS NULL THEN
    preferences := JSONB_BUILD_OBJECT(
      'base_currency', 'USD',
      'broker_priority_order', ARRAY['interactive_brokers', 'schwab', 'plaid', 'nordnet'],
      'conflict_resolution_preferences', '{}',
      'duplicate_detection_settings', '{}'
    );
  END IF;
  
  RETURN preferences;
END;
$$;

-- Trigger to refresh materialized views when holdings change
CREATE OR REPLACE FUNCTION trigger_refresh_consolidated_views()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Schedule a refresh of materialized views
  PERFORM pg_notify('refresh_consolidated_views', 'holdings_changed');
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER portfolio_holdings_consolidation_trigger
  AFTER INSERT OR UPDATE OR DELETE ON portfolio_holdings
  FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_consolidated_views();

-- Comments for documentation
COMMENT ON TABLE currency_exchange_rates IS 'Cached exchange rates for multi-currency portfolio conversion';
COMMENT ON TABLE conflict_resolution_logs IS 'Audit trail for conflict resolution decisions';
COMMENT ON TABLE duplicate_detection_overrides IS 'User-defined overrides for duplicate detection';
COMMENT ON TABLE user_preferences IS 'User preferences for portfolio aggregation and conflict resolution';
COMMENT ON TABLE portfolio_aggregation_results IS 'Results and status of portfolio aggregation processes';
COMMENT ON MATERIALIZED VIEW consolidated_portfolio_holdings IS 'Consolidated view of portfolio holdings across all brokers';
COMMENT ON MATERIALIZED VIEW broker_performance_comparison IS 'Performance comparison between different brokers';

COMMENT ON FUNCTION refresh_consolidated_holdings() IS 'Refreshes materialized views for consolidated portfolio data';
COMMENT ON FUNCTION trigger_portfolio_aggregation(UUID) IS 'Triggers portfolio aggregation for a user';
COMMENT ON FUNCTION update_aggregation_status(UUID, VARCHAR, JSONB, JSONB, JSONB) IS 'Updates the status of portfolio aggregation';
COMMENT ON FUNCTION cleanup_old_aggregation_results() IS 'Cleans up old aggregation results and logs';
COMMENT ON FUNCTION get_user_aggregation_preferences(UUID) IS 'Returns user preferences for portfolio aggregation';

-- Grant permissions
GRANT SELECT ON consolidated_portfolio_holdings TO authenticated;
GRANT SELECT ON broker_performance_comparison TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_consolidated_holdings() TO service_role;
GRANT EXECUTE ON FUNCTION trigger_portfolio_aggregation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_aggregation_status(UUID, VARCHAR, JSONB, JSONB, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_aggregation_results() TO service_role;
GRANT EXECUTE ON FUNCTION get_user_aggregation_preferences(UUID) TO authenticated;