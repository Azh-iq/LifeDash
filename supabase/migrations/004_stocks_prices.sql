-- Stocks and Prices Schema with Partitioning for LifeDash
-- Manages stock information and time-series price data with monthly partitioning

-- Create stocks table for all tradeable securities
CREATE TABLE IF NOT EXISTS public.stocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol CITEXT NOT NULL,
  exchange TEXT NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  asset_class asset_class DEFAULT 'STOCK',
  
  -- Stock classification
  sector TEXT,
  industry TEXT,
  country_code TEXT,
  currency currency_code DEFAULT 'USD',
  
  -- Market data identifiers
  isin TEXT,
  cusip TEXT,
  figi TEXT,
  bloomberg_ticker TEXT,
  reuters_ric TEXT,
  yahoo_symbol TEXT,
  google_symbol TEXT,
  
  -- Stock details
  market_cap BIGINT,
  shares_outstanding BIGINT,
  float_shares BIGINT,
  avg_volume_30d BIGINT,
  
  -- Trading status
  is_active BOOLEAN DEFAULT true,
  is_tradeable BOOLEAN DEFAULT true,
  listing_date DATE,
  delisting_date DATE,
  
  -- ETF/Fund specific fields
  expense_ratio DECIMAL(6,4), -- For ETFs and mutual funds
  aum BIGINT, -- Assets under management
  fund_type TEXT,
  
  -- Metadata
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  
  -- Data sources and updates
  data_source data_source DEFAULT 'API',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_country_code CHECK (country_code ~ '^[A-Z]{2}$'),
  CONSTRAINT valid_market_cap CHECK (market_cap IS NULL OR market_cap > 0),
  CONSTRAINT valid_shares CHECK (shares_outstanding IS NULL OR shares_outstanding > 0),
  CONSTRAINT valid_expense_ratio CHECK (expense_ratio IS NULL OR (expense_ratio >= 0 AND expense_ratio <= 10)),
  CONSTRAINT valid_dates CHECK (delisting_date IS NULL OR listing_date IS NULL OR delisting_date > listing_date),
  
  UNIQUE(symbol, exchange)
);

-- Create stock_aliases table for alternative symbols and tickers
CREATE TABLE IF NOT EXISTS public.stock_aliases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  alias_symbol CITEXT NOT NULL,
  alias_exchange TEXT NOT NULL,
  source TEXT NOT NULL, -- e.g., 'yahoo', 'google', 'bloomberg'
  is_primary BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(alias_symbol, alias_exchange, source),
  UNIQUE(stock_id, source, is_primary) DEFERRABLE
);

-- Create stock_fundamentals table for financial metrics
CREATE TABLE IF NOT EXISTS public.stock_fundamentals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('annual', 'quarterly', 'ttm')),
  
  -- Valuation metrics
  pe_ratio DECIMAL(10,4),
  pb_ratio DECIMAL(10,4),
  ps_ratio DECIMAL(10,4),
  peg_ratio DECIMAL(10,4),
  ev_ebitda DECIMAL(10,4),
  
  -- Profitability metrics
  roe DECIMAL(8,4), -- Return on Equity
  roa DECIMAL(8,4), -- Return on Assets
  roic DECIMAL(8,4), -- Return on Invested Capital
  gross_margin DECIMAL(8,4),
  operating_margin DECIMAL(8,4),
  net_margin DECIMAL(8,4),
  
  -- Financial health
  debt_to_equity DECIMAL(10,4),
  current_ratio DECIMAL(10,4),
  quick_ratio DECIMAL(10,4),
  interest_coverage DECIMAL(10,4),
  
  -- Growth metrics
  revenue_growth_yoy DECIMAL(8,4),
  earnings_growth_yoy DECIMAL(8,4),
  eps_growth_yoy DECIMAL(8,4),
  
  -- Per share metrics
  eps DECIMAL(20,8), -- Earnings per share
  book_value_per_share DECIMAL(20,8),
  revenue_per_share DECIMAL(20,8),
  free_cash_flow_per_share DECIMAL(20,8),
  
  -- Absolute values (in millions)
  revenue BIGINT,
  net_income BIGINT,
  total_assets BIGINT,
  total_debt BIGINT,
  free_cash_flow BIGINT,
  
  -- Dividend information
  dividend_per_share DECIMAL(20,8),
  dividend_yield DECIMAL(8,4),
  payout_ratio DECIMAL(8,4),
  
  data_source data_source DEFAULT 'API',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(stock_id, report_date, period_type)
);

