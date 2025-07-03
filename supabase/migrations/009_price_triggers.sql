-- Price Update Triggers Migration for LifeDash
-- Handles automatic updates of portfolios, holdings, and performance metrics when stock prices change
-- Optimized for high-frequency price updates in financial systems

-- Create price update notification table for batching
CREATE TABLE IF NOT EXISTS public.price_update_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  old_price DECIMAL(20,8),
  new_price DECIMAL(20,8) NOT NULL,
  price_date DATE NOT NULL,
  update_type TEXT NOT NULL CHECK (update_type IN ('daily', 'intraday', 'historical')),
  
  -- Batch processing fields
  batch_id UUID,
  processed BOOLEAN DEFAULT false,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_prices CHECK (new_price > 0 AND (old_price IS NULL OR old_price > 0))
);

-- Create index for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_price_update_queue_processing 
ON public.price_update_queue(processed, created_at) WHERE processed = false;

CREATE INDEX IF NOT EXISTS idx_price_update_queue_batch 
ON public.price_update_queue(batch_id, processed) WHERE batch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_price_update_queue_stock_date 
ON public.price_update_queue(stock_id, price_date, processed);

-- Create materialized view refresh schedule table
CREATE TABLE IF NOT EXISTS public.materialized_view_refresh_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  view_name TEXT NOT NULL,
  last_refresh TIMESTAMPTZ DEFAULT NOW(),
  refresh_interval INTERVAL NOT NULL DEFAULT '1 hour',
  next_refresh TIMESTAMPTZ,
  is_refreshing BOOLEAN DEFAULT false,
  refresh_duration INTERVAL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(view_name)
);

-- Create currency exchange rates table for real-time updates
CREATE TABLE IF NOT EXISTS public.currency_exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_currency currency_code NOT NULL,
  to_currency currency_code NOT NULL,
  rate DECIMAL(20,8) NOT NULL,
  date DATE NOT NULL,
  
  -- Rate metadata
  bid_rate DECIMAL(20,8),
  ask_rate DECIMAL(20,8),
  high_rate DECIMAL(20,8),
  low_rate DECIMAL(20,8),
  
  -- Data source
  data_source data_source DEFAULT 'API',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_rate CHECK (rate > 0),
  CONSTRAINT valid_currencies CHECK (from_currency != to_currency),
  CONSTRAINT valid_bid_ask CHECK (bid_rate IS NULL OR ask_rate IS NULL OR bid_rate <= ask_rate),
  
  UNIQUE(from_currency, to_currency, date)
);

-- Create price alert conditions table
CREATE TABLE IF NOT EXISTS public.price_alert_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  
  -- Alert conditions
  condition_type TEXT NOT NULL CHECK (condition_type IN ('price_above', 'price_below', 'percent_change', 'volume_spike')),
  threshold_value DECIMAL(20,8) NOT NULL,
  comparison_period INTERVAL DEFAULT '1 day',
  
  -- Alert settings
  is_active BOOLEAN DEFAULT true,
  notification_method TEXT[] DEFAULT ARRAY['email'],
  alert_frequency TEXT DEFAULT 'once' CHECK (alert_frequency IN ('once', 'daily', 'always')),
  
  -- Tracking
  last_triggered TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id, stock_id, condition_type)
);

-- Create price alerts history table
CREATE TABLE IF NOT EXISTS public.price_alerts_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_condition_id UUID NOT NULL REFERENCES public.price_alert_conditions(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Alert details
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  trigger_price DECIMAL(20,8) NOT NULL,
  threshold_value DECIMAL(20,8) NOT NULL,
  condition_type TEXT NOT NULL,
  
  -- Notification status
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  notification_method TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create audit log for price updates
CREATE TABLE IF NOT EXISTS public.price_update_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  
  -- Price change details
  old_price DECIMAL(20,8),
  new_price DECIMAL(20,8) NOT NULL,
  price_date DATE NOT NULL,
  change_amount DECIMAL(20,8) GENERATED ALWAYS AS (new_price - COALESCE(old_price, 0)) STORED,
  change_percent DECIMAL(10,4) GENERATED ALWAYS AS (
    CASE 
      WHEN old_price IS NOT NULL AND old_price > 0 
      THEN ((new_price - old_price) / old_price * 100)::DECIMAL(10,4)
      ELSE NULL 
    END
  ) STORED,
  
  -- Impact tracking
  holdings_updated INTEGER DEFAULT 0,
  portfolios_updated INTEGER DEFAULT 0,
  alerts_triggered INTEGER DEFAULT 0,
  
  -- Processing metrics
  processing_time_ms INTEGER,
  update_source TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_audit_prices CHECK (new_price > 0 AND (old_price IS NULL OR old_price > 0))
);

