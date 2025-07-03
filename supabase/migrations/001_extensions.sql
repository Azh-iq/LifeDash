-- Enable required PostgreSQL extensions for LifeDash
-- This migration sets up the foundational extensions needed for the application

-- Enable UUID generation for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable text search capabilities for searching stocks, companies, etc.
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable case-insensitive text operations
CREATE EXTENSION IF NOT EXISTS "citext";

-- Enable btree_gin for better indexing on JSONB and arrays
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create custom types for the application
CREATE TYPE currency_code AS ENUM (
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NOK', 'DKK',
  'PLN', 'CZK', 'HUF', 'RUB', 'BRL', 'INR', 'KRW', 'SGD', 'HKD', 'NZD', 'MXN',
  'ZAR', 'TRY', 'ILS', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP',
  'EGP', 'MAD', 'TND', 'DZD', 'LYD', 'SDG', 'ETB', 'KES', 'UGX', 'TZS', 'RWF',
  'BIF', 'DJF', 'SOS', 'MGA', 'KMF', 'SCR', 'MUR', 'MWK', 'ZMW', 'BWP', 'SZL',
  'LSL', 'NAD', 'AOA', 'MZN', 'ZWL', 'CDF', 'XAF', 'XOF', 'XPF', 'STD', 'CVE',
  'GNF', 'SLL', 'LRD', 'GMD', 'GHS', 'NGN', 'XDR', 'BTC', 'ETH', 'LTC', 'BCH',
  'ADA', 'DOT', 'LINK', 'UNI', 'DOGE', 'MATIC', 'SOL', 'AVAX', 'LUNA', 'ATOM',
  'XRP', 'XLM', 'VET', 'THETA', 'FIL', 'TRX', 'EOS', 'XMR', 'ZEC', 'DASH'
);

CREATE TYPE asset_class AS ENUM (
  'STOCK',
  'ETF', 
  'MUTUAL_FUND',
  'BOND',
  'CRYPTOCURRENCY',
  'COMMODITY',
  'REAL_ESTATE',
  'ALTERNATIVE',
  'CASH',
  'OPTION',
  'FUTURE',
  'FOREX'
);

CREATE TYPE transaction_type AS ENUM (
  'BUY',
  'SELL', 
  'DIVIDEND',
  'SPLIT',
  'MERGER',
  'SPINOFF',
  'DEPOSIT',
  'WITHDRAWAL',
  'FEE',
  'INTEREST',
  'TAX',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'REINVESTMENT'
);

CREATE TYPE platform_type AS ENUM (
  'BROKER',
  'BANK',
  'CRYPTO_EXCHANGE',
  'ROBO_ADVISOR',
  'MANUAL',
  'IMPORT_ONLY'
);

CREATE TYPE account_type AS ENUM (
  'TAXABLE',
  'TRADITIONAL_IRA',
  'ROTH_IRA',
  'SEP_IRA',
  'SIMPLE_IRA',
  '401K',
  'ROTH_401K',
  '403B',
  '457',
  'HSA',
  'TFSA',
  'RRSP',
  'RESP',
  'ISA',
  'PENSION',
  'TRUST',
  'JOINT',
  'INDIVIDUAL',
  'CORPORATE',
  'CRYPTO',
  'SAVINGS',
  'CHECKING'
);

CREATE TYPE data_source AS ENUM (
  'MANUAL',
  'API',
  'CSV_IMPORT',
  'PLATFORM_SYNC',
  'MARKET_DATA_PROVIDER',
  'CALCULATED',
  'ESTIMATED'
);

CREATE TYPE audit_action AS ENUM (
  'CREATE',
  'UPDATE', 
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'IMPORT',
  'EXPORT',
  'SYNC',
  'CALCULATE',
  'BACKUP',
  'RESTORE',
  'MIGRATE'
);

-- Create a function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a function to generate partition names
CREATE OR REPLACE FUNCTION generate_partition_name(table_name TEXT, date_value DATE)
RETURNS TEXT AS $$
BEGIN
  RETURN table_name || '_' || to_char(date_value, 'YYYY_MM');
END;
$$ LANGUAGE plpgsql;

-- Create a function to create monthly partitions
CREATE OR REPLACE FUNCTION create_monthly_partition(
  parent_table TEXT,
  partition_date DATE
) RETURNS VOID AS $$
DECLARE
  partition_name TEXT;
  start_date DATE;
  end_date DATE;
BEGIN
  -- Generate partition name
  partition_name := generate_partition_name(parent_table, partition_date);
  
  -- Calculate date range for the partition
  start_date := date_trunc('month', partition_date);
  end_date := start_date + interval '1 month';
  
  -- Create the partition if it doesn't exist
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I PARTITION OF %I
    FOR VALUES FROM (%L) TO (%L)',
    partition_name, parent_table, start_date, end_date);
    
  -- Create index on the partition key
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS %I ON %I (created_at)',
    partition_name || '_created_at_idx', partition_name);
END;
$$ LANGUAGE plpgsql;

-- Create a function to automatically create partitions for the next 12 months
CREATE OR REPLACE FUNCTION create_future_partitions(
  table_name TEXT,
  months_ahead INTEGER DEFAULT 12
) RETURNS VOID AS $$
DECLARE
  i INTEGER;
  partition_date DATE;
BEGIN
  FOR i IN 0..months_ahead LOOP
    partition_date := date_trunc('month', CURRENT_DATE) + (i || ' months')::interval;
    PERFORM create_monthly_partition(table_name, partition_date);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create composite types for complex data structures
CREATE TYPE price_data AS (
  open DECIMAL(20,8),
  high DECIMAL(20,8),
  low DECIMAL(20,8),
  close DECIMAL(20,8),
  volume BIGINT,
  adjusted_close DECIMAL(20,8)
);

CREATE TYPE portfolio_metrics AS (
  total_value DECIMAL(20,8),
  total_cost DECIMAL(20,8),
  unrealized_pnl DECIMAL(20,8),
  realized_pnl DECIMAL(20,8),
  day_change DECIMAL(20,8),
  day_change_percent DECIMAL(10,4),
  currency currency_code
);

-- Comment on extensions and types for documentation
COMMENT ON EXTENSION "uuid-ossp" IS 'UUID generation functions for primary keys';
COMMENT ON EXTENSION "pg_trgm" IS 'Trigram matching for fuzzy text search';
COMMENT ON EXTENSION "citext" IS 'Case-insensitive text type for emails and symbols';
COMMENT ON EXTENSION "btree_gin" IS 'GIN indexes for better JSONB and array performance';

COMMENT ON TYPE currency_code IS 'Supported currency codes including fiat and cryptocurrencies';
COMMENT ON TYPE asset_class IS 'Classification of investment asset types';
COMMENT ON TYPE transaction_type IS 'Types of financial transactions and corporate actions';
COMMENT ON TYPE platform_type IS 'Categories of financial platforms and brokers';
COMMENT ON TYPE account_type IS 'Investment account types with tax implications';
COMMENT ON TYPE data_source IS 'Source of data entry or import';
COMMENT ON TYPE audit_action IS 'Types of actions that can be audited';

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to automatically update updated_at timestamps';
COMMENT ON FUNCTION create_monthly_partition(TEXT, DATE) IS 'Creates a monthly partition for time-series tables';
COMMENT ON FUNCTION create_future_partitions(TEXT, INTEGER) IS 'Creates partitions for future months to ensure smooth operation';