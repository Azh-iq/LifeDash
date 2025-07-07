-- Add persistent test user protection
-- This migration ensures the test@test.no user cannot be accidentally deleted

-- Add columns to track test/persistent users
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_test_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_persistent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add index for quick lookup of test users
CREATE INDEX IF NOT EXISTS idx_user_profiles_test_persistent 
ON public.user_profiles(is_test_user, is_persistent) 
WHERE is_test_user = true OR is_persistent = true;

-- Create function to prevent deletion of persistent users
CREATE OR REPLACE FUNCTION prevent_persistent_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if trying to delete a persistent user
  IF OLD.is_persistent = true THEN
    RAISE EXCEPTION 'Cannot delete persistent user: %. This user is marked as persistent and should not be deleted.', OLD.email;
  END IF;
  
  -- Check if trying to delete the main test user
  IF OLD.email = 'test@test.no' THEN
    RAISE EXCEPTION 'Cannot delete main test user: test@test.no. This is a protected system user.';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent deletion of persistent users
DROP TRIGGER IF EXISTS prevent_persistent_user_deletion_trigger ON public.user_profiles;
CREATE TRIGGER prevent_persistent_user_deletion_trigger
  BEFORE DELETE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_persistent_user_deletion();

-- Update existing test@test.no user to be persistent
UPDATE public.user_profiles 
SET 
  is_test_user = true,
  is_persistent = true,
  full_name = 'Test Bruker - PERSISTENT',
  display_name = 'Test (Persistent)',
  notes = 'Protected test user - DO NOT DELETE',
  timezone = 'Europe/Oslo',
  locale = 'nb-NO',
  updated_at = NOW()
WHERE email = 'test@test.no';

-- Also protect any portfolios belonging to test users
CREATE OR REPLACE FUNCTION prevent_test_portfolio_deletion()
RETURNS TRIGGER AS $$
DECLARE
  user_is_persistent BOOLEAN;
BEGIN
  -- Check if the portfolio belongs to a persistent user
  SELECT is_persistent INTO user_is_persistent
  FROM public.user_profiles 
  WHERE id = OLD.user_id;
  
  IF user_is_persistent = true THEN
    RAISE EXCEPTION 'Cannot delete portfolio belonging to persistent user. Portfolio: %, User: %', OLD.name, OLD.user_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent deletion of test user portfolios
DROP TRIGGER IF EXISTS prevent_test_portfolio_deletion_trigger ON public.portfolios;
CREATE TRIGGER prevent_test_portfolio_deletion_trigger
  BEFORE DELETE ON public.portfolios
  FOR EACH ROW
  EXECUTE FUNCTION prevent_test_portfolio_deletion();

-- Create function to list all persistent users
CREATE OR REPLACE FUNCTION list_persistent_users()
RETURNS TABLE(
  user_id UUID,
  email CITEXT,
  full_name TEXT,
  is_test_user BOOLEAN,
  is_persistent BOOLEAN,
  created_at TIMESTAMPTZ,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.full_name,
    up.is_test_user,
    up.is_persistent,
    up.created_at,
    up.notes
  FROM public.user_profiles up
  WHERE up.is_persistent = true OR up.is_test_user = true
  ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to safely delete non-persistent test data
CREATE OR REPLACE FUNCTION cleanup_non_persistent_test_data()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  temp_count INTEGER;
BEGIN
  -- Delete transactions from non-persistent test users
  DELETE FROM public.transactions 
  WHERE user_id IN (
    SELECT id FROM public.user_profiles 
    WHERE is_test_user = true AND is_persistent = false
  );
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete holdings from non-persistent test users
  DELETE FROM public.holdings 
  WHERE user_id IN (
    SELECT id FROM public.user_profiles 
    WHERE is_test_user = true AND is_persistent = false
  );
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete accounts from non-persistent test users
  DELETE FROM public.accounts 
  WHERE user_id IN (
    SELECT id FROM public.user_profiles 
    WHERE is_test_user = true AND is_persistent = false
  );
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete portfolios from non-persistent test users
  DELETE FROM public.portfolios 
  WHERE user_id IN (
    SELECT id FROM public.user_profiles 
    WHERE is_test_user = true AND is_persistent = false
  );
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete user preferences for non-persistent test users
  DELETE FROM public.user_preferences 
  WHERE user_id IN (
    SELECT id FROM public.user_profiles 
    WHERE is_test_user = true AND is_persistent = false
  );
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Finally delete non-persistent test user profiles
  DELETE FROM public.user_profiles 
  WHERE is_test_user = true AND is_persistent = false;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON COLUMN public.user_profiles.is_test_user IS 'Indicates if this is a test user account';
COMMENT ON COLUMN public.user_profiles.is_persistent IS 'Prevents deletion of important test/system users';
COMMENT ON COLUMN public.user_profiles.notes IS 'Additional notes about the user account';

COMMENT ON FUNCTION prevent_persistent_user_deletion() IS 'Prevents accidental deletion of persistent users';
COMMENT ON FUNCTION prevent_test_portfolio_deletion() IS 'Prevents deletion of portfolios belonging to persistent users';
COMMENT ON FUNCTION list_persistent_users() IS 'Lists all persistent and test users in the system';
COMMENT ON FUNCTION cleanup_non_persistent_test_data() IS 'Safely removes non-persistent test data while preserving important test users';

-- Create migration log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migration_log (
  version TEXT PRIMARY KEY,
  description TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log the migration
INSERT INTO public.migration_log (version, description, applied_at)
VALUES ('014', 'Add persistent test user protection and cleanup functions', NOW())
ON CONFLICT (version) DO NOTHING;