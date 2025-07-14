-- Add INSERT policies for stocks table
-- Allows authenticated users to create stocks during CSV import

-- Allow authenticated users to insert stocks (needed for CSV import)
CREATE POLICY "Authenticated users can insert stocks" ON public.stocks
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to insert stock aliases
CREATE POLICY "Authenticated users can insert stock aliases" ON public.stock_aliases
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to insert stock fundamentals
CREATE POLICY "Authenticated users can insert stock fundamentals" ON public.stock_fundamentals
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to insert stock splits
CREATE POLICY "Authenticated users can insert stock splits" ON public.stock_splits
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to insert stock dividends
CREATE POLICY "Authenticated users can insert stock dividends" ON public.stock_dividends
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Allow service role to insert everything (for system operations)
CREATE POLICY "Service role can insert stocks" ON public.stocks
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert stock aliases" ON public.stock_aliases
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert stock fundamentals" ON public.stock_fundamentals
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert stock splits" ON public.stock_splits
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert stock dividends" ON public.stock_dividends
  FOR INSERT 
  TO service_role
  WITH CHECK (true);