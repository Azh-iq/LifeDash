-- Add Standard Platforms and Extended Platform Configuration
-- This migration adds default platforms and extends the platforms table with API configuration fields

-- =============================================================================
-- EXTEND PLATFORMS TABLE WITH API CONFIGURATION
-- =============================================================================

-- Add new columns to platforms table for API and CSV configuration
ALTER TABLE public.platforms 
ADD COLUMN IF NOT EXISTS api_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS csv_mapping_template JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS connection_status TEXT DEFAULT 'disconnected' 
  CHECK (connection_status IN ('connected', 'disconnected', 'error', 'pending')),
ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sync_frequency_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sync_error_message TEXT,
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false;

-- Add index for connection status lookups
CREATE INDEX IF NOT EXISTS idx_platforms_connection_status 
  ON public.platforms(connection_status) WHERE connection_status != 'disconnected';

-- Add unique constraint on name column
ALTER TABLE public.platforms 
ADD CONSTRAINT platforms_name_unique UNIQUE (name);

-- =============================================================================
-- INSERT STANDARD PLATFORMS
-- =============================================================================

-- Insert standard Norwegian and international platforms
INSERT INTO public.platforms (
  name, 
  display_name, 
  type, 
  default_currency, 
  country_code,
  stock_commission,
  etf_commission,
  fx_spread_percent,
  api_config,
  csv_mapping_template,
  setup_completed
) VALUES
  -- Nordnet (Norway) - CSV only
  (
    'nordnet',
    'Nordnet',
    'BROKER',
    'NOK',
    'NO',
    99.00, -- 99 NOK per trade
    0.00,  -- Free ETFs
    0.25,  -- 0.25% FX spread
    '{
      "type": "csv_only",
      "supported_markets": ["OSE", "NASDAQ", "NYSE"],
      "csv_format": "nordnet_export",
      "documentation_url": "https://www.nordnet.no/help/export"
    }',
    '{
      "required_fields": ["Id", "Verdipapir", "ISIN", "Antall", "Kurs", "Beløp", "Valuta", "Transaksjonstype"],
      "field_mappings": {
        "Id": "transaction_id",
        "Bokføringsdag": "booking_date", 
        "Handelsdag": "trade_date",
        "Oppgjørsdag": "settlement_date",
        "Portefølje": "portfolio_name",
        "Transaksjonstype": "transaction_type",
        "Verdipapir": "security_name",
        "ISIN": "isin",
        "Antall": "quantity",
        "Kurs": "price",
        "Beløp": "amount",
        "Valuta": "currency",
        "Kjøpsverdi": "cost_basis",
        "Resultat": "realized_pnl",
        "Totalt antall": "total_quantity",
        "Saldo": "account_balance"
      },
      "transaction_type_mappings": {
        "KJØPT": "BUY",
        "SALG": "SELL", 
        "Overføring via Trustly": "DEPOSIT",
        "UTBETALING": "WITHDRAWAL",
        "FORSIKRINGSKOSTNAD": "FEE",
        "Utbetaling aksjelån": "DIVIDEND",
        "PREMIEINNBETALING": "DEPOSIT"
      }
    }',
    false
  ),
  
  -- DNB (Norway) - API integration
  (
    'dnb',
    'DNB',
    'BANK',
    'NOK', 
    'NO',
    99.00, -- Standard commission
    0.00,
    0.50,  -- 0.5% FX spread
    '{
      "type": "oauth2",
      "auth_url": "https://developer.dnb.no/auth",
      "token_url": "https://api.dnb.no/oauth2/token",
      "api_base_url": "https://api.dnb.no/v1",
      "scopes": ["accounts", "transactions", "investments"],
      "supported_accounts": ["INVESTMENT", "TAXABLE", "ISK"],
      "rate_limit": {
        "requests_per_minute": 60,
        "burst_limit": 100
      },
      "documentation_url": "https://developer.dnb.no/docs"
    }',
    '{}', -- API doesn't need CSV mapping
    false
  ),
  
  -- Charles Schwab (USA) - API integration (replacement for TD Ameritrade)
  (
    'charles_schwab',
    'Charles Schwab',
    'BROKER',
    'USD',
    'US',
    0.00, -- Free stock trades
    0.00, -- Free ETF trades
    0.0,  -- No FX spread (USD base)
    '{
      "type": "oauth2",
      "auth_url": "https://api.schwabapi.com/v1/oauth/authorize",
      "token_url": "https://api.schwabapi.com/v1/oauth/token", 
      "api_base_url": "https://api.schwabapi.com/v1",
      "scopes": ["read", "trade"],
      "supported_accounts": ["TAXABLE", "IRA", "ROTH_IRA", "401K"],
      "rate_limit": {
        "requests_per_minute": 120,
        "burst_limit": 240
      },
      "documentation_url": "https://developer.schwab.com/"
    }',
    '{}', -- API doesn't need CSV mapping
    false
  ),
  
  -- Demo Platform for testing
  (
    'demo',
    'Demo Platform',
    'MANUAL',
    'USD',
    'XX',
    0.00,
    0.00,
    0.0,
    '{
      "type": "demo",
      "generates_sample_data": true,
      "supported_features": ["realtime_prices", "historical_data", "portfolio_tracking"]
    }',
    '{}',
    true -- Demo is always set up
  )

ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  type = EXCLUDED.type,
  default_currency = EXCLUDED.default_currency,
  country_code = EXCLUDED.country_code,
  stock_commission = EXCLUDED.stock_commission,
  etf_commission = EXCLUDED.etf_commission,
  fx_spread_percent = EXCLUDED.fx_spread_percent,
  api_config = EXCLUDED.api_config,
  csv_mapping_template = EXCLUDED.csv_mapping_template,
  updated_at = NOW();

