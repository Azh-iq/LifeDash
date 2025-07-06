-- CSV Imports Schema for LifeDash
-- Tracks CSV import operations and batch processing

-- Drop existing csv_imports table if it exists with wrong structure
DROP TABLE IF EXISTS public.csv_imports CASCADE;

-- Create csv_imports table for tracking import batches  
CREATE TABLE public.csv_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES public.platforms(id) ON DELETE RESTRICT,
  
  -- Import identification
  batch_id UUID NOT NULL UNIQUE,
  import_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  
  -- Import configuration
  import_type TEXT NOT NULL DEFAULT 'nordnet' CHECK (import_type IN ('nordnet', 'generic', 'manual')),
  encoding TEXT NOT NULL DEFAULT 'utf-8',
  delimiter TEXT NOT NULL DEFAULT ',',
  field_mappings JSONB,
  import_config JSONB,
  
  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  
  -- Results summary
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  successful_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  skipped_rows INTEGER DEFAULT 0,
  
  -- Created entities
  created_accounts INTEGER DEFAULT 0,
  created_transactions INTEGER DEFAULT 0,
  created_holdings INTEGER DEFAULT 0,
  created_stocks INTEGER DEFAULT 0,
  
  -- Error tracking
  errors JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  
  -- Processing details
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_duration_seconds INTEGER,
  
  -- Data source information
  source_date_range JSONB, -- {start_date, end_date}
  detected_portfolios TEXT[],
  detected_currencies currency_code[],
  detected_transaction_types TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_file_size CHECK (file_size > 0),
  CONSTRAINT valid_progress CHECK (progress_percent BETWEEN 0 AND 100),
  CONSTRAINT valid_row_counts CHECK (
    total_rows >= 0 AND 
    processed_rows >= 0 AND 
    successful_rows >= 0 AND 
    failed_rows >= 0 AND 
    skipped_rows >= 0 AND
    processed_rows = successful_rows + failed_rows + skipped_rows
  ),
  CONSTRAINT valid_created_counts CHECK (
    created_accounts >= 0 AND 
    created_transactions >= 0 AND 
    created_holdings >= 0 AND 
    created_stocks >= 0
  ),
  CONSTRAINT valid_duration CHECK (processing_duration_seconds IS NULL OR processing_duration_seconds >= 0),
  CONSTRAINT valid_timestamps CHECK (
    (started_at IS NULL AND completed_at IS NULL) OR
    (started_at IS NOT NULL AND completed_at IS NULL) OR
    (started_at IS NOT NULL AND completed_at IS NOT NULL AND completed_at >= started_at)
  )
);

-- Create csv_import_errors table for detailed error tracking
CREATE TABLE IF NOT EXISTS public.csv_import_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  import_id UUID NOT NULL REFERENCES public.csv_imports(id) ON DELETE CASCADE,
  
  -- Error details
  row_number INTEGER,
  error_type TEXT NOT NULL CHECK (error_type IN ('validation', 'transformation', 'database', 'business_logic', 'system')),
  error_code TEXT,
  error_message TEXT NOT NULL,
  error_details JSONB,
  
  -- Context
  raw_data JSONB, -- Original CSV row data
  transformed_data JSONB, -- Transformed data if transformation succeeded
  field_name TEXT, -- Specific field that caused the error
  
  -- Severity
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  is_recoverable BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_row_number CHECK (row_number IS NULL OR row_number > 0)
);

-- Create csv_import_field_mappings table for tracking field mapping configurations
CREATE TABLE IF NOT EXISTS public.csv_import_field_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES public.platforms(id) ON DELETE RESTRICT,
  
  -- Mapping identification
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  
  -- Field mappings
  mappings JSONB NOT NULL,
  validation_rules JSONB,
  transformation_rules JSONB,
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Template settings
  is_template BOOLEAN DEFAULT false,
  template_category TEXT, -- 'nordnet', 'generic', etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_mappings CHECK (jsonb_typeof(mappings) = 'array'),
  CONSTRAINT valid_usage_count CHECK (usage_count >= 0),
  UNIQUE(user_id, platform_id, name)
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_csv_imports_user_id ON public.csv_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_csv_imports_platform_id ON public.csv_imports(platform_id);
CREATE INDEX IF NOT EXISTS idx_csv_imports_batch_id ON public.csv_imports(batch_id);
CREATE INDEX IF NOT EXISTS idx_csv_imports_status ON public.csv_imports(status);
CREATE INDEX IF NOT EXISTS idx_csv_imports_import_type ON public.csv_imports(import_type);
CREATE INDEX IF NOT EXISTS idx_csv_imports_created_at ON public.csv_imports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_csv_imports_user_status ON public.csv_imports(user_id, status);
CREATE INDEX IF NOT EXISTS idx_csv_imports_platform_status ON public.csv_imports(platform_id, status);

