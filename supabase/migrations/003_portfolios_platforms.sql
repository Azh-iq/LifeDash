-- Portfolios and Platforms Schema for LifeDash
-- Manages investment platforms, portfolios, and accounts

-- Create platforms table for tracking brokers, exchanges, and financial institutions
CREATE TABLE IF NOT EXISTS public.platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  type platform_type NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  api_supported BOOLEAN DEFAULT false,
  csv_import_supported BOOLEAN DEFAULT true,
  
  -- Configuration for API integration
  api_config JSONB,
  csv_config JSONB,
  
  -- Platform-specific settings
  default_currency currency_code DEFAULT 'USD',
  supported_currencies currency_code[] DEFAULT ARRAY['USD']::currency_code[],
  supported_asset_classes asset_class[] DEFAULT ARRAY['STOCK']::asset_class[],
  
  -- Trading fees and costs
  stock_commission DECIMAL(10,4) DEFAULT 0,
  etf_commission DECIMAL(10,4) DEFAULT 0,
  option_commission DECIMAL(10,4) DEFAULT 0,
  crypto_commission_percent DECIMAL(6,4) DEFAULT 0,
  fx_spread_percent DECIMAL(6,4) DEFAULT 0,
  
  -- Metadata
  country_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_country_code CHECK (country_code ~ '^[A-Z]{2}$'),
  CONSTRAINT valid_commission CHECK (stock_commission >= 0 AND etf_commission >= 0 AND option_commission >= 0),
  CONSTRAINT valid_percentages CHECK (crypto_commission_percent >= 0 AND fx_spread_percent >= 0)
);

-- Create portfolios table for grouping accounts and investments
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  currency currency_code DEFAULT 'USD',
  
  -- Portfolio settings
  is_default BOOLEAN DEFAULT false,
  color_theme TEXT DEFAULT '#4169E1',
  sort_order INTEGER DEFAULT 0,
  
  -- Performance tracking
  inception_date DATE,
  target_allocation JSONB, -- JSON object with asset class allocations
  rebalancing_frequency TEXT DEFAULT 'quarterly' CHECK (rebalancing_frequency IN ('monthly', 'quarterly', 'semi-annually', 'annually', 'manual')),
  
  -- Privacy and sharing
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_color_theme CHECK (color_theme ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT valid_target_allocation CHECK (target_allocation IS NULL OR jsonb_typeof(target_allocation) = 'object'),
  UNIQUE(user_id, name)
);

-- Create accounts table for individual investment accounts
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES public.platforms(id) ON DELETE RESTRICT,
  
  -- Account identification
  name TEXT NOT NULL,
  account_number TEXT, -- Encrypted/masked account number
  account_type account_type NOT NULL,
  currency currency_code DEFAULT 'USD',
  
  -- Account settings
  is_active BOOLEAN DEFAULT true,
  auto_sync BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  sync_frequency INTEGER, -- Hours between syncs
  
  -- API credentials (encrypted)
  api_credentials JSONB,
  
  -- Tax settings
  tax_year_end DATE DEFAULT '2023-12-31',
  cost_basis_method TEXT DEFAULT 'fifo' CHECK (cost_basis_method IN ('fifo', 'lifo', 'average', 'specific')),
  
  -- Performance tracking
  opening_balance DECIMAL(20,8) DEFAULT 0,
  opening_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_sync_frequency CHECK (sync_frequency IS NULL OR sync_frequency BETWEEN 1 AND 168),
  CONSTRAINT valid_opening_balance CHECK (opening_balance >= 0),
  UNIQUE(user_id, portfolio_id, name)
);

-- Create platform_integrations table for managing API connections
CREATE TABLE IF NOT EXISTS public.platform_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES public.platforms(id) ON DELETE CASCADE,
  
  -- Integration status
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'expired', 'pending')),
  
  -- Authentication details (encrypted)
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Sync information
  last_successful_sync TIMESTAMPTZ,
  last_sync_error TEXT,
  sync_error_count INTEGER DEFAULT 0,
  
  -- Rate limiting
  api_calls_today INTEGER DEFAULT 0,
  api_calls_limit INTEGER,
  rate_limit_reset_at TIMESTAMPTZ,
  
  -- Permissions and scopes
  granted_scopes TEXT[],
  requested_scopes TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_error_count CHECK (sync_error_count >= 0),
  CONSTRAINT valid_api_calls CHECK (api_calls_today >= 0),
  UNIQUE(user_id, platform_id)
);

