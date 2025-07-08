-- Advanced Fees System Enhancement for LifeDash
-- Adds support for separate tracking of commission, currency exchange, and other fees

-- The existing transactions table already has the required columns:
-- - commission DECIMAL(20,8) DEFAULT 0
-- - sec_fees DECIMAL(20,8) DEFAULT 0 (will be repurposed for currency exchange)
-- - other_fees DECIMAL(20,8) DEFAULT 0
-- - total_fees DECIMAL(20,8) GENERATED ALWAYS AS (commission + sec_fees + other_fees) STORED

-- Update the existing sec_fees column to be more descriptive for currency exchange
COMMENT ON COLUMN public.transactions.sec_fees IS 'Currency exchange fees (previously SEC fees)';

-- Add helpful comments for the fee structure
COMMENT ON COLUMN public.transactions.commission IS 'Brokerage commission (kurtasje)';
COMMENT ON COLUMN public.transactions.other_fees IS 'Other miscellaneous fees (andre gebyrer)';
COMMENT ON COLUMN public.transactions.total_fees IS 'Automatically calculated total of all fees';

-- Create or update function to validate fee structure
CREATE OR REPLACE FUNCTION validate_transaction_fees()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure all fee components are non-negative
  IF NEW.commission < 0 OR NEW.sec_fees < 0 OR NEW.other_fees < 0 THEN
    RAISE EXCEPTION 'All fee components must be non-negative';
  END IF;
  
  -- For Norwegian stocks (.OL), currency exchange fees should typically be 0
  IF NEW.currency = 'NOK' AND NEW.sec_fees > 0 THEN
    -- This is just a warning, not an error
    RAISE WARNING 'Currency exchange fees detected for NOK transaction - this may be incorrect';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for fee validation
DROP TRIGGER IF EXISTS validate_transaction_fees_trigger ON public.transactions;
CREATE TRIGGER validate_transaction_fees_trigger
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_transaction_fees();

-- Add index for querying by fee types (useful for reporting)
CREATE INDEX IF NOT EXISTS idx_transactions_commission ON public.transactions(commission) WHERE commission > 0;
CREATE INDEX IF NOT EXISTS idx_transactions_currency_exchange ON public.transactions(sec_fees) WHERE sec_fees > 0;
CREATE INDEX IF NOT EXISTS idx_transactions_other_fees ON public.transactions(other_fees) WHERE other_fees > 0;
CREATE INDEX IF NOT EXISTS idx_transactions_total_fees ON public.transactions(total_fees) WHERE total_fees > 0;

-- Create view for fee analysis
CREATE OR REPLACE VIEW public.transaction_fee_analysis AS
SELECT 
  t.id,
  t.user_id,
  t.account_id,
  t.stock_id,
  s.symbol,
  s.name as stock_name,
  t.transaction_type,
  t.date,
  t.quantity,
  t.price,
  t.total_amount,
  t.currency,
  
  -- Fee breakdown
  t.commission as kurtasje,
  t.sec_fees as valutaveksling,
  t.other_fees as andre_gebyrer,
  t.total_fees as total_gebyrer,
  
  -- Fee analysis
  CASE 
    WHEN t.total_amount > 0 THEN (t.total_fees / t.total_amount) * 100
    ELSE 0
  END as fee_percentage,
  
  -- Categorize transactions by fee structure
  CASE 
    WHEN t.commission > 0 AND t.sec_fees > 0 AND t.other_fees > 0 THEN 'Complex'
    WHEN t.commission > 0 AND t.sec_fees > 0 THEN 'Commission + Currency'
    WHEN t.commission > 0 AND t.other_fees > 0 THEN 'Commission + Other'
    WHEN t.commission > 0 THEN 'Commission Only'
    WHEN t.sec_fees > 0 THEN 'Currency Only'
    WHEN t.other_fees > 0 THEN 'Other Only'
    ELSE 'No Fees'
  END as fee_structure,
  
  -- Platform detection (based on typical fee patterns)
  CASE 
    WHEN t.commission = 99 AND t.currency = 'NOK' THEN 'Likely Nordnet (NOK)'
    WHEN t.commission = 0.99 AND t.currency = 'USD' THEN 'Likely Nordnet (USD)'
    WHEN t.commission = 149 THEN 'Likely DNB'
    WHEN t.commission = 199 THEN 'Likely Handelsbanken'
    ELSE 'Unknown/Manual'
  END as likely_platform,
  
  t.created_at,
  t.updated_at