CREATE INDEX IF NOT EXISTS idx_csv_import_errors_import_id ON public.csv_import_errors(import_id);
CREATE INDEX IF NOT EXISTS idx_csv_import_errors_error_type ON public.csv_import_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_csv_import_errors_severity ON public.csv_import_errors(severity);
CREATE INDEX IF NOT EXISTS idx_csv_import_errors_row_number ON public.csv_import_errors(row_number);

CREATE INDEX IF NOT EXISTS idx_csv_import_field_mappings_user_id ON public.csv_import_field_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_csv_import_field_mappings_platform_id ON public.csv_import_field_mappings(platform_id);
CREATE INDEX IF NOT EXISTS idx_csv_import_field_mappings_template ON public.csv_import_field_mappings(is_template, template_category);
CREATE INDEX IF NOT EXISTS idx_csv_import_field_mappings_default ON public.csv_import_field_mappings(user_id, platform_id, is_default) WHERE is_default = true;

-- Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_csv_imports_field_mappings_gin ON public.csv_imports USING GIN(field_mappings);
CREATE INDEX IF NOT EXISTS idx_csv_imports_import_config_gin ON public.csv_imports USING GIN(import_config);
CREATE INDEX IF NOT EXISTS idx_csv_imports_errors_gin ON public.csv_imports USING GIN(errors);
CREATE INDEX IF NOT EXISTS idx_csv_imports_warnings_gin ON public.csv_imports USING GIN(warnings);
CREATE INDEX IF NOT EXISTS idx_csv_import_errors_error_details_gin ON public.csv_import_errors USING GIN(error_details);
CREATE INDEX IF NOT EXISTS idx_csv_import_field_mappings_mappings_gin ON public.csv_import_field_mappings USING GIN(mappings);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_csv_imports_updated_at
  BEFORE UPDATE ON public.csv_imports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_csv_import_field_mappings_updated_at
  BEFORE UPDATE ON public.csv_import_field_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update import progress