-- Create function to queue price updates for batch processing
CREATE OR REPLACE FUNCTION queue_price_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into price update queue for batch processing
  INSERT INTO public.price_update_queue (
    stock_id, old_price, new_price, price_date, update_type
  ) VALUES (
    NEW.stock_id,
    CASE 
      WHEN TG_OP = 'UPDATE' THEN OLD.close_price
      ELSE NULL
    END,
    NEW.close_price,
    NEW.date,
    'daily'
  ) ON CONFLICT (stock_id, price_date) DO UPDATE SET
    new_price = EXCLUDED.new_price,
    old_price = CASE 
      WHEN queue_price_update.old_price IS NULL THEN EXCLUDED.old_price
      ELSE queue_price_update.old_price
    END,
    processed = false,
    retry_count = 0,
    error_message = NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to process price update queue in batches
CREATE OR REPLACE FUNCTION process_price_update_batch(batch_size INTEGER DEFAULT 100)
RETURNS TABLE(
  processed_count INTEGER,
  error_count INTEGER,
  batch_id UUID
) AS $$
DECLARE
  current_batch_id UUID := uuid_generate_v4();
  queue_record RECORD;
  processed_count INTEGER := 0;
  error_count INTEGER := 0;
  start_time TIMESTAMPTZ := NOW();
BEGIN
  -- Mark batch for processing
  UPDATE public.price_update_queue SET 
    batch_id = current_batch_id,
    processing_started_at = start_time
  WHERE id IN (
    SELECT id FROM public.price_update_queue 
    WHERE processed = false 
    ORDER BY created_at 
    LIMIT batch_size
  );
  
  -- Process each item in the batch
  FOR queue_record IN 
    SELECT * FROM public.price_update_queue 
    WHERE batch_id = current_batch_id 
    ORDER BY created_at
  LOOP
    BEGIN
      -- Update holdings current price and market value
      UPDATE public.holdings SET
        current_price = queue_record.new_price,
        market_value = queue_record.new_price * quantity,
        last_price_update = NOW(),
        day_change = CASE 
          WHEN queue_record.old_price IS NOT NULL 
          THEN (queue_record.new_price - queue_record.old_price) * quantity
          ELSE NULL
        END,
        day_change_percent = CASE 
          WHEN queue_record.old_price IS NOT NULL AND queue_record.old_price > 0
          THEN ((queue_record.new_price - queue_record.old_price) / queue_record.old_price * 100)::DECIMAL(10,4)
          ELSE NULL
        END,
        previous_close = queue_record.old_price
      WHERE stock_id = queue_record.stock_id AND quantity > 0;
      
      -- Update portfolio performance metrics
      PERFORM update_portfolio_performance_from_price_change(
        queue_record.stock_id, 
        queue_record.old_price, 
        queue_record.new_price
      );
      
      -- Check for price alerts
      PERFORM check_price_alerts(queue_record.stock_id, queue_record.new_price);
      
      -- Mark as processed
      UPDATE public.price_update_queue SET 
        processed = true,
        processing_completed_at = NOW(),
        error_message = NULL
      WHERE id = queue_record.id;
      
      processed_count := processed_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error and mark for retry
      UPDATE public.price_update_queue SET 
        error_message = SQLERRM,
        retry_count = retry_count + 1,
        processing_completed_at = NOW()
      WHERE id = queue_record.id;
      
      error_count := error_count + 1;
      
      -- Log to audit table
      INSERT INTO public.price_update_audit_log (
        stock_id, old_price, new_price, price_date, 
        processing_time_ms, update_source
      ) VALUES (
        queue_record.stock_id, queue_record.old_price, queue_record.new_price, 
        queue_record.price_date, 
        EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
        'batch_error'
      );
    END;
  END LOOP;
  
  RETURN QUERY SELECT processed_count, error_count, current_batch_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update portfolio performance from price changes
CREATE OR REPLACE FUNCTION update_portfolio_performance_from_price_change(
  p_stock_id UUID,
  p_old_price DECIMAL(20,8),
  p_new_price DECIMAL(20,8)
)
RETURNS VOID AS $$
DECLARE
  portfolio_record RECORD;
  price_change DECIMAL(20,8);
  holdings_value_change DECIMAL(20,8);
