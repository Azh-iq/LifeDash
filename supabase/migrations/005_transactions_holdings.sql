-- Transactions and Holdings Schema for LifeDash
-- Manages trading transactions and current position holdings

-- Create transactions table for all trading activity
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  stock_id UUID REFERENCES public.stocks(id) ON DELETE RESTRICT,
  
  -- Transaction identification
  external_id TEXT, -- ID from broker/platform
  order_id TEXT, -- Associated order ID
  
  -- Transaction details
  transaction_type transaction_type NOT NULL,
  date DATE NOT NULL,
  time TIME,
  settlement_date DATE,
  
  -- Quantity and pricing
  quantity DECIMAL(20,8) NOT NULL DEFAULT 0,
  price DECIMAL(20,8),
  total_amount DECIMAL(20,8) NOT NULL,
  
  -- Fees and costs
  commission DECIMAL(20,8) DEFAULT 0,
  sec_fees DECIMAL(20,8) DEFAULT 0,
  other_fees DECIMAL(20,8) DEFAULT 0,
  total_fees DECIMAL(20,8) GENERATED ALWAYS AS (commission + sec_fees + other_fees) STORED,
  
  -- Currency and exchange
  currency currency_code NOT NULL,
  exchange_rate DECIMAL(20,8) DEFAULT 1.0, -- Rate to user's base currency
  
  -- Tax implications
  wash_sale BOOLEAN DEFAULT false,
  tax_lot_method TEXT DEFAULT 'fifo' CHECK (tax_lot_method IN ('fifo', 'lifo', 'average', 'specific')),
  
  -- Transaction context
  description TEXT,
  notes TEXT,
  tags TEXT[],
  
  -- Corporate actions
  related_transaction_id UUID REFERENCES public.transactions(id),
  corporate_action_type TEXT, -- 'split', 'merger', 'spinoff', etc.
  
  -- Data source and verification
  data_source data_source DEFAULT 'MANUAL',
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMPTZ,
  
  -- Import tracking
  import_batch_id UUID,
  import_source TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_quantity CHECK (
    (transaction_type IN ('BUY', 'SELL', 'DIVIDEND', 'INTEREST', 'FEE', 'TAX') AND quantity != 0) OR
    (transaction_type IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT') AND stock_id IS NULL)
  ),
  CONSTRAINT valid_price CHECK (price IS NULL OR price > 0),
  CONSTRAINT valid_fees CHECK (commission >= 0 AND sec_fees >= 0 AND other_fees >= 0),
  CONSTRAINT valid_exchange_rate CHECK (exchange_rate > 0),
  CONSTRAINT valid_corporate_action CHECK (
    (corporate_action_type IS NULL AND related_transaction_id IS NULL) OR
    (corporate_action_type IS NOT NULL AND related_transaction_id IS NOT NULL)
  ),
  CONSTRAINT valid_stock_transaction CHECK (
    (transaction_type IN ('BUY', 'SELL', 'DIVIDEND', 'SPLIT', 'MERGER', 'SPINOFF') AND stock_id IS NOT NULL) OR
    (transaction_type NOT IN ('BUY', 'SELL', 'DIVIDEND', 'SPLIT', 'MERGER', 'SPINOFF'))
  )
);

