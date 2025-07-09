#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { join } from 'path'

// Load environment variables
config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Define the SQL statements manually
const createWidgetLayoutsTable = `
CREATE TABLE IF NOT EXISTS public.widget_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  portfolio_id UUID,
  stock_symbol TEXT,
  layout_name TEXT NOT NULL,
  layout_type TEXT NOT NULL CHECK (layout_type IN ('dashboard', 'portfolio', 'stock', 'custom')),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  widget_type TEXT NOT NULL,
  widget_category TEXT DEFAULT 'STOCKS',
  widget_size TEXT DEFAULT 'MEDIUM',
  grid_row INTEGER NOT NULL DEFAULT 1,
  grid_column INTEGER NOT NULL DEFAULT 1,
  grid_row_span INTEGER DEFAULT 1 CHECK (grid_row_span >= 1 AND grid_row_span <= 4),
  grid_column_span INTEGER DEFAULT 1 CHECK (grid_column_span >= 1 AND grid_column_span <= 4),
  widget_config JSONB DEFAULT '{}',
  title TEXT,
  description TEXT,
  show_header BOOLEAN DEFAULT true,
  show_footer BOOLEAN DEFAULT false,
  mobile_hidden BOOLEAN DEFAULT false,
  tablet_config JSONB,
  mobile_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_grid_position CHECK (grid_row >= 1 AND grid_column >= 1),
  CONSTRAINT valid_config CHECK (widget_config IS NULL OR jsonb_typeof(widget_config) = 'object'),
  CONSTRAINT valid_tablet_config CHECK (tablet_config IS NULL OR jsonb_typeof(tablet_config) = 'object'),
  CONSTRAINT valid_mobile_config CHECK (mobile_config IS NULL OR jsonb_typeof(mobile_config) = 'object'),
  CONSTRAINT valid_stock_symbol CHECK (stock_symbol IS NULL OR stock_symbol ~ '^[A-Z]{1,5}$')
);
`

const createWidgetPreferencesTable = `
CREATE TABLE IF NOT EXISTS public.widget_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  default_theme TEXT DEFAULT 'light' CHECK (default_theme IN ('light', 'dark', 'system')),
  animation_enabled BOOLEAN DEFAULT true,
  auto_refresh_enabled BOOLEAN DEFAULT true,
  auto_refresh_interval INTEGER DEFAULT 300 CHECK (auto_refresh_interval BETWEEN 30 AND 3600),
  category_preferences JSONB DEFAULT '{}',
  grid_columns INTEGER DEFAULT 2 CHECK (grid_columns BETWEEN 1 AND 4),
  grid_gap TEXT DEFAULT 'md' CHECK (grid_gap IN ('sm', 'md', 'lg')),
  compact_mode BOOLEAN DEFAULT false,
  chart_type TEXT DEFAULT 'line' CHECK (chart_type IN ('line', 'candlestick', 'area', 'bar')),
  chart_theme TEXT DEFAULT 'default' CHECK (chart_theme IN ('default', 'dark', 'minimal', 'colorful')),
  show_volume BOOLEAN DEFAULT true,
  show_grid BOOLEAN DEFAULT true,
  currency_display TEXT DEFAULT 'NOK' CHECK (currency_display IN ('NOK', 'USD', 'EUR')),
  number_format TEXT DEFAULT 'norwegian' CHECK (number_format IN ('norwegian', 'international')),
  date_format TEXT DEFAULT 'dd.mm.yyyy' CHECK (date_format IN ('dd.mm.yyyy', 'yyyy-mm-dd', 'mm/dd/yyyy')),
  price_alerts_enabled BOOLEAN DEFAULT true,
  news_alerts_enabled BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT false,
  share_portfolio_enabled BOOLEAN DEFAULT false,
  public_profile_enabled BOOLEAN DEFAULT false,
  analytics_enabled BOOLEAN DEFAULT true,
  advanced_features_enabled BOOLEAN DEFAULT false,
  beta_features_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_category_preferences CHECK (category_preferences IS NULL OR jsonb_typeof(category_preferences) = 'object'),
  UNIQUE(user_id)
);
`

