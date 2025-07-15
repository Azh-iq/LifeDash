-- Fix test user by creating missing user_profiles record
-- This ensures test@test.no has a complete setup

-- Create user_profiles record if it doesn't exist
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
) 
SELECT 
  u.id,
  u.email,
  'Test Bruker - PERSISTENT',
  'Test (Persistent)',
  'Europe/Oslo',
  'nb-NO',
  true,
  true,
  'Protected test user - DO NOT DELETE. Password: 123456',
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'test@test.no'
AND NOT EXISTS (
  SELECT 1 FROM public.user_profiles p WHERE p.id = u.id
);

-- Create default portfolio if it doesn't exist
INSERT INTO public.portfolios (
  user_id,
  name,
  description,
  currency,
  is_default,
  created_at,
  updated_at
)
SELECT 
  u.id,
  'Min Portefølje',
  'Standard test portefølje for test@test.no',
  'NOK',
  true,
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'test@test.no'
AND NOT EXISTS (
  SELECT 1 FROM public.portfolios p WHERE p.user_id = u.id
);

-- Platform creation is handled by standard platforms migration

-- Create default account if it doesn't exist
INSERT INTO public.accounts (
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
  u.id,
  p.id,
  pl.id,
  'Test Konto - Nordnet',
  'TAXABLE',
  'NOK',
  true,
  NOW(),
  NOW()
FROM auth.users u
JOIN public.portfolios p ON p.user_id = u.id
JOIN public.platforms pl ON pl.name = 'nordnet'
WHERE u.email = 'test@test.no'
AND NOT EXISTS (
  SELECT 1 FROM public.accounts a WHERE a.user_id = u.id
);

-- Log the fix
INSERT INTO public.migration_log (version, description, applied_at)
VALUES ('024', 'Fix test user setup - create missing user_profiles and portfolio', NOW())
ON CONFLICT (version) DO UPDATE SET applied_at = NOW();