-- =============================================================================
-- PLATFORM CONNECTION TRACKING TABLE
-- =============================================================================

-- Table for tracking platform connection attempts and status
CREATE TABLE IF NOT EXISTS public.platform_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES public.platforms(id) ON DELETE CASCADE,
  
  connection_type TEXT NOT NULL CHECK (connection_type IN ('api', 'csv', 'manual')),
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'connected', 'failed', 'disconnected', 'expired')),
  
  -- API connection details
  access_token_encrypted TEXT, -- Encrypted with app key
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- CSV import details  
  last_csv_import_at TIMESTAMPTZ,
  csv_import_count INTEGER DEFAULT 0,
  
  -- Connection metadata
  connection_metadata JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  sync_error_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id, platform_id)
);

-- Indexes for platform connections
CREATE INDEX IF NOT EXISTS idx_platform_connections_user_id 
  ON public.platform_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_connections_platform_id 
  ON public.platform_connections(platform_id);
CREATE INDEX IF NOT EXISTS idx_platform_connections_status 
  ON public.platform_connections(status);
CREATE INDEX IF NOT EXISTS idx_platform_connections_sync 
  ON public.platform_connections(last_sync_at DESC) WHERE status = 'connected';

-- =============================================================================
-- CSV IMPORT TRACKING TABLE
-- =============================================================================

-- Table for tracking CSV imports and their results
CREATE TABLE IF NOT EXISTS public.csv_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_connection_id UUID NOT NULL REFERENCES public.platform_connections(id) ON DELETE CASCADE,
  
  filename TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  file_hash TEXT NOT NULL, -- To prevent duplicate imports
  
  -- Import status and results
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  rows_total INTEGER,
  rows_processed INTEGER DEFAULT 0,
  rows_successful INTEGER DEFAULT 0,
  rows_failed INTEGER DEFAULT 0,
  
  -- Data breakdown
  transactions_imported INTEGER DEFAULT 0,
  holdings_imported INTEGER DEFAULT 0,
  accounts_created INTEGER DEFAULT 0,
  
  -- Processing details
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  error_message TEXT,
  warnings JSONB DEFAULT '[]',
  
  -- Mapping used
  field_mapping JSONB,
  import_metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id, file_hash) -- Prevent duplicate file imports
);

-- Indexes for CSV imports
CREATE INDEX IF NOT EXISTS idx_csv_imports_user_id 
  ON public.csv_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_csv_imports_status 
  ON public.csv_imports(status);
CREATE INDEX IF NOT EXISTS idx_csv_imports_created_at 
  ON public.csv_imports(created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Platform connections RLS
ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own platform connections"
  ON public.platform_connections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CSV imports RLS  
ALTER TABLE public.csv_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own CSV imports"
  ON public.csv_imports
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get platform configuration for a user
CREATE OR REPLACE FUNCTION get_user_platform_config(
  p_user_id UUID,
  p_platform_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  platform_config JSONB;
  connection_config JSONB;
BEGIN
  -- Get platform base configuration
  SELECT 
    jsonb_build_object(
      'platform', jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'display_name', p.display_name,
        'type', p.type,
        'api_config', p.api_config,
        'csv_mapping_template', p.csv_mapping_template
      ),
      'connection', COALESCE(
        jsonb_build_object(
          'status', pc.status,
          'connection_type', pc.connection_type,
          'last_sync_at', pc.last_sync_at,
          'sync_error_count', pc.sync_error_count
        ),
        jsonb_build_object('status', 'not_connected')
      )
    )
  INTO platform_config
  FROM public.platforms p
  LEFT JOIN public.platform_connections pc ON pc.platform_id = p.id AND pc.user_id = p_user_id
  WHERE p.name = p_platform_name;
  
  RETURN COALESCE(platform_config, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update platform connection status
CREATE OR REPLACE FUNCTION update_platform_connection_status(
  p_user_id UUID,
  p_platform_id UUID,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.platform_connections 
  SET 
    status = p_status,
    last_sync_status = p_status,
    sync_error_count = CASE 
      WHEN p_status = 'failed' THEN sync_error_count + 1
      WHEN p_status = 'connected' THEN 0
      ELSE sync_error_count
    END,
    updated_at = NOW()
  WHERE user_id = p_user_id AND platform_id = p_platform_id;
  
  -- Log the status change if it's an error
  IF p_status = 'failed' AND p_error_message IS NOT NULL THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      success,
      error_message
    ) VALUES (
      p_user_id,
      'SYNC'::audit_action,
      'platform_connection',
      p_platform_id::TEXT,
      false,
      p_error_message
    );
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.platform_connections IS 'Tracks user connections to investment platforms via API or CSV';
COMMENT ON TABLE public.csv_imports IS 'Tracks CSV file imports and their processing results';
COMMENT ON FUNCTION get_user_platform_config(UUID, TEXT) IS 'Returns complete platform configuration for a user';
COMMENT ON FUNCTION update_platform_connection_status(UUID, UUID, TEXT, TEXT) IS 'Updates platform connection status with error tracking';