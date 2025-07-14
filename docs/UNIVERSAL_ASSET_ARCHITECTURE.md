# Universal Asset Architecture

## Overview

This document outlines the database architecture design for supporting multiple asset classes in a unified portfolio management system. The design enables tracking of traditional securities, cryptocurrencies, real world assets, and complex financial instruments through a flexible, extensible schema.

## Design Principles

### 1. Polymorphic Asset Model
- **Single source of truth**: One `assets` table for all asset types
- **Asset-specific extensions**: Separate tables for specialized metadata
- **Consistent interfaces**: Unified APIs across all asset classes

### 2. Flexible Metadata System
- **JSONB storage**: Unstructured data for asset-specific properties
- **Typed extensions**: Strongly typed fields for common attributes
- **External identifiers**: Multiple ID systems per asset (ISIN, contract address, catalog numbers)

### 3. Universal Transaction Model
- **Asset-agnostic transactions**: Same table structure for all assets
- **Flexible quantities**: Support for fractional shares, tokens, and unique items
- **Multi-currency support**: Built-in currency conversion and tracking

## Core Schema Design

### Assets Table (Universal)

```sql
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Universal identifiers
  symbol TEXT NOT NULL,                    -- AAPL, BTC, MONET_001
  name TEXT NOT NULL,                      -- Apple Inc., Bitcoin, Water Lilies
  asset_class asset_class NOT NULL,       -- STOCK, CRYPTOCURRENCY, ALTERNATIVE
  asset_subtype TEXT,                     -- common_stock, bitcoin, painting
  
  -- Primary market/exchange
  primary_exchange TEXT,                  -- NASDAQ, binance, christies
  primary_network TEXT,                   -- For crypto: ethereum, bitcoin, polygon
  
  -- Base metadata
  currency currency_code NOT NULL,        -- USD, ETH, EUR
  country_code TEXT,                      -- US, Global, FR
  is_active BOOLEAN DEFAULT true,
  is_tradeable BOOLEAN DEFAULT true,
  
  -- Flexible identifiers
  external_ids JSONB,                     -- {'isin': 'US...', 'contract': '0x...'}
  
  -- Asset-agnostic metadata
  metadata JSONB,                         -- Flexible storage for any asset type
  
  -- Market data
  current_price DECIMAL(20,8),
  last_price_update TIMESTAMPTZ,
  market_cap BIGINT,
  
  -- Data source tracking
  data_sources TEXT[],                    -- ['finnhub', 'coingecko', 'manual']
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(symbol, primary_exchange, asset_class)
);
```

### Asset Type Extensions

#### Securities Metadata
For stocks, ETFs, bonds, and mutual funds:

