-- System Widget Templates for LifeDash
-- Pre-defined templates for common widget layouts

-- Insert system templates for different layout types
INSERT INTO public.widget_templates (
  template_name,
  template_type,
  category,
  display_name,
  description,
  widgets_config,
  is_system_template,
  is_active,
  version
) VALUES
-- Dashboard Templates
(
  'default_dashboard',
  'dashboard',
  'STOCKS',
  'Standard Dashboard',
  'Standard dashboard layout with hero chart and key metrics',
  '[
    {
      "widget_type": "HERO_PORTFOLIO_CHART",
      "widget_category": "STOCKS",
      "widget_size": "HERO",
      "grid_row": 1,
      "grid_column": 1,
      "grid_row_span": 2,
      "grid_column_span": 2,
      "widget_config": {
        "chartType": "line",
        "showVolume": true,
        "timeframe": "1M",
        "showTechnicalIndicators": false
      },
      "title": "Portfolio Performance",
      "description": "Your portfolio performance over time",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false,
      "tablet_config": {
        "size": "LARGE",
        "gridRowSpan": 2,
        "gridColumnSpan": 2
      },
      "mobile_config": {
        "size": "LARGE",
        "gridRowSpan": 2,
        "gridColumnSpan": 1
      }
    },
    {
      "widget_type": "METRICS_GRID",
      "widget_category": "STOCKS",
      "widget_size": "MEDIUM",
      "grid_row": 3,
      "grid_column": 1,
      "grid_row_span": 1,
      "grid_column_span": 1,
      "widget_config": {
        "metrics": ["total_value", "total_return", "day_change", "unrealized_pnl"],
        "showPercentageChange": true,
        "showSparklines": true,
        "compactView": false
      },
      "title": "Key Metrics",
      "description": "Portfolio key performance indicators",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false
    },
    {
      "widget_type": "ACTIVITY_FEED",
      "widget_category": "STOCKS",
      "widget_size": "MEDIUM",
      "grid_row": 3,
      "grid_column": 2,
      "grid_row_span": 1,
      "grid_column_span": 1,
      "widget_config": {
        "maxItems": 10,
        "showImages": false,
        "showSummary": true
      },
      "title": "Recent Activity",
      "description": "Latest transactions and portfolio changes",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false
    }
  ]'::jsonb,
  true,
  true,
  1
),

-- Compact Dashboard Template
(
  'compact_dashboard',
  'dashboard',
  'STOCKS',
  'Compact Dashboard',
  'Compact dashboard layout for smaller screens',
  '[
    {
      "widget_type": "CATEGORY_MINI_CHART",
      "widget_category": "STOCKS",
      "widget_size": "SMALL",
      "grid_row": 1,
      "grid_column": 1,
      "grid_row_span": 1,
      "grid_column_span": 1,
      "widget_config": {
        "chartType": "area",
        "showVolume": false,
        "timeframe": "1W"
      },
      "title": "Stocks",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false
    },
    {
      "widget_type": "CATEGORY_MINI_CHART",
      "widget_category": "CRYPTO",
      "widget_size": "SMALL",
      "grid_row": 1,
      "grid_column": 2,
      "grid_row_span": 1,
      "grid_column_span": 1,
      "widget_config": {
        "chartType": "area",
        "showVolume": false,
        "timeframe": "1W"
      },
      "title": "Crypto",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false
    },
    {
      "widget_type": "METRICS_GRID",
      "widget_category": "STOCKS",
      "widget_size": "MEDIUM",
      "grid_row": 2,
      "grid_column": 1,
      "grid_row_span": 1,
      "grid_column_span": 2,
      "widget_config": {
        "metrics": ["total_value", "day_change", "total_return"],
        "showPercentageChange": true,
        "showSparklines": false,
        "compactView": true
      },
      "title": "Portfolio Summary",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false
    }
  ]'::jsonb,
  true,
  true,
  1
),