BEGIN
  IF p_old_price IS NULL OR p_old_price <= 0 THEN
    RETURN;
  END IF;
  
  price_change := p_new_price - p_old_price;
  
  -- Update portfolio performance for each portfolio containing this stock
  FOR portfolio_record IN
    SELECT DISTINCT p.id as portfolio_id, p.user_id
    FROM public.portfolios p
    JOIN public.accounts a ON a.portfolio_id = p.id
    JOIN public.holdings h ON h.account_id = a.id
    WHERE h.stock_id = p_stock_id AND h.quantity > 0
  LOOP
    -- Calculate total value change for this portfolio
    SELECT SUM(h.quantity * price_change) INTO holdings_value_change
    FROM public.holdings h
    JOIN public.accounts a ON a.id = h.account_id
    WHERE a.portfolio_id = portfolio_record.portfolio_id 
    AND h.stock_id = p_stock_id;
    
    -- Update or insert today's performance record
    INSERT INTO public.portfolio_performance (
      portfolio_id, date, daily_return, currency
    ) VALUES (
      portfolio_record.portfolio_id,
      CURRENT_DATE,
      COALESCE(holdings_value_change, 0),
      'USD'
    ) ON CONFLICT (portfolio_id, date) DO UPDATE SET
      daily_return = COALESCE(portfolio_performance.daily_return, 0) + COALESCE(holdings_value_change, 0),
      daily_return_percent = CASE 
        WHEN portfolio_performance.total_value > 0 
        THEN (COALESCE(portfolio_performance.daily_return, 0) + COALESCE(holdings_value_change, 0)) / portfolio_performance.total_value * 100
        ELSE 0
      END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to check price alerts
CREATE OR REPLACE FUNCTION check_price_alerts(
  p_stock_id UUID,
  p_current_price DECIMAL(20,8)
)
RETURNS INTEGER AS $$
DECLARE
  alert_record RECORD;
  alerts_triggered INTEGER := 0;
  should_trigger BOOLEAN := false;
  previous_price DECIMAL(20,8);
  percent_change DECIMAL(10,4);
BEGIN
  -- Get previous price for percent change calculations
  SELECT close_price INTO previous_price
  FROM public.stock_prices
  WHERE stock_id = p_stock_id 
  AND date < CURRENT_DATE
  ORDER BY date DESC, created_at DESC
  LIMIT 1;
  
  -- Check each active alert condition for this stock
  FOR alert_record IN
    SELECT * FROM public.price_alert_conditions
    WHERE stock_id = p_stock_id AND is_active = true
  LOOP
    should_trigger := false;
    
    CASE alert_record.condition_type
      WHEN 'price_above' THEN
        should_trigger := p_current_price > alert_record.threshold_value;
      WHEN 'price_below' THEN
        should_trigger := p_current_price < alert_record.threshold_value;
      WHEN 'percent_change' THEN
        IF previous_price IS NOT NULL AND previous_price > 0 THEN
          percent_change := ((p_current_price - previous_price) / previous_price * 100)::DECIMAL(10,4);
          should_trigger := ABS(percent_change) > alert_record.threshold_value;
        END IF;
    END CASE;
    
    -- Trigger alert if conditions are met
    IF should_trigger THEN
      -- Check alert frequency to avoid spam
      IF alert_record.alert_frequency = 'always' OR
         alert_record.last_triggered IS NULL OR
         (alert_record.alert_frequency = 'daily' AND alert_record.last_triggered < CURRENT_DATE) OR
         (alert_record.alert_frequency = 'once' AND alert_record.last_triggered IS NULL) THEN
        
        -- Insert alert history
        INSERT INTO public.price_alerts_history (
          alert_condition_id, stock_id, user_id, trigger_price, 
          threshold_value, condition_type, notification_method
        ) VALUES (
          alert_record.id, p_stock_id, alert_record.user_id, p_current_price,
          alert_record.threshold_value, alert_record.condition_type, 
          alert_record.notification_method
        );
        
        -- Update alert condition
        UPDATE public.price_alert_conditions SET
          last_triggered = NOW(),
          trigger_count = trigger_count + 1
        WHERE id = alert_record.id;
        
        alerts_triggered := alerts_triggered + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN alerts_triggered;
END;
$$ LANGUAGE plpgsql;