```sql
CREATE TABLE public.securities_metadata (
  asset_id UUID PRIMARY KEY REFERENCES public.assets(id) ON DELETE CASCADE,
  
  -- Traditional identifiers
  isin TEXT,
  cusip TEXT,
  figi TEXT,
  bloomberg_ticker TEXT,
  
  -- Company/fund details
  company_name TEXT,
  sector TEXT,
  industry TEXT,
  
  -- Market metrics
  shares_outstanding BIGINT,
  float_shares BIGINT,
  avg_volume_30d BIGINT,
  dividend_yield DECIMAL(6,4),
  
  -- Fund-specific fields
  expense_ratio DECIMAL(6,4),
  aum BIGINT,                            -- Assets under management
  fund_type TEXT,                        -- etf, mutual_fund, index_fund
  
  -- Trading status
  listing_date DATE,
  delisting_date DATE,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Crypto Assets Metadata
For cryptocurrencies, tokens, and NFTs:

```sql
CREATE TABLE public.crypto_metadata (
  asset_id UUID PRIMARY KEY REFERENCES public.assets(id) ON DELETE CASCADE,
  
  -- Blockchain identifiers
  contract_address TEXT,
  blockchain_network TEXT NOT NULL,      -- ethereum, bitcoin, polygon, solana
  token_standard TEXT,                   -- ERC-20, ERC-721, BEP-20, SPL
  
  -- Token economics
  total_supply DECIMAL(30,0),
  circulating_supply DECIMAL(30,0),
  max_supply DECIMAL(30,0),
  
  -- DeFi protocol information
  protocol_name TEXT,                    -- Uniswap, Compound, Aave
  protocol_type TEXT,                    -- dex, lending, staking
  pool_address TEXT,
  yield_bearing BOOLEAN DEFAULT false,
  apy DECIMAL(8,4),                     -- Annual percentage yield
  
  -- NFT specific fields
  collection_name TEXT,
  token_id TEXT,
  rarity_rank INTEGER,
  traits JSONB,                         -- NFT attributes/traits
  
  -- Market data sources
  coingecko_id TEXT,
  coinmarketcap_id TEXT,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Art & Collectibles Metadata
For physical and digital collectibles:

```sql
CREATE TABLE public.collectibles_metadata (
  asset_id UUID PRIMARY KEY REFERENCES public.assets(id) ON DELETE CASCADE,
  
  -- Creator/manufacturer information
  artist_name TEXT,
  creator TEXT,
  manufacturer TEXT,
  creation_year INTEGER,
  
  -- Physical properties
  medium TEXT,                          -- oil on canvas, bronze, cardboard
  dimensions TEXT,                      -- 24"x36", 12cm x 8cm
  weight_grams INTEGER,
  condition TEXT,                       -- mint, near_mint, excellent, good, fair
  
  -- Classification
  category TEXT,                        -- painting, sculpture, trading_card, wine, watch
  subcategory TEXT,                     -- impressionist, vintage, rookie_card
  rarity TEXT,                         -- unique, limited_edition, mass_produced
  edition_size INTEGER,                 -- Number in limited run
  edition_number INTEGER,               -- Which number this is
  
  -- Authentication & provenance
  authentication_source TEXT,           -- PSA, Beckett, gallery_certificate
  certificate_number TEXT,
  grade TEXT,                          -- PSA 10, BGS 9.5
  provenance TEXT,                     -- Ownership history
  
  -- Storage & insurance
  storage_location TEXT,               -- home, bank_vault, gallery
  storage_conditions TEXT,             -- climate_controlled, archival
  insurance_value DECIMAL(20,2),
  insurer TEXT,
  last_appraised TIMESTAMPTZ,
  appraiser TEXT,
  
  -- Market data
  last_sale_price DECIMAL(20,2),
  last_sale_date DATE,
  estimated_value DECIMAL(20,2),
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Universal Holdings Table

```sql
CREATE TABLE public.holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE RESTRICT,
  
  -- Position basics
  quantity DECIMAL(30,8) NOT NULL,       -- Supports fractional shares and tokens
  average_cost DECIMAL(20,8),            -- Average cost basis per unit
  total_cost DECIMAL(20,8),              -- Total acquisition cost
  
  -- Current valuation
  current_price DECIMAL(20,8),
  market_value DECIMAL(20,8),
  unrealized_pnl DECIMAL(20,8),
  unrealized_pnl_percent DECIMAL(10,4),
  
  -- Acquisition tracking
  first_acquired TIMESTAMPTZ,
  last_transaction TIMESTAMPTZ,
  
  -- Complex position data
  position_metadata JSONB,               -- Options chains, staking rewards, etc.
  
  -- Performance metrics
  day_change DECIMAL(20,8),
  day_change_percent DECIMAL(10,4),
  
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(account_id, asset_id)
);
```

### Enhanced Transactions Table

```sql
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE RESTRICT,
  
  -- Transaction identification
  external_id TEXT,                      -- Broker/exchange transaction ID
  order_id TEXT,                        -- Associated order ID
  
  -- Transaction details
  transaction_type transaction_type NOT NULL,
  date DATE NOT NULL,
  time TIME,
  settlement_date DATE,
  
  -- Quantities and pricing
  quantity DECIMAL(30,8) NOT NULL DEFAULT 0,  -- Supports crypto decimals
  price DECIMAL(20,8),
  total_amount DECIMAL(20,8) NOT NULL,
  
  -- Universal fee structure
  commission DECIMAL(20,8) DEFAULT 0,    -- Broker commission
  network_fees DECIMAL(20,8) DEFAULT 0,  -- Gas fees, blockchain fees
  platform_fees DECIMAL(20,8) DEFAULT 0, -- Exchange/platform fees
  other_fees DECIMAL(20,8) DEFAULT 0,    -- Misc fees
  total_fees DECIMAL(20,8) GENERATED ALWAYS AS 
    (commission + network_fees + platform_fees + other_fees) STORED,
  
  -- Currency handling
  currency currency_code NOT NULL,
  exchange_rate DECIMAL(20,8) DEFAULT 1.0,
  
  -- Asset-specific transaction data
  transaction_metadata JSONB,            -- Flexible field for complex transactions
  
  -- Transaction context
  description TEXT,
  notes TEXT,
  tags TEXT[],
  
  -- Related transactions (splits, mergers, etc.)
  related_transaction_id UUID REFERENCES public.transactions(id),
  corporate_action_type TEXT,
  
  -- Data source and verification
  data_source data_source DEFAULT 'MANUAL',
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMPTZ,
  
  -- Import tracking
  import_batch_id UUID,
  import_source TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

