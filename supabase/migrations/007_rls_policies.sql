-- Comprehensive Row Level Security Policies for LifeDash
-- Ensures complete data privacy and security in a financial application

-- Enable RLS on all user-specific tables (if not already enabled)
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tax_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.realized_gains ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dividend_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.portfolio_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.portfolio_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.platform_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.data_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them with better security
DROP POLICY IF EXISTS "Users can manage own data" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can manage own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can view own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can manage own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can manage own holdings" ON public.holdings;
DROP POLICY IF EXISTS "Users can view own holdings" ON public.holdings;
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view portfolio allocations" ON public.portfolio_allocations;
DROP POLICY IF EXISTS "Users can manage own portfolio allocations" ON public.portfolio_allocations;
DROP POLICY IF EXISTS "Users can view portfolio snapshots" ON public.portfolio_snapshots;
DROP POLICY IF EXISTS "Users can insert own portfolio snapshots" ON public.portfolio_snapshots;
DROP POLICY IF EXISTS "Users can manage own integrations" ON public.platform_integrations;
DROP POLICY IF EXISTS "Users can view own integrations" ON public.platform_integrations;
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can manage own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can view own tax lots" ON public.tax_lots;
DROP POLICY IF EXISTS "Users can manage own tax lots" ON public.tax_lots;
DROP POLICY IF EXISTS "Users can view own dividend payments" ON public.dividend_payments;
DROP POLICY IF EXISTS "Users can manage own dividend payments" ON public.dividend_payments;
DROP POLICY IF EXISTS "Users can view own realized gains" ON public.realized_gains;
DROP POLICY IF EXISTS "Users can manage own realized gains" ON public.realized_gains;
DROP POLICY IF EXISTS "Users can view portfolio performance" ON public.portfolio_performance;
DROP POLICY IF EXISTS "Users can manage own portfolio performance" ON public.portfolio_performance;
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view own security events" ON public.security_events;
DROP POLICY IF EXISTS "Users can view own data changes" ON public.data_changes;
DROP POLICY IF EXISTS "Users can view own API usage" ON public.api_usage_logs;
DROP POLICY IF EXISTS "Platforms are publicly readable" ON public.platforms;
DROP POLICY IF EXISTS "Stocks are publicly readable" ON public.stocks;
DROP POLICY IF EXISTS "Stock aliases are publicly readable" ON public.stock_aliases;
DROP POLICY IF EXISTS "Stock fundamentals are publicly readable" ON public.stock_fundamentals;
DROP POLICY IF EXISTS "Stock prices are publicly readable" ON public.stock_prices;
DROP POLICY IF EXISTS "Intraday prices are publicly readable" ON public.intraday_prices;
DROP POLICY IF EXISTS "Stock splits are publicly readable" ON public.stock_splits;
DROP POLICY IF EXISTS "Stock dividends are publicly readable" ON public.stock_dividends;
DROP POLICY IF EXISTS "Market indices are publicly readable" ON public.market_indices;
DROP POLICY IF EXISTS "Market index prices are publicly readable" ON public.market_index_prices;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view all security events" ON public.security_events;
DROP POLICY IF EXISTS "Admins can view all data changes" ON public.data_changes;
DROP POLICY IF EXISTS "Admins can view system metrics" ON public.system_metrics;
DROP POLICY IF EXISTS "Admins can view API usage logs" ON public.api_usage_logs;

-- =============================================================================
-- USER PROFILES AND AUTHENTICATION
-- =============================================================================

-- User profiles: Users can only see and manage their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User preferences: Users can only access their own preferences
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- User sessions: Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- User API keys: Users can only manage their own API keys
CREATE POLICY "Users can manage own api keys" ON public.user_api_keys
  FOR ALL USING (auth.uid() = user_id);

-- User notifications: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.user_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.user_notifications
  FOR INSERT WITH CHECK (true); -- Allow system to create notifications

-- =============================================================================
-- PORTFOLIOS AND INVESTMENTS
-- =============================================================================