-- Create holdings table for current positions
CREATE TABLE IF NOT EXISTS public.holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE RESTRICT,
  
  -- Current position
  quantity DECIMAL(20,8) NOT NULL DEFAULT 0,
  average_cost DECIMAL(20,8) NOT NULL DEFAULT 0,
  total_cost DECIMAL(20,8) NOT NULL DEFAULT 0,
  
  -- Current market value
  current_price DECIMAL(20,8),
  market_value DECIMAL(20,8),
  last_price_update TIMESTAMPTZ,
  
  -- Performance metrics
  unrealized_pnl DECIMAL(20,8) GENERATED ALWAYS AS (
    CASE 
      WHEN current_price IS NOT NULL AND quantity != 0 
      THEN (current_price * quantity) - total_cost
      ELSE 0 
    END
  ) STORED,
  unrealized_pnl_percent DECIMAL(10,4) GENERATED ALWAYS AS (
    CASE 
      WHEN total_cost > 0 AND current_price IS NOT NULL
      THEN ((current_price * quantity) - total_cost) / total_cost * 100
      ELSE 0 
    END
  ) STORED,
  
  -- Day change tracking
  day_change DECIMAL(20,8),
  day_change_percent DECIMAL(10,4),
  previous_close DECIMAL(20,8),
  
  -- Historical tracking
  first_purchase_date DATE,
  last_transaction_date DATE,
  holding_period_days INTEGER DEFAULT 0,
  
  -- Tax lot information
  tax_lots JSONB, -- Array of tax lots with cost basis
  wash_sale_loss_deferred DECIMAL(20,8) DEFAULT 0,
  
  -- Asset allocation
  allocation_percent DECIMAL(8,4), -- Percentage of portfolio
  asset_class_allocation DECIMAL(8,4), -- Percentage within asset class
  
  -- Currency
  currency currency_code NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_quantity_holding CHECK (quantity >= 0),
  CONSTRAINT valid_costs CHECK (average_cost >= 0 AND total_cost >= 0),
  CONSTRAINT valid_current_price CHECK (current_price IS NULL OR current_price >= 0),
  CONSTRAINT valid_allocations CHECK (
    allocation_percent IS NULL OR (allocation_percent >= 0 AND allocation_percent <= 100)
  ),
  CONSTRAINT valid_tax_lots CHECK (tax_lots IS NULL OR jsonb_typeof(tax_lots) = 'array'),
  
  UNIQUE(user_id, account_id, stock_id)
);

-- Create tax_lots table for detailed cost basis tracking
CREATE TABLE IF NOT EXISTS public.tax_lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  holding_id UUID NOT NULL REFERENCES public.holdings(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  
  -- Lot details
  acquisition_date DATE NOT NULL,
  quantity DECIMAL(20,8) NOT NULL,
  cost_per_share DECIMAL(20,8) NOT NULL,
  total_cost DECIMAL(20,8) NOT NULL,
  
  -- Remaining quantity (after partial sales)
  remaining_quantity DECIMAL(20,8) NOT NULL,
  remaining_cost DECIMAL(20,8) NOT NULL,
  
  -- Tax information
  is_short_term BOOLEAN DEFAULT false,
  wash_sale_adjustment DECIMAL(20,8) DEFAULT 0,
  
  -- Status
  is_open BOOLEAN DEFAULT true,
  closed_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_lot_quantity CHECK (quantity > 0 AND remaining_quantity >= 0 AND remaining_quantity <= quantity),
  CONSTRAINT valid_lot_costs CHECK (cost_per_share > 0 AND total_cost > 0 AND remaining_cost >= 0),
  CONSTRAINT valid_lot_status CHECK (
    (is_open = true AND closed_date IS NULL AND remaining_quantity > 0) OR
    (is_open = false AND closed_date IS NOT NULL AND remaining_quantity = 0)
  )
);

-- Create dividend_payments table for tracking received dividends
CREATE TABLE IF NOT EXISTS public.dividend_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE RESTRICT,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  
  -- Dividend details
  ex_date DATE NOT NULL,
  record_date DATE,
  payment_date DATE NOT NULL,
  amount_per_share DECIMAL(20,8) NOT NULL,
  shares_held DECIMAL(20,8) NOT NULL,
  total_amount DECIMAL(20,8) NOT NULL,
  
  -- Tax information
  qualified_dividend BOOLEAN DEFAULT true,
  tax_withheld DECIMAL(20,8) DEFAULT 0,
  foreign_tax_paid DECIMAL(20,8) DEFAULT 0,
  
  -- Currency
  currency currency_code NOT NULL,
  exchange_rate DECIMAL(20,8) DEFAULT 1.0,
  
  -- Reinvestment
  is_reinvested BOOLEAN DEFAULT false,
  reinvestment_transaction_id UUID REFERENCES public.transactions(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_dividend_amount CHECK (amount_per_share > 0 AND total_amount > 0),
  CONSTRAINT valid_dividend_shares CHECK (shares_held > 0),
  CONSTRAINT valid_dividend_taxes CHECK (tax_withheld >= 0 AND foreign_tax_paid >= 0),
  CONSTRAINT valid_exchange_rate_div CHECK (exchange_rate > 0),
  
  UNIQUE(user_id, account_id, stock_id, ex_date)
);

