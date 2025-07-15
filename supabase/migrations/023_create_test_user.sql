-- Create test@test.no user with password 123456
-- This migration ensures the test user exists for development

-- First, insert the user into auth.users if it doesn't exist
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Check if user exists
  SELECT id INTO user_id FROM auth.users WHERE email = 'test@test.no';
  
  -- If user doesn't exist, create it
  IF user_id IS NULL THEN
    user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      user_id,
      '00000000-0000-0000-0000-000000000000',
      'test@test.no',
      crypt('123456', gen_salt('bf')), -- Hash the password
      NOW(),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    );
  END IF;
END
$$;

-- Create or update user profile
INSERT INTO public.user_profiles (
  id,
  email,
  full_name,
  display_name,
  timezone,
  locale,
  is_test_user,
  is_persistent,
  notes,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'test@test.no'),
  'test@test.no',
  'Test Bruker - PERSISTENT',
  'Test (Persistent)',
  'Europe/Oslo',
  'nb-NO',
  true,
  true,
  'Protected test user - DO NOT DELETE. Password: 123456',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  display_name = EXCLUDED.display_name,
  is_test_user = EXCLUDED.is_test_user,
  is_persistent = EXCLUDED.is_persistent,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- Create default portfolio for test user if it doesn't exist
INSERT INTO public.portfolios (
  id,
  user_id,
  name,
  description,
  is_default,
  currency,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'test@test.no'),
  'Min Portefølje',
  'Standard test portefølje for test@test.no',
  true,
  'NOK',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.portfolios p 
  WHERE p.user_id = (SELECT id FROM auth.users WHERE email = 'test@test.no')
);

-- Create default account for test user if it doesn't exist  
-- First need to get nordnet platform_id
INSERT INTO public.accounts (
  id,
  user_id,
  portfolio_id,
  platform_id,
  name,
  account_type,
  currency,
  is_active,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'test@test.no'),
  (SELECT id FROM public.portfolios WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@test.no') LIMIT 1),
  (SELECT id FROM public.platforms WHERE name = 'nordnet' LIMIT 1),
  'Test Konto - Nordnet',
  'TAXABLE',
  'NOK',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.accounts a 
  WHERE a.user_id = (SELECT id FROM auth.users WHERE email = 'test@test.no')
) AND EXISTS (
  SELECT 1 FROM public.platforms WHERE name = 'nordnet'
);

-- Log the migration
INSERT INTO public.migration_log (version, description, applied_at)
VALUES ('023', 'Create persistent test user test@test.no with password 123456', NOW())
ON CONFLICT (version) DO UPDATE SET applied_at = NOW();