CREATE OR REPLACE FUNCTION update_import_progress(
  import_uuid UUID,
  new_progress INTEGER,
  new_status TEXT DEFAULT NULL,
  processing_errors JSONB DEFAULT NULL,
  processing_warnings JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.csv_imports 
  SET 
    progress_percent = new_progress,
    status = COALESCE(new_status, status),
    errors = COALESCE(processing_errors, errors),
    warnings = COALESCE(processing_warnings, warnings),
    updated_at = NOW()
  WHERE id = import_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create function to complete import
CREATE OR REPLACE FUNCTION complete_import(
  import_uuid UUID,
  final_status TEXT,
  processing_results JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.csv_imports 
  SET 
    status = final_status,
    progress_percent = 100,
    completed_at = NOW(),
    processing_duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
    processed_rows = COALESCE((processing_results->>'processed_rows')::INTEGER, processed_rows),
    successful_rows = COALESCE((processing_results->>'successful_rows')::INTEGER, successful_rows),
    failed_rows = COALESCE((processing_results->>'failed_rows')::INTEGER, failed_rows),
    skipped_rows = COALESCE((processing_results->>'skipped_rows')::INTEGER, skipped_rows),
    created_accounts = COALESCE((processing_results->>'created_accounts')::INTEGER, created_accounts),
    created_transactions = COALESCE((processing_results->>'created_transactions')::INTEGER, created_transactions),
    created_holdings = COALESCE((processing_results->>'created_holdings')::INTEGER, created_holdings),
    created_stocks = COALESCE((processing_results->>'created_stocks')::INTEGER, created_stocks),
    errors = COALESCE(processing_results->'errors', errors),
    warnings = COALESCE(processing_results->'warnings', warnings),
    updated_at = NOW()
  WHERE id = import_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create function to start import processing
CREATE OR REPLACE FUNCTION start_import_processing(import_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.csv_imports 
  SET 
    status = 'processing',
    started_at = NOW(),
    updated_at = NOW()
  WHERE id = import_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create function to get import statistics
CREATE OR REPLACE FUNCTION get_import_statistics(
  user_uuid UUID,
  platform_uuid UUID DEFAULT NULL,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
  total_imports BIGINT,
  successful_imports BIGINT,
  failed_imports BIGINT,
  total_transactions_imported BIGINT,
  total_accounts_created BIGINT,
  avg_processing_time_seconds NUMERIC,
  most_recent_import TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_imports,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as successful_imports,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_imports,
    COALESCE(SUM(created_transactions), 0)::BIGINT as total_transactions_imported,
    COALESCE(SUM(created_accounts), 0)::BIGINT as total_accounts_created,
    AVG(processing_duration_seconds) as avg_processing_time_seconds,
    MAX(created_at) as most_recent_import
  FROM public.csv_imports
  WHERE 
    csv_imports.user_id = user_uuid
    AND (platform_uuid IS NULL OR csv_imports.platform_id = platform_uuid)
    AND created_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup old import records
CREATE OR REPLACE FUNCTION cleanup_old_imports(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete import errors first (due to foreign key)
  DELETE FROM public.csv_import_errors 
  WHERE import_id IN (
    SELECT id FROM public.csv_imports 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep
    AND status IN ('completed', 'failed', 'cancelled')
  );
  
  -- Delete old import records
  DELETE FROM public.csv_imports 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep
  AND status IN ('completed', 'failed', 'cancelled');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE public.csv_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_import_field_mappings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for csv_imports
CREATE POLICY "Users can view own imports" ON public.csv_imports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own imports" ON public.csv_imports
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for csv_import_errors
CREATE POLICY "Users can view own import errors" ON public.csv_import_errors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.csv_imports ci
      WHERE ci.id = import_id AND ci.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own import errors" ON public.csv_import_errors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.csv_imports ci
      WHERE ci.id = import_id AND ci.user_id = auth.uid()
    )
  );

-- Create RLS policies for csv_import_field_mappings
CREATE POLICY "Users can view own field mappings" ON public.csv_import_field_mappings
  FOR SELECT USING (auth.uid() = user_id OR is_template = true);

CREATE POLICY "Users can manage own field mappings" ON public.csv_import_field_mappings
  FOR ALL USING (auth.uid() = user_id);

-- Note: Field mapping templates will be created on first use by users

-- Add comments for documentation
COMMENT ON TABLE public.csv_imports IS 'Tracks CSV import operations and batch processing';
COMMENT ON TABLE public.csv_import_errors IS 'Detailed error tracking for CSV import operations';
COMMENT ON TABLE public.csv_import_field_mappings IS 'Field mapping configurations for CSV imports';

COMMENT ON COLUMN public.csv_imports.batch_id IS 'Unique identifier for linking transactions to import batch';
COMMENT ON COLUMN public.csv_imports.field_mappings IS 'JSON configuration of CSV field to internal field mappings';
COMMENT ON COLUMN public.csv_imports.import_config IS 'JSON configuration for import processing options';
COMMENT ON COLUMN public.csv_imports.source_date_range IS 'Date range of transactions in the CSV file';

COMMENT ON FUNCTION update_import_progress(UUID, INTEGER, TEXT, JSONB, JSONB) IS 'Updates import progress and status';
COMMENT ON FUNCTION complete_import(UUID, TEXT, JSONB) IS 'Marks import as complete with final results';
COMMENT ON FUNCTION start_import_processing(UUID) IS 'Marks import as started processing';
COMMENT ON FUNCTION get_import_statistics(UUID, UUID, INTEGER) IS 'Gets import statistics for a user and platform';
COMMENT ON FUNCTION cleanup_old_imports(INTEGER) IS 'Cleans up old import records to manage storage';