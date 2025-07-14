-- Enhanced database schema for broker API integrations
-- Based on Ghostfolio architecture with LifeDash adaptations

-- Enum types for broker integration
CREATE TYPE broker_id AS ENUM ('plaid', 'schwab', 'interactive_brokers', 'nordnet');
CREATE TYPE connection_status AS ENUM ('pending', 'connected', 'disconnected', 'error', 'expired');
CREATE TYPE account_type AS ENUM ('CASH', 'MARGIN', 'RETIREMENT', 'CUSTODIAL');
CREATE TYPE asset_class AS ENUM ('EQUITY', 'FIXED_INCOME', 'CRYPTOCURRENCY', 'COMMODITY', 'REAL_ESTATE', 'CASH', 'OPTION', 'FUND', 'ETF');
CREATE TYPE transaction_type AS ENUM ('BUY', 'SELL', 'DIVIDEND', 'INTEREST', 'DEPOSIT', 'WITHDRAWAL', 'FEE', 'TAX', 'SPLIT', 'TRANSFER');

-- Brokerage connections table
CREATE TABLE brokerage_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  broker_id broker_id NOT NULL,
  connection_id VARCHAR(255) NOT NULL, -- Broker-specific connection identifier
  display_name VARCHAR(255) NOT NULL,
  status connection_status NOT NULL DEFAULT 'pending',
  access_token TEXT, -- Encrypted in application layer
  refresh_token TEXT, -- Encrypted in application layer
  expires_at TIMESTAMPTZ,
  error_message TEXT,
  last_synced_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}', -- Broker-specific metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, broker_id, connection_id)
);

-- Brokerage accounts table (external broker accounts)
CREATE TABLE brokerage_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES brokerage_connections(id) ON DELETE CASCADE,
  broker_account_id VARCHAR(255) NOT NULL, -- Broker's internal account ID
  account_number VARCHAR(100) NOT NULL,
  account_type account_type NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  institution_name VARCHAR(255),
  metadata JSONB DEFAULT '{}', -- Broker-specific account metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(connection_id, broker_account_id)
);

-- Enhanced stocks table for multi-asset support
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS asset_class asset_class DEFAULT 'EQUITY';
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS asset_sub_class VARCHAR(50);
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS sectors JSONB DEFAULT '[]';
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS countries JSONB DEFAULT '[]';
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS institution_security_id VARCHAR(255);
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Enhanced transactions table for broker integration
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS broker_transaction_id VARCHAR(255);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS brokerage_account_id UUID REFERENCES brokerage_accounts(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS institution_security_id VARCHAR(255);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS broker_metadata JSONB DEFAULT '{}';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_type transaction_type;

-- Portfolio holdings cache table (denormalized for performance)
CREATE TABLE portfolio_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  brokerage_account_id UUID REFERENCES brokerage_accounts(id) ON DELETE CASCADE,
  stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  quantity DECIMAL(15,8) NOT NULL,
  market_value DECIMAL(15,2) NOT NULL,
  cost_basis DECIMAL(15,2),
  market_price DECIMAL(15,4) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  asset_class asset_class NOT NULL DEFAULT 'EQUITY',
  unrealized_pnl DECIMAL(15,2),
  unrealized_pnl_percent DECIMAL(8,4),
  day_change DECIMAL(15,2),
  day_change_percent DECIMAL(8,4),
  institution_security_id VARCHAR(255),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  UNIQUE(user_id, brokerage_account_id, symbol)
);

-- Portfolio summary cache table (for dashboard performance)
CREATE TABLE portfolio_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  total_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_cost_basis DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_gain_loss DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_gain_loss_percent DECIMAL(8,4) NOT NULL DEFAULT 0,
  day_change DECIMAL(15,2) NOT NULL DEFAULT 0,
  day_change_percent DECIMAL(8,4) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  account_count INTEGER NOT NULL DEFAULT 0,
  holding_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  asset_allocation JSONB DEFAULT '{}', -- {asset_class: {value, percentage}}
  broker_breakdown JSONB DEFAULT '{}', -- {broker_id: {value, percentage}}
  
  UNIQUE(user_id)
);

-- Sync operations table (for tracking background sync jobs)
CREATE TABLE sync_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES brokerage_connections(id) ON DELETE CASCADE,
  broker_id broker_id NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  operation_type VARCHAR(50) NOT NULL DEFAULT 'full_sync', -- full_sync, holdings_only, transactions_only
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  result JSONB DEFAULT '{}', -- {accounts_processed, holdings_processed, transactions_processed, errors}
  
  INDEX(user_id, started_at),
  INDEX(connection_id, started_at)
);

-- Broker API audit log (for debugging and monitoring)
CREATE TABLE broker_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES brokerage_connections(id) ON DELETE CASCADE,
  broker_id broker_id NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  request_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX(broker_id, created_at),
  INDEX(user_id, created_at),
  INDEX(connection_id, created_at)
);

-- Indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brokerage_connections_user_status 
  ON brokerage_connections(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brokerage_accounts_connection_active 
  ON brokerage_accounts(connection_id, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_portfolio_holdings_user_updated 
  ON portfolio_holdings(user_id, last_updated);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_portfolio_holdings_symbol_asset 
  ON portfolio_holdings(symbol, asset_class);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_broker_account 
  ON transactions(brokerage_account_id, created_at) WHERE brokerage_account_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stocks_asset_class 
  ON stocks(asset_class) WHERE asset_class IS NOT NULL;

-- Row Level Security (RLS) policies
ALTER TABLE brokerage_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE brokerage_accounts ENABLE ROW LEVEL SECURITY;  
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_api_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brokerage_connections
CREATE POLICY "Users can view own broker connections" ON brokerage_connections
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own broker connections" ON brokerage_connections
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own broker connections" ON brokerage_connections
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own broker connections" ON brokerage_connections
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for brokerage_accounts
CREATE POLICY "Users can view own brokerage accounts" ON brokerage_accounts
  FOR SELECT USING (
    connection_id IN (
      SELECT id FROM brokerage_connections WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own brokerage accounts" ON brokerage_accounts
  FOR INSERT WITH CHECK (
    connection_id IN (
      SELECT id FROM brokerage_connections WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own brokerage accounts" ON brokerage_accounts
  FOR UPDATE USING (
    connection_id IN (
      SELECT id FROM brokerage_connections WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own brokerage accounts" ON brokerage_accounts
  FOR DELETE USING (
    connection_id IN (
      SELECT id FROM brokerage_connections WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for portfolio_holdings
CREATE POLICY "Users can view own portfolio holdings" ON portfolio_holdings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own portfolio holdings" ON portfolio_holdings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own portfolio holdings" ON portfolio_holdings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own portfolio holdings" ON portfolio_holdings
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for portfolio_summaries
CREATE POLICY "Users can view own portfolio summary" ON portfolio_summaries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own portfolio summary" ON portfolio_summaries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own portfolio summary" ON portfolio_summaries
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own portfolio summary" ON portfolio_summaries
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for sync_operations
CREATE POLICY "Users can view own sync operations" ON sync_operations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sync operations" ON sync_operations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sync operations" ON sync_operations
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for broker_api_logs
CREATE POLICY "Users can view own API logs" ON broker_api_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage API logs" ON broker_api_logs
  FOR ALL USING (current_setting('role') = 'service_role');

-- Functions for portfolio calculations
CREATE OR REPLACE FUNCTION calculate_portfolio_summary(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_val DECIMAL(15,2) := 0;
  total_cost DECIMAL(15,2) := 0;
  total_gain DECIMAL(15,2) := 0;
  gain_pct DECIMAL(8,4) := 0;
  holding_cnt INTEGER := 0;
  account_cnt INTEGER := 0;
BEGIN
  -- Calculate totals from holdings
  SELECT 
    COALESCE(SUM(market_value), 0),
    COALESCE(SUM(cost_basis), 0),
    COUNT(*),
    COUNT(DISTINCT brokerage_account_id)
  INTO total_val, total_cost, holding_cnt, account_cnt
  FROM portfolio_holdings 
  WHERE user_id = p_user_id;
  
  -- Calculate gain/loss
  total_gain := total_val - total_cost;
  
  -- Calculate percentage (avoid division by zero)
  IF total_cost > 0 THEN
    gain_pct := (total_gain / total_cost) * 100;
  END IF;
  
  -- Upsert portfolio summary
  INSERT INTO portfolio_summaries (
    user_id, total_value, total_cost_basis, total_gain_loss, 
    total_gain_loss_percent, account_count, holding_count, last_updated
  )
  VALUES (
    p_user_id, total_val, total_cost, total_gain, 
    gain_pct, account_cnt, holding_cnt, NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_value = EXCLUDED.total_value,
    total_cost_basis = EXCLUDED.total_cost_basis,
    total_gain_loss = EXCLUDED.total_gain_loss,
    total_gain_loss_percent = EXCLUDED.total_gain_loss_percent,
    account_count = EXCLUDED.account_count,
    holding_count = EXCLUDED.holding_count,
    last_updated = NOW();
END;
$$;

-- Trigger to update portfolio summary when holdings change
CREATE OR REPLACE FUNCTION trigger_portfolio_summary_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_portfolio_summary(OLD.user_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_portfolio_summary(NEW.user_id);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER portfolio_holdings_summary_trigger
  AFTER INSERT OR UPDATE OR DELETE ON portfolio_holdings
  FOR EACH ROW EXECUTE FUNCTION trigger_portfolio_summary_update();

-- Function to clean up old sync operations (keep last 100 per user)
CREATE OR REPLACE FUNCTION cleanup_old_sync_operations()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM sync_operations 
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (
        PARTITION BY user_id ORDER BY started_at DESC
      ) as rn
      FROM sync_operations
    ) t WHERE rn > 100
  );
END;
$$;

-- Function to clean up old API logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_api_logs()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM broker_api_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Comments for documentation
COMMENT ON TABLE brokerage_connections IS 'Stores user connections to external brokerage APIs';
COMMENT ON TABLE brokerage_accounts IS 'External brokerage accounts linked through API connections';
COMMENT ON TABLE portfolio_holdings IS 'Denormalized cache of current portfolio holdings for performance';
COMMENT ON TABLE portfolio_summaries IS 'Aggregated portfolio statistics cache for dashboard';
COMMENT ON TABLE sync_operations IS 'Tracks background synchronization jobs with external brokers';
COMMENT ON TABLE broker_api_logs IS 'Audit log for broker API calls for debugging and monitoring';

COMMENT ON COLUMN brokerage_connections.connection_id IS 'Broker-specific identifier (access_token, session_key, etc.)';
COMMENT ON COLUMN brokerage_connections.access_token IS 'Encrypted access token for API calls';
COMMENT ON COLUMN brokerage_connections.refresh_token IS 'Encrypted refresh token for token renewal';
COMMENT ON COLUMN portfolio_holdings.unrealized_pnl IS 'Current unrealized profit/loss in account currency';
COMMENT ON COLUMN portfolio_summaries.asset_allocation IS 'JSON object with asset class breakdowns';
COMMENT ON COLUMN portfolio_summaries.broker_breakdown IS 'JSON object with broker-wise portfolio distribution';