-- Portfolios: Users can manage their own portfolios and view public ones
CREATE POLICY "Users can view accessible portfolios" ON public.portfolios
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can manage own portfolios" ON public.portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios" ON public.portfolios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios" ON public.portfolios
  FOR DELETE USING (auth.uid() = user_id);

-- Accounts: Users can only access their own accounts
CREATE POLICY "Users can view own accounts" ON public.accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own accounts" ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" ON public.accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts" ON public.accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Transactions: Users can only access transactions for their accounts
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.accounts 
      WHERE id = account_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Holdings: Users can only access holdings for their accounts
CREATE POLICY "Users can view own holdings" ON public.holdings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own holdings" ON public.holdings
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.accounts 
      WHERE id = account_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own holdings" ON public.holdings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own holdings" ON public.holdings
  FOR DELETE USING (auth.uid() = user_id);

-- Tax lots: Users can only access tax lots for their holdings
CREATE POLICY "Users can view own tax lots" ON public.tax_lots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.holdings h
      WHERE h.id = holding_id AND h.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own tax lots" ON public.tax_lots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.holdings h
      WHERE h.id = holding_id AND h.user_id = auth.uid()
    )
  );

-- Realized gains: Users can only access their own gains
CREATE POLICY "Users can view own realized gains" ON public.realized_gains
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own realized gains" ON public.realized_gains
  FOR ALL USING (auth.uid() = user_id);

-- Dividend payments: Users can only access their own dividends
CREATE POLICY "Users can view own dividend payments" ON public.dividend_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own dividend payments" ON public.dividend_payments
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- PORTFOLIO MANAGEMENT
-- =============================================================================

-- Portfolio allocations: Users can view allocations for accessible portfolios
CREATE POLICY "Users can view accessible portfolio allocations" ON public.portfolio_allocations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.portfolios p
      WHERE p.id = portfolio_id AND (p.user_id = auth.uid() OR p.is_public = true)
    )
  );

CREATE POLICY "Users can manage own portfolio allocations" ON public.portfolio_allocations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.portfolios p
      WHERE p.id = portfolio_id AND p.user_id = auth.uid()
    )
  );

-- Portfolio snapshots: Users can view snapshots for accessible portfolios
CREATE POLICY "Users can view accessible portfolio snapshots" ON public.portfolio_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.portfolios p
      WHERE p.id = portfolio_id AND (p.user_id = auth.uid() OR p.is_public = true)
    )
  );

CREATE POLICY "Users can manage own portfolio snapshots" ON public.portfolio_snapshots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.portfolios p
      WHERE p.id = portfolio_id AND p.user_id = auth.uid()
    )
  );

-- Portfolio performance: Similar to snapshots
CREATE POLICY "Users can view accessible portfolio performance" ON public.portfolio_performance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.portfolios p
      WHERE p.id = portfolio_id AND (p.user_id = auth.uid() OR p.is_public = true)
    )
  );

CREATE POLICY "Users can manage own portfolio performance" ON public.portfolio_performance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.portfolios p
      WHERE p.id = portfolio_id AND p.user_id = auth.uid()
    )
  );

-- =============================================================================
-- PLATFORM INTEGRATIONS
-- =============================================================================

-- Platform integrations: Users can only access their own integrations
CREATE POLICY "Users can view own platform integrations" ON public.platform_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own platform integrations" ON public.platform_integrations
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- AUDIT AND SECURITY
-- =============================================================================

-- Audit logs: Users can view their own audit logs, admins can view all
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true); -- Allow system to create audit logs

-- Security events: Users can view their own security events
CREATE POLICY "Users can view own security events" ON public.security_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert security events" ON public.security_events
  FOR INSERT WITH CHECK (true); -- Allow system to create security events

-- Data changes: Users can view changes to their own data
CREATE POLICY "Users can view own data changes" ON public.data_changes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert data changes" ON public.data_changes
  FOR INSERT WITH CHECK (true); -- Allow system to track changes