const createWidgetTemplatesTable = `
CREATE TABLE IF NOT EXISTS public.widget_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  template_type TEXT NOT NULL CHECK (template_type IN ('dashboard', 'portfolio', 'stock', 'custom')),
  category TEXT DEFAULT 'STOCKS',
  display_name TEXT NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  widgets_config JSONB NOT NULL,
  is_system_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  usage_count INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_widgets_config CHECK (jsonb_typeof(widgets_config) = 'array'),
  CONSTRAINT valid_version CHECK (version >= 1)
);
`

const createWidgetUsageAnalyticsTable = `
CREATE TABLE IF NOT EXISTS public.widget_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  widget_layout_id UUID,
  widget_type TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'interact', 'refresh', 'export', 'configure')),
  portfolio_id UUID,
  stock_symbol TEXT,
  session_id UUID,
  duration_seconds INTEGER,
  interaction_count INTEGER DEFAULT 1,
  device_type TEXT CHECK (device_type IN ('desktop', 'tablet', 'mobile')),
  browser_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_duration CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  CONSTRAINT valid_interaction_count CHECK (interaction_count >= 0)
);
`

const createIndexes = `
CREATE INDEX IF NOT EXISTS idx_widget_layouts_user_id ON public.widget_layouts(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_layouts_portfolio_id ON public.widget_layouts(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_widget_layouts_stock_symbol ON public.widget_layouts(stock_symbol);
CREATE INDEX IF NOT EXISTS idx_widget_layouts_type ON public.widget_layouts(layout_type);
CREATE INDEX IF NOT EXISTS idx_widget_layouts_active ON public.widget_layouts(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_widget_layouts_config_gin ON public.widget_layouts USING GIN(widget_config);
CREATE INDEX IF NOT EXISTS idx_widget_preferences_user_id ON public.widget_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_templates_type ON public.widget_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_widget_templates_active ON public.widget_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_widget_usage_user_id ON public.widget_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_usage_date ON public.widget_usage_analytics(created_at);
`

const enableRLS = `
ALTER TABLE public.widget_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_usage_analytics ENABLE ROW LEVEL SECURITY;
`

const createPolicies = `
CREATE POLICY "Users can view own widget layouts" ON public.widget_layouts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own widget layouts" ON public.widget_layouts
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view own widget preferences" ON public.widget_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own widget preferences" ON public.widget_preferences
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Widget templates are publicly readable" ON public.widget_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own widget usage analytics" ON public.widget_usage_analytics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own widget usage analytics" ON public.widget_usage_analytics
  FOR INSERT WITH CHECK (user_id = auth.uid());
`

async function runManualMigration() {
  console.log('🚀 Running Manual Widget Database Migration...')
  
  const statements = [
    { name: 'widget_layouts table', sql: createWidgetLayoutsTable },
    { name: 'widget_preferences table', sql: createWidgetPreferencesTable },
    { name: 'widget_templates table', sql: createWidgetTemplatesTable },
    { name: 'widget_usage_analytics table', sql: createWidgetUsageAnalyticsTable },
    { name: 'indexes', sql: createIndexes },
    { name: 'row level security', sql: enableRLS },
    { name: 'security policies', sql: createPolicies }
  ]
  
  for (const statement of statements) {
    try {
      console.log(`⏳ Creating ${statement.name}...`)
      const { error } = await supabase.from('_').select('*').limit(0) // Test connection
      
      // Use direct SQL query for DDL statements
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql: statement.sql })
      
      if (sqlError) {
        console.error(`❌ ${statement.name} failed:`, sqlError.message)
      } else {
        console.log(`✅ ${statement.name} created successfully`)
      }
    } catch (error) {
      console.error(`❌ ${statement.name} error:`, error)
    }
  }
  
  // Test the tables
  console.log('\n🔍 Testing created tables...')
  await testTables()
  
  console.log('\n🎉 Manual widget database migration completed!')
}

async function testTables() {
  const tables = ['widget_layouts', 'widget_preferences', 'widget_templates', 'widget_usage_analytics']
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0)
        
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: Available`)
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err}`)
    }
  }
}

// Run the migration
runManualMigration()