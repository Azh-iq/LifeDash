# Database Migration Plan

## Universal Asset Migration Strategy

This document outlines the step-by-step migration plan from the current Norwegian stock portfolio schema to the comprehensive universal asset architecture supporting stocks, cryptocurrencies, and alternative assets.

## Current Schema Assessment

### Existing Tables
```sql
-- Core portfolio structure (RETAIN)
user_profiles ✅ Keep as-is
portfolios ✅ Keep as-is  
accounts ✅ Keep as-is

-- Stock-specific tables (TRANSFORM)
stocks → migrate to universal assets table
stock_aliases → integrate into assets metadata
stock_fundamentals → move to securities_metadata
stock_prices → keep but link to assets
stock_splits → keep but link to assets
stock_dividends → keep but link to assets

-- Transaction/Holdings (EXTEND)
transactions → enhance for multi-asset support
holdings → enhance for multi-asset support
tax_lots → keep with enhanced asset linking
```

### Migration Challenges
1. **Data Consistency**: Ensure no data loss during migration
2. **Foreign Key Constraints**: Maintain referential integrity
3. **Application Compatibility**: Minimize downtime during transition
4. **Performance**: Large datasets require careful migration strategy

## Migration Phases

### Phase 1: Schema Preparation (Week 1, Days 1-2)