-- Create realized_gains table for tracking closed positions
CREATE TABLE IF NOT EXISTS public.realized_gains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE RESTRICT,
  
  -- Sale transaction details
  sell_transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  sell_date DATE NOT NULL,
  quantity_sold DECIMAL(20,8) NOT NULL,
  sell_price DECIMAL(20,8) NOT NULL,
  gross_proceeds DECIMAL(20,8) NOT NULL,
  
  -- Cost basis details
  cost_basis DECIMAL(20,8) NOT NULL,
  average_acquisition_date DATE,
  
  -- Gain/loss calculation
  realized_gain DECIMAL(20,8) GENERATED ALWAYS AS (gross_proceeds - cost_basis) STORED,
  realized_gain_percent DECIMAL(10,4) GENERATED ALWAYS AS (
    CASE 
      WHEN cost_basis > 0 
      THEN (gross_proceeds - cost_basis) / cost_basis * 100
      ELSE 0 
    END
  ) STORED,
  
  -- Tax classification
  is_short_term BOOLEAN NOT NULL,
  holding_period_days INTEGER,
  
  -- Wash sale information
  is_wash_sale BOOLEAN DEFAULT false,
  wash_sale_loss_deferred DECIMAL(20,8) DEFAULT 0,
  disallowed_loss DECIMAL(20,8) DEFAULT 0,
  
  -- Currency
  currency currency_code NOT NULL,
  
  -- Associated tax lots
  tax_lot_details JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_sale_details CHECK (quantity_sold > 0 AND sell_price > 0 AND gross_proceeds > 0),
  CONSTRAINT valid_cost_basis_rg CHECK (cost_basis >= 0),
  CONSTRAINT valid_wash_sale_amounts CHECK (
    wash_sale_loss_deferred >= 0 AND disallowed_loss >= 0
  ),
  CONSTRAINT valid_tax_lot_details CHECK (tax_lot_details IS NULL OR jsonb_typeof(tax_lot_details) = 'array')
);