FROM public.transactions t
LEFT JOIN public.stocks s ON t.stock_id = s.id
WHERE t.transaction_type IN ('BUY', 'SELL');

-- Grant access to the view
GRANT SELECT ON public.transaction_fee_analysis TO authenticated;

-- Note: RLS policies cannot be applied directly to views in PostgreSQL
-- Access control is handled through the underlying tables (transactions, stocks)

-- Create function to get fee statistics for a user
CREATE OR REPLACE FUNCTION get_user_fee_statistics(target_user_id UUID)
RETURNS TABLE (
  total_transactions BIGINT,
  total_fees_paid DECIMAL,
  average_fee_per_transaction DECIMAL,
  commission_total DECIMAL,
  currency_exchange_total DECIMAL,
  other_fees_total DECIMAL,
  highest_fee_transaction_id UUID,
  highest_fee_amount DECIMAL,
  most_common_fee_structure TEXT,
  estimated_savings_with_cheaper_broker DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_transactions,
    COALESCE(SUM(t.total_fees), 0) as total_fees_paid,
    COALESCE(AVG(t.total_fees), 0) as average_fee_per_transaction,
    COALESCE(SUM(t.commission), 0) as commission_total,
    COALESCE(SUM(t.sec_fees), 0) as currency_exchange_total,
    COALESCE(SUM(t.other_fees), 0) as other_fees_total,
    (SELECT id FROM public.transactions WHERE user_id = target_user_id ORDER BY total_fees DESC LIMIT 1) as highest_fee_transaction_id,
    (SELECT MAX(total_fees) FROM public.transactions WHERE user_id = target_user_id) as highest_fee_amount,
    (SELECT fee_structure FROM public.transaction_fee_analysis WHERE user_id = target_user_id GROUP BY fee_structure ORDER BY COUNT(*) DESC LIMIT 1) as most_common_fee_structure,
    -- Simple calculation: assume 50% cheaper broker fees
    COALESCE(SUM(t.total_fees) * 0.5, 0) as estimated_savings_with_cheaper_broker
  FROM public.transactions t
  WHERE t.user_id = target_user_id
    AND t.transaction_type IN ('BUY', 'SELL')
    AND t.total_fees > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION get_user_fee_statistics TO authenticated;

-- Add documentation
COMMENT ON VIEW public.transaction_fee_analysis IS 'Comprehensive analysis of transaction fees with platform detection and fee structure categorization';
COMMENT ON FUNCTION get_user_fee_statistics IS 'Returns comprehensive fee statistics for a user including potential savings analysis';
COMMENT ON FUNCTION validate_transaction_fees IS 'Validates transaction fees and provides warnings for potentially incorrect fee structures';

-- Create sample data migration function (for development/testing)
CREATE OR REPLACE FUNCTION migrate_legacy_fee_data()
RETURNS void AS $$
BEGIN
  -- This function would migrate any existing simple fee data to the new structure
  -- For now, we'll just add a note that existing 'fees' data should be mapped to 'commission'
  
  -- If there are existing transactions with only a single 'fees' field,
  -- we would map them to commission for Norwegian stocks, and split between
  -- commission and currency exchange for foreign stocks
  
  -- Example migration logic (commented out for safety):
  /*
  UPDATE public.transactions 
  SET commission = fees,
      sec_fees = 0,
      other_fees = 0
  WHERE commission = 0 
    AND sec_fees = 0 
    AND other_fees = 0 
    AND fees > 0;
  */
  
  RAISE NOTICE 'Legacy fee data migration function created. Run manually if needed.';
END;
$$ LANGUAGE plpgsql;

-- Performance optimization: Update statistics
ANALYZE public.transactions;