-- API usage logs: Users can view their own API usage
CREATE POLICY "Users can view own api usage" ON public.api_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert api usage logs" ON public.api_usage_logs
  FOR INSERT WITH CHECK (true); -- Allow system to log API usage

-- =============================================================================
-- PUBLIC DATA (READ-ONLY)
-- =============================================================================

-- Platforms: Public read access (brokers, exchanges, etc.)
CREATE POLICY "Platforms are publicly readable" ON public.platforms
  FOR SELECT USING (true);

-- Stocks: Public read access (stock information)
CREATE POLICY "Stocks are publicly readable" ON public.stocks
  FOR SELECT USING (true);

-- Stock aliases: Public read access
CREATE POLICY "Stock aliases are publicly readable" ON public.stock_aliases
  FOR SELECT USING (true);

-- Stock fundamentals: Public read access
CREATE POLICY "Stock fundamentals are publicly readable" ON public.stock_fundamentals
  FOR SELECT USING (true);

-- Stock prices: Public read access
CREATE POLICY "Stock prices are publicly readable" ON public.stock_prices
  FOR SELECT USING (true);

-- Intraday prices: Public read access
CREATE POLICY "Intraday prices are publicly readable" ON public.intraday_prices
  FOR SELECT USING (true);

-- Stock splits and dividends: Public read access
CREATE POLICY "Stock splits are publicly readable" ON public.stock_splits
  FOR SELECT USING (true);

CREATE POLICY "Stock dividends are publicly readable" ON public.stock_dividends
  FOR SELECT USING (true);

-- Market indices: Public read access
CREATE POLICY "Market indices are publicly readable" ON public.market_indices
  FOR SELECT USING (true);

CREATE POLICY "Market index prices are publicly readable" ON public.market_index_prices
  FOR SELECT USING (true);

-- =============================================================================
-- ADMIN POLICIES (for system maintenance)
-- =============================================================================

-- Allow service role to bypass RLS for system operations
CREATE POLICY "Service role can manage all data" ON public.user_profiles
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage all portfolios" ON public.portfolios
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage all accounts" ON public.accounts
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage all transactions" ON public.transactions
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage all holdings" ON public.holdings
  FOR ALL TO service_role USING (true);

-- =============================================================================
-- SPECIAL FUNCTION FOR SHARED PORTFOLIO ACCESS
-- =============================================================================

-- Function to check if user has access to a portfolio (direct ownership or via share token)
CREATE OR REPLACE FUNCTION user_can_access_portfolio(portfolio_uuid UUID, share_token_input TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check direct ownership
  IF EXISTS (
    SELECT 1 FROM public.portfolios 
    WHERE id = portfolio_uuid AND user_id = auth.uid()
  ) THEN
    RETURN true;
  END IF;
  
  -- Check public access
  IF EXISTS (
    SELECT 1 FROM public.portfolios 
    WHERE id = portfolio_uuid AND is_public = true
  ) THEN
    RETURN true;
  END IF;
  
  -- Check share token access (if provided)
  IF share_token_input IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.portfolios 
    WHERE id = portfolio_uuid AND share_token = share_token_input
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PERFORMANCE OPTIMIZATIONS
-- =============================================================================

-- Create indexes to optimize RLS policy lookups
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id_active ON public.portfolios(user_id) WHERE is_public = false;
CREATE INDEX IF NOT EXISTS idx_accounts_user_id_active ON public.accounts(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_transactions_user_account ON public.transactions(user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_holdings_user_account ON public.holdings(user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id_created ON public.audit_logs(user_id, created_at DESC);

-- Comments for documentation
COMMENT ON POLICY "Users can view own profile" ON public.user_profiles IS 'Ensures users can only access their own profile data';
COMMENT ON POLICY "Users can view accessible portfolios" ON public.portfolios IS 'Users can view their own portfolios and public portfolios';
COMMENT ON POLICY "Users can view own transactions" ON public.transactions IS 'Financial data is strictly private to the account owner';
COMMENT ON FUNCTION user_can_access_portfolio(UUID, TEXT) IS 'Centralized function for checking portfolio access permissions';