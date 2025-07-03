-- Users and Authentication Schema for LifeDash
-- Extends Supabase Auth with custom user profiles and preferences

-- Create users profile table that extends auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email CITEXT NOT NULL UNIQUE,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  locale TEXT DEFAULT 'en-US',
  date_format TEXT DEFAULT 'YYYY-MM-DD',
  time_format TEXT DEFAULT '24h',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_timezone CHECK (timezone ~ '^[A-Za-z_/]+$'),
  CONSTRAINT valid_locale CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  CONSTRAINT valid_date_format CHECK (date_format IN ('YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY', 'DD.MM.YYYY')),
  CONSTRAINT valid_time_format CHECK (time_format IN ('12h', '24h'))
);

-- Create user preferences table for app-specific settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Display preferences
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
  primary_currency currency_code DEFAULT 'USD',
  secondary_currency currency_code,
  show_percentage_changes BOOLEAN DEFAULT true,
  show_absolute_changes BOOLEAN DEFAULT true,
  compact_view BOOLEAN DEFAULT false,
  
  -- Dashboard preferences
  default_time_range TEXT DEFAULT '1Y' CHECK (default_time_range IN ('1D', '1W', '1M', '3M', '6M', '1Y', '2Y', '5Y', 'ALL')),
  dashboard_widgets JSONB DEFAULT '[]',
  portfolio_view_mode TEXT DEFAULT 'grouped' CHECK (portfolio_view_mode IN ('grouped', 'flat', 'tree')),
  
  -- Notification preferences
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  price_alerts BOOLEAN DEFAULT true,
  news_alerts BOOLEAN DEFAULT false,
  weekly_summary BOOLEAN DEFAULT true,
  monthly_report BOOLEAN DEFAULT true,
  
  -- Privacy preferences
  data_sharing BOOLEAN DEFAULT false,
  analytics_tracking BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  
  -- Performance preferences
  auto_refresh_interval INTEGER DEFAULT 300 CHECK (auto_refresh_interval BETWEEN 60 AND 3600),
  preload_data BOOLEAN DEFAULT true,
  reduce_motion BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id)
);

-- Create user sessions table for tracking login activity
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  session_token TEXT,
  ip_address INET,
  user_agent TEXT,
  location JSONB, -- Store geo data like city, country, etc.
  device_info JSONB, -- Store device type, OS, browser, etc.
  login_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  logout_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create user API keys table for external integrations
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- Store hashed version of the key
  key_prefix TEXT NOT NULL, -- Store first 8 characters for identification
  scopes JSONB DEFAULT '[]', -- Array of permitted scopes
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  rate_limit INTEGER DEFAULT 1000, -- Requests per hour
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_scopes CHECK (jsonb_typeof(scopes) = 'array')
);

-- Create user notifications table
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'price_alert', 'news', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data for the notification
  read_at TIMESTAMPTZ,
  action_url TEXT,
  action_label TEXT,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_data CHECK (data IS NULL OR jsonb_typeof(data) = 'object')
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_theme ON public.user_preferences(theme);
CREATE INDEX IF NOT EXISTS idx_user_preferences_currency ON public.user_preferences(primary_currency);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_at ON public.user_sessions(login_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip ON public.user_sessions(ip_address);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_active ON public.user_api_keys(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_api_keys_hash ON public.user_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_prefix ON public.user_api_keys(key_prefix);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON public.user_notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON public.user_notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created ON public.user_notifications(created_at);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active_login ON public.user_sessions(user_id, is_active, login_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread_created ON public.user_notifications(user_id, created_at DESC) WHERE read_at IS NULL;

-- Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_user_preferences_widgets_gin ON public.user_preferences USING GIN(dashboard_widgets);
CREATE INDEX IF NOT EXISTS idx_user_sessions_location_gin ON public.user_sessions USING GIN(location);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_gin ON public.user_sessions USING GIN(device_info);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_scopes_gin ON public.user_api_keys USING GIN(scopes);
CREATE INDEX IF NOT EXISTS idx_user_notifications_data_gin ON public.user_notifications USING GIN(data);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create user preferences when profile is created
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create preferences
CREATE TRIGGER create_user_preferences_trigger
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_preferences();

-- Create function to clean up old sessions
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete sessions older than 90 days
  DELETE FROM public.user_sessions 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM public.user_notifications 
  WHERE read_at IS NOT NULL AND read_at < NOW() - INTERVAL '30 days';
  
  -- Delete unread notifications older than 90 days
  DELETE FROM public.user_notifications 
  WHERE read_at IS NULL AND created_at < NOW() - INTERVAL '90 days';
  
  -- Delete expired notifications
  DELETE FROM public.user_notifications 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for user_preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for user_api_keys
CREATE POLICY "Users can view own API keys" ON public.user_api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own API keys" ON public.user_api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for user_notifications
CREATE POLICY "Users can view own notifications" ON public.user_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.user_profiles IS 'Extended user profile information beyond Supabase auth';
COMMENT ON TABLE public.user_preferences IS 'User-specific application preferences and settings';
COMMENT ON TABLE public.user_sessions IS 'Track user login sessions and device information';
COMMENT ON TABLE public.user_api_keys IS 'API keys for external integrations and third-party access';
COMMENT ON TABLE public.user_notifications IS 'In-app notifications and alerts for users';

COMMENT ON COLUMN public.user_profiles.timezone IS 'User timezone for proper date/time display';
COMMENT ON COLUMN public.user_preferences.dashboard_widgets IS 'JSON array of enabled dashboard widgets and their configuration';
COMMENT ON COLUMN public.user_sessions.device_info IS 'JSON object containing device type, OS, browser information';
COMMENT ON COLUMN public.user_api_keys.scopes IS 'JSON array of permitted API scopes';
COMMENT ON COLUMN public.user_notifications.data IS 'Additional JSON data for notification context';

COMMENT ON FUNCTION create_user_preferences() IS 'Automatically creates user preferences when a new profile is created';
COMMENT ON FUNCTION cleanup_old_sessions() IS 'Removes old user sessions to maintain database performance';
COMMENT ON FUNCTION cleanup_old_notifications() IS 'Removes old notifications based on read status and expiration';