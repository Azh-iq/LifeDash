-- Audit Logs Schema with Time Partitioning for LifeDash
-- Comprehensive audit trail for all user actions and system events

-- Create partitioned audit_logs table for comprehensive system logging
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  session_id UUID,
  
  -- Action details
  action audit_action NOT NULL,
  resource_type TEXT NOT NULL, -- 'transaction', 'holding', 'portfolio', etc.
  resource_id UUID,
  
  -- Request context
  endpoint TEXT, -- API endpoint or page accessed
  method TEXT, -- HTTP method or action type
  user_agent TEXT,
  ip_address INET,
  
  -- Data changes
  old_values JSONB, -- Previous state
  new_values JSONB, -- New state after change
  changes JSONB, -- Computed diff between old and new
  
  -- Additional context
  metadata JSONB, -- Additional context data
  tags TEXT[], -- Searchable tags
  
  -- Error tracking
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  error_code TEXT,
  stack_trace TEXT,
  
  -- Performance metrics
  duration_ms INTEGER, -- Request/operation duration
  
  -- Geo and device information
  country_code TEXT,
  city TEXT,
  device_type TEXT, -- 'mobile', 'desktop', 'tablet'
  browser TEXT,
  os TEXT,
  
  -- Data retention
  retention_date DATE, -- When this log can be deleted
  is_sensitive BOOLEAN DEFAULT false, -- Contains PII or sensitive data
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_ip_address CHECK (ip_address IS NOT NULL),
  CONSTRAINT valid_duration CHECK (duration_ms IS NULL OR duration_ms >= 0),
  CONSTRAINT valid_country_code CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$'),
  CONSTRAINT valid_retention_date CHECK (retention_date IS NULL OR retention_date > created_at::DATE),
  CONSTRAINT valid_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
  CONSTRAINT valid_changes CHECK (changes IS NULL OR jsonb_typeof(changes) = 'object'),
  
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create security_events table for security-related logging
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  session_id UUID,
  
  -- Event classification
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login_attempt', 'login_success', 'login_failure', 'logout',
    'password_change', 'email_change', 'mfa_setup', 'mfa_disable',
    'api_key_created', 'api_key_deleted', 'permission_change',
    'suspicious_activity', 'account_locked', 'account_unlocked',
    'data_export', 'data_import', 'unauthorized_access'
  )),
  severity TEXT DEFAULT 'info' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Request details
  ip_address INET NOT NULL,
  user_agent TEXT,
  endpoint TEXT,
  
  -- Security context
  risk_score INTEGER, -- 0-100 risk assessment
  threat_indicators TEXT[], -- Array of detected threats
  authentication_method TEXT, -- 'password', 'oauth', 'api_key', etc.
  
  -- Additional details
  description TEXT NOT NULL,
  metadata JSONB,
  
  -- Response actions
  action_taken TEXT, -- What action was taken in response
  blocked BOOLEAN DEFAULT false,
  requires_investigation BOOLEAN DEFAULT false,
  
  -- Geo information
  country_code TEXT,
  city TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_risk_score CHECK (risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100)),
  CONSTRAINT valid_country_code_sec CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$'),
  
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create data_changes table for detailed change tracking
CREATE TABLE IF NOT EXISTS public.data_changes (
  id UUID DEFAULT uuid_generate_v4(),
  audit_log_id UUID NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  
  -- Change details
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  
  -- Value changes
  old_value TEXT,
  new_value TEXT,
  data_type TEXT, -- 'string', 'number', 'boolean', 'json', etc.
  
  -- Change metadata
  change_type TEXT NOT NULL CHECK (change_type IN ('insert', 'update', 'delete')),
  is_sensitive BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create system_metrics table for performance and health monitoring
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id UUID DEFAULT uuid_generate_v4(),
  
  -- Metric identification
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram', 'timer')),
  
  -- Metric values
  value DECIMAL(20,8) NOT NULL,
  unit TEXT, -- 'ms', 'bytes', 'percent', 'count', etc.
  
  -- Dimensions/labels
  labels JSONB, -- Key-value pairs for metric dimensions
  
  -- Aggregation period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Source information
  source TEXT, -- 'app', 'database', 'api', 'worker', etc.
  node_id TEXT, -- Identifier for the specific instance/node
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_period CHECK (period_end >= period_start),
  CONSTRAINT valid_labels CHECK (labels IS NULL OR jsonb_typeof(labels) = 'object'),
  
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create api_usage_logs table for API monitoring
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  api_key_id UUID,
  
  -- Request details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  query_params JSONB,
  
  -- Response details
  status_code INTEGER NOT NULL,
  response_size INTEGER, -- bytes
  duration_ms INTEGER,
  
  -- Usage tracking
  rate_limit_remaining INTEGER,
  quota_used INTEGER,
  quota_limit INTEGER,
  
  -- Client information
  ip_address INET NOT NULL,
  user_agent TEXT,
  client_id TEXT,
  
  -- Error tracking
  error_message TEXT,
  error_code TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_status_code CHECK (status_code BETWEEN 100 AND 599),
  CONSTRAINT valid_response_size CHECK (response_size IS NULL OR response_size >= 0),
  CONSTRAINT valid_duration_api CHECK (duration_ms IS NULL OR duration_ms >= 0),
  
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for all time-partitioned tables (current month + 12 months ahead)
-- TODO: Enable partitions after fixing table creation
-- SELECT create_future_partitions('public.audit_logs', 12);
-- SELECT create_future_partitions('public.security_events', 12);
-- SELECT create_future_partitions('public.data_changes', 12);
-- SELECT create_future_partitions('public.system_metrics', 6);
-- SELECT create_future_partitions('public.api_usage_logs', 6);

-- Create indexes for optimal performance

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session ON public.audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip ON public.audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON public.audit_logs(success) WHERE success = false;
CREATE INDEX IF NOT EXISTS idx_audit_logs_sensitive ON public.audit_logs(is_sensitive) WHERE is_sensitive = true;
CREATE INDEX IF NOT EXISTS idx_audit_logs_retention ON public.audit_logs(retention_date) WHERE retention_date IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_created ON public.audit_logs(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_created ON public.audit_logs(resource_type, resource_id, created_at DESC);

-- Security events indexes
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON public.security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_risk ON public.security_events(risk_score DESC) WHERE risk_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_events_blocked ON public.security_events(blocked) WHERE blocked = true;
CREATE INDEX IF NOT EXISTS idx_security_events_investigation ON public.security_events(requires_investigation) WHERE requires_investigation = true;

-- Data changes indexes
CREATE INDEX IF NOT EXISTS idx_data_changes_audit_log ON public.data_changes(audit_log_id);
CREATE INDEX IF NOT EXISTS idx_data_changes_user_id ON public.data_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_data_changes_table_record ON public.data_changes(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_data_changes_field ON public.data_changes(table_name, field_name);
CREATE INDEX IF NOT EXISTS idx_data_changes_type ON public.data_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_data_changes_sensitive ON public.data_changes(is_sensitive) WHERE is_sensitive = true;

-- System metrics indexes
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON public.system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON public.system_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_system_metrics_source ON public.system_metrics(source);
CREATE INDEX IF NOT EXISTS idx_system_metrics_period ON public.system_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_system_metrics_node ON public.system_metrics(node_id);

-- API usage logs indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON public.api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_api_key ON public.api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON public.api_usage_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_method ON public.api_usage_logs(method);
CREATE INDEX IF NOT EXISTS idx_api_usage_status ON public.api_usage_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_api_usage_ip ON public.api_usage_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_api_usage_errors ON public.api_usage_logs(status_code) WHERE status_code >= 400;

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin ON public.audit_logs USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changes_gin ON public.audit_logs USING GIN(changes);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tags_gin ON public.audit_logs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_security_events_metadata_gin ON public.security_events USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_security_events_threats_gin ON public.security_events USING GIN(threat_indicators);
CREATE INDEX IF NOT EXISTS idx_system_metrics_labels_gin ON public.system_metrics USING GIN(labels);
CREATE INDEX IF NOT EXISTS idx_api_usage_query_gin ON public.api_usage_logs USING GIN(query_params);

-- Create functions for audit logging

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_action audit_action,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
  changes_obj JSONB;
BEGIN
  -- Generate changes object if both old and new values provided
  IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
    changes_obj := jsonb_diff(p_old_values, p_new_values);
  END IF;
  
  INSERT INTO public.audit_logs (
    user_id, action, resource_type, resource_id,
    old_values, new_values, changes, metadata,
    ip_address, user_agent, success, error_message,
    retention_date
  ) VALUES (
    p_user_id, p_action, p_resource_type, p_resource_id,
    p_old_values, p_new_values, changes_obj, p_metadata,
    p_ip_address, p_user_agent, p_success, p_error_message,
    CURRENT_DATE + INTERVAL '7 years' -- Default 7-year retention
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create security event logs
CREATE OR REPLACE FUNCTION create_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_severity TEXT,
  p_description TEXT,
  p_ip_address INET,
  p_risk_score INTEGER DEFAULT NULL,
  p_blocked BOOLEAN DEFAULT false,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    user_id, event_type, severity, description,
    ip_address, risk_score, blocked, metadata
  ) VALUES (
    p_user_id, p_event_type, p_severity, p_description,
    p_ip_address, p_risk_score, p_blocked, p_metadata
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate JSON differences
CREATE OR REPLACE FUNCTION jsonb_diff(old_data JSONB, new_data JSONB)
RETURNS JSONB AS $$
DECLARE
  result JSONB := '{}';
  key TEXT;
  old_val JSONB;
  new_val JSONB;
BEGIN
  -- Check for changed or new keys
  FOR key IN SELECT jsonb_object_keys(new_data) LOOP
    new_val := new_data -> key;
    old_val := old_data -> key;
    
    IF old_val IS DISTINCT FROM new_val THEN
      result := result || jsonb_build_object(key, jsonb_build_object(
        'old', old_val,
        'new', new_val
      ));
    END IF;
  END LOOP;
  
  -- Check for deleted keys
  FOR key IN SELECT jsonb_object_keys(old_data) LOOP
    IF NOT (new_data ? key) THEN
      result := result || jsonb_build_object(key, jsonb_build_object(
        'old', old_data -> key,
        'new', null
      ));
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old audit logs based on retention policy
CREATE OR REPLACE FUNCTION cleanup_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete audit logs past their retention date
  DELETE FROM public.audit_logs 
  WHERE retention_date IS NOT NULL AND retention_date < CURRENT_DATE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup operation
  PERFORM create_audit_log(
    NULL, 'DELETE', 'audit_logs', NULL, NULL, NULL,
    jsonb_build_object('deleted_count', deleted_count),
    NULL, 'system_cleanup', true, NULL
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old system metrics (keep only 90 days)
CREATE OR REPLACE FUNCTION cleanup_system_metrics()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.system_metrics 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old API usage logs (keep only 1 year)
CREATE OR REPLACE FUNCTION cleanup_api_usage_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.api_usage_logs 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for automatic audit logging
CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER AS $$
DECLARE
  audit_user_id UUID;
  old_values_json JSONB;
  new_values_json JSONB;
  action_type audit_action;
BEGIN
  -- Get user ID from session context or use system user
  audit_user_id := COALESCE(
    current_setting('audit.user_id', true)::UUID,
    auth.uid()
  );
  
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'CREATE';
    new_values_json := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'UPDATE';
    old_values_json := to_jsonb(OLD);
    new_values_json := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'DELETE';
    old_values_json := to_jsonb(OLD);
  END IF;
  
  -- Create audit log entry
  PERFORM create_audit_log(
    audit_user_id,
    action_type,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    old_values_json,
    new_values_json,
    jsonb_build_object('table_schema', TG_TABLE_SCHEMA),
    NULL, NULL, true, NULL
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit tables

-- Admin users can see all logs, regular users can see their own
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Similar policies for other audit tables
CREATE POLICY "Admins can view all security events" ON public.security_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Users can view own security events" ON public.security_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all data changes" ON public.data_changes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Users can view own data changes" ON public.data_changes
  FOR SELECT USING (auth.uid() = user_id);

-- System metrics and API usage logs are admin-only
CREATE POLICY "Admins can view system metrics" ON public.system_metrics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Admins can view API usage logs" ON public.api_usage_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Users can view own API usage" ON public.api_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail of all user actions and system events';
COMMENT ON TABLE public.security_events IS 'Security-related events and suspicious activity tracking';
COMMENT ON TABLE public.data_changes IS 'Detailed field-level change tracking for sensitive data';
COMMENT ON TABLE public.system_metrics IS 'System performance and health metrics';
COMMENT ON TABLE public.api_usage_logs IS 'API endpoint usage and performance tracking';

COMMENT ON FUNCTION create_audit_log IS 'Creates audit log entries with automatic change detection';
COMMENT ON FUNCTION create_security_event IS 'Creates security event log entries';
COMMENT ON FUNCTION jsonb_diff IS 'Calculates differences between JSON objects';
COMMENT ON FUNCTION cleanup_audit_logs IS 'Removes audit logs based on retention policies';
COMMENT ON FUNCTION audit_table_changes IS 'Trigger function for automatic audit logging of table changes';

-- Create a view for recent activity
CREATE OR REPLACE VIEW public.recent_activity AS
SELECT 
  'audit' as log_type,
  id,
  user_id,
  action::TEXT as action,
  resource_type,
  resource_id,
  metadata,
  success,
  error_message,
  created_at
FROM public.audit_logs 
WHERE created_at > NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'security' as log_type,
  id,
  user_id,
  event_type as action,
  'security_event' as resource_type,
  NULL as resource_id,
  metadata,
  NOT blocked as success,
  description as error_message,
  created_at
FROM public.security_events 
WHERE created_at > NOW() - INTERVAL '30 days'

ORDER BY created_at DESC;

COMMENT ON VIEW public.recent_activity IS 'Combined view of recent audit and security events';

-- Enable RLS on the view
ALTER VIEW public.recent_activity SET (security_invoker = true);