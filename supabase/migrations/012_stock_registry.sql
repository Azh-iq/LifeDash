-- Stock Registry Migration
-- Creates a comprehensive stock registry for easy stock lookup and auto-completion

-- Create stock_registry table for searchable stock information
CREATE TABLE IF NOT EXISTS stock_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  exchange TEXT NOT NULL,
  currency currency_code NOT NULL DEFAULT 'USD',
  sector TEXT,
  industry TEXT,
  country TEXT,
  market_cap BIGINT,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  isin TEXT,
  -- Search optimization fields
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', 
      coalesce(symbol, '') || ' ' || 
      coalesce(name, '') || ' ' || 
      coalesce(company_name, '') || ' ' ||
      coalesce(sector, '') || ' ' ||
      coalesce(industry, '')
    )
  ) STORED,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false, -- For prioritizing common stocks
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_symbol_exchange UNIQUE (symbol, exchange)
);

-- Create indexes for fast search
CREATE INDEX IF NOT EXISTS idx_stock_registry_symbol ON stock_registry (symbol);
CREATE INDEX IF NOT EXISTS idx_stock_registry_name ON stock_registry (name);
CREATE INDEX IF NOT EXISTS idx_stock_registry_search_vector ON stock_registry USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_stock_registry_exchange ON stock_registry (exchange);
CREATE INDEX IF NOT EXISTS idx_stock_registry_currency ON stock_registry (currency);
CREATE INDEX IF NOT EXISTS idx_stock_registry_sector ON stock_registry (sector);
CREATE INDEX IF NOT EXISTS idx_stock_registry_popular ON stock_registry (is_popular) WHERE is_popular = true;
CREATE INDEX IF NOT EXISTS idx_stock_registry_active ON stock_registry (is_active) WHERE is_active = true;

-- Update trigger for updated_at
CREATE OR REPLACE TRIGGER update_stock_registry_updated_at
    BEFORE UPDATE ON stock_registry
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert popular Norwegian stocks
INSERT INTO stock_registry (symbol, name, company_name, exchange, currency, sector, industry, country, is_popular) VALUES
  ('EQNR.OL', 'Equinor ASA', 'Equinor ASA', 'OSLO', 'NOK', 'Energy', 'Oil & Gas', 'NO', true),
  ('DNB.OL', 'DNB Bank ASA', 'DNB Bank ASA', 'OSLO', 'NOK', 'Financial Services', 'Banks', 'NO', true),
  ('MOWI.OL', 'Mowi ASA', 'Mowi ASA', 'OSLO', 'NOK', 'Consumer Staples', 'Packaged Foods', 'NO', true),
  ('TEL.OL', 'Telenor ASA', 'Telenor ASA', 'OSLO', 'NOK', 'Communication Services', 'Telecom Services', 'NO', true),
  ('YAR.OL', 'Yara International ASA', 'Yara International ASA', 'OSLO', 'NOK', 'Materials', 'Chemicals', 'NO', true),
  ('SALM.OL', 'SalMar ASA', 'SalMar ASA', 'OSLO', 'NOK', 'Consumer Staples', 'Packaged Foods', 'NO', true),
  ('NHY.OL', 'Norsk Hydro ASA', 'Norsk Hydro ASA', 'OSLO', 'NOK', 'Materials', 'Aluminum', 'NO', true),
  ('ORK.OL', 'Orkla ASA', 'Orkla ASA', 'OSLO', 'NOK', 'Consumer Staples', 'Packaged Foods', 'NO', true),
  ('STB.OL', 'Storebrand ASA', 'Storebrand ASA', 'OSLO', 'NOK', 'Financial Services', 'Insurance', 'NO', true),
  ('SCATC.OL', 'Scatec ASA', 'Scatec ASA', 'OSLO', 'NOK', 'Utilities', 'Renewable Energy', 'NO', true)
ON CONFLICT (symbol, exchange) DO NOTHING;