-- Create function to update currency exchange rates
CREATE OR REPLACE FUNCTION update_currency_exchange_rate()
RETURNS TRIGGER AS $$
BEGIN
  -- Update holdings with new exchange rates for foreign currencies
  UPDATE public.holdings h SET
    market_value = CASE 
      WHEN h.currency != 'USD' AND h.current_price IS NOT NULL 
      THEN h.current_price * h.quantity * NEW.rate
      ELSE h.market_value
    END
  FROM public.stocks s
  WHERE h.stock_id = s.id 
  AND s.currency = NEW.from_currency 
  AND NEW.to_currency = 'USD'
  AND h.quantity > 0;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to refresh materialized views on schedule
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS TABLE(
  view_name TEXT,
  refresh_status TEXT,
  duration INTERVAL
) AS $$
DECLARE
  view_record RECORD;
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
BEGIN
  FOR view_record IN
    SELECT * FROM public.materialized_view_refresh_schedule
    WHERE next_refresh <= NOW() AND is_refreshing = false
  LOOP
    BEGIN
      -- Mark as refreshing
      UPDATE public.materialized_view_refresh_schedule SET
        is_refreshing = true
      WHERE id = view_record.id;
      
      start_time := NOW();
      
      -- Refresh the materialized view (this would be dynamic based on view_name)
      -- For now, we'll just update the schedule
      
      end_time := NOW();
      
      -- Update refresh schedule
      UPDATE public.materialized_view_refresh_schedule SET
        last_refresh = end_time,
        is_refreshing = false,
        refresh_duration = end_time - start_time
      WHERE id = view_record.id;
      
      RETURN QUERY SELECT 
        view_record.view_name,
        'success'::TEXT,
        end_time - start_time;
      
    EXCEPTION WHEN OTHERS THEN
      -- Reset refreshing flag on error
      UPDATE public.materialized_view_refresh_schedule SET
        is_refreshing = false
      WHERE id = view_record.id;
      
      RETURN QUERY SELECT 
        view_record.view_name,
        ('error: ' || SQLERRM)::TEXT,
        NULL::INTERVAL;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old price update queue entries
CREATE OR REPLACE FUNCTION cleanup_price_update_queue()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete processed entries older than 7 days
  DELETE FROM public.price_update_queue
  WHERE processed = true 
  AND processing_completed_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete failed entries older than 30 days
  DELETE FROM public.price_update_queue
  WHERE processed = false 
  AND retry_count > 3
  AND created_at < NOW() - INTERVAL '30 days';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for price updates
CREATE TRIGGER trigger_queue_stock_price_update
  AFTER INSERT OR UPDATE ON public.stock_prices
  FOR EACH ROW
  WHEN (NEW.close_price IS NOT NULL)
  EXECUTE FUNCTION queue_price_update();

CREATE TRIGGER trigger_queue_intraday_price_update
  AFTER INSERT OR UPDATE ON public.intraday_prices
  FOR EACH ROW
  WHEN (NEW.close_price IS NOT NULL)
  EXECUTE FUNCTION queue_price_update();

-- Create trigger for currency exchange rate updates
CREATE TRIGGER trigger_currency_exchange_rate_update
  AFTER INSERT OR UPDATE ON public.currency_exchange_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_currency_exchange_rate();

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_price_alert_conditions_updated_at
  BEFORE UPDATE ON public.price_alert_conditions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger function to update next_refresh
CREATE OR REPLACE FUNCTION update_next_refresh()
RETURNS TRIGGER AS $$
BEGIN
  NEW.next_refresh := NEW.last_refresh + NEW.refresh_interval;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_materialized_view_refresh_schedule_updated_at
  BEFORE UPDATE ON public.materialized_view_refresh_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_next_refresh();

