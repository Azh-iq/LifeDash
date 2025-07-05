-- Temporarily disable RLS to insert sample data
ALTER TABLE public.stocks DISABLE ROW LEVEL SECURITY;

-- Insert sample stocks
INSERT INTO public.stocks (symbol, exchange, name, company_name, currency, current_price) VALUES
('AAPL', 'NASDAQ', 'Apple Inc.', 'Apple Inc.', 'USD', 185.50),
('MSFT', 'NASDAQ', 'Microsoft Corporation', 'Microsoft Corporation', 'USD', 378.85),
('GOOGL', 'NASDAQ', 'Alphabet Inc.', 'Alphabet Inc.', 'USD', 138.21),
('TSLA', 'NASDAQ', 'Tesla, Inc.', 'Tesla, Inc.', 'USD', 251.55),
('NVDA', 'NASDAQ', 'NVIDIA Corporation', 'NVIDIA Corporation', 'USD', 118.11);

-- Re-enable RLS
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;