-- Portfolio Templates
(
  'detailed_portfolio',
  'portfolio',
  'STOCKS',
  'Detailed Portfolio View',
  'Comprehensive portfolio view with holdings table and allocation chart',
  '[
    {
      "widget_type": "HOLDINGS_TABLE_RICH",
      "widget_category": "STOCKS",
      "widget_size": "LARGE",
      "grid_row": 1,
      "grid_column": 1,
      "grid_row_span": 2,
      "grid_column_span": 2,
      "widget_config": {
        "columns": ["symbol", "quantity", "current_price", "market_value", "cost_basis", "pnl", "pnl_percent", "day_change", "actions"],
        "sortBy": "market_value",
        "sortDirection": "desc",
        "pageSize": 20,
        "showPagination": true,
        "showSearch": true,
        "showFilters": true,
        "compactMode": false
      },
      "title": "Holdings",
      "description": "Complete overview of your portfolio holdings",
      "show_header": true,
      "show_footer": true,
      "mobile_hidden": false
    },
    {
      "widget_type": "PORTFOLIO_ALLOCATION",
      "widget_category": "STOCKS",
      "widget_size": "MEDIUM",
      "grid_row": 3,
      "grid_column": 1,
      "grid_row_span": 1,
      "grid_column_span": 1,
      "widget_config": {
        "chartType": "pie",
        "showPercentages": true,
        "groupByCategory": true
      },
      "title": "Asset Allocation",
      "description": "Portfolio allocation by asset class",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false
    },
    {
      "widget_type": "PERFORMANCE_METRICS",
      "widget_category": "STOCKS",
      "widget_size": "MEDIUM",
      "grid_row": 3,
      "grid_column": 2,
      "grid_row_span": 1,
      "grid_column_span": 1,
      "widget_config": {
        "metrics": ["sharpe_ratio", "volatility", "max_drawdown", "beta"],
        "showSparklines": true,
        "timeframe": "1Y"
      },
      "title": "Performance Metrics",
      "description": "Advanced portfolio performance analytics",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false
    }
  ]'::jsonb,
  true,
  true,
  1
),

-- Stock Detail Templates
(
  'stock_analysis',
  'stock',
  'STOCKS',
  'Stock Analysis View',
  'Comprehensive stock analysis with chart and key metrics',
  '[
    {
      "widget_type": "STOCK_PERFORMANCE_CHART",
      "widget_category": "STOCKS",
      "widget_size": "HERO",
      "grid_row": 1,
      "grid_column": 1,
      "grid_row_span": 2,
      "grid_column_span": 2,
      "widget_config": {
        "chartType": "candlestick",
        "showVolume": true,
        "showTechnicalIndicators": true,
        "indicators": ["SMA", "RSI", "MACD"],
        "timeframe": "3M"
      },
      "title": "Stock Chart",
      "description": "Technical analysis chart with indicators",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false
    },
    {
      "widget_type": "STOCK_DETAIL_CARD",
      "widget_category": "STOCKS",
      "widget_size": "MEDIUM",
      "grid_row": 3,
      "grid_column": 1,
      "grid_row_span": 1,
      "grid_column_span": 1,
      "widget_config": {
        "showFundamentals": true,
        "showKeyStats": true,
        "showAnalystRatings": true
      },
      "title": "Stock Details",
      "description": "Company information and key statistics",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false
    },
    {
      "widget_type": "TRANSACTION_HISTORY",
      "widget_category": "STOCKS",
      "widget_size": "MEDIUM",
      "grid_row": 3,
      "grid_column": 2,
      "grid_row_span": 1,
      "grid_column_span": 1,
      "widget_config": {
        "maxItems": 20,
        "showFilters": true,
        "groupByDate": true
      },
      "title": "Transaction History",
      "description": "Your transaction history for this stock",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false
    }
  ]'::jsonb,
  true,
  true,
  1
),