-- Create portfolio_performance table for tracking portfolio-level metrics
CREATE TABLE IF NOT EXISTS public.portfolio_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Portfolio value metrics
  total_value DECIMAL(20,8) NOT NULL,
  total_cost DECIMAL(20,8) NOT NULL,
  cash_balance DECIMAL(20,8) DEFAULT 0,
  
  -- Performance metrics
  daily_return DECIMAL(20,8),
  daily_return_percent DECIMAL(10,4),
  cumulative_return DECIMAL(20,8),
  cumulative_return_percent DECIMAL(10,4),
  
  -- Risk metrics
  volatility_30d DECIMAL(10,4),
  beta DECIMAL(10,6),
  sharpe_ratio DECIMAL(10,6),
  max_drawdown DECIMAL(10,4),
  
  -- Dividend tracking
  dividends_received DECIMAL(20,8) DEFAULT 0,
  dividend_yield DECIMAL(8,4),
  
  -- Allocation metrics
  equity_allocation DECIMAL(8,4),
  bond_allocation DECIMAL(8,4),
  cash_allocation DECIMAL(8,4),
  alternative_allocation DECIMAL(8,4),
  
  -- Benchmarking
  benchmark_return DECIMAL(10,4),
  alpha DECIMAL(10,6),
  
  currency currency_code NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_performance_values CHECK (total_value >= 0 AND total_cost >= 0 AND cash_balance >= 0),
  CONSTRAINT valid_allocations_perf CHECK (
    equity_allocation IS NULL OR (equity_allocation >= 0 AND equity_allocation <= 100) AND
    bond_allocation IS NULL OR (bond_allocation >= 0 AND bond_allocation <= 100) AND
    cash_allocation IS NULL OR (cash_allocation >= 0 AND cash_allocation <= 100) AND
    alternative_allocation IS NULL OR (alternative_allocation >= 0 AND alternative_allocation <= 100)
  ),
  
  UNIQUE(portfolio_id, date)
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stock_id ON public.transactions(stock_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON public.transactions(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_import_batch ON public.transactions(import_batch_id) WHERE import_batch_id IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_account_date ON public.transactions(user_id, account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_stock_date ON public.transactions(user_id, stock_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account_stock_date ON public.transactions(account_id, stock_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_verification ON public.transactions(is_verified, verification_date);

-- Holdings indexes
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON public.holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_account_id ON public.holdings(account_id);
CREATE INDEX IF NOT EXISTS idx_holdings_stock_id ON public.holdings(stock_id);
CREATE INDEX IF NOT EXISTS idx_holdings_active ON public.holdings(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_holdings_quantity ON public.holdings(user_id, quantity) WHERE quantity > 0;
CREATE INDEX IF NOT EXISTS idx_holdings_value ON public.holdings(user_id, market_value DESC) WHERE market_value IS NOT NULL;

-- Tax lots indexes
CREATE INDEX IF NOT EXISTS idx_tax_lots_holding_id ON public.tax_lots(holding_id);
CREATE INDEX IF NOT EXISTS idx_tax_lots_transaction_id ON public.tax_lots(transaction_id);
CREATE INDEX IF NOT EXISTS idx_tax_lots_acquisition_date ON public.tax_lots(acquisition_date);
CREATE INDEX IF NOT EXISTS idx_tax_lots_open ON public.tax_lots(holding_id, is_open) WHERE is_open = true;
CREATE INDEX IF NOT EXISTS idx_tax_lots_short_term ON public.tax_lots(is_short_term);

-- Dividend payments indexes
CREATE INDEX IF NOT EXISTS idx_dividend_payments_user_id ON public.dividend_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_dividend_payments_account_id ON public.dividend_payments(account_id);
CREATE INDEX IF NOT EXISTS idx_dividend_payments_stock_id ON public.dividend_payments(stock_id);
CREATE INDEX IF NOT EXISTS idx_dividend_payments_payment_date ON public.dividend_payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_dividend_payments_ex_date ON public.dividend_payments(ex_date DESC);

-- Realized gains indexes
CREATE INDEX IF NOT EXISTS idx_realized_gains_user_id ON public.realized_gains(user_id);
CREATE INDEX IF NOT EXISTS idx_realized_gains_account_id ON public.realized_gains(account_id);
CREATE INDEX IF NOT EXISTS idx_realized_gains_stock_id ON public.realized_gains(stock_id);
CREATE INDEX IF NOT EXISTS idx_realized_gains_sell_date ON public.realized_gains(sell_date DESC);
CREATE INDEX IF NOT EXISTS idx_realized_gains_short_term ON public.realized_gains(is_short_term);
CREATE INDEX IF NOT EXISTS idx_realized_gains_wash_sale ON public.realized_gains(is_wash_sale) WHERE is_wash_sale = true;

-- Portfolio performance indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_performance_portfolio ON public.portfolio_performance(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_performance_date ON public.portfolio_performance(date DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_performance_portfolio_date ON public.portfolio_performance(portfolio_id, date DESC);

-- GIN indexes for JSONB and array columns
CREATE INDEX IF NOT EXISTS idx_transactions_tags_gin ON public.transactions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_holdings_tax_lots_gin ON public.holdings USING GIN(tax_lots);
CREATE INDEX IF NOT EXISTS idx_realized_gains_tax_lot_details_gin ON public.realized_gains USING GIN(tax_lot_details);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holdings_updated_at
  BEFORE UPDATE ON public.holdings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_lots_updated_at
  BEFORE UPDATE ON public.tax_lots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update holdings from transactions
CREATE OR REPLACE FUNCTION update_holdings_from_transaction()
RETURNS TRIGGER AS $$
DECLARE
  current_holding_id UUID;
  current_quantity DECIMAL(20,8);
  current_total_cost DECIMAL(20,8);
  new_quantity DECIMAL(20,8);
  new_total_cost DECIMAL(20,8);
  new_average_cost DECIMAL(20,8);
BEGIN
  -- Only process BUY and SELL transactions for stocks
  IF NEW.transaction_type NOT IN ('BUY', 'SELL') OR NEW.stock_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get or create holding record
  SELECT id, quantity, total_cost 
  INTO current_holding_id, current_quantity, current_total_cost
  FROM public.holdings 
  WHERE user_id = NEW.user_id AND account_id = NEW.account_id AND stock_id = NEW.stock_id;
  
  IF current_holding_id IS NULL THEN
    -- Create new holding
    INSERT INTO public.holdings (user_id, account_id, stock_id, currency)
    VALUES (NEW.user_id, NEW.account_id, NEW.stock_id, NEW.currency)
    RETURNING id INTO current_holding_id;
    current_quantity := 0;
    current_total_cost := 0;
  END IF;
  
  -- Calculate new values based on transaction type
  IF NEW.transaction_type = 'BUY' THEN
    new_quantity := current_quantity + NEW.quantity;
    new_total_cost := current_total_cost + NEW.total_amount;
  ELSIF NEW.transaction_type = 'SELL' THEN
    new_quantity := current_quantity - NEW.quantity;
    -- For sells, reduce total cost proportionally
    IF current_quantity > 0 THEN
      new_total_cost := current_total_cost * (new_quantity / current_quantity);
    ELSE
      new_total_cost := 0;
    END IF;
  END IF;
  
  -- Calculate new average cost
  IF new_quantity > 0 THEN
    new_average_cost := new_total_cost / new_quantity;
  ELSE
    new_average_cost := 0;
  END IF;
  
  -- Update holding
  UPDATE public.holdings SET
    quantity = new_quantity,
    total_cost = new_total_cost,
    average_cost = new_average_cost,
    last_transaction_date = NEW.date,
    first_purchase_date = CASE 
      WHEN first_purchase_date IS NULL AND NEW.transaction_type = 'BUY' 
      THEN NEW.date 
      ELSE first_purchase_date 
    END,
    is_active = CASE WHEN new_quantity > 0 THEN true ELSE false END
  WHERE id = current_holding_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for holdings updates
CREATE TRIGGER update_holdings_from_transaction_trigger
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_holdings_from_transaction();

-- Create function to calculate realized gains on sells
CREATE OR REPLACE FUNCTION calculate_realized_gains()
RETURNS TRIGGER AS $$
DECLARE
  lot_record RECORD;
  remaining_quantity DECIMAL(20,8);
  quantity_to_sell DECIMAL(20,8);
  cost_basis DECIMAL(20,8) := 0;
  total_holding_period_days INTEGER := 0;
  is_short_term_sale BOOLEAN;
BEGIN
  -- Only process SELL transactions
  IF NEW.transaction_type != 'SELL' OR NEW.stock_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  remaining_quantity := NEW.quantity;
  
  -- Process tax lots in FIFO order (oldest first)
  FOR lot_record IN 
    SELECT * FROM public.tax_lots 
    WHERE holding_id IN (
      SELECT id FROM public.holdings 
      WHERE user_id = NEW.user_id AND account_id = NEW.account_id AND stock_id = NEW.stock_id
    )
    AND is_open = true 
    ORDER BY acquisition_date ASC
  LOOP
    EXIT WHEN remaining_quantity <= 0;
    
    quantity_to_sell := LEAST(remaining_quantity, lot_record.remaining_quantity);
    cost_basis := cost_basis + (quantity_to_sell * lot_record.cost_per_share);
    total_holding_period_days := total_holding_period_days + 
      (quantity_to_sell * (NEW.date - lot_record.acquisition_date));
    
    -- Update tax lot
    UPDATE public.tax_lots SET
      remaining_quantity = remaining_quantity - quantity_to_sell,
      remaining_cost = remaining_cost - (quantity_to_sell * cost_per_share),
      is_open = CASE WHEN remaining_quantity - quantity_to_sell <= 0 THEN false ELSE true END,
      closed_date = CASE WHEN remaining_quantity - quantity_to_sell <= 0 THEN NEW.date ELSE NULL END
    WHERE id = lot_record.id;
    
    remaining_quantity := remaining_quantity - quantity_to_sell;
  END LOOP;
  
  -- Determine if short-term (less than 1 year average holding period)
  is_short_term_sale := (total_holding_period_days / NEW.quantity) < 365;
  
  -- Create realized gain record
  INSERT INTO public.realized_gains (
    user_id, account_id, stock_id, sell_transaction_id, sell_date,
    quantity_sold, sell_price, gross_proceeds, cost_basis,
    is_short_term, holding_period_days, currency
  ) VALUES (
    NEW.user_id, NEW.account_id, NEW.stock_id, NEW.id, NEW.date,
    NEW.quantity, NEW.price, NEW.total_amount, cost_basis,
    is_short_term_sale, (total_holding_period_days / NEW.quantity)::INTEGER, NEW.currency
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for realized gains calculation
CREATE TRIGGER calculate_realized_gains_trigger
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_realized_gains();

-- Enable Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dividend_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realized_gains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_performance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for holdings
CREATE POLICY "Users can view own holdings" ON public.holdings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own holdings" ON public.holdings
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for tax_lots
CREATE POLICY "Users can view own tax lots" ON public.tax_lots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.holdings h
      WHERE h.id = holding_id AND h.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own tax lots" ON public.tax_lots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.holdings h
      WHERE h.id = holding_id AND h.user_id = auth.uid()
    )
  );

-- Create RLS policies for dividend_payments
CREATE POLICY "Users can view own dividend payments" ON public.dividend_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own dividend payments" ON public.dividend_payments
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for realized_gains
CREATE POLICY "Users can view own realized gains" ON public.realized_gains
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own realized gains" ON public.realized_gains
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for portfolio_performance
CREATE POLICY "Users can view portfolio performance" ON public.portfolio_performance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.portfolios p
      WHERE p.id = portfolio_id AND (p.user_id = auth.uid() OR p.is_public = true)
    )
  );

CREATE POLICY "Users can manage own portfolio performance" ON public.portfolio_performance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.portfolios p
      WHERE p.id = portfolio_id AND p.user_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.transactions IS 'All trading transactions and corporate actions';
COMMENT ON TABLE public.holdings IS 'Current investment positions and holdings';
COMMENT ON TABLE public.tax_lots IS 'Detailed cost basis tracking for tax purposes';
COMMENT ON TABLE public.dividend_payments IS 'Dividend payments received from holdings';
COMMENT ON TABLE public.realized_gains IS 'Realized gains and losses from closed positions';
COMMENT ON TABLE public.portfolio_performance IS 'Historical portfolio performance metrics';

COMMENT ON COLUMN public.transactions.wash_sale IS 'Whether this transaction is subject to wash sale rules';
COMMENT ON COLUMN public.holdings.tax_lots IS 'JSON array of tax lots for this holding';
COMMENT ON COLUMN public.tax_lots.is_short_term IS 'Computed field indicating if holding period is less than 1 year';
COMMENT ON COLUMN public.realized_gains.tax_lot_details IS 'JSON details of which tax lots were used for this sale';

COMMENT ON FUNCTION update_holdings_from_transaction() IS 'Automatically updates holdings when transactions are created';
COMMENT ON FUNCTION calculate_realized_gains() IS 'Calculates realized gains/losses when positions are sold';