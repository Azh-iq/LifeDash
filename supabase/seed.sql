-- LifeDash Seed Data for Testing and Development
-- This file provides realistic test data for the financial portfolio application

-- Create partitions for partitioned tables first
DO $$
BEGIN
    -- Create partitions for stock_prices if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_prices') THEN
        PERFORM create_future_partitions('public.stock_prices', 12);
        PERFORM create_future_partitions('public.intraday_prices', 3);
        PERFORM create_future_partitions('public.market_index_prices', 12);
        RAISE NOTICE 'Partitions created for time-series tables';
    ELSE
        RAISE NOTICE 'Partitioned tables not found, skipping partition creation';
    END IF;
END $$;

-- =============================================================================
-- IMPORTANT: This seed data is for DEVELOPMENT and TESTING only
-- =============================================================================

-- Only run this seed in development environment
DO $$
BEGIN
    -- Safety check: Only run in local/development environment
    IF current_setting('server_version_num')::int >= 150000 AND 
       current_database() IN ('postgres', 'lifedash') THEN
        RAISE NOTICE 'Running LifeDash seed data in development environment';
    ELSE
        RAISE EXCEPTION 'Seed data should only be run in development environment';
    END IF;
END $$;

-- =============================================================================
-- CLEANUP EXISTING TEST DATA
-- =============================================================================

-- Delete existing test data (in reverse dependency order)
DELETE FROM public.audit_logs WHERE resource_type LIKE 'test_%';
DELETE FROM public.portfolio_performance WHERE portfolio_id IN (
    SELECT id FROM public.portfolios WHERE name LIKE 'Test %'
);
DELETE FROM public.dividend_payments WHERE user_id IN (
    SELECT id FROM public.user_profiles WHERE email LIKE '%@test.com'
);
DELETE FROM public.realized_gains WHERE user_id IN (
    SELECT id FROM public.user_profiles WHERE email LIKE '%@test.com'
);
DELETE FROM public.tax_lots WHERE holding_id IN (
    SELECT h.id FROM public.holdings h 
    JOIN public.accounts a ON a.id = h.account_id 
    JOIN public.user_profiles u ON u.id = a.user_id 
    WHERE u.email LIKE '%@test.com'
);
DELETE FROM public.holdings WHERE user_id IN (
    SELECT id FROM public.user_profiles WHERE email LIKE '%@test.com'
);
DELETE FROM public.transactions WHERE user_id IN (
    SELECT id FROM public.user_profiles WHERE email LIKE '%@test.com'
);
DELETE FROM public.portfolio_allocations WHERE portfolio_id IN (
    SELECT p.id FROM public.portfolios p 
    JOIN public.user_profiles u ON u.id = p.user_id 
    WHERE u.email LIKE '%@test.com'
);
DELETE FROM public.accounts WHERE user_id IN (
    SELECT id FROM public.user_profiles WHERE email LIKE '%@test.com'
);
DELETE FROM public.portfolios WHERE user_id IN (
    SELECT id FROM public.user_profiles WHERE email LIKE '%@test.com'
);
DELETE FROM public.user_preferences WHERE user_id IN (
    SELECT id FROM public.user_profiles WHERE email LIKE '%@test.com'
);
DELETE FROM public.user_profiles WHERE email LIKE '%@test.com';

