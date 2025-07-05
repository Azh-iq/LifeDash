-- Add current_price column to stocks table for easier querying
-- This will store the most recent price for each stock

ALTER TABLE public.stocks 
ADD COLUMN current_price DECIMAL(20,8);

-- Add constraint to ensure current_price is positive when set
ALTER TABLE public.stocks 
ADD CONSTRAINT valid_current_price CHECK (current_price IS NULL OR current_price > 0);

-- Create function to update current_price when new price data is added
CREATE OR REPLACE FUNCTION update_stock_current_price()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the current_price in stocks table when new price is added
  UPDATE public.stocks 
  SET 
    current_price = NEW.close_price,
    last_updated = NOW()
  WHERE id = NEW.stock_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update current_price
CREATE TRIGGER update_stock_current_price_trigger
  AFTER INSERT OR UPDATE ON public.stock_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_current_price();

-- Add comment for documentation
COMMENT ON COLUMN public.stocks.current_price IS 'Most recent closing price, automatically updated from stock_prices table';
COMMENT ON FUNCTION update_stock_current_price() IS 'Automatically updates current_price in stocks table when new price data is added';