-- Create portfolio_allocations table for target asset allocation
CREATE TABLE IF NOT EXISTS public.portfolio_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  asset_class asset_class NOT NULL,
  target_percentage DECIMAL(5,2) NOT NULL,
  min_percentage DECIMAL(5,2),
  max_percentage DECIMAL(5,2),
  
  -- Rebalancing settings
  rebalance_threshold DECIMAL(5,2) DEFAULT 5.00,
  priority INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_percentages CHECK (
    target_percentage BETWEEN 0 AND 100 AND
    (min_percentage IS NULL OR min_percentage BETWEEN 0 AND 100) AND
    (max_percentage IS NULL OR max_percentage BETWEEN 0 AND 100) AND
    (min_percentage IS NULL OR max_percentage IS NULL OR min_percentage <= max_percentage) AND
    (min_percentage IS NULL OR target_percentage >= min_percentage) AND
    (max_percentage IS NULL OR target_percentage <= max_percentage)
  ),
  CONSTRAINT valid_threshold CHECK (rebalance_threshold BETWEEN 0 AND 50),
  UNIQUE(portfolio_id, asset_class)
);

-- Create portfolio_snapshots table for historical portfolio values
CREATE TABLE IF NOT EXISTS public.portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  
  -- Portfolio metrics
  total_value DECIMAL(20,8) NOT NULL,
  total_cost DECIMAL(20,8) NOT NULL,
  cash_balance DECIMAL(20,8) DEFAULT 0,
  
  -- Performance metrics
  day_change DECIMAL(20,8),
  day_change_percent DECIMAL(10,4),
  total_return DECIMAL(20,8),
  total_return_percent DECIMAL(10,4),
  
  -- Asset allocation breakdown
  allocation_breakdown JSONB,
  
  -- Currency and data source
  currency currency_code NOT NULL,
  data_source data_source DEFAULT 'CALCULATED',
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_values CHECK (total_value >= 0 AND total_cost >= 0 AND cash_balance >= 0),
  CONSTRAINT valid_allocation CHECK (allocation_breakdown IS NULL OR jsonb_typeof(allocation_breakdown) = 'object'),
  UNIQUE(portfolio_id, snapshot_date)
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_platforms_type ON public.platforms(type);
CREATE INDEX IF NOT EXISTS idx_platforms_active ON public.platforms(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_platforms_name ON public.platforms(name);
CREATE INDEX IF NOT EXISTS idx_platforms_country ON public.platforms(country_code);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_default ON public.portfolios(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_portfolios_public ON public.portfolios(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_portfolios_share_token ON public.portfolios(share_token) WHERE share_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_portfolio_id ON public.accounts(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_accounts_platform_id ON public.accounts(platform_id);
CREATE INDEX IF NOT EXISTS idx_accounts_active ON public.accounts(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_accounts_sync ON public.accounts(auto_sync, last_sync_at) WHERE auto_sync = true;

CREATE INDEX IF NOT EXISTS idx_platform_integrations_user_id ON public.platform_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_integrations_platform ON public.platform_integrations(platform_id);
CREATE INDEX IF NOT EXISTS idx_platform_integrations_status ON public.platform_integrations(status);
CREATE INDEX IF NOT EXISTS idx_platform_integrations_expires ON public.platform_integrations(token_expires_at) WHERE token_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_portfolio_allocations_portfolio ON public.portfolio_allocations(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_allocations_asset_class ON public.portfolio_allocations(asset_class);

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_portfolio ON public.portfolio_snapshots(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_date ON public.portfolio_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_portfolio_date ON public.portfolio_snapshots(portfolio_id, snapshot_date DESC);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_accounts_user_portfolio_active ON public.accounts(user_id, portfolio_id, is_active);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_recent ON public.portfolio_snapshots(portfolio_id, snapshot_date DESC, total_value);

-- Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_platforms_api_config_gin ON public.platforms USING GIN(api_config);
CREATE INDEX IF NOT EXISTS idx_portfolios_target_allocation_gin ON public.portfolios USING GIN(target_allocation);
CREATE INDEX IF NOT EXISTS idx_accounts_api_credentials_gin ON public.accounts USING GIN(api_credentials);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_allocation_gin ON public.portfolio_snapshots USING GIN(allocation_breakdown);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_platforms_updated_at
  BEFORE UPDATE ON public.platforms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_integrations_updated_at
  BEFORE UPDATE ON public.platform_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_allocations_updated_at
  BEFORE UPDATE ON public.portfolio_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate portfolio allocation totals
CREATE OR REPLACE FUNCTION validate_portfolio_allocations()
RETURNS TRIGGER AS $$
DECLARE
  total_allocation DECIMAL(5,2);
BEGIN
  -- Calculate total allocation for the portfolio
  SELECT COALESCE(SUM(target_percentage), 0)
  INTO total_allocation
  FROM public.portfolio_allocations
  WHERE portfolio_id = COALESCE(NEW.portfolio_id, OLD.portfolio_id)
    AND (TG_OP = 'DELETE' OR id != COALESCE(NEW.id, OLD.id));
  
  -- Add the new allocation if inserting or updating
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    total_allocation := total_allocation + NEW.target_percentage;
  END IF;
  
  -- Check if total exceeds 100%
  IF total_allocation > 100 THEN
    RAISE EXCEPTION 'Total portfolio allocation cannot exceed 100%%. Current total would be: %', total_allocation;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for allocation validation
CREATE TRIGGER validate_portfolio_allocations_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.portfolio_allocations
  FOR EACH ROW
  EXECUTE FUNCTION validate_portfolio_allocations();

-- Create function to generate share tokens
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_public = true AND NEW.share_token IS NULL THEN
    NEW.share_token := encode(gen_random_bytes(16), 'base64url');
  ELSIF NEW.is_public = false THEN
    NEW.share_token := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for share token generation
CREATE TRIGGER generate_share_token_trigger
  BEFORE INSERT OR UPDATE ON public.portfolios
  FOR EACH ROW
  EXECUTE FUNCTION generate_share_token();

-- Create function to calculate portfolio metrics
CREATE OR REPLACE FUNCTION calculate_portfolio_metrics(portfolio_uuid UUID, calculation_date DATE DEFAULT CURRENT_DATE)
RETURNS portfolio_metrics AS $$
DECLARE
  result portfolio_metrics;
  portfolio_currency currency_code;
BEGIN
  -- Get portfolio currency
  SELECT currency INTO portfolio_currency
  FROM public.portfolios
  WHERE id = portfolio_uuid;
  
  -- Calculate metrics (placeholder - will be implemented with holdings data)
  result.total_value := 0;
  result.total_cost := 0;
  result.unrealized_pnl := 0;
  result.realized_pnl := 0;
  result.day_change := 0;
  result.day_change_percent := 0;
  result.currency := portfolio_currency;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for platforms (publicly readable)
CREATE POLICY "Platforms are publicly readable" ON public.platforms
  FOR SELECT USING (true);

-- Create RLS policies for portfolios
CREATE POLICY "Users can view own portfolios" ON public.portfolios
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can manage own portfolios" ON public.portfolios
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for accounts
CREATE POLICY "Users can view own accounts" ON public.accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own accounts" ON public.accounts
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for platform_integrations
CREATE POLICY "Users can view own integrations" ON public.platform_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own integrations" ON public.platform_integrations
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for portfolio_allocations
CREATE POLICY "Users can view portfolio allocations" ON public.portfolio_allocations
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

-- Create RLS policies for portfolio_snapshots
CREATE POLICY "Users can view portfolio snapshots" ON public.portfolio_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.portfolios p
      WHERE p.id = portfolio_id AND (p.user_id = auth.uid() OR p.is_public = true)
    )
  );

CREATE POLICY "Users can insert own portfolio snapshots" ON public.portfolio_snapshots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.portfolios p
      WHERE p.id = portfolio_id AND p.user_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.platforms IS 'Financial platforms, brokers, and exchanges';
COMMENT ON TABLE public.portfolios IS 'Investment portfolios grouping accounts and assets';
COMMENT ON TABLE public.accounts IS 'Individual investment accounts linked to platforms';
COMMENT ON TABLE public.platform_integrations IS 'API integrations with financial platforms';
COMMENT ON TABLE public.portfolio_allocations IS 'Target asset allocation for portfolios';
COMMENT ON TABLE public.portfolio_snapshots IS 'Historical portfolio value snapshots';

COMMENT ON COLUMN public.platforms.api_config IS 'JSON configuration for API integration';
COMMENT ON COLUMN public.portfolios.target_allocation IS 'JSON object with target asset class percentages';
COMMENT ON COLUMN public.accounts.api_credentials IS 'Encrypted API credentials for platform access';
COMMENT ON COLUMN public.portfolio_snapshots.allocation_breakdown IS 'JSON breakdown of asset allocation';

COMMENT ON FUNCTION validate_portfolio_allocations() IS 'Ensures portfolio allocations do not exceed 100%';
COMMENT ON FUNCTION generate_share_token() IS 'Generates secure tokens for portfolio sharing';
COMMENT ON FUNCTION calculate_portfolio_metrics(UUID, DATE) IS 'Calculates comprehensive portfolio performance metrics';