export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number: string | null
          account_type: Database['public']['Enums']['account_type']
          api_credentials: Json | null
          auto_sync: boolean | null
          cost_basis_method: string | null
          created_at: string
          currency: Database['public']['Enums']['currency_code'] | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          name: string
          opening_balance: number | null
          opening_date: string | null
          platform_id: string
          portfolio_id: string
          sync_frequency: number | null
          tax_year_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          account_type: Database['public']['Enums']['account_type']
          api_credentials?: Json | null
          auto_sync?: boolean | null
          cost_basis_method?: string | null
          created_at?: string
          currency?: Database['public']['Enums']['currency_code'] | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name: string
          opening_balance?: number | null
          opening_date?: string | null
          platform_id: string
          portfolio_id: string
          sync_frequency?: number | null
          tax_year_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          account_type?: Database['public']['Enums']['account_type']
          api_credentials?: Json | null
          auto_sync?: boolean | null
          cost_basis_method?: string | null
          created_at?: string
          currency?: Database['public']['Enums']['currency_code'] | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name?: string
          opening_balance?: number | null
          opening_date?: string | null
          platform_id?: string
          portfolio_id?: string
          sync_frequency?: number | null
          tax_year_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'accounts_platform_id_fkey'
            columns: ['platform_id']
            isOneToOne: false
            referencedRelation: 'platforms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'accounts_portfolio_id_fkey'
            columns: ['portfolio_id']
            isOneToOne: false
            referencedRelation: 'portfolios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'accounts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      api_usage_logs: {
        Row: {
          api_key_id: string | null
          client_id: string | null
          created_at: string
          duration_ms: number | null
          endpoint: string
          error_code: string | null
          error_message: string | null
          id: string
          ip_address: unknown
          method: string
          path: string
          query_params: Json | null
          quota_limit: number | null
          quota_used: number | null
          rate_limit_remaining: number | null
          response_size: number | null
          status_code: number
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          api_key_id?: string | null
          client_id?: string | null
          created_at?: string
          duration_ms?: number | null
          endpoint: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address: unknown
          method: string
          path: string
          query_params?: Json | null
          quota_limit?: number | null
          quota_used?: number | null
          rate_limit_remaining?: number | null
          response_size?: number | null
          status_code: number
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          api_key_id?: string | null
          client_id?: string | null
          created_at?: string
          duration_ms?: number | null
          endpoint?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          method?: string
          path?: string
          query_params?: Json | null
          quota_limit?: number | null
          quota_used?: number | null
          rate_limit_remaining?: number | null
          response_size?: number | null
          status_code?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'api_usage_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      audit_logs: {
        Row: {
          action: Database['public']['Enums']['audit_action']
          browser: string | null
          changes: Json | null
          city: string | null
          country_code: string | null
          created_at: string
          device_type: string | null
          duration_ms: number | null
          endpoint: string | null
          error_code: string | null
          error_message: string | null
          id: string
          ip_address: unknown | null
          is_sensitive: boolean | null
          metadata: Json | null
          method: string | null
          new_values: Json | null
          old_values: Json | null
          os: string | null
          resource_id: string | null
          resource_type: string
          retention_date: string | null
          session_id: string | null
          stack_trace: string | null
          success: boolean | null
          tags: string[] | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: Database['public']['Enums']['audit_action']
          browser?: string | null
          changes?: Json | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          duration_ms?: number | null
          endpoint?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          is_sensitive?: boolean | null
          metadata?: Json | null
          method?: string | null
          new_values?: Json | null
          old_values?: Json | null
          os?: string | null
          resource_id?: string | null
          resource_type: string
          retention_date?: string | null
          session_id?: string | null
          stack_trace?: string | null
          success?: boolean | null
          tags?: string[] | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database['public']['Enums']['audit_action']
          browser?: string | null
          changes?: Json | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          duration_ms?: number | null
          endpoint?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          is_sensitive?: boolean | null
          metadata?: Json | null
          method?: string | null
          new_values?: Json | null
          old_values?: Json | null
          os?: string | null
          resource_id?: string | null
          resource_type?: string
          retention_date?: string | null
          session_id?: string | null
          stack_trace?: string | null
          success?: boolean | null
          tags?: string[] | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      data_changes: {
        Row: {
          audit_log_id: string
          change_type: string
          created_at: string
          data_type: string | null
          field_name: string
          id: string
          is_sensitive: boolean | null
          new_value: string | null
          old_value: string | null
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          audit_log_id: string
          change_type: string
          created_at?: string
          data_type?: string | null
          field_name: string
          id?: string
          is_sensitive?: boolean | null
          new_value?: string | null
          old_value?: string | null
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          audit_log_id?: string
          change_type?: string
          created_at?: string
          data_type?: string | null
          field_name?: string
          id?: string
          is_sensitive?: boolean | null
          new_value?: string | null
          old_value?: string | null
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'data_changes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      dividend_payments: {
        Row: {
          account_id: string
          amount_per_share: number
          created_at: string
          currency: Database['public']['Enums']['currency_code']
          ex_date: string
          exchange_rate: number | null
          foreign_tax_paid: number | null
          id: string
          is_reinvested: boolean | null
          payment_date: string
          qualified_dividend: boolean | null
          record_date: string | null
          reinvestment_transaction_id: string | null
          shares_held: number
          stock_id: string
          tax_withheld: number | null
          total_amount: number
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          amount_per_share: number
          created_at?: string
          currency: Database['public']['Enums']['currency_code']
          ex_date: string
          exchange_rate?: number | null
          foreign_tax_paid?: number | null
          id?: string
          is_reinvested?: boolean | null
          payment_date: string
          qualified_dividend?: boolean | null
          record_date?: string | null
          reinvestment_transaction_id?: string | null
          shares_held: number
          stock_id: string
          tax_withheld?: number | null
          total_amount: number
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          amount_per_share?: number
          created_at?: string
          currency?: Database['public']['Enums']['currency_code']
          ex_date?: string
          exchange_rate?: number | null
          foreign_tax_paid?: number | null
          id?: string
          is_reinvested?: boolean | null
          payment_date?: string
          qualified_dividend?: boolean | null
          record_date?: string | null
          reinvestment_transaction_id?: string | null
          shares_held?: number
          stock_id?: string
          tax_withheld?: number | null
          total_amount?: number
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'dividend_payments_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'dividend_payments_reinvestment_transaction_id_fkey'
            columns: ['reinvestment_transaction_id']
            isOneToOne: false
            referencedRelation: 'transactions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'dividend_payments_stock_id_fkey'
            columns: ['stock_id']
            isOneToOne: false
            referencedRelation: 'stocks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'dividend_payments_transaction_id_fkey'
            columns: ['transaction_id']
            isOneToOne: false
            referencedRelation: 'transactions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'dividend_payments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      holdings: {
        Row: {
          account_id: string
          allocation_percent: number | null
          asset_class_allocation: number | null
          average_cost: number
          created_at: string
          currency: Database['public']['Enums']['currency_code']
          current_price: number | null
          day_change: number | null
          day_change_percent: number | null
          first_purchase_date: string | null
          holding_period_days: number | null
          id: string
          is_active: boolean | null
          last_price_update: string | null
          last_transaction_date: string | null
          market_value: number | null
          previous_close: number | null
          quantity: number
          stock_id: string
          tax_lots: Json | null
          total_cost: number
          unrealized_pnl: number | null
          unrealized_pnl_percent: number | null
          updated_at: string
          user_id: string
          wash_sale_loss_deferred: number | null
        }
        Insert: {
          account_id: string
          allocation_percent?: number | null
          asset_class_allocation?: number | null
          average_cost?: number
          created_at?: string
          currency: Database['public']['Enums']['currency_code']
          current_price?: number | null
          day_change?: number | null
          day_change_percent?: number | null
          first_purchase_date?: string | null
          holding_period_days?: number | null
          id?: string
          is_active?: boolean | null
          last_price_update?: string | null
          last_transaction_date?: string | null
          market_value?: number | null
          previous_close?: number | null
          quantity?: number
          stock_id: string
          tax_lots?: Json | null
          total_cost?: number
          unrealized_pnl?: number | null
          unrealized_pnl_percent?: number | null
          updated_at?: string
          user_id: string
          wash_sale_loss_deferred?: number | null
        }
        Update: {
          account_id?: string
          allocation_percent?: number | null
          asset_class_allocation?: number | null
          average_cost?: number
          created_at?: string
          currency?: Database['public']['Enums']['currency_code']
          current_price?: number | null
          day_change?: number | null
          day_change_percent?: number | null
          first_purchase_date?: string | null
          holding_period_days?: number | null
          id?: string
          is_active?: boolean | null
          last_price_update?: string | null
          last_transaction_date?: string | null
          market_value?: number | null
          previous_close?: number | null
          quantity?: number
          stock_id?: string
          tax_lots?: Json | null
          total_cost?: number
          unrealized_pnl?: number | null
          unrealized_pnl_percent?: number | null
          updated_at?: string
          user_id?: string
          wash_sale_loss_deferred?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'holdings_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'holdings_stock_id_fkey'
            columns: ['stock_id']
            isOneToOne: false
            referencedRelation: 'stocks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'holdings_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      intraday_prices: {
        Row: {
          close_price: number
          created_at: string
          data_source: Database['public']['Enums']['data_source'] | null
          high_price: number
          id: string | null
          interval_type: string
          is_verified: boolean | null
          low_price: number
          open_price: number
          stock_id: string
          timestamp: string
          volume: number | null
        }
        Insert: {
          close_price: number
          created_at?: string
          data_source?: Database['public']['Enums']['data_source'] | null
          high_price: number
          id?: string | null
          interval_type?: string
          is_verified?: boolean | null
          low_price: number
          open_price: number
          stock_id: string
          timestamp: string
          volume?: number | null
        }
        Update: {
          close_price?: number
          created_at?: string
          data_source?: Database['public']['Enums']['data_source'] | null
          high_price?: number
          id?: string | null
          interval_type?: string
          is_verified?: boolean | null
          low_price?: number
          open_price?: number
          stock_id?: string
          timestamp?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'intraday_prices_stock_id_fkey'
            columns: ['stock_id']
            isOneToOne: false
            referencedRelation: 'stocks'
            referencedColumns: ['id']
          },
        ]
      }
      market_index_prices: {
        Row: {
          close_price: number
          created_at: string
          data_source: Database['public']['Enums']['data_source'] | null
          date: string
          high_price: number
          id: string | null
          index_id: string
          low_price: number
          open_price: number
        }
        Insert: {
          close_price: number
          created_at?: string
          data_source?: Database['public']['Enums']['data_source'] | null
          date: string
          high_price: number
          id?: string | null
          index_id: string
          low_price: number
          open_price: number
        }
        Update: {
          close_price?: number
          created_at?: string
          data_source?: Database['public']['Enums']['data_source'] | null
          date?: string
          high_price?: number
          id?: string | null
          index_id?: string
          low_price?: number
          open_price?: number
        }
        Relationships: [
          {
            foreignKeyName: 'market_index_prices_index_id_fkey'
            columns: ['index_id']
            isOneToOne: false
            referencedRelation: 'market_indices'
            referencedColumns: ['id']
          },
        ]
      }
      market_indices: {
        Row: {
          component_count: number | null
          country_code: string | null
          created_at: string
          currency: Database['public']['Enums']['currency_code'] | null
          description: string | null
          id: string
          is_active: boolean | null
          methodology: string | null
          name: string
          symbol: string
          updated_at: string
        }
        Insert: {
          component_count?: number | null
          country_code?: string | null
          created_at?: string
          currency?: Database['public']['Enums']['currency_code'] | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          methodology?: string | null
          name: string
          symbol: string
          updated_at?: string
        }
        Update: {
          component_count?: number | null
          country_code?: string | null
          created_at?: string
          currency?: Database['public']['Enums']['currency_code'] | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          methodology?: string | null
          name?: string
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_integrations: {
        Row: {
          access_token_encrypted: string | null
          api_calls_limit: number | null
          api_calls_today: number | null
          created_at: string
          granted_scopes: string[] | null
          id: string
          last_successful_sync: string | null
          last_sync_error: string | null
          platform_id: string
          rate_limit_reset_at: string | null
          refresh_token_encrypted: string | null
          requested_scopes: string[] | null
          status: string | null
          sync_error_count: number | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          api_calls_limit?: number | null
          api_calls_today?: number | null
          created_at?: string
          granted_scopes?: string[] | null
          id?: string
          last_successful_sync?: string | null
          last_sync_error?: string | null
          platform_id: string
          rate_limit_reset_at?: string | null
          refresh_token_encrypted?: string | null
          requested_scopes?: string[] | null
          status?: string | null
          sync_error_count?: number | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          api_calls_limit?: number | null
          api_calls_today?: number | null
          created_at?: string
          granted_scopes?: string[] | null
          id?: string
          last_successful_sync?: string | null
          last_sync_error?: string | null
          platform_id?: string
          rate_limit_reset_at?: string | null
          refresh_token_encrypted?: string | null
          requested_scopes?: string[] | null
          status?: string | null
          sync_error_count?: number | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'platform_integrations_platform_id_fkey'
            columns: ['platform_id']
            isOneToOne: false
            referencedRelation: 'platforms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'platform_integrations_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      platforms: {
        Row: {
          api_config: Json | null
          api_supported: boolean | null
          country_code: string | null
          created_at: string
          crypto_commission_percent: number | null
          csv_config: Json | null
          csv_import_supported: boolean | null
          default_currency: Database['public']['Enums']['currency_code'] | null
          display_name: string
          etf_commission: number | null
          fx_spread_percent: number | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          option_commission: number | null
          stock_commission: number | null
          supported_asset_classes:
            | Database['public']['Enums']['asset_class'][]
            | null
          supported_currencies:
            | Database['public']['Enums']['currency_code'][]
            | null
          type: Database['public']['Enums']['platform_type']
          updated_at: string
          website_url: string | null
        }
        Insert: {
          api_config?: Json | null
          api_supported?: boolean | null
          country_code?: string | null
          created_at?: string
          crypto_commission_percent?: number | null
          csv_config?: Json | null
          csv_import_supported?: boolean | null
          default_currency?: Database['public']['Enums']['currency_code'] | null
          display_name: string
          etf_commission?: number | null
          fx_spread_percent?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          option_commission?: number | null
          stock_commission?: number | null
          supported_asset_classes?:
            | Database['public']['Enums']['asset_class'][]
            | null
          supported_currencies?:
            | Database['public']['Enums']['currency_code'][]
            | null
          type: Database['public']['Enums']['platform_type']
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          api_config?: Json | null
          api_supported?: boolean | null
          country_code?: string | null
          created_at?: string
          crypto_commission_percent?: number | null
          csv_config?: Json | null
          csv_import_supported?: boolean | null
          default_currency?: Database['public']['Enums']['currency_code'] | null
          display_name?: string
          etf_commission?: number | null
          fx_spread_percent?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          option_commission?: number | null
          stock_commission?: number | null
          supported_asset_classes?:
            | Database['public']['Enums']['asset_class'][]
            | null
          supported_currencies?:
            | Database['public']['Enums']['currency_code'][]
            | null
          type?: Database['public']['Enums']['platform_type']
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      portfolio_allocations: {
        Row: {
          asset_class: Database['public']['Enums']['asset_class']
          created_at: string
          id: string
          max_percentage: number | null
          min_percentage: number | null
          portfolio_id: string
          priority: number | null
          rebalance_threshold: number | null
          target_percentage: number
          updated_at: string
        }
        Insert: {
          asset_class: Database['public']['Enums']['asset_class']
          created_at?: string
          id?: string
          max_percentage?: number | null
          min_percentage?: number | null
          portfolio_id: string
          priority?: number | null
          rebalance_threshold?: number | null
          target_percentage: number
          updated_at?: string
        }
        Update: {
          asset_class?: Database['public']['Enums']['asset_class']
          created_at?: string
          id?: string
          max_percentage?: number | null
          min_percentage?: number | null
          portfolio_id?: string
          priority?: number | null
          rebalance_threshold?: number | null
          target_percentage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'portfolio_allocations_portfolio_id_fkey'
            columns: ['portfolio_id']
            isOneToOne: false
            referencedRelation: 'portfolios'
            referencedColumns: ['id']
          },
        ]
      }
      portfolio_performance: {
        Row: {
          alpha: number | null
          alternative_allocation: number | null
          benchmark_return: number | null
          beta: number | null
          bond_allocation: number | null
          cash_allocation: number | null
          cash_balance: number | null
          created_at: string
          cumulative_return: number | null
          cumulative_return_percent: number | null
          currency: Database['public']['Enums']['currency_code']
          daily_return: number | null
          daily_return_percent: number | null
          date: string
          dividend_yield: number | null
          dividends_received: number | null
          equity_allocation: number | null
          id: string
          max_drawdown: number | null
          portfolio_id: string
          sharpe_ratio: number | null
          total_cost: number
          total_value: number
          volatility_30d: number | null
        }
        Insert: {
          alpha?: number | null
          alternative_allocation?: number | null
          benchmark_return?: number | null
          beta?: number | null
          bond_allocation?: number | null
          cash_allocation?: number | null
          cash_balance?: number | null
          created_at?: string
          cumulative_return?: number | null
          cumulative_return_percent?: number | null
          currency: Database['public']['Enums']['currency_code']
          daily_return?: number | null
          daily_return_percent?: number | null
          date: string
          dividend_yield?: number | null
          dividends_received?: number | null
          equity_allocation?: number | null
          id?: string
          max_drawdown?: number | null
          portfolio_id: string
          sharpe_ratio?: number | null
          total_cost: number
          total_value: number
          volatility_30d?: number | null
        }
        Update: {
          alpha?: number | null
          alternative_allocation?: number | null
          benchmark_return?: number | null
          beta?: number | null
          bond_allocation?: number | null
          cash_allocation?: number | null
          cash_balance?: number | null
          created_at?: string
          cumulative_return?: number | null
          cumulative_return_percent?: number | null
          currency?: Database['public']['Enums']['currency_code']
          daily_return?: number | null
          daily_return_percent?: number | null
          date?: string
          dividend_yield?: number | null
          dividends_received?: number | null
          equity_allocation?: number | null
          id?: string
          max_drawdown?: number | null
          portfolio_id?: string
          sharpe_ratio?: number | null
          total_cost?: number
          total_value?: number
          volatility_30d?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'portfolio_performance_portfolio_id_fkey'
            columns: ['portfolio_id']
            isOneToOne: false
            referencedRelation: 'portfolios'
            referencedColumns: ['id']
          },
        ]
      }
      portfolio_snapshots: {
        Row: {
          allocation_breakdown: Json | null
          cash_balance: number | null
          created_at: string
          currency: Database['public']['Enums']['currency_code']
          data_source: Database['public']['Enums']['data_source'] | null
          day_change: number | null
          day_change_percent: number | null
          id: string
          portfolio_id: string
          snapshot_date: string
          total_cost: number
          total_return: number | null
          total_return_percent: number | null
          total_value: number
        }
        Insert: {
          allocation_breakdown?: Json | null
          cash_balance?: number | null
          created_at?: string
          currency: Database['public']['Enums']['currency_code']
          data_source?: Database['public']['Enums']['data_source'] | null
          day_change?: number | null
          day_change_percent?: number | null
          id?: string
          portfolio_id: string
          snapshot_date: string
          total_cost: number
          total_return?: number | null
          total_return_percent?: number | null
          total_value: number
        }
        Update: {
          allocation_breakdown?: Json | null
          cash_balance?: number | null
          created_at?: string
          currency?: Database['public']['Enums']['currency_code']
          data_source?: Database['public']['Enums']['data_source'] | null
          day_change?: number | null
          day_change_percent?: number | null
          id?: string
          portfolio_id?: string
          snapshot_date?: string
          total_cost?: number
          total_return?: number | null
          total_return_percent?: number | null
          total_value?: number
        }
        Relationships: [
          {
            foreignKeyName: 'portfolio_snapshots_portfolio_id_fkey'
            columns: ['portfolio_id']
            isOneToOne: false
            referencedRelation: 'portfolios'
            referencedColumns: ['id']
          },
        ]
      }
      portfolios: {
        Row: {
          color_theme: string | null
          created_at: string
          currency: Database['public']['Enums']['currency_code'] | null
          description: string | null
          id: string
          inception_date: string | null
          is_default: boolean | null
          is_public: boolean | null
          name: string
          rebalancing_frequency: string | null
          share_token: string | null
          sort_order: number | null
          target_allocation: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color_theme?: string | null
          created_at?: string
          currency?: Database['public']['Enums']['currency_code'] | null
          description?: string | null
          id?: string
          inception_date?: string | null
          is_default?: boolean | null
          is_public?: boolean | null
          name: string
          rebalancing_frequency?: string | null
          share_token?: string | null
          sort_order?: number | null
          target_allocation?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color_theme?: string | null
          created_at?: string
          currency?: Database['public']['Enums']['currency_code'] | null
          description?: string | null
          id?: string
          inception_date?: string | null
          is_default?: boolean | null
          is_public?: boolean | null
          name?: string
          rebalancing_frequency?: string | null
          share_token?: string | null
          sort_order?: number | null
          target_allocation?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'portfolios_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      realized_gains: {
        Row: {
          account_id: string
          average_acquisition_date: string | null
          cost_basis: number
          created_at: string
          currency: Database['public']['Enums']['currency_code']
          disallowed_loss: number | null
          gross_proceeds: number
          holding_period_days: number | null
          id: string
          is_short_term: boolean
          is_wash_sale: boolean | null
          quantity_sold: number
          realized_gain: number | null
          realized_gain_percent: number | null
          sell_date: string
          sell_price: number
          sell_transaction_id: string
          stock_id: string
          tax_lot_details: Json | null
          user_id: string
          wash_sale_loss_deferred: number | null
        }
        Insert: {
          account_id: string
          average_acquisition_date?: string | null
          cost_basis: number
          created_at?: string
          currency: Database['public']['Enums']['currency_code']
          disallowed_loss?: number | null
          gross_proceeds: number
          holding_period_days?: number | null
          id?: string
          is_short_term: boolean
          is_wash_sale?: boolean | null
          quantity_sold: number
          realized_gain?: number | null
          realized_gain_percent?: number | null
          sell_date: string
          sell_price: number
          sell_transaction_id: string
          stock_id: string
          tax_lot_details?: Json | null
          user_id: string
          wash_sale_loss_deferred?: number | null
        }
        Update: {
          account_id?: string
          average_acquisition_date?: string | null
          cost_basis?: number
          created_at?: string
          currency?: Database['public']['Enums']['currency_code']
          disallowed_loss?: number | null
          gross_proceeds?: number
          holding_period_days?: number | null
          id?: string
          is_short_term?: boolean
          is_wash_sale?: boolean | null
          quantity_sold?: number
          realized_gain?: number | null
          realized_gain_percent?: number | null
          sell_date?: string
          sell_price?: number
          sell_transaction_id?: string
          stock_id?: string
          tax_lot_details?: Json | null
          user_id?: string
          wash_sale_loss_deferred?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'realized_gains_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'realized_gains_sell_transaction_id_fkey'
            columns: ['sell_transaction_id']
            isOneToOne: false
            referencedRelation: 'transactions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'realized_gains_stock_id_fkey'
            columns: ['stock_id']
            isOneToOne: false
            referencedRelation: 'stocks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'realized_gains_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      security_events: {
        Row: {
          action_taken: string | null
          authentication_method: string | null
          blocked: boolean | null
          city: string | null
          country_code: string | null
          created_at: string
          description: string
          endpoint: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          requires_investigation: boolean | null
          risk_score: number | null
          session_id: string | null
          severity: string | null
          threat_indicators: string[] | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_taken?: string | null
          authentication_method?: string | null
          blocked?: boolean | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          description: string
          endpoint?: string | null
          event_type: string
          id?: string
          ip_address: unknown
          metadata?: Json | null
          requires_investigation?: boolean | null
          risk_score?: number | null
          session_id?: string | null
          severity?: string | null
          threat_indicators?: string[] | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_taken?: string | null
          authentication_method?: string | null
          blocked?: boolean | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          description?: string
          endpoint?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          requires_investigation?: boolean | null
          risk_score?: number | null
          session_id?: string | null
          severity?: string | null
          threat_indicators?: string[] | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'security_events_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      stock_aliases: {
        Row: {
          alias_exchange: string
          alias_symbol: string
          created_at: string
          id: string
          is_primary: boolean | null
          source: string
          stock_id: string
        }
        Insert: {
          alias_exchange: string
          alias_symbol: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          source: string
          stock_id: string
        }
        Update: {
          alias_exchange?: string
          alias_symbol?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          source?: string
          stock_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'stock_aliases_stock_id_fkey'
            columns: ['stock_id']
            isOneToOne: false
            referencedRelation: 'stocks'
            referencedColumns: ['id']
          },
        ]
      }
      stock_dividends: {
        Row: {
          amount: number
          created_at: string
          data_source: Database['public']['Enums']['data_source'] | null
          dividend_type: string | null
          ex_date: string
          id: string
          payment_date: string | null
          record_date: string | null
          stock_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          data_source?: Database['public']['Enums']['data_source'] | null
          dividend_type?: string | null
          ex_date: string
          id?: string
          payment_date?: string | null
          record_date?: string | null
          stock_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          data_source?: Database['public']['Enums']['data_source'] | null
          dividend_type?: string | null
          ex_date?: string
          id?: string
          payment_date?: string | null
          record_date?: string | null
          stock_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'stock_dividends_stock_id_fkey'
            columns: ['stock_id']
            isOneToOne: false
            referencedRelation: 'stocks'
            referencedColumns: ['id']
          },
        ]
      }
      stock_fundamentals: {
        Row: {
          book_value_per_share: number | null
          created_at: string
          current_ratio: number | null
          data_source: Database['public']['Enums']['data_source'] | null
          debt_to_equity: number | null
          dividend_per_share: number | null
          dividend_yield: number | null
          earnings_growth_yoy: number | null
          eps: number | null
          eps_growth_yoy: number | null
          ev_ebitda: number | null
          free_cash_flow: number | null
          free_cash_flow_per_share: number | null
          gross_margin: number | null
          id: string
          interest_coverage: number | null
          net_income: number | null
          net_margin: number | null
          operating_margin: number | null
          payout_ratio: number | null
          pb_ratio: number | null
          pe_ratio: number | null
          peg_ratio: number | null
          period_type: string
          ps_ratio: number | null
          quick_ratio: number | null
          report_date: string
          revenue: number | null
          revenue_growth_yoy: number | null
          revenue_per_share: number | null
          roa: number | null
          roe: number | null
          roic: number | null
          stock_id: string
          total_assets: number | null
          total_debt: number | null
        }
        Insert: {
          book_value_per_share?: number | null
          created_at?: string
          current_ratio?: number | null
          data_source?: Database['public']['Enums']['data_source'] | null
          debt_to_equity?: number | null
          dividend_per_share?: number | null
          dividend_yield?: number | null
          earnings_growth_yoy?: number | null
          eps?: number | null
          eps_growth_yoy?: number | null
          ev_ebitda?: number | null
          free_cash_flow?: number | null
          free_cash_flow_per_share?: number | null
          gross_margin?: number | null
          id?: string
          interest_coverage?: number | null
          net_income?: number | null
          net_margin?: number | null
          operating_margin?: number | null
          payout_ratio?: number | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          peg_ratio?: number | null
          period_type: string
          ps_ratio?: number | null
          quick_ratio?: number | null
          report_date: string
          revenue?: number | null
          revenue_growth_yoy?: number | null
          revenue_per_share?: number | null
          roa?: number | null
          roe?: number | null
          roic?: number | null
          stock_id: string
          total_assets?: number | null
          total_debt?: number | null
        }
        Update: {
          book_value_per_share?: number | null
          created_at?: string
          current_ratio?: number | null
          data_source?: Database['public']['Enums']['data_source'] | null
          debt_to_equity?: number | null
          dividend_per_share?: number | null
          dividend_yield?: number | null
          earnings_growth_yoy?: number | null
          eps?: number | null
          eps_growth_yoy?: number | null
          ev_ebitda?: number | null
          free_cash_flow?: number | null
          free_cash_flow_per_share?: number | null
          gross_margin?: number | null
          id?: string
          interest_coverage?: number | null
          net_income?: number | null
          net_margin?: number | null
          operating_margin?: number | null
          payout_ratio?: number | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          peg_ratio?: number | null
          period_type?: string
          ps_ratio?: number | null
          quick_ratio?: number | null
          report_date?: string
          revenue?: number | null
          revenue_growth_yoy?: number | null
          revenue_per_share?: number | null
          roa?: number | null
          roe?: number | null
          roic?: number | null
          stock_id?: string
          total_assets?: number | null
          total_debt?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'stock_fundamentals_stock_id_fkey'
            columns: ['stock_id']
            isOneToOne: false
            referencedRelation: 'stocks'
            referencedColumns: ['id']
          },
        ]
      }
      stock_prices: {
        Row: {
          adjusted_close: number | null
          close_price: number
          created_at: string
          data_source: Database['public']['Enums']['data_source'] | null
          date: string
          dividend_amount: number | null
          high_price: number
          id: string | null
          is_verified: boolean | null
          low_price: number
          open_price: number
          split_factor: number | null
          stock_id: string
          volume: number | null
          vwap: number | null
        }
        Insert: {
          adjusted_close?: number | null
          close_price: number
          created_at?: string
          data_source?: Database['public']['Enums']['data_source'] | null
          date: string
          dividend_amount?: number | null
          high_price: number
          id?: string | null
          is_verified?: boolean | null
          low_price: number
          open_price: number
          split_factor?: number | null
          stock_id: string
          volume?: number | null
          vwap?: number | null
        }
        Update: {
          adjusted_close?: number | null
          close_price?: number
          created_at?: string
          data_source?: Database['public']['Enums']['data_source'] | null
          date?: string
          dividend_amount?: number | null
          high_price?: number
          id?: string | null
          is_verified?: boolean | null
          low_price?: number
          open_price?: number
          split_factor?: number | null
          stock_id?: string
          volume?: number | null
          vwap?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'stock_prices_stock_id_fkey'
            columns: ['stock_id']
            isOneToOne: false
            referencedRelation: 'stocks'
            referencedColumns: ['id']
          },
        ]
      }
      stock_splits: {
        Row: {
          created_at: string
          data_source: Database['public']['Enums']['data_source'] | null
          ex_date: string
          id: string
          split_ratio: number
          stock_id: string
        }
        Insert: {
          created_at?: string
          data_source?: Database['public']['Enums']['data_source'] | null
          ex_date: string
          id?: string
          split_ratio: number
          stock_id: string
        }
        Update: {
          created_at?: string
          data_source?: Database['public']['Enums']['data_source'] | null
          ex_date?: string
          id?: string
          split_ratio?: number
          stock_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'stock_splits_stock_id_fkey'
            columns: ['stock_id']
            isOneToOne: false
            referencedRelation: 'stocks'
            referencedColumns: ['id']
          },
        ]
      }
      stocks: {
        Row: {
          asset_class: Database['public']['Enums']['asset_class'] | null
          aum: number | null
          avg_volume_30d: number | null
          bloomberg_ticker: string | null
          company_name: string | null
          country_code: string | null
          created_at: string
          currency: Database['public']['Enums']['currency_code'] | null
          cusip: string | null
          data_source: Database['public']['Enums']['data_source'] | null
          delisting_date: string | null
          description: string | null
          exchange: string
          expense_ratio: number | null
          figi: string | null
          float_shares: number | null
          fund_type: string | null
          google_symbol: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          is_tradeable: boolean | null
          isin: string | null
          last_updated: string | null
          listing_date: string | null
          logo_url: string | null
          market_cap: number | null
          name: string
          reuters_ric: string | null
          sector: string | null
          shares_outstanding: number | null
          symbol: string
          updated_at: string
          website_url: string | null
          yahoo_symbol: string | null
        }
        Insert: {
          asset_class?: Database['public']['Enums']['asset_class'] | null
          aum?: number | null
          avg_volume_30d?: number | null
          bloomberg_ticker?: string | null
          company_name?: string | null
          country_code?: string | null
          created_at?: string
          currency?: Database['public']['Enums']['currency_code'] | null
          cusip?: string | null
          data_source?: Database['public']['Enums']['data_source'] | null
          delisting_date?: string | null
          description?: string | null
          exchange: string
          expense_ratio?: number | null
          figi?: string | null
          float_shares?: number | null
          fund_type?: string | null
          google_symbol?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_tradeable?: boolean | null
          isin?: string | null
          last_updated?: string | null
          listing_date?: string | null
          logo_url?: string | null
          market_cap?: number | null
          name: string
          reuters_ric?: string | null
          sector?: string | null
          shares_outstanding?: number | null
          symbol: string
          updated_at?: string
          website_url?: string | null
          yahoo_symbol?: string | null
        }
        Update: {
          asset_class?: Database['public']['Enums']['asset_class'] | null
          aum?: number | null
          avg_volume_30d?: number | null
          bloomberg_ticker?: string | null
          company_name?: string | null
          country_code?: string | null
          created_at?: string
          currency?: Database['public']['Enums']['currency_code'] | null
          cusip?: string | null
          data_source?: Database['public']['Enums']['data_source'] | null
          delisting_date?: string | null
          description?: string | null
          exchange?: string
          expense_ratio?: number | null
          figi?: string | null
          float_shares?: number | null
          fund_type?: string | null
          google_symbol?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_tradeable?: boolean | null
          isin?: string | null
          last_updated?: string | null
          listing_date?: string | null
          logo_url?: string | null
          market_cap?: number | null
          name?: string
          reuters_ric?: string | null
          sector?: string | null
          shares_outstanding?: number | null
          symbol?: string
          updated_at?: string
          website_url?: string | null
          yahoo_symbol?: string | null
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          created_at: string
          id: string
          labels: Json | null
          metric_name: string
          metric_type: string
          node_id: string | null
          period_end: string
          period_start: string
          source: string | null
          unit: string | null
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          labels?: Json | null
          metric_name: string
          metric_type: string
          node_id?: string | null
          period_end: string
          period_start: string
          source?: string | null
          unit?: string | null
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          labels?: Json | null
          metric_name?: string
          metric_type?: string
          node_id?: string | null
          period_end?: string
          period_start?: string
          source?: string | null
          unit?: string | null
          value?: number
        }
        Relationships: []
      }
      tax_lots: {
        Row: {
          acquisition_date: string
          closed_date: string | null
          cost_per_share: number
          created_at: string
          holding_id: string
          id: string
          is_open: boolean | null
          is_short_term: boolean | null
          quantity: number
          remaining_cost: number
          remaining_quantity: number
          total_cost: number
          transaction_id: string
          updated_at: string
          wash_sale_adjustment: number | null
        }
        Insert: {
          acquisition_date: string
          closed_date?: string | null
          cost_per_share: number
          created_at?: string
          holding_id: string
          id?: string
          is_open?: boolean | null
          is_short_term?: boolean | null
          quantity: number
          remaining_cost: number
          remaining_quantity: number
          total_cost: number
          transaction_id: string
          updated_at?: string
          wash_sale_adjustment?: number | null
        }
        Update: {
          acquisition_date?: string
          closed_date?: string | null
          cost_per_share?: number
          created_at?: string
          holding_id?: string
          id?: string
          is_open?: boolean | null
          is_short_term?: boolean | null
          quantity?: number
          remaining_cost?: number
          remaining_quantity?: number
          total_cost?: number
          transaction_id?: string
          updated_at?: string
          wash_sale_adjustment?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'tax_lots_holding_id_fkey'
            columns: ['holding_id']
            isOneToOne: false
            referencedRelation: 'holdings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tax_lots_transaction_id_fkey'
            columns: ['transaction_id']
            isOneToOne: false
            referencedRelation: 'transactions'
            referencedColumns: ['id']
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          commission: number | null
          corporate_action_type: string | null
          created_at: string
          currency: Database['public']['Enums']['currency_code']
          data_source: Database['public']['Enums']['data_source'] | null
          date: string
          description: string | null
          exchange_rate: number | null
          external_id: string | null
          id: string
          import_batch_id: string | null
          import_source: string | null
          is_verified: boolean | null
          notes: string | null
          order_id: string | null
          other_fees: number | null
          price: number | null
          quantity: number
          related_transaction_id: string | null
          sec_fees: number | null
          settlement_date: string | null
          stock_id: string | null
          tags: string[] | null
          tax_lot_method: string | null
          time: string | null
          total_amount: number
          total_fees: number | null
          transaction_type: Database['public']['Enums']['transaction_type']
          updated_at: string
          user_id: string
          verification_date: string | null
          wash_sale: boolean | null
        }
        Insert: {
          account_id: string
          commission?: number | null
          corporate_action_type?: string | null
          created_at?: string
          currency: Database['public']['Enums']['currency_code']
          data_source?: Database['public']['Enums']['data_source'] | null
          date: string
          description?: string | null
          exchange_rate?: number | null
          external_id?: string | null
          id?: string
          import_batch_id?: string | null
          import_source?: string | null
          is_verified?: boolean | null
          notes?: string | null
          order_id?: string | null
          other_fees?: number | null
          price?: number | null
          quantity?: number
          related_transaction_id?: string | null
          sec_fees?: number | null
          settlement_date?: string | null
          stock_id?: string | null
          tags?: string[] | null
          tax_lot_method?: string | null
          time?: string | null
          total_amount: number
          total_fees?: number | null
          transaction_type: Database['public']['Enums']['transaction_type']
          updated_at?: string
          user_id: string
          verification_date?: string | null
          wash_sale?: boolean | null
        }
        Update: {
          account_id?: string
          commission?: number | null
          corporate_action_type?: string | null
          created_at?: string
          currency?: Database['public']['Enums']['currency_code']
          data_source?: Database['public']['Enums']['data_source'] | null
          date?: string
          description?: string | null
          exchange_rate?: number | null
          external_id?: string | null
          id?: string
          import_batch_id?: string | null
          import_source?: string | null
          is_verified?: boolean | null
          notes?: string | null
          order_id?: string | null
          other_fees?: number | null
          price?: number | null
          quantity?: number
          related_transaction_id?: string | null
          sec_fees?: number | null
          settlement_date?: string | null
          stock_id?: string | null
          tags?: string[] | null
          tax_lot_method?: string | null
          time?: string | null
          total_amount?: number
          total_fees?: number | null
          transaction_type?: Database['public']['Enums']['transaction_type']
          updated_at?: string
          user_id?: string
          verification_date?: string | null
          wash_sale?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_related_transaction_id_fkey'
            columns: ['related_transaction_id']
            isOneToOne: false
            referencedRelation: 'transactions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_stock_id_fkey'
            columns: ['stock_id']
            isOneToOne: false
            referencedRelation: 'stocks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      user_api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          rate_limit: number | null
          scopes: Json | null
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          rate_limit?: number | null
          scopes?: Json | null
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          rate_limit?: number | null
          scopes?: Json | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_api_keys_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      user_notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string
          data: Json | null
          expires_at: string | null
          id: string
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      user_preferences: {
        Row: {
          analytics_tracking: boolean | null
          auto_refresh_interval: number | null
          compact_view: boolean | null
          created_at: string
          dashboard_widgets: Json | null
          data_sharing: boolean | null
          default_time_range: string | null
          email_notifications: boolean | null
          id: string
          marketing_emails: boolean | null
          monthly_report: boolean | null
          news_alerts: boolean | null
          portfolio_view_mode: string | null
          preload_data: boolean | null
          price_alerts: boolean | null
          primary_currency: Database['public']['Enums']['currency_code'] | null
          push_notifications: boolean | null
          reduce_motion: boolean | null
          secondary_currency:
            | Database['public']['Enums']['currency_code']
            | null
          show_absolute_changes: boolean | null
          show_percentage_changes: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
          weekly_summary: boolean | null
        }
        Insert: {
          analytics_tracking?: boolean | null
          auto_refresh_interval?: number | null
          compact_view?: boolean | null
          created_at?: string
          dashboard_widgets?: Json | null
          data_sharing?: boolean | null
          default_time_range?: string | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          monthly_report?: boolean | null
          news_alerts?: boolean | null
          portfolio_view_mode?: string | null
          preload_data?: boolean | null
          price_alerts?: boolean | null
          primary_currency?: Database['public']['Enums']['currency_code'] | null
          push_notifications?: boolean | null
          reduce_motion?: boolean | null
          secondary_currency?:
            | Database['public']['Enums']['currency_code']
            | null
          show_absolute_changes?: boolean | null
          show_percentage_changes?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
          weekly_summary?: boolean | null
        }
        Update: {
          analytics_tracking?: boolean | null
          auto_refresh_interval?: number | null
          compact_view?: boolean | null
          created_at?: string
          dashboard_widgets?: Json | null
          data_sharing?: boolean | null
          default_time_range?: string | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          monthly_report?: boolean | null
          news_alerts?: boolean | null
          portfolio_view_mode?: string | null
          preload_data?: boolean | null
          price_alerts?: boolean | null
          primary_currency?: Database['public']['Enums']['currency_code'] | null
          push_notifications?: boolean | null
          reduce_motion?: boolean | null
          secondary_currency?:
            | Database['public']['Enums']['currency_code']
            | null
          show_absolute_changes?: boolean | null
          show_percentage_changes?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
          weekly_summary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_preferences_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_format: string | null
          display_name: string | null
          email: string
          full_name: string | null
          id: string
          locale: string | null
          time_format: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_format?: string | null
          display_name?: string | null
          email: string
          full_name?: string | null
          id: string
          locale?: string | null
          time_format?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_format?: string | null
          display_name?: string | null
          email?: string
          full_name?: string | null
          id?: string
          locale?: string | null
          time_format?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          device_info: Json | null
          expires_at: string | null
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          location: Json | null
          login_at: string
          logout_at: string | null
          session_token: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          location?: Json | null
          login_at?: string
          logout_at?: string | null
          session_token?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          location?: Json | null
          login_at?: string
          logout_at?: string | null
          session_token?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_sessions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      recent_activity: {
        Row: {
          action: string | null
          created_at: string | null
          error_message: string | null
          id: string | null
          log_type: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          success: boolean | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_portfolio_metrics: {
        Args: { portfolio_uuid: string; calculation_date?: string }
        Returns: Database['public']['CompositeTypes']['portfolio_metrics']
      }
      calculate_stock_return: {
        Args: { stock_uuid: string; start_date: string; end_date?: string }
        Returns: {
          absolute_return: number
          percentage_return: number
          start_price: number
          end_price: number
        }[]
      }
      citext: {
        Args: { '': boolean } | { '': string } | { '': unknown }
        Returns: string
      }
      citext_hash: {
        Args: { '': string }
        Returns: number
      }
      citextin: {
        Args: { '': unknown }
        Returns: string
      }
      citextout: {
        Args: { '': string }
        Returns: unknown
      }
      citextrecv: {
        Args: { '': unknown }
        Returns: string
      }
      citextsend: {
        Args: { '': string }
        Returns: string
      }
      cleanup_api_usage_logs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_notifications: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_system_metrics: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_audit_log: {
        Args: {
          p_user_id: string
          p_action: Database['public']['Enums']['audit_action']
          p_resource_type: string
          p_resource_id?: string
          p_old_values?: Json
          p_new_values?: Json
          p_metadata?: Json
          p_ip_address?: unknown
          p_user_agent?: string
          p_success?: boolean
          p_error_message?: string
        }
        Returns: string
      }
      create_future_partitions: {
        Args: { table_name: string; months_ahead?: number }
        Returns: undefined
      }
      create_monthly_partition: {
        Args: { parent_table: string; partition_date: string }
        Returns: undefined
      }
      create_security_event: {
        Args: {
          p_user_id: string
          p_event_type: string
          p_severity: string
          p_description: string
          p_ip_address: unknown
          p_risk_score?: number
          p_blocked?: boolean
          p_metadata?: Json
        }
        Returns: string
      }
      generate_partition_name: {
        Args: { table_name: string; date_value: string }
        Returns: string
      }
      get_latest_stock_price: {
        Args: { stock_uuid: string }
        Returns: number
      }
      get_stock_price_at_date: {
        Args: { stock_uuid: string; price_date: string }
        Returns: number
      }
      gtrgm_compress: {
        Args: { '': unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { '': unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { '': unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { '': unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { '': unknown }
        Returns: unknown
      }
      jsonb_diff: {
        Args: { old_data: Json; new_data: Json }
        Returns: Json
      }
      set_limit: {
        Args: { '': number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { '': string }
        Returns: string[]
      }
    }
    Enums: {
      account_type:
        | 'TAXABLE'
        | 'TRADITIONAL_IRA'
        | 'ROTH_IRA'
        | 'SEP_IRA'
        | 'SIMPLE_IRA'
        | '401K'
        | 'ROTH_401K'
        | '403B'
        | '457'
        | 'HSA'
        | 'TFSA'
        | 'RRSP'
        | 'RESP'
        | 'ISA'
        | 'PENSION'
        | 'TRUST'
        | 'JOINT'
        | 'INDIVIDUAL'
        | 'CORPORATE'
        | 'CRYPTO'
        | 'SAVINGS'
        | 'CHECKING'
      asset_class:
        | 'STOCK'
        | 'ETF'
        | 'MUTUAL_FUND'
        | 'BOND'
        | 'CRYPTOCURRENCY'
        | 'COMMODITY'
        | 'REAL_ESTATE'
        | 'ALTERNATIVE'
        | 'CASH'
        | 'OPTION'
        | 'FUTURE'
        | 'FOREX'
      audit_action:
        | 'CREATE'
        | 'UPDATE'
        | 'DELETE'
        | 'LOGIN'
        | 'LOGOUT'
        | 'IMPORT'
        | 'EXPORT'
        | 'SYNC'
        | 'CALCULATE'
        | 'BACKUP'
        | 'RESTORE'
        | 'MIGRATE'
      currency_code:
        | 'USD'
        | 'EUR'
        | 'GBP'
        | 'JPY'
        | 'CAD'
        | 'AUD'
        | 'CHF'
        | 'CNY'
        | 'SEK'
        | 'NOK'
        | 'DKK'
        | 'PLN'
        | 'CZK'
        | 'HUF'
        | 'RUB'
        | 'BRL'
        | 'INR'
        | 'KRW'
        | 'SGD'
        | 'HKD'
        | 'NZD'
        | 'MXN'
        | 'ZAR'
        | 'TRY'
        | 'ILS'
        | 'AED'
        | 'SAR'
        | 'QAR'
        | 'KWD'
        | 'BHD'
        | 'OMR'
        | 'JOD'
        | 'LBP'
        | 'EGP'
        | 'MAD'
        | 'TND'
        | 'DZD'
        | 'LYD'
        | 'SDG'
        | 'ETB'
        | 'KES'
        | 'UGX'
        | 'TZS'
        | 'RWF'
        | 'BIF'
        | 'DJF'
        | 'SOS'
        | 'MGA'
        | 'KMF'
        | 'SCR'
        | 'MUR'
        | 'MWK'
        | 'ZMW'
        | 'BWP'
        | 'SZL'
        | 'LSL'
        | 'NAD'
        | 'AOA'
        | 'MZN'
        | 'ZWL'
        | 'CDF'
        | 'XAF'
        | 'XOF'
        | 'XPF'
        | 'STD'
        | 'CVE'
        | 'GNF'
        | 'SLL'
        | 'LRD'
        | 'GMD'
        | 'GHS'
        | 'NGN'
        | 'XDR'
        | 'BTC'
        | 'ETH'
        | 'LTC'
        | 'BCH'
        | 'ADA'
        | 'DOT'
        | 'LINK'
        | 'UNI'
        | 'DOGE'
        | 'MATIC'
        | 'SOL'
        | 'AVAX'
        | 'LUNA'
        | 'ATOM'
        | 'XRP'
        | 'XLM'
        | 'VET'
        | 'THETA'
        | 'FIL'
        | 'TRX'
        | 'EOS'
        | 'XMR'
        | 'ZEC'
        | 'DASH'
      data_source:
        | 'MANUAL'
        | 'API'
        | 'CSV_IMPORT'
        | 'PLATFORM_SYNC'
        | 'MARKET_DATA_PROVIDER'
        | 'CALCULATED'
        | 'ESTIMATED'
      platform_type:
        | 'BROKER'
        | 'BANK'
        | 'CRYPTO_EXCHANGE'
        | 'ROBO_ADVISOR'
        | 'MANUAL'
        | 'IMPORT_ONLY'
      transaction_type:
        | 'BUY'
        | 'SELL'
        | 'DIVIDEND'
        | 'SPLIT'
        | 'MERGER'
        | 'SPINOFF'
        | 'DEPOSIT'
        | 'WITHDRAWAL'
        | 'FEE'
        | 'INTEREST'
        | 'TAX'
        | 'TRANSFER_IN'
        | 'TRANSFER_OUT'
        | 'REINVESTMENT'
    }
    CompositeTypes: {
      portfolio_metrics: {
        total_value: number | null
        total_cost: number | null
        unrealized_pnl: number | null
        realized_pnl: number | null
        day_change: number | null
        day_change_percent: number | null
        currency: Database['public']['Enums']['currency_code'] | null
      }
      price_data: {
        open: number | null
        high: number | null
        low: number | null
        close: number | null
        volume: number | null
        adjusted_close: number | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: [
        'TAXABLE',
        'TRADITIONAL_IRA',
        'ROTH_IRA',
        'SEP_IRA',
        'SIMPLE_IRA',
        '401K',
        'ROTH_401K',
        '403B',
        '457',
        'HSA',
        'TFSA',
        'RRSP',
        'RESP',
        'ISA',
        'PENSION',
        'TRUST',
        'JOINT',
        'INDIVIDUAL',
        'CORPORATE',
        'CRYPTO',
        'SAVINGS',
        'CHECKING',
      ],
      asset_class: [
        'STOCK',
        'ETF',
        'MUTUAL_FUND',
        'BOND',
        'CRYPTOCURRENCY',
        'COMMODITY',
        'REAL_ESTATE',
        'ALTERNATIVE',
        'CASH',
        'OPTION',
        'FUTURE',
        'FOREX',
      ],
      audit_action: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'IMPORT',
        'EXPORT',
        'SYNC',
        'CALCULATE',
        'BACKUP',
        'RESTORE',
        'MIGRATE',
      ],
      currency_code: [
        'USD',
        'EUR',
        'GBP',
        'JPY',
        'CAD',
        'AUD',
        'CHF',
        'CNY',
        'SEK',
        'NOK',
        'DKK',
        'PLN',
        'CZK',
        'HUF',
        'RUB',
        'BRL',
        'INR',
        'KRW',
        'SGD',
        'HKD',
        'NZD',
        'MXN',
        'ZAR',
        'TRY',
        'ILS',
        'AED',
        'SAR',
        'QAR',
        'KWD',
        'BHD',
        'OMR',
        'JOD',
        'LBP',
        'EGP',
        'MAD',
        'TND',
        'DZD',
        'LYD',
        'SDG',
        'ETB',
        'KES',
        'UGX',
        'TZS',
        'RWF',
        'BIF',
        'DJF',
        'SOS',
        'MGA',
        'KMF',
        'SCR',
        'MUR',
        'MWK',
        'ZMW',
        'BWP',
        'SZL',
        'LSL',
        'NAD',
        'AOA',
        'MZN',
        'ZWL',
        'CDF',
        'XAF',
        'XOF',
        'XPF',
        'STD',
        'CVE',
        'GNF',
        'SLL',
        'LRD',
        'GMD',
        'GHS',
        'NGN',
        'XDR',
        'BTC',
        'ETH',
        'LTC',
        'BCH',
        'ADA',
        'DOT',
        'LINK',
        'UNI',
        'DOGE',
        'MATIC',
        'SOL',
        'AVAX',
        'LUNA',
        'ATOM',
        'XRP',
        'XLM',
        'VET',
        'THETA',
        'FIL',
        'TRX',
        'EOS',
        'XMR',
        'ZEC',
        'DASH',
      ],
      data_source: [
        'MANUAL',
        'API',
        'CSV_IMPORT',
        'PLATFORM_SYNC',
        'MARKET_DATA_PROVIDER',
        'CALCULATED',
        'ESTIMATED',
      ],
      platform_type: [
        'BROKER',
        'BANK',
        'CRYPTO_EXCHANGE',
        'ROBO_ADVISOR',
        'MANUAL',
        'IMPORT_ONLY',
      ],
      transaction_type: [
        'BUY',
        'SELL',
        'DIVIDEND',
        'SPLIT',
        'MERGER',
        'SPINOFF',
        'DEPOSIT',
        'WITHDRAWAL',
        'FEE',
        'INTEREST',
        'TAX',
        'TRANSFER_IN',
        'TRANSFER_OUT',
        'REINVESTMENT',
      ],
    },
  },
} as const