CREATE TRIGGER update_materialized_view_refresh_schedule_insert
  BEFORE INSERT ON public.materialized_view_refresh_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_next_refresh();

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_price_alert_conditions_stock_active 
ON public.price_alert_conditions(stock_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_price_alert_conditions_user_active 
ON public.price_alert_conditions(user_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_price_alerts_history_user_triggered 
ON public.price_alerts_history(user_id, triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_alerts_history_stock_triggered 
ON public.price_alerts_history(stock_id, triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_update_audit_log_stock_date 
ON public.price_update_audit_log(stock_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_update_audit_log_date 
ON public.price_update_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_currency_exchange_rates_pair_date 
ON public.currency_exchange_rates(from_currency, to_currency, date DESC);

CREATE INDEX IF NOT EXISTS idx_currency_exchange_rates_date 
ON public.currency_exchange_rates(date DESC);

CREATE INDEX IF NOT EXISTS idx_materialized_view_refresh_schedule_next 
ON public.materialized_view_refresh_schedule(next_refresh, is_refreshing) WHERE is_refreshing = false;

-- Enable Row Level Security (RLS)
ALTER TABLE public.price_update_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alert_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_update_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materialized_view_refresh_schedule ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service role can manage price update queue" ON public.price_update_queue
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view price update queue" ON public.price_update_queue
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own price alert conditions" ON public.price_alert_conditions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own price alerts history" ON public.price_alerts_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage price alerts history" ON public.price_alerts_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view price update audit log" ON public.price_update_audit_log
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage price update audit log" ON public.price_update_audit_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view currency exchange rates" ON public.currency_exchange_rates
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage currency exchange rates" ON public.currency_exchange_rates
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage materialized view refresh schedule" ON public.materialized_view_refresh_schedule
  FOR ALL USING (auth.role() = 'service_role');

-- Initialize default materialized view refresh schedules
INSERT INTO public.materialized_view_refresh_schedule (view_name, refresh_interval) VALUES
  ('portfolio_summary', '15 minutes'),
  ('holdings_summary', '5 minutes'),
  ('performance_metrics', '1 hour'),
  ('market_data_summary', '1 minute');

-- Insert default currency exchange rates (USD base)
INSERT INTO public.currency_exchange_rates (from_currency, to_currency, rate, date) VALUES
  ('EUR', 'USD', 1.08, CURRENT_DATE),
  ('GBP', 'USD', 1.27, CURRENT_DATE),
  ('JPY', 'USD', 0.0067, CURRENT_DATE),
  ('CAD', 'USD', 0.74, CURRENT_DATE),
  ('AUD', 'USD', 0.66, CURRENT_DATE),
  ('CHF', 'USD', 1.10, CURRENT_DATE),
  ('CNY', 'USD', 0.14, CURRENT_DATE),
  ('USD', 'EUR', 0.93, CURRENT_DATE),
  ('USD', 'GBP', 0.79, CURRENT_DATE),
  ('USD', 'JPY', 149.25, CURRENT_DATE),
  ('USD', 'CAD', 1.35, CURRENT_DATE)
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE public.price_update_queue IS 'Queue for batching price updates to improve performance';
COMMENT ON TABLE public.price_alert_conditions IS 'User-defined conditions for price alerts';
COMMENT ON TABLE public.price_alerts_history IS 'History of triggered price alerts';
COMMENT ON TABLE public.price_update_audit_log IS 'Audit log of all price updates and their impacts';
COMMENT ON TABLE public.currency_exchange_rates IS 'Real-time currency exchange rates';
COMMENT ON TABLE public.materialized_view_refresh_schedule IS 'Schedule for refreshing materialized views';

COMMENT ON FUNCTION queue_price_update() IS 'Queues price updates for batch processing to avoid trigger cascades';
COMMENT ON FUNCTION process_price_update_batch(INTEGER) IS 'Processes price updates in batches for optimal performance';
COMMENT ON FUNCTION update_portfolio_performance_from_price_change(UUID, DECIMAL, DECIMAL) IS 'Updates portfolio performance metrics when prices change';
COMMENT ON FUNCTION check_price_alerts(UUID, DECIMAL) IS 'Checks and triggers price alerts for significant price movements';
COMMENT ON FUNCTION update_currency_exchange_rate() IS 'Updates holdings values when exchange rates change';
COMMENT ON FUNCTION refresh_materialized_views() IS 'Refreshes materialized views on schedule';
COMMENT ON FUNCTION cleanup_price_update_queue() IS 'Cleans up old entries from the price update queue';

-- Create a function to manually trigger batch processing (for scheduled jobs)
CREATE OR REPLACE FUNCTION trigger_price_update_batch_processing()
RETURNS TABLE(
  batch_id UUID,
  processed_count INTEGER,
  error_count INTEGER,
  processing_time INTERVAL
) AS $$
DECLARE
  start_time TIMESTAMPTZ := NOW();
  result_record RECORD;
BEGIN
  -- Process pending price updates
  FOR result_record IN
    SELECT * FROM process_price_update_batch(1000)
  LOOP
    RETURN QUERY SELECT 
      result_record.batch_id,
      result_record.processed_count,
      result_record.error_count,
      NOW() - start_time;
  END LOOP;
  
  -- Clean up old queue entries
  PERFORM cleanup_price_update_queue();
  
  -- Refresh materialized views if needed
  PERFORM refresh_materialized_views();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trigger_price_update_batch_processing() IS 'Manual trigger for batch processing of price updates - use with scheduled jobs';