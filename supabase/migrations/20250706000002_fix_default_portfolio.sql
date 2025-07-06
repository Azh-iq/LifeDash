-- Fix the default portfolio creation function to use proper UUID

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
  WHERE user_id = user_uuid AND name = 'Default Portfolio'
  LIMIT 1;

  -- Create default portfolio if it doesn't exist
  IF portfolio_uuid IS NULL THEN
    INSERT INTO public.portfolios (
      user_id, 
      name, 
      description, 
      currency, 
      is_default,
      inception_date
    ) VALUES (
      user_uuid,
      'Default Portfolio',
      'Your main investment portfolio',
      'NOK',
      true,
      CURRENT_DATE
    ) 
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
      'TAXABLE',
      'NOK',
      true
    ) RETURNING id INTO account_uuid;
  END IF;

  RETURN portfolio_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;