-- Crypto Dashboard Template
(
  'crypto_dashboard',
  'dashboard',
  'CRYPTO',
  'Crypto Dashboard',
  'Cryptocurrency-focused dashboard layout',
  '[
    {
      "widget_type": "HERO_PORTFOLIO_CHART",
      "widget_category": "CRYPTO",
      "widget_size": "HERO",
      "grid_row": 1,
      "grid_column": 1,
      "grid_row_span": 2,
      "grid_column_span": 2,
      "widget_config": {
        "chartType": "candlestick",
        "showVolume": true,
        "timeframe": "1D",
        "showTechnicalIndicators": true
      },
      "title": "Crypto Portfolio",
      "description": "Cryptocurrency portfolio performance",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false
    },
    {
      "widget_type": "WATCHLIST",
      "widget_category": "CRYPTO",
      "widget_size": "MEDIUM",
      "grid_row": 3,
      "grid_column": 1,
      "grid_row_span": 1,
      "grid_column_span": 1,
      "widget_config": {
        "maxItems": 10,
        "showPriceChange": true,
        "showSparklines": true
      },
      "title": "Crypto Watchlist",
      "description": "Cryptocurrencies you are monitoring",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false
    },
    {
      "widget_type": "NEWS_FEED",
      "widget_category": "CRYPTO",
      "widget_size": "MEDIUM",
      "grid_row": 3,
      "grid_column": 2,
      "grid_row_span": 1,
      "grid_column_span": 1,
      "widget_config": {
        "sources": ["coindesk", "cointelegraph", "cryptonews"],
        "maxItems": 5,
        "showImages": true,
        "showSummary": true
      },
      "title": "Crypto News",
      "description": "Latest cryptocurrency news and updates",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false
    }
  ]'::jsonb,
  true,
  true,
  1
),

-- Mobile-Optimized Template
(
  'mobile_optimized',
  'dashboard',
  'STOCKS',
  'Mobile Dashboard',
  'Mobile-optimized dashboard layout',
  '[
    {
      "widget_type": "METRICS_GRID",
      "widget_category": "STOCKS",
      "widget_size": "MEDIUM",
      "grid_row": 1,
      "grid_column": 1,
      "grid_row_span": 1,
      "grid_column_span": 1,
      "widget_config": {
        "metrics": ["total_value", "day_change", "total_return"],
        "showPercentageChange": true,
        "showSparklines": false,
        "compactView": true
      },
      "title": "Portfolio Summary",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false
    },
    {
      "widget_type": "CATEGORY_MINI_CHART",
      "widget_category": "STOCKS",
      "widget_size": "MEDIUM",
      "grid_row": 2,
      "grid_column": 1,
      "grid_row_span": 1,
      "grid_column_span": 1,
      "widget_config": {
        "chartType": "area",
        "showVolume": false,
        "timeframe": "1W"
      },
      "title": "Performance",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false
    },
    {
      "widget_type": "HOLDINGS_TABLE_RICH",
      "widget_category": "STOCKS",
      "widget_size": "LARGE",
      "grid_row": 3,
      "grid_column": 1,
      "grid_row_span": 2,
      "grid_column_span": 1,
      "widget_config": {
        "columns": ["symbol", "quantity", "current_price", "pnl_percent"],
        "sortBy": "market_value",
        "sortDirection": "desc",
        "pageSize": 10,
        "showPagination": true,
        "showSearch": false,
        "showFilters": false,
        "compactMode": true
      },
      "title": "Holdings",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false,
      "mobile_config": {
        "size": "LARGE",
        "gridRowSpan": 2,
        "gridColumnSpan": 1,
        "config": {
          "columns": ["symbol", "pnl_percent"],
          "compactMode": true
        }
      }
    }
  ]'::jsonb,
  true,
  true,
  1
),

-- Minimal Template
(
  'minimal_dashboard',
  'dashboard',
  'STOCKS',
  'Minimal Dashboard',
  'Clean, minimal dashboard with essential information only',
  '[
    {
      "widget_type": "HERO_PORTFOLIO_CHART",
      "widget_category": "STOCKS",
      "widget_size": "HERO",
      "grid_row": 1,
      "grid_column": 1,
      "grid_row_span": 3,
      "grid_column_span": 2,
      "widget_config": {
        "chartType": "line",
        "showVolume": false,
        "timeframe": "1M",
        "showTechnicalIndicators": false,
        "showGrid": false
      },
      "title": "Portfolio",
      "show_header": false,
      "show_footer": false,
      "mobile_hidden": false
    }
  ]'::jsonb,
  true,
  true,
  1
),

