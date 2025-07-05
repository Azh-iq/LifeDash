-- Add more sample stocks for testing
-- Temporarily disable RLS to insert sample data
ALTER TABLE public.stocks DISABLE ROW LEVEL SECURITY;

-- Insert more sample stocks including Norwegian ones
INSERT INTO public.stocks (symbol, exchange, name, company_name, currency, current_price, sector, industry, market_cap) VALUES
-- Norwegian stocks
('EQUI.OL', 'OSL', 'Equinor ASA', 'Equinor ASA', 'NOK', 280.50, 'Energy', 'Oil & Gas E&P', 890000000000),
('DNB.OL', 'OSL', 'DNB ASA', 'DNB Bank ASA', 'NOK', 205.80, 'Financial Services', 'Banks—Diversified', 320000000000),
('MOWI.OL', 'OSL', 'Mowi ASA', 'Mowi ASA', 'NOK', 185.40, 'Consumer Defensive', 'Farm Products', 96000000000),
('NEL.OL', 'OSL', 'Nel ASA', 'Nel ASA', 'NOK', 5.85, 'Technology', 'Specialty Industrial Machinery', 9700000000),
('YARA.OL', 'OSL', 'Yara International ASA', 'Yara International ASA', 'NOK', 385.20, 'Basic Materials', 'Agricultural Inputs', 104000000000),

-- More US stocks
('AMZN', 'NASDAQ', 'Amazon.com, Inc.', 'Amazon.com, Inc.', 'USD', 155.89, 'Consumer Cyclical', 'Internet Retail', 1600000000000),
('META', 'NASDAQ', 'Meta Platforms, Inc.', 'Meta Platforms, Inc.', 'USD', 329.31, 'Communication Services', 'Internet Content & Information', 850000000000),
('NFLX', 'NASDAQ', 'Netflix, Inc.', 'Netflix, Inc.', 'USD', 445.05, 'Communication Services', 'Entertainment', 200000000000),
('AMD', 'NASDAQ', 'Advanced Micro Devices, Inc.', 'Advanced Micro Devices, Inc.', 'USD', 163.89, 'Technology', 'Semiconductors', 265000000000),
('INTC', 'NASDAQ', 'Intel Corporation', 'Intel Corporation', 'USD', 23.24, 'Technology', 'Semiconductors', 100000000000),

-- European stocks
('ASML.AS', 'EURONEXT', 'ASML Holding N.V.', 'ASML Holding N.V.', 'EUR', 685.50, 'Technology', 'Semiconductor Equipment & Materials', 280000000000),
('SAP', 'XETRA', 'SAP SE', 'SAP SE', 'EUR', 178.92, 'Technology', 'Software—Application', 210000000000)
ON CONFLICT (symbol, exchange) DO UPDATE SET 
    current_price = EXCLUDED.current_price,
    sector = EXCLUDED.sector,
    industry = EXCLUDED.industry,
    market_cap = EXCLUDED.market_cap;

-- Add some stock aliases for better search
INSERT INTO public.stock_aliases (stock_id, alias_symbol, alias_exchange, source) 
SELECT s.id, 'EQUI', 'OSL', 'yahoo' FROM public.stocks s WHERE s.symbol = 'EQUI.OL'
UNION ALL
SELECT s.id, 'DNB', 'OSL', 'yahoo' FROM public.stocks s WHERE s.symbol = 'DNB.OL'
UNION ALL
SELECT s.id, 'MOWI', 'OSL', 'yahoo' FROM public.stocks s WHERE s.symbol = 'MOWI.OL'
UNION ALL
SELECT s.id, 'NEL', 'OSL', 'yahoo' FROM public.stocks s WHERE s.symbol = 'NEL.OL'
UNION ALL
SELECT s.id, 'YARA', 'OSL', 'yahoo' FROM public.stocks s WHERE s.symbol = 'YARA.OL'
ON CONFLICT (alias_symbol, alias_exchange, source) DO NOTHING;

-- Re-enable RLS
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;