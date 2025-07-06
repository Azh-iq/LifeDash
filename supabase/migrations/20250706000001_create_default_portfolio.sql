-- Create default portfolio and account for existing users
-- This ensures the stocks page can find a "default" portfolio

-- Function to create default portfolio for a user
CREATE OR REPLACE FUNCTION create_default_portfolio_for_user(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  portfolio_uuid UUID;
  account_uuid UUID;
  platform_uuid UUID;
BEGIN
  -- Get or create demo platform
  SELECT id INTO platform_uuid FROM public.platforms WHERE name = 'demo' LIMIT 1;
  
  IF platform_uuid IS NULL THEN
    INSERT INTO public.platforms (name, display_name, type, default_currency, country_code)
    VALUES ('demo', 'Demo Platform', 'BROKER', 'NOK', 'NO')
    RETURNING id INTO platform_uuid;
  END IF;

  -- Check if user already has a default portfolio
  SELECT id INTO portfolio_uuid 
  FROM public.portfolios 
  WHERE user_id = user_uuid AND (name = 'Default Portfolio' OR id::text = 'default')
  LIMIT 1;

  -- Create default portfolio if it doesn't exist
  IF portfolio_uuid IS NULL THEN
    INSERT INTO public.portfolios (
      id,
      user_id, 
      name, 
      description, 
      currency, 
      is_default,
      inception_date
    ) VALUES (
      'default'::uuid,
      user_uuid,
      'Default Portfolio',
      'Your main investment portfolio',
      'NOK',
      true,
      CURRENT_DATE
    ) 
    ON CONFLICT (id) DO UPDATE SET 
      user_id = user_uuid,
      name = 'Default Portfolio',
      is_default = true
    RETURNING id INTO portfolio_uuid;
  END IF;

  -- Create default account if it doesn't exist
  SELECT id INTO account_uuid 
  FROM public.accounts 
  WHERE user_id = user_uuid AND portfolio_id = portfolio_uuid
  LIMIT 1;

  IF account_uuid IS NULL THEN
    INSERT INTO public.accounts (
      user_id,
      portfolio_id,
      platform_id,
      name,
      account_type,
      currency,
      is_active
    ) VALUES (
      user_uuid,
      portfolio_uuid,
      platform_uuid,
      'Default Account',
      'BROKERAGE',
      'NOK',
      true
    ) RETURNING id INTO account_uuid;
  END IF;

  RETURN portfolio_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to be called when new users are created
CREATE OR REPLACE FUNCTION handle_new_user_portfolio()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default portfolio for new user
  PERFORM create_default_portfolio_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users (if user_profiles table exists)
DROP TRIGGER IF EXISTS on_auth_user_created_portfolio ON public.user_profiles;
CREATE TRIGGER on_auth_user_created_portfolio
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_portfolio();

-- Add some sample holdings to the default portfolio if needed
CREATE OR REPLACE FUNCTION add_sample_holdings_to_default()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  portfolio_uuid UUID;
  account_uuid UUID;
  stock_record RECORD;
BEGIN
  -- For each existing user, create default portfolio and sample holdings
  FOR user_record IN SELECT id FROM public.user_profiles LOOP
    -- Create default portfolio for this user
    portfolio_uuid := create_default_portfolio_for_user(user_record.id);
    
    -- Get the default account
    SELECT id INTO account_uuid 
    FROM public.accounts 
    WHERE user_id = user_record.id AND portfolio_id = portfolio_uuid
    LIMIT 1;
    
    -- Add sample holdings if no holdings exist
    IF account_uuid IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.holdings WHERE account_id = account_uuid
    ) THEN
      -- Add sample holdings for demo
      FOR stock_record IN SELECT id, symbol, current_price FROM public.stocks LIMIT 3 LOOP
        INSERT INTO public.holdings (
          user_id,
          account_id,
          stock_id,
          quantity,
          average_cost,
          total_cost,
          current_price,
          currency,
          first_purchase_date,
          last_transaction_date
        ) VALUES (
          user_record.id,
          account_uuid,
          stock_record.id,
          10 + (random() * 90)::integer, -- Random quantity between 10-100
          stock_record.current_price * (0.8 + random() * 0.4), -- Random cost basis ±20%
          (10 + (random() * 90)::integer) * stock_record.current_price * (0.8 + random() * 0.4),
          stock_record.current_price,
          'NOK',
          CURRENT_DATE - (random() * 365)::integer,
          CURRENT_DATE - (random() * 30)::integer
        );
      END LOOP;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create portfolios for existing users
SELECT add_sample_holdings_to_default();

-- Clean up the temporary function
DROP FUNCTION add_sample_holdings_to_default();

-- Add comments
COMMENT ON FUNCTION create_default_portfolio_for_user(UUID) IS 'Creates a default portfolio and account for a user';
COMMENT ON FUNCTION handle_new_user_portfolio() IS 'Trigger function to create default portfolio for new users';