-- Clean test stocks
DELETE FROM public.stock_prices WHERE stock_id IN (
    SELECT id FROM public.stocks WHERE symbol IN ('AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'BTC-USD', 'SPY', 'VTI', 'BND')
);
DELETE FROM public.stocks WHERE symbol IN ('AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'BTC-USD', 'SPY', 'VTI', 'BND');

-- Clean test platforms
DELETE FROM public.platforms WHERE name LIKE 'Test %';

-- =============================================================================
-- PLATFORMS (Brokers, Exchanges, Banks)
-- =============================================================================

INSERT INTO public.platforms (id, name, display_name, type, country_code, default_currency, supported_currencies, supported_asset_classes, stock_commission, etf_commission, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'fidelity', 'Fidelity Investments', 'BROKER', 'US', 'USD', ARRAY['USD']::currency_code[], ARRAY['STOCK', 'ETF', 'MUTUAL_FUND', 'BOND']::asset_class[], 0.00, 0.00, true),
('22222222-2222-2222-2222-222222222222', 'vanguard', 'Vanguard', 'BROKER', 'US', 'USD', ARRAY['USD']::currency_code[], ARRAY['STOCK', 'ETF', 'MUTUAL_FUND', 'BOND']::asset_class[], 0.00, 0.00, true),
('33333333-3333-3333-3333-333333333333', 'charles_schwab', 'Charles Schwab', 'BROKER', 'US', 'USD', ARRAY['USD']::currency_code[], ARRAY['STOCK', 'ETF', 'MUTUAL_FUND', 'BOND', 'OPTION']::asset_class[], 0.00, 0.00, true),
('44444444-4444-4444-4444-444444444444', 'coinbase', 'Coinbase', 'CRYPTO_EXCHANGE', 'US', 'USD', ARRAY['USD', 'BTC', 'ETH']::currency_code[], ARRAY['CRYPTOCURRENCY']::asset_class[], 0.00, 0.00, true),
('55555555-5555-5555-5555-555555555555', 'robinhood', 'Robinhood', 'BROKER', 'US', 'USD', ARRAY['USD']::currency_code[], ARRAY['STOCK', 'ETF', 'CRYPTOCURRENCY', 'OPTION']::asset_class[], 0.00, 0.00, true),
('66666666-6666-6666-6666-666666666666', 'interactive_brokers', 'Interactive Brokers', 'BROKER', 'US', 'USD', ARRAY['USD', 'EUR', 'GBP', 'CAD']::currency_code[], ARRAY['STOCK', 'ETF', 'BOND', 'OPTION', 'FUTURE', 'FOREX']::asset_class[], 0.0035, 0.0035, true);

-- =============================================================================
-- STOCKS AND SECURITIES
-- =============================================================================

INSERT INTO public.stocks (id, symbol, exchange, name, company_name, asset_class, sector, industry, currency, market_cap, is_active, is_tradeable) VALUES
-- Large Cap Tech Stocks
('aaaa1111-1111-1111-1111-111111111111', 'AAPL', 'NASDAQ', 'Apple Inc.', 'Apple Inc.', 'STOCK', 'Technology', 'Consumer Electronics', 'USD', 3000000000000, true, true),
('aaaa2222-2222-2222-2222-222222222222', 'GOOGL', 'NASDAQ', 'Alphabet Inc Class A', 'Alphabet Inc.', 'STOCK', 'Technology', 'Internet Services', 'USD', 1800000000000, true, true),
('aaaa3333-3333-3333-3333-333333333333', 'MSFT', 'NASDAQ', 'Microsoft Corporation', 'Microsoft Corporation', 'STOCK', 'Technology', 'Software', 'USD', 2800000000000, true, true),
('aaaa4444-4444-4444-4444-444444444444', 'TSLA', 'NASDAQ', 'Tesla Inc', 'Tesla, Inc.', 'STOCK', 'Consumer Discretionary', 'Electric Vehicles', 'USD', 800000000000, true, true),
('aaaa5555-5555-5555-5555-555555555555', 'AMZN', 'NASDAQ', 'Amazon.com Inc', 'Amazon.com, Inc.', 'STOCK', 'Consumer Discretionary', 'E-commerce', 'USD', 1500000000000, true, true),
('aaaa6666-6666-6666-6666-666666666666', 'NVDA', 'NASDAQ', 'NVIDIA Corporation', 'NVIDIA Corporation', 'STOCK', 'Technology', 'Semiconductors', 'USD', 1200000000000, true, true),

-- ETFs
('bbbb1111-1111-1111-1111-111111111111', 'SPY', 'NYSE', 'SPDR S&P 500 ETF Trust', 'State Street Corporation', 'ETF', 'Broad Market', 'Large Cap Blend', 'USD', 400000000000, true, true),
('bbbb2222-2222-2222-2222-222222222222', 'VTI', 'NYSE', 'Vanguard Total Stock Market ETF', 'The Vanguard Group', 'ETF', 'Broad Market', 'Total Stock Market', 'USD', 250000000000, true, true),
('bbbb3333-3333-3333-3333-333333333333', 'BND', 'NYSE', 'Vanguard Total Bond Market ETF', 'The Vanguard Group', 'ETF', 'Fixed Income', 'Total Bond Market', 'USD', 80000000000, true, true),

-- Cryptocurrency (represented as stock for simplicity)
('cccc1111-1111-1111-1111-111111111111', 'BTC-USD', 'CRYPTO', 'Bitcoin', 'Bitcoin', 'CRYPTOCURRENCY', 'Cryptocurrency', 'Digital Currency', 'USD', 1000000000000, true, true);

-- =============================================================================
-- HISTORICAL STOCK PRICES (Last 30 days)
-- =============================================================================

-- Generate prices for the last 30 days for major stocks
WITH date_series AS (
    SELECT generate_series(
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE - INTERVAL '1 day',
        INTERVAL '1 day'
    )::date AS price_date
),
stock_base_prices AS (
    SELECT 
        'aaaa1111-1111-1111-1111-111111111111'::uuid as stock_id, 'AAPL' as symbol, 175.00 as base_price
    UNION ALL SELECT 'aaaa2222-2222-2222-2222-222222222222'::uuid, 'GOOGL', 140.00
    UNION ALL SELECT 'aaaa3333-3333-3333-3333-333333333333'::uuid, 'MSFT', 420.00
    UNION ALL SELECT 'aaaa4444-4444-4444-4444-444444444444'::uuid, 'TSLA', 250.00
    UNION ALL SELECT 'aaaa5555-5555-5555-5555-555555555555'::uuid, 'AMZN', 155.00
    UNION ALL SELECT 'aaaa6666-6666-6666-6666-666666666666'::uuid, 'NVDA', 450.00
    UNION ALL SELECT 'bbbb1111-1111-1111-1111-111111111111'::uuid, 'SPY', 450.00
    UNION ALL SELECT 'bbbb2222-2222-2222-2222-222222222222'::uuid, 'VTI', 230.00
    UNION ALL SELECT 'bbbb3333-3333-3333-3333-333333333333'::uuid, 'BND', 75.00
    UNION ALL SELECT 'cccc1111-1111-1111-1111-111111111111'::uuid, 'BTC-USD', 45000.00
)
INSERT INTO public.stock_prices (stock_id, date, open_price, high_price, low_price, close_price, volume, data_source)
SELECT 
    sbp.stock_id,
    ds.price_date,
    -- Generate realistic OHLC prices with some volatility
    sbp.base_price * (1 + (random() - 0.5) * 0.04) as open_price,
    sbp.base_price * (1 + (random() - 0.5) * 0.04 + 0.02) as high_price,
    sbp.base_price * (1 + (random() - 0.5) * 0.04 - 0.02) as low_price,
    sbp.base_price * (1 + (random() - 0.5) * 0.04) as close_price,
    -- Generate realistic volume
    CASE 
        WHEN sbp.symbol = 'BTC-USD' THEN (random() * 1000000 + 500000)::bigint
        WHEN sbp.symbol IN ('AAPL', 'MSFT', 'GOOGL') THEN (random() * 50000000 + 20000000)::bigint
        ELSE (random() * 10000000 + 5000000)::bigint
    END as volume,
    'API'::data_source
FROM date_series ds
CROSS JOIN stock_base_prices sbp;

-- =============================================================================
-- TEST USERS
-- =============================================================================

INSERT INTO public.user_profiles (id, email, full_name, display_name, created_at) VALUES
('a1111111-1111-1111-1111-111111111111', 'john.doe@test.com', 'John Doe', 'John', NOW() - INTERVAL '6 months'),
('a2222222-2222-2222-2222-222222222222', 'jane.smith@test.com', 'Jane Smith', 'Jane', NOW() - INTERVAL '3 months'),
('a3333333-3333-3333-3333-333333333333', 'mike.investor@test.com', 'Mike Investor', 'Mike', NOW() - INTERVAL '1 year');

-- User preferences
INSERT INTO public.user_preferences (user_id, theme, primary_currency, show_percentage_changes, show_absolute_changes, email_notifications) VALUES
('a1111111-1111-1111-1111-111111111111', 'dark', 'USD', true, true, true),
('a2222222-2222-2222-2222-222222222222', 'light', 'USD', true, false, false),
('a3333333-3333-3333-3333-333333333333', 'dark', 'USD', true, true, true);

-- =============================================================================
-- PORTFOLIOS
-- =============================================================================

INSERT INTO public.portfolios (id, user_id, name, description, currency, is_default, color_theme, inception_date) VALUES
-- John's portfolios
('b0001111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Growth Portfolio', 'Aggressive growth focused on tech stocks', 'USD', true, '#4169E1', '2023-01-15'),
('b0001112-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Retirement 401k', 'Conservative retirement savings', 'USD', false, '#228B22', '2022-06-01'),

-- Jane's portfolios
('b0002222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Balanced Portfolio', 'Mix of stocks, bonds, and ETFs', 'USD', true, '#FF6347', '2023-06-01'),
('b0002223-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Crypto Holdings', 'Cryptocurrency investments', 'USD', false, '#FFD700', '2023-08-15'),

-- Mike's portfolios
('b0003333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'Dividend Income', 'Focus on dividend-paying stocks', 'USD', true, '#8B4513', '2022-01-01'),
('b0003334-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'Tech Innovation', 'High-risk technology investments', 'USD', false, '#9932CC', '2023-03-01');

-- =============================================================================
-- ACCOUNTS
-- =============================================================================

INSERT INTO public.accounts (id, user_id, portfolio_id, platform_id, name, account_type, currency, is_active, opening_balance) VALUES
-- John's accounts
('d0001111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'b0001111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Fidelity Brokerage', 'TAXABLE', 'USD', true, 10000.00),
('d0001112-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'b0001112-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Vanguard 401k', '401K', 'USD', true, 25000.00),

-- Jane's accounts
('d0002222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'b0002222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Schwab Individual', 'TAXABLE', 'USD', true, 15000.00),
('d0002223-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'b0002223-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Coinbase Pro', 'CRYPTO', 'USD', true, 5000.00),

-- Mike's accounts
('d0003333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'b0003333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', 'Interactive Brokers', 'TAXABLE', 'USD', true, 50000.00),
('d0003334-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'b0003334-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'Robinhood', 'TAXABLE', 'USD', true, 20000.00);

-- =============================================================================
-- TRANSACTIONS AND HOLDINGS
-- =============================================================================

-- Sample transactions for John's Growth Portfolio
INSERT INTO public.transactions (id, user_id, account_id, stock_id, transaction_type, quantity, price, total_amount, currency, date, data_source) VALUES
-- AAPL purchases
('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'd0001111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'BUY', 50, 150.00, 7500.00, 'USD', '2023-02-01', 'MANUAL'),
('11112222-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'd0001111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'BUY', 25, 165.00, 4125.00, 'USD', '2023-04-15', 'MANUAL'),

-- MSFT purchases
('11113333-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'd0001111-1111-1111-1111-111111111111', 'aaaa3333-3333-3333-3333-333333333333', 'BUY', 30, 380.00, 11400.00, 'USD', '2023-03-01', 'MANUAL'),

-- GOOGL purchases
('11114444-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'd0001111-1111-1111-1111-111111111111', 'aaaa2222-2222-2222-2222-222222222222', 'BUY', 40, 125.00, 5000.00, 'USD', '2023-05-01', 'MANUAL');

-- Sample transactions for Jane's Balanced Portfolio
INSERT INTO public.transactions (id, user_id, account_id, stock_id, transaction_type, quantity, price, total_amount, currency, date, data_source) VALUES
-- SPY ETF
('22221111-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'd0002222-2222-2222-2222-222222222222', 'bbbb1111-1111-1111-1111-111111111111', 'BUY', 25, 420.00, 10500.00, 'USD', '2023-07-01', 'MANUAL'),

-- VTI ETF
('22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'd0002222-2222-2222-2222-222222222222', 'bbbb2222-2222-2222-2222-222222222222', 'BUY', 50, 215.00, 10750.00, 'USD', '2023-07-15', 'MANUAL'),

-- BND ETF
('22223333-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'd0002222-2222-2222-2222-222222222222', 'bbbb3333-3333-3333-3333-333333333333', 'BUY', 100, 73.00, 7300.00, 'USD', '2023-08-01', 'MANUAL');

-- Bitcoin
INSERT INTO public.transactions (id, user_id, account_id, stock_id, transaction_type, quantity, price, total_amount, currency, date, data_source) VALUES
('22224444-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'd0002223-2222-2222-2222-222222222222', 'cccc1111-1111-1111-1111-111111111111', 'BUY', 0.1, 42000.00, 4200.00, 'USD', '2023-09-01', 'MANUAL');

-- Sample transactions for Mike's portfolios
INSERT INTO public.transactions (id, user_id, account_id, stock_id, transaction_type, quantity, price, total_amount, currency, date, data_source) VALUES
-- Dividend stocks for Mike
('33331111-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'd0003333-3333-3333-3333-333333333333', 'aaaa1111-1111-1111-1111-111111111111', 'BUY', 100, 145.00, 14500.00, 'USD', '2022-03-01', 'MANUAL'),
('33332222-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'd0003333-3333-3333-3333-333333333333', 'aaaa3333-3333-3333-3333-333333333333', 'BUY', 75, 350.00, 26250.00, 'USD', '2022-04-01', 'MANUAL'),

-- Tech innovation stocks
('33333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'd0003334-3333-3333-3333-333333333333', 'aaaa6666-6666-6666-6666-666666666666', 'BUY', 50, 380.00, 19000.00, 'USD', '2023-04-01', 'MANUAL'),
('33334444-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'd0003334-3333-3333-3333-333333333333', 'aaaa4444-4444-4444-4444-444444444444', 'BUY', 25, 220.00, 5500.00, 'USD', '2023-05-01', 'MANUAL');

-- =============================================================================
-- CURRENT HOLDINGS (calculated from transactions)
-- =============================================================================

INSERT INTO public.holdings (id, user_id, account_id, stock_id, quantity, average_cost, total_cost, current_price, market_value, currency, is_active, first_purchase_date, last_transaction_date) VALUES
-- John's holdings
('c0001111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'd0001111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 75, 155.00, 11625.00, 175.00, 13125.00, 'USD', true, '2023-02-01', '2023-04-15'),
('c0001112-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'd0001111-1111-1111-1111-111111111111', 'aaaa3333-3333-3333-3333-333333333333', 30, 380.00, 11400.00, 420.00, 12600.00, 'USD', true, '2023-03-01', '2023-03-01'),
('c0001113-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'd0001111-1111-1111-1111-111111111111', 'aaaa2222-2222-2222-2222-222222222222', 40, 125.00, 5000.00, 140.00, 5600.00, 'USD', true, '2023-05-01', '2023-05-01'),

-- Jane's holdings
('c0002221-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'd0002222-2222-2222-2222-222222222222', 'bbbb1111-1111-1111-1111-111111111111', 25, 420.00, 10500.00, 450.00, 11250.00, 'USD', true, '2023-07-01', '2023-07-01'),
('c0002222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'd0002222-2222-2222-2222-222222222222', 'bbbb2222-2222-2222-2222-222222222222', 50, 215.00, 10750.00, 230.00, 11500.00, 'USD', true, '2023-07-15', '2023-07-15'),
('c0002223-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'd0002222-2222-2222-2222-222222222222', 'bbbb3333-3333-3333-3333-333333333333', 100, 73.00, 7300.00, 75.00, 7500.00, 'USD', true, '2023-08-01', '2023-08-01'),
('c0002224-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'd0002223-2222-2222-2222-222222222222', 'cccc1111-1111-1111-1111-111111111111', 0.1, 42000.00, 4200.00, 45000.00, 4500.00, 'USD', true, '2023-09-01', '2023-09-01'),

-- Mike's holdings
('c0003331-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'd0003333-3333-3333-3333-333333333333', 'aaaa1111-1111-1111-1111-111111111111', 100, 145.00, 14500.00, 175.00, 17500.00, 'USD', true, '2022-03-01', '2022-03-01'),
('c0003332-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'd0003333-3333-3333-3333-333333333333', 'aaaa3333-3333-3333-3333-333333333333', 75, 350.00, 26250.00, 420.00, 31500.00, 'USD', true, '2022-04-01', '2022-04-01'),
('c0003333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'd0003334-3333-3333-3333-333333333333', 'aaaa6666-6666-6666-6666-666666666666', 50, 380.00, 19000.00, 450.00, 22500.00, 'USD', true, '2023-04-01', '2023-04-01'),
('c0003334-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'd0003334-3333-3333-3333-333333333333', 'aaaa4444-4444-4444-4444-444444444444', 25, 220.00, 5500.00, 250.00, 6250.00, 'USD', true, '2023-05-01', '2023-05-01');

-- =============================================================================
-- PORTFOLIO ALLOCATIONS (Target vs Actual)
-- =============================================================================

INSERT INTO public.portfolio_allocations (portfolio_id, asset_class, target_percentage, min_percentage, max_percentage, rebalance_threshold) VALUES
-- John's Growth Portfolio targets
('b0001111-1111-1111-1111-111111111111', 'STOCK', 80.00, 70.00, 90.00, 5.00),
('b0001111-1111-1111-1111-111111111111', 'ETF', 15.00, 10.00, 25.00, 5.00),
('b0001111-1111-1111-1111-111111111111', 'CASH', 5.00, 0.00, 10.00, 2.00),

-- Jane's Balanced Portfolio targets
('b0002222-2222-2222-2222-222222222222', 'ETF', 70.00, 60.00, 80.00, 5.00),
('b0002222-2222-2222-2222-222222222222', 'BOND', 25.00, 20.00, 30.00, 5.00),
('b0002222-2222-2222-2222-222222222222', 'CASH', 5.00, 0.00, 10.00, 2.00),

-- Mike's Dividend Income targets
('b0003333-3333-3333-3333-333333333333', 'STOCK', 90.00, 80.00, 95.00, 5.00),
('b0003333-3333-3333-3333-333333333333', 'CASH', 10.00, 5.00, 15.00, 2.00);

-- =============================================================================
-- SAMPLE DIVIDEND PAYMENTS
-- =============================================================================

INSERT INTO public.dividend_payments (user_id, account_id, stock_id, ex_date, payment_date, amount_per_share, shares_held, total_amount, currency) VALUES
-- AAPL dividends for John and Mike
('a1111111-1111-1111-1111-111111111111', 'd0001111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', '2023-08-11', '2023-08-17', 0.24, 75, 18.00, 'USD'),
('a3333333-3333-3333-3333-333333333333', 'd0003333-3333-3333-3333-333333333333', 'aaaa1111-1111-1111-1111-111111111111', '2023-08-11', '2023-08-17', 0.24, 100, 24.00, 'USD'),

-- MSFT dividends
('a1111111-1111-1111-1111-111111111111', 'd0001111-1111-1111-1111-111111111111', 'aaaa3333-3333-3333-3333-333333333333', '2023-08-16', '2023-09-14', 0.68, 30, 20.40, 'USD'),
('a3333333-3333-3333-3333-333333333333', 'd0003333-3333-3333-3333-333333333333', 'aaaa3333-3333-3333-3333-333333333333', '2023-08-16', '2023-09-14', 0.68, 75, 51.00, 'USD');

-- =============================================================================
-- AUDIT LOG ENTRIES
-- =============================================================================

INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, success, metadata) VALUES
('a1111111-1111-1111-1111-111111111111', 'CREATE', 'portfolio', 'b0001111-1111-1111-1111-111111111111', true, '{"portfolio_name": "Growth Portfolio"}'),
('a1111111-1111-1111-1111-111111111111', 'CREATE', 'transaction', '11111111-1111-1111-1111-111111111111', true, '{"symbol": "AAPL", "type": "BUY", "amount": 7500}'),
('a2222222-2222-2222-2222-222222222222', 'CREATE', 'portfolio', 'b0002222-2222-2222-2222-222222222222', true, '{"portfolio_name": "Balanced Portfolio"}'),
('a3333333-3333-3333-3333-333333333333', 'CREATE', 'portfolio', 'b0003333-3333-3333-3333-333333333333', true, '{"portfolio_name": "Dividend Income"}');

-- =============================================================================
-- REFRESH MATERIALIZED VIEWS
-- =============================================================================

-- Refresh materialized views with the new seed data
REFRESH MATERIALIZED VIEW public.mv_portfolio_current_performance;
REFRESH MATERIALIZED VIEW public.mv_stock_performance_summary;
REFRESH MATERIALIZED VIEW public.mv_user_dashboard_summary;
REFRESH MATERIALIZED VIEW public.mv_asset_allocation_analysis;

-- =============================================================================
-- SUMMARY
-- =============================================================================

DO $$
DECLARE
    user_count INTEGER;
    portfolio_count INTEGER;
    account_count INTEGER;
    holding_count INTEGER;
    transaction_count INTEGER;
    stock_count INTEGER;
    platform_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.user_profiles WHERE email LIKE '%@test.com';
    SELECT COUNT(*) INTO portfolio_count FROM public.portfolios;
    SELECT COUNT(*) INTO account_count FROM public.accounts;
    SELECT COUNT(*) INTO holding_count FROM public.holdings WHERE is_active = true;
    SELECT COUNT(*) INTO transaction_count FROM public.transactions;
    SELECT COUNT(*) INTO stock_count FROM public.stocks WHERE is_active = true;
    SELECT COUNT(*) INTO platform_count FROM public.platforms WHERE is_active = true;
    
    RAISE NOTICE 'LifeDash seed data created successfully!';
    RAISE NOTICE 'Users: %, Portfolios: %, Accounts: %, Holdings: %, Transactions: %, Stocks: %, Platforms: %',
        user_count, portfolio_count, account_count, holding_count, transaction_count, stock_count, platform_count;
    
    RAISE NOTICE 'Test users created:';
    RAISE NOTICE '  - john.doe@test.com (Growth focused investor)';
    RAISE NOTICE '  - jane.smith@test.com (Balanced investor with crypto)';
    RAISE NOTICE '  - mike.investor@test.com (Dividend income focused)';
    
    RAISE NOTICE 'You can now test the application with realistic data!';
END $$;