## Asset Class Examples

### Traditional Stock
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "asset_class": "STOCK",
  "asset_subtype": "common_stock",
  "primary_exchange": "NASDAQ",
  "currency": "USD",
  "external_ids": {
    "isin": "US0378331005",
    "cusip": "037833100"
  },
  "metadata": {
    "dividend_frequency": "quarterly",
    "split_history": [{"date": "2020-08-31", "ratio": "4:1"}]
  }
}
```

### Cryptocurrency
```json
{
  "symbol": "ETH",
  "name": "Ethereum",
  "asset_class": "CRYPTOCURRENCY",
  "asset_subtype": "native_token",
  "primary_exchange": "binance",
  "primary_network": "ethereum",
  "currency": "USD",
  "external_ids": {
    "coingecko_id": "ethereum",
    "contract_address": "native"
  },
  "metadata": {
    "consensus_mechanism": "proof_of_stake",
    "staking_enabled": true
  }
}
```

### Art Piece
```json
{
  "symbol": "MONET_WL_047",
  "name": "Water Lilies #47",
  "asset_class": "ALTERNATIVE", 
  "asset_subtype": "painting",
  "primary_exchange": "christies",
  "currency": "USD",
  "external_ids": {
    "catalog_number": "M1920-47",
    "lot_number": "CHR2024-157"
  },
  "metadata": {
    "exhibition_history": ["MoMA 1999", "Louvre 2003"],
    "provenance_verified": true
  }
}
```

## Migration Strategy

### Phase 1: Parallel Schema Creation
1. Create new universal tables alongside existing schema
2. Set up foreign key relationships
3. Create asset-specific metadata tables

### Phase 2: Data Migration
1. Migrate existing stock data to universal `assets` table
2. Populate `securities_metadata` from current stock fields
3. Update `holdings` and `transactions` to reference new schema

### Phase 3: Schema Cleanup
1. Drop old `stocks` table after validation
2. Update all application code to use universal schema
3. Add indexes and optimize performance

### Phase 4: Extension
1. Add crypto assets and metadata
2. Implement art/collectibles tracking
3. Build UI components for each asset type

## Performance Considerations

### Indexing Strategy
```sql
-- Core asset lookups
CREATE INDEX idx_assets_symbol_exchange ON assets(symbol, primary_exchange);
CREATE INDEX idx_assets_class_active ON assets(asset_class, is_active);
CREATE INDEX idx_assets_external_ids ON assets USING GIN(external_ids);

-- Holdings performance  
CREATE INDEX idx_holdings_user_account ON holdings(user_id, account_id);
CREATE INDEX idx_holdings_asset ON holdings(asset_id);

-- Transaction queries
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_asset_date ON transactions(asset_id, date DESC);
```

### Partitioning Strategy
- Partition transaction tables by date (monthly)
- Partition price history by asset class and date
- Use table inheritance for asset metadata tables

This architecture provides the foundation for a truly universal portfolio management system that scales across any asset type while maintaining performance and data integrity.