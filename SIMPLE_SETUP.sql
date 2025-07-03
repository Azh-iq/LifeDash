-- LifeDash Database Setup - Copy this ENTIRE content to Supabase SQL Editor and run once

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create types
CREATE TYPE currency_code AS ENUM ('USD', 'EUR', 'GBP', 'JPY', 'NOK', 'BTC', 'ETH');
CREATE TYPE asset_class AS ENUM ('STOCK', 'ETF', 'CRYPTOCURRENCY', 'CASH');
CREATE TYPE transaction_type AS ENUM ('BUY', 'SELL', 'DIVIDEND', 'DEPOSIT', 'WITHDRAWAL');
CREATE TYPE platform_type AS ENUM ('BROKER', 'BANK', 'CRYPTO_EXCHANGE', 'MANUAL');
CREATE TYPE account_type AS ENUM ('TAXABLE', 'SAVINGS', 'CRYPTO');
CREATE TYPE data_source AS ENUM ('MANUAL', 'API', 'CSV_IMPORT');

-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email CITEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Platforms
CREATE TABLE platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type platform_type NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Portfolios  
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency currency_code DEFAULT 'USD',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, name)
);

-- Accounts
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  account_type account_type NOT NULL,
  currency currency_code DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Stocks
CREATE TABLE stocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol CITEXT NOT NULL,
  name TEXT NOT NULL,
  asset_class asset_class DEFAULT 'STOCK',
  currency currency_code DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(symbol)
);

-- Holdings
CREATE TABLE holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE RESTRICT,
  quantity DECIMAL(20,8) NOT NULL DEFAULT 0,
  average_cost DECIMAL(20,8) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, account_id, stock_id)
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  stock_id UUID REFERENCES stocks(id) ON DELETE RESTRICT,
  transaction_type transaction_type NOT NULL,
  quantity DECIMAL(20,8) NOT NULL DEFAULT 0,
  price DECIMAL(20,8),
  total_amount DECIMAL(20,8) NOT NULL,
  currency currency_code NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own data" ON user_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own portfolios" ON portfolios FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own accounts" ON accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own holdings" ON holdings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);

-- Platforms are public
CREATE POLICY "Platforms are public" ON platforms FOR SELECT USING (true);
CREATE POLICY "Stocks are public" ON stocks FOR SELECT USING (true);

-- Done! Your database is ready.