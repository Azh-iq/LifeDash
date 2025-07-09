-- Widget Layouts Schema for LifeDash
-- Manages user widget configurations and layout preferences

-- Create widget_types enum for supported widget types
CREATE TYPE widget_type AS ENUM (
  'HERO_PORTFOLIO_CHART',
  'CATEGORY_MINI_CHART',
  'STOCK_PERFORMANCE_CHART',
  'HOLDINGS_TABLE_RICH',
  'METRICS_GRID',
  'ACTIVITY_FEED',
  'TOP_NAVIGATION_ENHANCED',
  'CATEGORY_SELECTOR',
  'STOCK_DETAIL_CARD',
  'TRANSACTION_HISTORY',
  'PRICE_ALERTS',
  'NEWS_FEED',
  'PORTFOLIO_ALLOCATION',
  'PERFORMANCE_METRICS',
  'WATCHLIST',
  'CUSTOM_WIDGET'
);

-- Create widget_categories enum for widget categorization
CREATE TYPE widget_category AS ENUM (
  'STOCKS',
  'CRYPTO',
  'ART',
  'OTHER'
);

-- Create widget_size enum for widget sizing
CREATE TYPE widget_size AS ENUM (
  'SMALL',
  'MEDIUM',
  'LARGE',
  'HERO'
);

-- Create widget_layouts table for user widget configurations
CREATE TABLE IF NOT EXISTS public.widget_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
  stock_symbol TEXT, -- For stock-specific widget layouts
  
  -- Layout identification
  layout_name TEXT NOT NULL,
  layout_type TEXT NOT NULL CHECK (layout_type IN ('dashboard', 'portfolio', 'stock', 'custom')),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Widget configuration
  widget_type widget_type NOT NULL,
  widget_category widget_category DEFAULT 'STOCKS',
  widget_size widget_size DEFAULT 'MEDIUM',
  
  -- Layout positioning
  grid_row INTEGER NOT NULL DEFAULT 1,
  grid_column INTEGER NOT NULL DEFAULT 1,
  grid_row_span INTEGER DEFAULT 1 CHECK (grid_row_span >= 1 AND grid_row_span <= 4),
  grid_column_span INTEGER DEFAULT 1 CHECK (grid_column_span >= 1 AND grid_column_span <= 4),
  
  -- Widget settings (flexible JSON configuration)
  widget_config JSONB DEFAULT '{}',
  
  -- Display settings
  title TEXT,
  description TEXT,
  show_header BOOLEAN DEFAULT true,
  show_footer BOOLEAN DEFAULT false,
  
  -- Responsive settings
  mobile_hidden BOOLEAN DEFAULT false,
  tablet_config JSONB, -- Optional tablet-specific overrides
  mobile_config JSONB, -- Optional mobile-specific overrides
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_grid_position CHECK (grid_row >= 1 AND grid_column >= 1),
  CONSTRAINT valid_config CHECK (widget_config IS NULL OR jsonb_typeof(widget_config) = 'object'),
  CONSTRAINT valid_tablet_config CHECK (tablet_config IS NULL OR jsonb_typeof(tablet_config) = 'object'),
  CONSTRAINT valid_mobile_config CHECK (mobile_config IS NULL OR jsonb_typeof(mobile_config) = 'object'),
  CONSTRAINT valid_stock_symbol CHECK (stock_symbol IS NULL OR stock_symbol ~ '^[A-Z]{1,5}$'),
  UNIQUE(user_id, portfolio_id, stock_symbol, layout_name, widget_type, grid_row, grid_column)
);