-- Insert popular US stocks  
INSERT INTO stock_registry (symbol, name, company_name, exchange, currency, sector, industry, country, is_popular) VALUES
  ('AAPL', 'Apple Inc.', 'Apple Inc.', 'NASDAQ', 'USD', 'Technology', 'Consumer Electronics', 'US', true),
  ('MSFT', 'Microsoft Corporation', 'Microsoft Corporation', 'NASDAQ', 'USD', 'Technology', 'Software', 'US', true),
  ('GOOGL', 'Alphabet Inc.', 'Alphabet Inc.', 'NASDAQ', 'USD', 'Communication Services', 'Internet Content & Information', 'US', true),
  ('AMZN', 'Amazon.com Inc.', 'Amazon.com Inc.', 'NASDAQ', 'USD', 'Consumer Discretionary', 'Internet Retail', 'US', true),
  ('TSLA', 'Tesla Inc.', 'Tesla Inc.', 'NASDAQ', 'USD', 'Consumer Discretionary', 'Auto Manufacturers', 'US', true),
  ('META', 'Meta Platforms Inc.', 'Meta Platforms Inc.', 'NASDAQ', 'USD', 'Communication Services', 'Social Media', 'US', true),
  ('NVDA', 'NVIDIA Corporation', 'NVIDIA Corporation', 'NASDAQ', 'USD', 'Technology', 'Semiconductors', 'US', true),
  ('JPM', 'JPMorgan Chase & Co.', 'JPMorgan Chase & Co.', 'NYSE', 'USD', 'Financial Services', 'Banks', 'US', true),
  ('JNJ', 'Johnson & Johnson', 'Johnson & Johnson', 'NYSE', 'USD', 'Healthcare', 'Pharmaceuticals', 'US', true),
  ('V', 'Visa Inc.', 'Visa Inc.', 'NYSE', 'USD', 'Financial Services', 'Credit Services', 'US', true),
  ('WMT', 'Walmart Inc.', 'Walmart Inc.', 'NYSE', 'USD', 'Consumer Staples', 'Discount Stores', 'US', true),
  ('PG', 'Procter & Gamble Co.', 'Procter & Gamble Co.', 'NYSE', 'USD', 'Consumer Staples', 'Household Products', 'US', true),
  ('HD', 'Home Depot Inc.', 'Home Depot Inc.', 'NYSE', 'USD', 'Consumer Discretionary', 'Home Improvement Retail', 'US', true),
  ('MA', 'Mastercard Inc.', 'Mastercard Inc.', 'NYSE', 'USD', 'Financial Services', 'Credit Services', 'US', true),
  ('DIS', 'Walt Disney Co.', 'Walt Disney Co.', 'NYSE', 'USD', 'Communication Services', 'Entertainment', 'US', true)
ON CONFLICT (symbol, exchange) DO NOTHING;

-- Insert popular European stocks
INSERT INTO stock_registry (symbol, name, company_name, exchange, currency, sector, industry, country, is_popular) VALUES
  ('ASML.AS', 'ASML Holding N.V.', 'ASML Holding N.V.', 'EURONEXT', 'EUR', 'Technology', 'Semiconductor Equipment', 'NL', true),
  ('SAP.DE', 'SAP SE', 'SAP SE', 'XETRA', 'EUR', 'Technology', 'Software', 'DE', true),
  ('NESN.SW', 'Nestlé S.A.', 'Nestlé S.A.', 'SIX', 'CHF', 'Consumer Staples', 'Packaged Foods', 'CH', true),
  ('NOVN.SW', 'Novartis AG', 'Novartis AG', 'SIX', 'CHF', 'Healthcare', 'Pharmaceuticals', 'CH', true),
  ('ROCHE.SW', 'Roche Holding AG', 'Roche Holding AG', 'SIX', 'CHF', 'Healthcare', 'Pharmaceuticals', 'CH', true)
ON CONFLICT (symbol, exchange) DO NOTHING;

-- Create function for stock search
CREATE OR REPLACE FUNCTION search_stocks(
  search_term TEXT,
  limit_count INTEGER DEFAULT 10,
  exchange_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  symbol TEXT,
  name TEXT,
  company_name TEXT,
  exchange TEXT,
  currency currency_code,
  sector TEXT,
  industry TEXT,
  country TEXT,
  is_popular BOOLEAN,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.id,
    sr.symbol,
    sr.name,
    sr.company_name,
    sr.exchange,
    sr.currency,
    sr.sector,
    sr.industry,
    sr.country,
    sr.is_popular,
    ts_rank_cd(sr.search_vector, plainto_tsquery('english', search_term)) +
    CASE 
      WHEN sr.is_popular THEN 0.5
      ELSE 0.0
    END +
    CASE 
      WHEN sr.symbol ILIKE search_term || '%' THEN 1.0
      WHEN sr.name ILIKE search_term || '%' THEN 0.8
      WHEN sr.company_name ILIKE search_term || '%' THEN 0.6
      ELSE 0.0
    END as rank
  FROM stock_registry sr
  WHERE sr.is_active = true
    AND (
      sr.search_vector @@ plainto_tsquery('english', search_term)
      OR sr.symbol ILIKE '%' || search_term || '%'
      OR sr.name ILIKE '%' || search_term || '%'
      OR sr.company_name ILIKE '%' || search_term || '%'
    )
    AND (exchange_filter IS NULL OR sr.exchange = exchange_filter)
  ORDER BY rank DESC, sr.is_popular DESC, sr.name ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON stock_registry TO authenticated;
GRANT EXECUTE ON FUNCTION search_stocks TO authenticated;

-- Comments
COMMENT ON TABLE stock_registry IS 'Comprehensive stock registry for search and auto-completion';
COMMENT ON FUNCTION search_stocks IS 'Full-text search function for finding stocks with ranking';