-- Create partitioned stock_prices table for time-series data
CREATE TABLE IF NOT EXISTS public.stock_prices (
  id UUID DEFAULT uuid_generate_v4(),
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- OHLCV data
  open_price DECIMAL(20,8) NOT NULL,
  high_price DECIMAL(20,8) NOT NULL,
  low_price DECIMAL(20,8) NOT NULL,
  close_price DECIMAL(20,8) NOT NULL,
  adjusted_close DECIMAL(20,8),
  volume BIGINT DEFAULT 0,
  
  -- Additional price metrics
  vwap DECIMAL(20,8), -- Volume Weighted Average Price
  split_factor DECIMAL(10,6) DEFAULT 1.0,
  dividend_amount DECIMAL(20,8) DEFAULT 0,
  
  -- Data quality and source
  data_source data_source DEFAULT 'API',
  is_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_ohlc CHECK (
    open_price > 0 AND high_price > 0 AND low_price > 0 AND close_price > 0 AND
    high_price >= low_price AND
    high_price >= open_price AND high_price >= close_price AND
    low_price <= open_price AND low_price <= close_price
  ),
  CONSTRAINT valid_adjusted_close CHECK (adjusted_close IS NULL OR adjusted_close > 0),
  CONSTRAINT valid_volume CHECK (volume >= 0),
  CONSTRAINT valid_split_factor CHECK (split_factor > 0),
  CONSTRAINT valid_dividend CHECK (dividend_amount >= 0),
  
  PRIMARY KEY (stock_id, date, created_at)
) PARTITION BY RANGE (created_at);

-- Create intraday_prices table for minute/hourly data
CREATE TABLE IF NOT EXISTS public.intraday_prices (
  id UUID DEFAULT uuid_generate_v4(),
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  
  -- OHLCV data for the time interval
  open_price DECIMAL(20,8) NOT NULL,
  high_price DECIMAL(20,8) NOT NULL,
  low_price DECIMAL(20,8) NOT NULL,
  close_price DECIMAL(20,8) NOT NULL,
  volume BIGINT DEFAULT 0,
  
  -- Interval type (1m, 5m, 15m, 1h, etc.)
  interval_type TEXT NOT NULL DEFAULT '1m',
  
  -- Data source and quality
  data_source data_source DEFAULT 'API',
  is_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_ohlc_intraday CHECK (
    open_price > 0 AND high_price > 0 AND low_price > 0 AND close_price > 0 AND
    high_price >= low_price AND
    high_price >= open_price AND high_price >= close_price AND
    low_price <= open_price AND low_price <= close_price
  ),
  CONSTRAINT valid_volume_intraday CHECK (volume >= 0),
  CONSTRAINT valid_interval CHECK (interval_type IN ('1m', '5m', '15m', '30m', '1h', '4h')),
  
  PRIMARY KEY (stock_id, timestamp, interval_type, created_at)
) PARTITION BY RANGE (created_at);

-- Create stock_splits table for tracking stock splits
CREATE TABLE IF NOT EXISTS public.stock_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  ex_date DATE NOT NULL,
  split_ratio DECIMAL(10,6) NOT NULL, -- e.g., 2.0 for 2:1 split, 0.5 for 1:2 reverse split
  
  data_source data_source DEFAULT 'API',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_split_ratio CHECK (split_ratio > 0),
  UNIQUE(stock_id, ex_date)
);

-- Create stock_dividends table for dividend payments
CREATE TABLE IF NOT EXISTS public.stock_dividends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  ex_date DATE NOT NULL,
  record_date DATE,
  payment_date DATE,
  amount DECIMAL(20,8) NOT NULL,
  dividend_type TEXT DEFAULT 'cash' CHECK (dividend_type IN ('cash', 'stock', 'special', 'return_of_capital')),
  
  data_source data_source DEFAULT 'API',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_dividend_amount CHECK (amount > 0),
  CONSTRAINT valid_dividend_dates CHECK (
    record_date IS NULL OR ex_date <= record_date
  ),
  UNIQUE(stock_id, ex_date, dividend_type)
);

-- Create market_indices table for market benchmarks
CREATE TABLE IF NOT EXISTS public.market_indices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol CITEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  currency currency_code DEFAULT 'USD',
  country_code TEXT,
  
  -- Index composition
  component_count INTEGER,
  methodology TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create market_index_prices table (also partitioned)