-- Create widget_preferences table for user widget preferences
CREATE TABLE IF NOT EXISTS public.widget_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Global widget preferences
  default_theme TEXT DEFAULT 'light' CHECK (default_theme IN ('light', 'dark', 'system')),
  animation_enabled BOOLEAN DEFAULT true,
  auto_refresh_enabled BOOLEAN DEFAULT true,
  auto_refresh_interval INTEGER DEFAULT 300 CHECK (auto_refresh_interval BETWEEN 30 AND 3600), -- 30 seconds to 1 hour
  
  -- Category-specific preferences
  category_preferences JSONB DEFAULT '{}',
  
  -- Grid layout preferences
  grid_columns INTEGER DEFAULT 2 CHECK (grid_columns BETWEEN 1 AND 4),
  grid_gap TEXT DEFAULT 'md' CHECK (grid_gap IN ('sm', 'md', 'lg')),
  compact_mode BOOLEAN DEFAULT false,
  
  -- Chart preferences
  chart_type TEXT DEFAULT 'line' CHECK (chart_type IN ('line', 'candlestick', 'area', 'bar')),
  chart_theme TEXT DEFAULT 'default' CHECK (chart_theme IN ('default', 'dark', 'minimal', 'colorful')),
  show_volume BOOLEAN DEFAULT true,
  show_grid BOOLEAN DEFAULT true,
  
  -- Data preferences
  currency_display TEXT DEFAULT 'NOK' CHECK (currency_display IN ('NOK', 'USD', 'EUR')),
  number_format TEXT DEFAULT 'norwegian' CHECK (number_format IN ('norwegian', 'international')),
  date_format TEXT DEFAULT 'dd.mm.yyyy' CHECK (date_format IN ('dd.mm.yyyy', 'yyyy-mm-dd', 'mm/dd/yyyy')),
  
  -- Notification preferences
  price_alerts_enabled BOOLEAN DEFAULT true,
  news_alerts_enabled BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT false,
  
  -- Privacy preferences
  share_portfolio_enabled BOOLEAN DEFAULT false,
  public_profile_enabled BOOLEAN DEFAULT false,
  analytics_enabled BOOLEAN DEFAULT true,
  
  -- Advanced settings
  advanced_features_enabled BOOLEAN DEFAULT false,
  beta_features_enabled BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_category_preferences CHECK (category_preferences IS NULL OR jsonb_typeof(category_preferences) = 'object'),
  UNIQUE(user_id) -- One preferences record per user
);

-- Create widget_templates table for predefined widget layouts
CREATE TABLE IF NOT EXISTS public.widget_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Template identification
  template_name TEXT NOT NULL UNIQUE,
  template_type TEXT NOT NULL CHECK (template_type IN ('dashboard', 'portfolio', 'stock', 'custom')),
  category widget_category DEFAULT 'STOCKS',
  
  -- Template description
  display_name TEXT NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  
  -- Template configuration (JSON array of widget configs)
  widgets_config JSONB NOT NULL,
  
  -- Template metadata
  is_system_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 0,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_widgets_config CHECK (jsonb_typeof(widgets_config) = 'array'),
  CONSTRAINT valid_version CHECK (version >= 1)
);

