-- Improved Stock Search Function Migration
-- Fixes partial matching issues for better user experience

-- Drop the existing function first
DROP FUNCTION IF EXISTS search_stocks(TEXT, INTEGER, TEXT);

-- Create improved stock search function with better partial matching
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
    (
      -- Exact symbol match gets highest priority
      CASE WHEN sr.symbol ILIKE search_term THEN 100.0 ELSE 0.0 END +
      
      -- Symbol starts with search term gets very high priority
      CASE WHEN sr.symbol ILIKE search_term || '%' THEN 50.0 ELSE 0.0 END +
      
      -- Company/name starts with search term gets high priority
      CASE 
        WHEN sr.name ILIKE search_term || '%' THEN 40.0
        WHEN sr.company_name ILIKE search_term || '%' THEN 40.0
        ELSE 0.0 
      END +
      
      -- Symbol contains search term (partial match)
      CASE WHEN sr.symbol ILIKE '%' || search_term || '%' THEN 20.0 ELSE 0.0 END +
      
      -- Name contains search term (partial match)
      CASE 
        WHEN sr.name ILIKE '%' || search_term || '%' THEN 15.0
        WHEN sr.company_name ILIKE '%' || search_term || '%' THEN 15.0
        ELSE 0.0 
      END +
      
      -- Industry/sector contains search term
      CASE 
        WHEN sr.industry ILIKE '%' || search_term || '%' THEN 5.0
        WHEN sr.sector ILIKE '%' || search_term || '%' THEN 5.0
        ELSE 0.0 
      END +
      
      -- Popular stocks get bonus points
      CASE WHEN sr.is_popular THEN 10.0 ELSE 0.0 END +
      
      -- Full-text search bonus (if available)
      COALESCE(ts_rank_cd(sr.search_vector, plainto_tsquery('english', search_term)) * 5.0, 0.0)
    )::real as rank
  FROM stock_registry sr
  WHERE sr.is_active = true
    AND (
      -- More flexible matching conditions
      sr.symbol ILIKE '%' || search_term || '%'
      OR sr.name ILIKE '%' || search_term || '%'
      OR sr.company_name ILIKE '%' || search_term || '%'
      OR sr.industry ILIKE '%' || search_term || '%'
      OR sr.sector ILIKE '%' || search_term || '%'
      OR sr.search_vector @@ plainto_tsquery('english', search_term)
      -- Add word boundary matching for better "micro" -> "Microsoft" matching
      OR sr.name ~* ('(^|\W)' || search_term)
      OR sr.company_name ~* ('(^|\W)' || search_term)
    )
    AND (exchange_filter IS NULL OR sr.exchange = exchange_filter)
    AND LENGTH(search_term) >= 1  -- Minimum search length
  ORDER BY rank DESC, sr.is_popular DESC, sr.market_cap DESC NULLS LAST, sr.name ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_stocks TO authenticated;

-- Update function comment
COMMENT ON FUNCTION search_stocks IS 'Improved full-text search for stocks with better partial matching and ranking';

-- Test the improved function with some common search terms
-- These are just for reference/testing - they won't execute in migration

-- Examples that should now work better:
-- SELECT * FROM search_stocks('micro', 5);    -- Should return Microsoft, Micron, etc.
-- SELECT * FROM search_stocks('app', 5);      -- Should return Apple
-- SELECT * FROM search_stocks('goog', 5);     -- Should return Google/Alphabet
-- SELECT * FROM search_stocks('eqnr', 5);     -- Should return Equinor
-- SELECT * FROM search_stocks('tesla', 5);    -- Should return Tesla

-- Insert some additional test data to ensure we have enough variety
INSERT INTO stock_registry (symbol, name, company_name, exchange, currency, sector, industry, country, is_popular) VALUES
  ('MU', 'Micron Technology Inc.', 'Micron Technology Inc.', 'NASDAQ', 'USD', 'Technology', 'Semiconductors', 'US', false),
  ('MCHP', 'Microchip Technology Inc.', 'Microchip Technology Inc.', 'NASDAQ', 'USD', 'Technology', 'Semiconductors', 'US', false),
  ('CRM', 'Salesforce Inc.', 'Salesforce Inc.', 'NYSE', 'USD', 'Technology', 'Software', 'US', false),
  ('ORCL', 'Oracle Corporation', 'Oracle Corporation', 'NYSE', 'USD', 'Technology', 'Software', 'US', false),
  ('ADBE', 'Adobe Inc.', 'Adobe Inc.', 'NASDAQ', 'USD', 'Technology', 'Software', 'US', false),
  ('NFLX', 'Netflix Inc.', 'Netflix Inc.', 'NASDAQ', 'USD', 'Communication Services', 'Entertainment', 'US', false),
  ('PYPL', 'PayPal Holdings Inc.', 'PayPal Holdings Inc.', 'NASDAQ', 'USD', 'Technology', 'Financial Technology', 'US', false),
  ('CSCO', 'Cisco Systems Inc.', 'Cisco Systems Inc.', 'NASDAQ', 'USD', 'Technology', 'Networking', 'US', false),
  ('INTC', 'Intel Corporation', 'Intel Corporation', 'NASDAQ', 'USD', 'Technology', 'Semiconductors', 'US', false),
  ('IBM', 'International Business Machines Corporation', 'International Business Machines Corporation', 'NYSE', 'USD', 'Technology', 'IT Services', 'US', false)
ON CONFLICT (symbol, exchange) DO NOTHING;

-- Update search_vector for better searching (regenerate tsvector with latest data)
UPDATE stock_registry SET updated_at = CURRENT_TIMESTAMP WHERE id IN (
  SELECT id FROM stock_registry WHERE symbol IN ('MU', 'MCHP', 'CRM', 'ORCL', 'ADBE', 'NFLX', 'PYPL', 'CSCO', 'INTC', 'IBM')
);