-- Advanced Analytics Template
(
  'advanced_analytics',
  'portfolio',
  'STOCKS',
  'Advanced Analytics',
  'Advanced portfolio analytics and performance metrics',
  '[
    {
      "widget_type": "PERFORMANCE_METRICS",
      "widget_category": "STOCKS",
      "widget_size": "LARGE",
      "grid_row": 1,
      "grid_column": 1,
      "grid_row_span": 1,
      "grid_column_span": 2,
      "widget_config": {
        "metrics": ["sharpe_ratio", "volatility", "max_drawdown", "beta", "alpha", "sortino_ratio"],
        "showSparklines": true,
        "timeframe": "1Y",
        "showBenchmarkComparison": true
      },
      "title": "Risk & Performance Analytics",
      "description": "Advanced portfolio risk and performance metrics",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false
    },
    {
      "widget_type": "PORTFOLIO_ALLOCATION",
      "widget_category": "STOCKS",
      "widget_size": "MEDIUM",
      "grid_row": 2,
      "grid_column": 1,
      "grid_row_span": 1,
      "grid_column_span": 1,
      "widget_config": {
        "chartType": "treemap",
        "showPercentages": true,
        "groupByCategory": false,
        "showRebalancingOpportunities": true
      },
      "title": "Asset Allocation",
      "description": "Portfolio allocation with rebalancing suggestions",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false
    },
    {
      "widget_type": "HOLDINGS_TABLE_RICH",
      "widget_category": "STOCKS",
      "widget_size": "MEDIUM",
      "grid_row": 2,
      "grid_column": 2,
      "grid_row_span": 1,
      "grid_column_span": 1,
      "widget_config": {
        "columns": ["symbol", "beta", "volatility", "sharpe_ratio", "correlation"],
        "sortBy": "sharpe_ratio",
        "sortDirection": "desc",
        "pageSize": 15,
        "showPagination": true,
        "showSearch": true,
        "showFilters": true,
        "compactMode": false
      },
      "title": "Risk Analysis",
      "description": "Individual stock risk metrics",
      "show_header": true,
      "show_footer": false,
      "mobile_hidden": false
    }
  ]'::jsonb,
  true,
  true,
  1
);

-- Create function to apply default template for new users
CREATE OR REPLACE FUNCTION apply_default_widget_template_for_user(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Apply default dashboard template
  INSERT INTO public.widget_layouts (
    user_id,
    layout_name,
    layout_type,
    is_default,
    is_active,
    widget_type,
    widget_category,
    widget_size,
    grid_row,
    grid_column,
    grid_row_span,
    grid_column_span,
    widget_config,
    title,
    description,
    show_header,
    show_footer,
    mobile_hidden,
    tablet_config,
    mobile_config
  )
  SELECT
    user_uuid,
    'Default Dashboard',
    'dashboard',
    true,
    true,
    (widget->>'widget_type')::widget_type,
    (widget->>'widget_category')::widget_category,
    (widget->>'widget_size')::widget_size,
    (widget->>'grid_row')::integer,
    (widget->>'grid_column')::integer,
    (widget->>'grid_row_span')::integer,
    (widget->>'grid_column_span')::integer,
    widget->'widget_config',
    widget->>'title',
    widget->>'description',
    (widget->>'show_header')::boolean,
    (widget->>'show_footer')::boolean,
    (widget->>'mobile_hidden')::boolean,
    widget->'tablet_config',
    widget->'mobile_config'
  FROM public.widget_templates,
       jsonb_array_elements(widgets_config) AS widget
  WHERE template_name = 'default_dashboard'
    AND is_system_template = true
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION apply_default_widget_template_for_user(UUID) IS 'Applies default widget template for new users';

-- Create trigger to apply default template when user preferences are created
CREATE OR REPLACE FUNCTION apply_default_template_on_preferences_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Apply default template when user preferences are first created
  PERFORM apply_default_widget_template_for_user(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER apply_default_template_trigger
  AFTER INSERT ON public.widget_preferences
  FOR EACH ROW
  EXECUTE FUNCTION apply_default_template_on_preferences_insert();

-- Add comments
COMMENT ON FUNCTION apply_default_template_on_preferences_insert() IS 'Triggers default template application when user preferences are created';
COMMENT ON TRIGGER apply_default_template_trigger ON public.widget_preferences IS 'Applies default widget template for new users';