-- Create widget_usage_analytics table for tracking widget usage
CREATE TABLE IF NOT EXISTS public.widget_usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  widget_layout_id UUID REFERENCES public.widget_layouts(id) ON DELETE CASCADE,
  
  -- Usage tracking
  widget_type widget_type NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'interact', 'refresh', 'export', 'configure')),
  
  -- Context
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
  stock_symbol TEXT,
  
  -- Analytics data
  session_id UUID,
  duration_seconds INTEGER,
  interaction_count INTEGER DEFAULT 1,
  
  -- Device/browser info
  device_type TEXT CHECK (device_type IN ('desktop', 'tablet', 'mobile')),
  browser_type TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_duration CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  CONSTRAINT valid_interaction_count CHECK (interaction_count >= 0)
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_widget_layouts_user_id ON public.widget_layouts(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_layouts_portfolio_id ON public.widget_layouts(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_widget_layouts_stock_symbol ON public.widget_layouts(stock_symbol);
CREATE INDEX IF NOT EXISTS idx_widget_layouts_type ON public.widget_layouts(layout_type);
CREATE INDEX IF NOT EXISTS idx_widget_layouts_active ON public.widget_layouts(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_widget_layouts_default ON public.widget_layouts(user_id, layout_type, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_widget_layouts_grid ON public.widget_layouts(user_id, layout_type, grid_row, grid_column);

CREATE INDEX IF NOT EXISTS idx_widget_preferences_user_id ON public.widget_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_preferences_theme ON public.widget_preferences(default_theme);

CREATE INDEX IF NOT EXISTS idx_widget_templates_type ON public.widget_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_widget_templates_category ON public.widget_templates(category);
CREATE INDEX IF NOT EXISTS idx_widget_templates_active ON public.widget_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_widget_templates_system ON public.widget_templates(is_system_template) WHERE is_system_template = true;

CREATE INDEX IF NOT EXISTS idx_widget_usage_user_id ON public.widget_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_usage_layout_id ON public.widget_usage_analytics(widget_layout_id);
CREATE INDEX IF NOT EXISTS idx_widget_usage_type ON public.widget_usage_analytics(widget_type);
CREATE INDEX IF NOT EXISTS idx_widget_usage_date ON public.widget_usage_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_widget_usage_portfolio ON public.widget_usage_analytics(portfolio_id);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_widget_layouts_user_portfolio_active ON public.widget_layouts(user_id, portfolio_id, is_active);
CREATE INDEX IF NOT EXISTS idx_widget_layouts_user_type_active ON public.widget_layouts(user_id, layout_type, is_active);
CREATE INDEX IF NOT EXISTS idx_widget_usage_user_date ON public.widget_usage_analytics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_widget_usage_portfolio_date ON public.widget_usage_analytics(portfolio_id, created_at DESC);

-- Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_widget_layouts_config_gin ON public.widget_layouts USING GIN(widget_config);
CREATE INDEX IF NOT EXISTS idx_widget_layouts_tablet_config_gin ON public.widget_layouts USING GIN(tablet_config);
CREATE INDEX IF NOT EXISTS idx_widget_layouts_mobile_config_gin ON public.widget_layouts USING GIN(mobile_config);
CREATE INDEX IF NOT EXISTS idx_widget_preferences_category_gin ON public.widget_preferences USING GIN(category_preferences);
CREATE INDEX IF NOT EXISTS idx_widget_templates_config_gin ON public.widget_templates USING GIN(widgets_config);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_widget_layouts_updated_at
  BEFORE UPDATE ON public.widget_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_widget_preferences_updated_at
  BEFORE UPDATE ON public.widget_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_widget_templates_updated_at
  BEFORE UPDATE ON public.widget_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate widget grid layout
CREATE OR REPLACE FUNCTION validate_widget_grid_layout()
RETURNS TRIGGER AS $$
DECLARE
  max_row INTEGER;
  max_col INTEGER;
BEGIN
  -- Get the maximum grid dimensions for the layout
  SELECT 
    COALESCE(MAX(grid_row + grid_row_span - 1), 0),
    COALESCE(MAX(grid_column + grid_column_span - 1), 0)
  INTO max_row, max_col
  FROM public.widget_layouts
  WHERE user_id = NEW.user_id 
    AND layout_type = NEW.layout_type
    AND COALESCE(portfolio_id, '') = COALESCE(NEW.portfolio_id, '')
    AND COALESCE(stock_symbol, '') = COALESCE(NEW.stock_symbol, '')
    AND is_active = true
    AND (TG_OP = 'INSERT' OR id != NEW.id);
  
  -- Add the new widget dimensions
  max_row := GREATEST(max_row, NEW.grid_row + NEW.grid_row_span - 1);
  max_col := GREATEST(max_col, NEW.grid_column + NEW.grid_column_span - 1);
  
  -- Check if layout exceeds reasonable grid limits
  IF max_row > 10 OR max_col > 4 THEN
    RAISE EXCEPTION 'Widget layout exceeds maximum grid dimensions (10x4). Current: %x%', max_row, max_col;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for grid layout validation
CREATE TRIGGER validate_widget_grid_layout_trigger
  BEFORE INSERT OR UPDATE ON public.widget_layouts
  FOR EACH ROW
  EXECUTE FUNCTION validate_widget_grid_layout();

-- Create function to check widget overlap
CREATE OR REPLACE FUNCTION check_widget_overlap()
RETURNS TRIGGER AS $$
DECLARE
  overlap_count INTEGER;
BEGIN
  -- Check for overlapping widgets in the same layout
  SELECT COUNT(*)
  INTO overlap_count
  FROM public.widget_layouts
  WHERE user_id = NEW.user_id
    AND layout_type = NEW.layout_type
    AND COALESCE(portfolio_id, '') = COALESCE(NEW.portfolio_id, '')
    AND COALESCE(stock_symbol, '') = COALESCE(NEW.stock_symbol, '')
    AND is_active = true
    AND (TG_OP = 'INSERT' OR id != NEW.id)
    AND (
      -- Check if rectangles overlap
      NOT (
        NEW.grid_row >= grid_row + grid_row_span OR
        grid_row >= NEW.grid_row + NEW.grid_row_span OR
        NEW.grid_column >= grid_column + grid_column_span OR
        grid_column >= NEW.grid_column + NEW.grid_column_span
      )
    );
  
  IF overlap_count > 0 THEN
    RAISE EXCEPTION 'Widget overlaps with existing widget in the same layout position';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for overlap checking
CREATE TRIGGER check_widget_overlap_trigger
  BEFORE INSERT OR UPDATE ON public.widget_layouts
  FOR EACH ROW
  EXECUTE FUNCTION check_widget_overlap();

-- Create function to ensure only one default layout per type
CREATE OR REPLACE FUNCTION ensure_single_default_layout()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Clear other default layouts of the same type
    UPDATE public.widget_layouts
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND layout_type = NEW.layout_type
      AND COALESCE(portfolio_id, '') = COALESCE(NEW.portfolio_id, '')
      AND COALESCE(stock_symbol, '') = COALESCE(NEW.stock_symbol, '')
      AND is_default = true
      AND (TG_OP = 'INSERT' OR id != NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for default layout management
CREATE TRIGGER ensure_single_default_layout_trigger
  BEFORE INSERT OR UPDATE ON public.widget_layouts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_layout();

-- Create function to increment template usage
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment usage count when a template is used
  UPDATE public.widget_templates
  SET usage_count = usage_count + 1
  WHERE template_name = NEW.layout_name
    AND is_system_template = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for template usage tracking
CREATE TRIGGER increment_template_usage_trigger
  AFTER INSERT ON public.widget_layouts
  FOR EACH ROW
  EXECUTE FUNCTION increment_template_usage();

-- Enable Row Level Security (RLS)
ALTER TABLE public.widget_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_usage_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for widget_layouts
CREATE POLICY "Users can view own widget layouts" ON public.widget_layouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own widget layouts" ON public.widget_layouts
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for widget_preferences
CREATE POLICY "Users can view own widget preferences" ON public.widget_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own widget preferences" ON public.widget_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for widget_templates
CREATE POLICY "Widget templates are publicly readable" ON public.widget_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage own widget templates" ON public.widget_templates
  FOR ALL USING (auth.uid() = created_by);

-- Create RLS policies for widget_usage_analytics
CREATE POLICY "Users can view own widget usage analytics" ON public.widget_usage_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own widget usage analytics" ON public.widget_usage_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.widget_layouts IS 'User widget configurations and layout preferences';
COMMENT ON TABLE public.widget_preferences IS 'Global widget preferences per user';
COMMENT ON TABLE public.widget_templates IS 'Predefined widget layout templates';
COMMENT ON TABLE public.widget_usage_analytics IS 'Widget usage analytics and tracking';

COMMENT ON COLUMN public.widget_layouts.widget_config IS 'JSON configuration for widget-specific settings';
COMMENT ON COLUMN public.widget_layouts.tablet_config IS 'Tablet-specific configuration overrides';
COMMENT ON COLUMN public.widget_layouts.mobile_config IS 'Mobile-specific configuration overrides';
COMMENT ON COLUMN public.widget_preferences.category_preferences IS 'Category-specific user preferences';
COMMENT ON COLUMN public.widget_templates.widgets_config IS 'JSON array of widget configurations in template';

COMMENT ON FUNCTION validate_widget_grid_layout() IS 'Validates widget grid layout dimensions';
COMMENT ON FUNCTION check_widget_overlap() IS 'Prevents overlapping widgets in same layout';
COMMENT ON FUNCTION ensure_single_default_layout() IS 'Ensures only one default layout per type';
COMMENT ON FUNCTION increment_template_usage() IS 'Tracks template usage statistics';