CREATE TABLE IF NOT EXISTS public.market_index_prices (
  id UUID DEFAULT uuid_generate_v4(),
  index_id UUID NOT NULL REFERENCES public.market_indices(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  open_price DECIMAL(20,8) NOT NULL,
  high_price DECIMAL(20,8) NOT NULL,
  low_price DECIMAL(20,8) NOT NULL,
  close_price DECIMAL(20,8) NOT NULL,
  
  data_source data_source DEFAULT 'API',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_index_ohlc CHECK (
    open_price > 0 AND high_price > 0 AND low_price > 0 AND close_price > 0 AND
    high_price >= low_price AND
    high_price >= open_price AND high_price >= close_price AND
    low_price <= open_price AND low_price <= close_price
  ),
  
  PRIMARY KEY (index_id, date, created_at)
) PARTITION BY RANGE (created_at);

-- Note: Partition creation will happen after all tables are created

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON public.stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_stocks_exchange ON public.stocks(exchange);
CREATE INDEX IF NOT EXISTS idx_stocks_symbol_exchange ON public.stocks(symbol, exchange);
CREATE INDEX IF NOT EXISTS idx_stocks_asset_class ON public.stocks(asset_class);
CREATE INDEX IF NOT EXISTS idx_stocks_sector ON public.stocks(sector);
CREATE INDEX IF NOT EXISTS idx_stocks_currency ON public.stocks(currency);
CREATE INDEX IF NOT EXISTS idx_stocks_active ON public.stocks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_stocks_tradeable ON public.stocks(is_tradeable) WHERE is_tradeable = true;
CREATE INDEX IF NOT EXISTS idx_stocks_market_cap ON public.stocks(market_cap DESC) WHERE market_cap IS NOT NULL;

-- Text search indexes for stocks
CREATE INDEX IF NOT EXISTS idx_stocks_name_trgm ON public.stocks USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_stocks_company_trgm ON public.stocks USING GIN(company_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_stocks_symbol_trgm ON public.stocks USING GIN(symbol gin_trgm_ops);

-- Stock aliases indexes
CREATE INDEX IF NOT EXISTS idx_stock_aliases_stock_id ON public.stock_aliases(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_aliases_symbol ON public.stock_aliases(alias_symbol);
CREATE INDEX IF NOT EXISTS idx_stock_aliases_primary ON public.stock_aliases(stock_id, is_primary) WHERE is_primary = true;

-- Stock fundamentals indexes
CREATE INDEX IF NOT EXISTS idx_stock_fundamentals_stock_id ON public.stock_fundamentals(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_fundamentals_date ON public.stock_fundamentals(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_fundamentals_stock_date ON public.stock_fundamentals(stock_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_fundamentals_period ON public.stock_fundamentals(period_type);

-- Stock prices indexes (will be created automatically for each partition)
-- These indexes are created by the partition creation function

-- Additional indexes for intraday data
-- These indexes are also created automatically for each partition

-- Stock splits and dividends indexes
CREATE INDEX IF NOT EXISTS idx_stock_splits_stock_id ON public.stock_splits(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_splits_date ON public.stock_splits(ex_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_splits_stock_date ON public.stock_splits(stock_id, ex_date DESC);

CREATE INDEX IF NOT EXISTS idx_stock_dividends_stock_id ON public.stock_dividends(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_dividends_ex_date ON public.stock_dividends(ex_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_dividends_payment_date ON public.stock_dividends(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_dividends_stock_ex_date ON public.stock_dividends(stock_id, ex_date DESC);

-- Market indices indexes
CREATE INDEX IF NOT EXISTS idx_market_indices_symbol ON public.market_indices(symbol);
CREATE INDEX IF NOT EXISTS idx_market_indices_active ON public.market_indices(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_market_indices_country ON public.market_indices(country_code);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_stocks_updated_at
  BEFORE UPDATE ON public.stocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_indices_updated_at
  BEFORE UPDATE ON public.market_indices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to get latest stock price
CREATE OR REPLACE FUNCTION get_latest_stock_price(stock_uuid UUID)
RETURNS DECIMAL(20,8) AS $$
DECLARE
  latest_price DECIMAL(20,8);
BEGIN
  SELECT close_price INTO latest_price
  FROM public.stock_prices
  WHERE stock_id = stock_uuid
  ORDER BY date DESC, created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(latest_price, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to get stock price for a specific date
CREATE OR REPLACE FUNCTION get_stock_price_at_date(stock_uuid UUID, price_date DATE)
RETURNS DECIMAL(20,8) AS $$
DECLARE
  price_at_date DECIMAL(20,8);
BEGIN
  SELECT close_price INTO price_at_date
  FROM public.stock_prices
  WHERE stock_id = stock_uuid AND date <= price_date
  ORDER BY date DESC, created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(price_at_date, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate price returns between dates
CREATE OR REPLACE FUNCTION calculate_stock_return(
  stock_uuid UUID,
  start_date DATE,
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  absolute_return DECIMAL(20,8),
  percentage_return DECIMAL(10,4),
  start_price DECIMAL(20,8),
  end_price DECIMAL(20,8)
) AS $$
DECLARE
  start_price_val DECIMAL(20,8);
  end_price_val DECIMAL(20,8);
BEGIN
  start_price_val := get_stock_price_at_date(stock_uuid, start_date);
  end_price_val := get_stock_price_at_date(stock_uuid, end_date);
  
  IF start_price_val > 0 THEN
    RETURN QUERY SELECT 
      end_price_val - start_price_val,
      ((end_price_val - start_price_val) / start_price_val * 100)::DECIMAL(10,4),
      start_price_val,
      end_price_val;
  ELSE
    RETURN QUERY SELECT 
      0::DECIMAL(20,8),
      0::DECIMAL(10,4),
      0::DECIMAL(20,8),
      end_price_val;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to update stock fundamentals with calculated metrics
CREATE OR REPLACE FUNCTION update_calculated_fundamentals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate derived metrics when certain fields are updated
  IF NEW.net_income IS NOT NULL AND NEW.revenue IS NOT NULL AND NEW.revenue > 0 THEN
    NEW.net_margin := (NEW.net_income::DECIMAL / NEW.revenue::DECIMAL * 100)::DECIMAL(8,4);
  END IF;
  
  IF NEW.total_debt IS NOT NULL AND NEW.total_assets IS NOT NULL AND NEW.total_assets > 0 THEN
    NEW.debt_to_equity := (NEW.total_debt::DECIMAL / (NEW.total_assets - NEW.total_debt)::DECIMAL)::DECIMAL(10,4);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for calculated fundamentals
CREATE TRIGGER update_calculated_fundamentals_trigger
  BEFORE INSERT OR UPDATE ON public.stock_fundamentals
  FOR EACH ROW
  EXECUTE FUNCTION update_calculated_fundamentals();

-- Create function to prevent duplicate prices on the same date
CREATE OR REPLACE FUNCTION prevent_duplicate_prices()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete any existing price for the same stock and date
  DELETE FROM public.stock_prices 
  WHERE stock_id = NEW.stock_id AND date = NEW.date AND id != COALESCE(NEW.id, uuid_generate_v4());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for preventing duplicate prices
CREATE TRIGGER prevent_duplicate_prices_trigger
  BEFORE INSERT OR UPDATE ON public.stock_prices
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_prices();

-- Enable Row Level Security (RLS)
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_fundamentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intraday_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_dividends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_index_prices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (stocks and market data are publicly readable)
CREATE POLICY "Stocks are publicly readable" ON public.stocks FOR SELECT USING (true);
CREATE POLICY "Stock aliases are publicly readable" ON public.stock_aliases FOR SELECT USING (true);
CREATE POLICY "Stock fundamentals are publicly readable" ON public.stock_fundamentals FOR SELECT USING (true);
CREATE POLICY "Stock prices are publicly readable" ON public.stock_prices FOR SELECT USING (true);
CREATE POLICY "Intraday prices are publicly readable" ON public.intraday_prices FOR SELECT USING (true);
CREATE POLICY "Stock splits are publicly readable" ON public.stock_splits FOR SELECT USING (true);
CREATE POLICY "Stock dividends are publicly readable" ON public.stock_dividends FOR SELECT USING (true);
CREATE POLICY "Market indices are publicly readable" ON public.market_indices FOR SELECT USING (true);
CREATE POLICY "Market index prices are publicly readable" ON public.market_index_prices FOR SELECT USING (true);

-- Add comments for documentation
COMMENT ON TABLE public.stocks IS 'Master table of all tradeable securities and instruments';
COMMENT ON TABLE public.stock_aliases IS 'Alternative symbols and tickers for stocks across different data providers';
COMMENT ON TABLE public.stock_fundamentals IS 'Financial fundamentals and ratios for stocks';
COMMENT ON TABLE public.stock_prices IS 'Daily OHLCV price data partitioned by month for performance';
COMMENT ON TABLE public.intraday_prices IS 'Intraday price data for minute/hourly intervals';
COMMENT ON TABLE public.stock_splits IS 'Historical stock split events and ratios';
COMMENT ON TABLE public.stock_dividends IS 'Dividend payment history and details';
COMMENT ON TABLE public.market_indices IS 'Market indices and benchmarks';
COMMENT ON TABLE public.market_index_prices IS 'Historical price data for market indices';

COMMENT ON FUNCTION get_latest_stock_price(UUID) IS 'Gets the most recent closing price for a stock';
COMMENT ON FUNCTION get_stock_price_at_date(UUID, DATE) IS 'Gets the closing price for a stock on or before a specific date';
COMMENT ON FUNCTION calculate_stock_return(UUID, DATE, DATE) IS 'Calculates absolute and percentage returns between two dates';
COMMENT ON FUNCTION update_calculated_fundamentals() IS 'Automatically calculates derived fundamental metrics';
COMMENT ON FUNCTION prevent_duplicate_prices() IS 'Prevents duplicate price entries for the same stock and date';

-- TODO: Create partitions for time-series tables after fixing table creation
-- SELECT create_future_partitions('public.stock_prices', 12);
-- SELECT create_future_partitions('public.intraday_prices', 3);
-- SELECT create_future_partitions('public.market_index_prices', 12);