#### Step 1.1: Create Universal Asset Tables
```sql
-- Create new universal tables alongside existing schema
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  asset_class asset_class NOT NULL,
  asset_subtype TEXT,
  primary_exchange TEXT,
  primary_network TEXT,
  currency currency_code NOT NULL,
  country_code TEXT,
  is_active BOOLEAN DEFAULT true,
  is_tradeable BOOLEAN DEFAULT true,
  external_ids JSONB,
  metadata JSONB,
  current_price DECIMAL(20,8),
  last_price_update TIMESTAMPTZ,
  market_cap BIGINT,
  data_sources TEXT[],
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(symbol, primary_exchange, asset_class)
);

-- Create asset-specific metadata tables
CREATE TABLE public.securities_metadata (
  asset_id UUID PRIMARY KEY REFERENCES public.assets(id) ON DELETE CASCADE,
  isin TEXT,
  cusip TEXT,
  figi TEXT,
  bloomberg_ticker TEXT,
  company_name TEXT,
  sector TEXT,
  industry TEXT,
  shares_outstanding BIGINT,
  float_shares BIGINT,
  avg_volume_30d BIGINT,
  dividend_yield DECIMAL(6,4),
  expense_ratio DECIMAL(6,4),
  aum BIGINT,
  fund_type TEXT,
  listing_date DATE,
  delisting_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.crypto_metadata (
  asset_id UUID PRIMARY KEY REFERENCES public.assets(id) ON DELETE CASCADE,
  contract_address TEXT,
  blockchain_network TEXT NOT NULL,
  token_standard TEXT,
  total_supply DECIMAL(30,0),
  circulating_supply DECIMAL(30,0),
  max_supply DECIMAL(30,0),
  protocol_name TEXT,
  protocol_type TEXT,
  pool_address TEXT,
  yield_bearing BOOLEAN DEFAULT false,
  apy DECIMAL(8,4),
  collection_name TEXT,
  token_id TEXT,
  rarity_rank INTEGER,
  traits JSONB,
  coingecko_id TEXT,
  coinmarketcap_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.collectibles_metadata (
  asset_id UUID PRIMARY KEY REFERENCES public.assets(id) ON DELETE CASCADE,
  artist_name TEXT,
  creator TEXT,
  manufacturer TEXT,
  creation_year INTEGER,
  medium TEXT,
  dimensions TEXT,
  weight_grams INTEGER,
  condition TEXT,
  category TEXT,
  subcategory TEXT,
  rarity TEXT,
  edition_size INTEGER,
  edition_number INTEGER,
  authentication_source TEXT,
  certificate_number TEXT,
  grade TEXT,
  provenance TEXT,
  storage_location TEXT,
  storage_conditions TEXT,
  insurance_value DECIMAL(20,2),
  insurer TEXT,
  last_appraised TIMESTAMPTZ,
  appraiser TEXT,
  last_sale_price DECIMAL(20,2),
  last_sale_date DATE,
  estimated_value DECIMAL(20,2),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Step 1.2: Create Migration Tracking
```sql
-- Track migration progress and rollback capability
CREATE TABLE public.migration_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  migration_phase TEXT NOT NULL,
  table_name TEXT NOT NULL,
  old_id UUID,
  new_id UUID,
  migration_status TEXT CHECK (migration_status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create backup tables for rollback
CREATE TABLE public.stocks_backup AS SELECT * FROM public.stocks;
CREATE TABLE public.transactions_backup AS SELECT * FROM public.transactions;
CREATE TABLE public.holdings_backup AS SELECT * FROM public.holdings;
```

### Phase 2: Data Migration (Week 1, Days 3-5)

#### Step 2.1: Migrate Stock Data to Universal Assets
```sql
-- Migration function for stocks → assets
CREATE OR REPLACE FUNCTION migrate_stocks_to_assets()
RETURNS INTEGER AS $$
DECLARE
  stock_record RECORD;
  new_asset_id UUID;
  migration_count INTEGER := 0;
BEGIN
  FOR stock_record IN SELECT * FROM public.stocks LOOP
    BEGIN
      -- Insert into assets table
      INSERT INTO public.assets (
        symbol, name, asset_class, asset_subtype,
        primary_exchange, currency, country_code,
        is_active, is_tradeable, current_price,
        market_cap, data_sources, last_updated,
        external_ids, metadata
      ) VALUES (
        stock_record.symbol,
        COALESCE(stock_record.company_name, stock_record.name),
        COALESCE(stock_record.asset_class, 'STOCK'),
        CASE 
          WHEN stock_record.fund_type IS NOT NULL THEN stock_record.fund_type
          ELSE 'common_stock'
        END,
        stock_record.exchange,
        stock_record.currency,
        stock_record.country_code,
        stock_record.is_active,
        stock_record.is_tradeable,
        (SELECT close_price FROM public.stock_prices 
         WHERE stock_id = stock_record.id 
         ORDER BY date DESC, created_at DESC LIMIT 1),
        stock_record.market_cap,
        ARRAY[stock_record.data_source::TEXT],
        stock_record.last_updated,
        jsonb_build_object(
          'isin', stock_record.isin,
          'cusip', stock_record.cusip,
          'figi', stock_record.figi,
          'bloomberg_ticker', stock_record.bloomberg_ticker,
          'reuters_ric', stock_record.reuters_ric,
          'yahoo_symbol', stock_record.yahoo_symbol,
          'google_symbol', stock_record.google_symbol
        ),
        jsonb_build_object(
          'original_stock_id', stock_record.id,
          'description', stock_record.description,
          'website_url', stock_record.website_url,
          'logo_url', stock_record.logo_url
        )
      ) RETURNING id INTO new_asset_id;

      -- Insert into securities_metadata
      INSERT INTO public.securities_metadata (
        asset_id, isin, cusip, figi, bloomberg_ticker,
        company_name, sector, industry, shares_outstanding,
        float_shares, avg_volume_30d, dividend_yield,
        expense_ratio, aum, fund_type, listing_date, delisting_date
      ) VALUES (
        new_asset_id,
        stock_record.isin,
        stock_record.cusip,
        stock_record.figi,
        stock_record.bloomberg_ticker,
        stock_record.company_name,
        stock_record.sector,
        stock_record.industry,
        stock_record.shares_outstanding,
        stock_record.float_shares,
        stock_record.avg_volume_30d,
        NULL, -- Will be calculated from stock_dividends
        stock_record.expense_ratio,
        stock_record.aum,
        stock_record.fund_type,
        stock_record.listing_date,
        stock_record.delisting_date
      );

      -- Log successful migration
      INSERT INTO public.migration_log (
        migration_phase, table_name, old_id, new_id, migration_status
      ) VALUES (
        'stock_to_asset', 'stocks', stock_record.id, new_asset_id, 'completed'
      );

      migration_count := migration_count + 1;

    EXCEPTION WHEN OTHERS THEN
      -- Log failed migration
      INSERT INTO public.migration_log (
        migration_phase, table_name, old_id, migration_status, error_message
      ) VALUES (
        'stock_to_asset', 'stocks', stock_record.id, 'failed', SQLERRM
      );
    END;
  END LOOP;
  
  RETURN migration_count;
END;
$$ LANGUAGE plpgsql;

-- Execute migration
SELECT migrate_stocks_to_assets();
```

#### Step 2.2: Create Stock-to-Asset Mapping View
```sql
-- Create mapping view for transition period
CREATE OR REPLACE VIEW stock_asset_mapping AS
SELECT 
  s.id as stock_id,
  a.id as asset_id,
  s.symbol as stock_symbol,
  a.symbol as asset_symbol,
  s.exchange,
  a.primary_exchange
FROM public.stocks s
JOIN public.assets a ON (
  (a.metadata->>'original_stock_id')::UUID = s.id
  OR (s.symbol = a.symbol AND s.exchange = a.primary_exchange)
);
```

### Phase 3: Update Dependent Tables (Week 1, Days 6-7)

#### Step 3.1: Add Asset References to Existing Tables
```sql
-- Add asset_id column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN asset_id UUID REFERENCES public.assets(id) ON DELETE RESTRICT;

-- Add asset_id column to holdings table
ALTER TABLE public.holdings 
ADD COLUMN asset_id UUID REFERENCES public.assets(id) ON DELETE RESTRICT;

-- Update transactions with asset references
UPDATE public.transactions t
SET asset_id = sam.asset_id
FROM stock_asset_mapping sam
WHERE t.stock_id = sam.stock_id;

-- Update holdings with asset references
UPDATE public.holdings h
SET asset_id = sam.asset_id
FROM stock_asset_mapping sam
WHERE h.stock_id = sam.stock_id;

-- Update other stock-referencing tables
UPDATE public.stock_prices sp
SET stock_id = sam.asset_id
FROM stock_asset_mapping sam
WHERE sp.stock_id = sam.stock_id;

-- Verify all references are updated
SELECT 
  'transactions' as table_name,
  COUNT(*) as total_records,
  COUNT(asset_id) as with_asset_id,
  COUNT(*) - COUNT(asset_id) as missing_asset_id
FROM public.transactions
WHERE stock_id IS NOT NULL

UNION ALL

SELECT 
  'holdings' as table_name,
  COUNT(*) as total_records,
  COUNT(asset_id) as with_asset_id,
  COUNT(*) - COUNT(asset_id) as missing_asset_id
FROM public.holdings;
```

#### Step 3.2: Update Price Tables to Reference Assets
```sql
-- Update stock_prices table structure
ALTER TABLE public.stock_prices RENAME COLUMN stock_id TO asset_id;
ALTER TABLE public.intraday_prices RENAME COLUMN stock_id TO asset_id;
ALTER TABLE public.stock_splits RENAME COLUMN stock_id TO asset_id;
ALTER TABLE public.stock_dividends RENAME COLUMN stock_id TO asset_id;
ALTER TABLE public.stock_fundamentals RENAME COLUMN stock_id TO asset_id;

-- Update foreign key constraints
ALTER TABLE public.stock_prices 
DROP CONSTRAINT stock_prices_stock_id_fkey,
ADD CONSTRAINT stock_prices_asset_id_fkey 
  FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;

-- Apply same pattern to other tables...
```

### Phase 4: Enhanced Universal Tables (Week 2)

#### Step 4.1: Enhance Transactions for Multi-Asset Support
```sql
-- Add enhanced fee structure for crypto/alternative assets
ALTER TABLE public.transactions 
ADD COLUMN network_fees DECIMAL(20,8) DEFAULT 0,
ADD COLUMN platform_fees DECIMAL(20,8) DEFAULT 0,
DROP COLUMN sec_fees,
ADD COLUMN gas_fees DECIMAL(20,8) DEFAULT 0; -- For crypto transactions

-- Update fee calculation
ALTER TABLE public.transactions 
DROP COLUMN total_fees,
ADD COLUMN total_fees DECIMAL(20,8) GENERATED ALWAYS AS 
  (commission + network_fees + platform_fees + other_fees) STORED;

-- Add transaction metadata for complex transactions
ALTER TABLE public.transactions
ADD COLUMN transaction_metadata JSONB;
```

#### Step 4.2: Enhance Holdings for Multi-Asset Support
```sql
-- Update holdings for universal asset support
ALTER TABLE public.holdings
ADD COLUMN position_metadata JSONB;

-- Update quantity precision for crypto (supports up to 30 decimal places)
ALTER TABLE public.holdings 
ALTER COLUMN quantity TYPE DECIMAL(30,8);

-- Add day change tracking
ALTER TABLE public.holdings
ADD COLUMN day_change DECIMAL(20,8),
ADD COLUMN day_change_percent DECIMAL(10,4);
```

### Phase 5: Application Layer Updates (Week 2-3)

#### Step 5.1: Update Server Actions
```typescript
// Update lib/actions/holdings/fetch-holdings.ts
export async function fetchHoldings(userId: string) {
  const { data, error } = await supabase
    .from('holdings')
    .select(`
      *,
      asset:assets!inner (
        id,
        symbol,
        name,
        asset_class,
        asset_subtype,
        primary_exchange,
        currency,
        current_price,
        metadata
      ),
      account:accounts!inner (
        id,
        name,
        platform,
        account_type
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .gt('quantity', 0)

  return { data, error }
}
```

#### Step 5.2: Update Components
```typescript
// Update types/database.ts
export interface Asset {
  id: string
  symbol: string
  name: string
  asset_class: 'STOCK' | 'CRYPTOCURRENCY' | 'ALTERNATIVE'
  asset_subtype: string
  primary_exchange: string
  currency: string
  current_price?: number
  metadata?: Record<string, any>
}

export interface Holding {
  id: string
  user_id: string
  account_id: string
  asset_id: string
  asset?: Asset
  quantity: number
  average_cost: number
  current_price?: number
  market_value?: number
  unrealized_pnl?: number
  unrealized_pnl_percent?: number
}
```

### Phase 6: Validation & Cleanup (Week 3)

#### Step 6.1: Data Integrity Validation
```sql
-- Comprehensive data validation queries
-- Verify all transactions have asset references
SELECT COUNT(*) as orphaned_transactions
FROM public.transactions 
WHERE asset_id IS NULL AND stock_id IS NOT NULL;

-- Verify all holdings have asset references  
SELECT COUNT(*) as orphaned_holdings
FROM public.holdings 
WHERE asset_id IS NULL AND stock_id IS NOT NULL;

-- Verify asset class consistency
SELECT 
  asset_class,
  COUNT(*) as count,
  COUNT(DISTINCT primary_exchange) as exchanges
FROM public.assets 
GROUP BY asset_class;

-- Check for duplicate assets
SELECT symbol, primary_exchange, asset_class, COUNT(*)
FROM public.assets
GROUP BY symbol, primary_exchange, asset_class
HAVING COUNT(*) > 1;
```

#### Step 6.2: Performance Optimization
```sql
-- Create optimized indexes for universal schema
CREATE INDEX idx_assets_class_active ON assets(asset_class, is_active);
CREATE INDEX idx_assets_exchange_symbol ON assets(primary_exchange, symbol);
CREATE INDEX idx_holdings_asset_user ON holdings(asset_id, user_id);
CREATE INDEX idx_transactions_asset_date ON transactions(asset_id, date DESC);

-- Update existing indexes
DROP INDEX IF EXISTS idx_holdings_stock_id;
DROP INDEX IF EXISTS idx_transactions_stock_id;
```

#### Step 6.3: Legacy Table Removal
```sql
-- After full validation, remove legacy columns and tables
-- (Only after 100% confidence in migration success)

-- Remove old stock_id columns (backup first!)
-- ALTER TABLE public.transactions DROP COLUMN stock_id;
-- ALTER TABLE public.holdings DROP COLUMN stock_id;

-- Eventually remove stocks table (keep backup!)
-- DROP TABLE public.stocks_backup;
-- DROP TABLE public.stocks;
```

## Rollback Strategy

### Emergency Rollback Procedure
```sql
-- If migration fails, restore from backups
TRUNCATE public.transactions;
INSERT INTO public.transactions SELECT * FROM public.transactions_backup;

TRUNCATE public.holdings;
INSERT INTO public.holdings SELECT * FROM public.holdings_backup;

-- Remove universal tables if needed
DROP TABLE IF EXISTS public.collectibles_metadata;
DROP TABLE IF EXISTS public.crypto_metadata;
DROP TABLE IF EXISTS public.securities_metadata;
DROP TABLE IF EXISTS public.assets;
```

### Partial Rollback Options
- Restore individual tables from backup
- Revert schema changes using migration log
- Keep both schemas temporarily for comparison

## Testing Strategy

### Pre-Migration Testing
1. **Data Backup Verification**: Ensure all backups are complete and restorable
2. **Constraint Testing**: Verify all foreign key relationships work correctly
3. **Performance Baseline**: Record current query performance metrics

### Migration Testing
1. **Data Integrity**: Verify no data loss during migration
2. **Reference Integrity**: Ensure all foreign keys are properly updated
3. **Application Testing**: Test all CRUD operations work with new schema

### Post-Migration Validation
1. **Functional Testing**: Verify all application features work correctly
2. **Performance Testing**: Ensure query performance is maintained or improved
3. **User Acceptance**: Test with real user workflows

## Risk Mitigation

### Data Loss Prevention
- Complete backups before any migration step
- Incremental migration with validation at each step
- Rollback procedures tested and documented

### Performance Impact
- Migration during low-usage periods
- Incremental migration to minimize downtime
- Index creation after data migration for speed

### Application Downtime
- Blue-green deployment strategy
- Feature flags for gradual rollout
- Database connection pooling maintenance

## Success Criteria

### Technical Validation
- ✅ Zero data loss during migration
- ✅ All foreign key relationships intact
- ✅ Query performance maintained or improved
- ✅ All application features functional

### Business Validation
- ✅ Portfolio calculations accurate
- ✅ Transaction history preserved
- ✅ User experience unchanged
- ✅ Reporting features working

This comprehensive migration plan ensures a safe, gradual transition from the current stock-focused schema to the universal asset architecture while maintaining data integrity and application functionality.