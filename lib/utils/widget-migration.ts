'use client'

import { createClient } from '@/lib/supabase/client'
import type {
  WidgetLayout,
  WidgetLayoutRow,
  WidgetType,
  WidgetCategory,
  WidgetSize,
  WidgetConfig,
  LayoutType,
} from '@/lib/types/widget.types'

// Migration version system
const CURRENT_MIGRATION_VERSION = '1.2.0'
const MIGRATION_COMPATIBILITY_MAP = {
  '1.0.0': ['1.0.0', '1.1.0', '1.2.0'],
  '1.1.0': ['1.1.0', '1.2.0'],
  '1.2.0': ['1.2.0'],
}

// Legacy data structures from stock modal system
interface LegacyStockModalData {
  activeTab: 'overview' | 'transactions' | 'performance'
  stockSymbol: string
  portfolioId: string
  preferences: {
    showHeader: boolean
    showChart: boolean
    showTransactions: boolean
    showPerformance: boolean
    chartType: 'line' | 'candlestick' | 'area'
    timeframe: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y'
    theme: 'light' | 'dark'
  }
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  lastUsed: string
}

interface LegacyDashboardLayout {
  portfolioChart: {
    type: 'hero' | 'mini'
    position: [number, number]
    size: [number, number]
    config: any
  }
  holdingsTable: {
    position: [number, number]
    size: [number, number]
    config: any
  }
  activityFeed: {
    position: [number, number]
    size: [number, number]
    config: any
  }
  version: string
}

// Migration result types
interface MigrationResult {
  success: boolean
  migratedLayouts: number
  errors: string[]
  warnings: string[]
  backupCreated: boolean
  version: string
}

interface MigrationOptions {
  preservePositions: boolean
  createBackup: boolean
  overwriteExisting: boolean
  dryRun: boolean
  logVerbose: boolean
}

interface DataTransformationResult {
  success: boolean
  transformedData: WidgetLayoutRow[]
  errors: string[]
  warnings: string[]
}

/**
 * Widget Layout Migration System
 * Handles migration from legacy stock modal system to new widget board
 */
export class WidgetMigrationSystem {
  private supabase = createClient()
  private userId: string | null = null
  private migrationLog: string[] = []

  constructor() {
    this.initializeUser()
  }

  private async initializeUser(): Promise<void> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      this.userId = user?.id || null
    } catch (error) {
      console.error('Failed to initialize user for migration:', error)
    }
  }

  /**
   * Main migration function - migrates from stock modal to widget board
   */
  async migrateFromStockModal(
    options: Partial<MigrationOptions> = {}
  ): Promise<MigrationResult> {
    const defaultOptions: MigrationOptions = {
      preservePositions: true,
      createBackup: true,
      overwriteExisting: false,
      dryRun: false,
      logVerbose: false,
    }

    const migrationOptions = { ...defaultOptions, ...options }

    this.log(
      '🚀 Starting migration from stock modal to widget board',
      migrationOptions.logVerbose
    )

    const result: MigrationResult = {
      success: false,
      migratedLayouts: 0,
      errors: [],
      warnings: [],
      backupCreated: false,
      version: CURRENT_MIGRATION_VERSION,
    }

    try {
      if (!this.userId) {
        result.errors.push('Bruker ikke autentisert')
        return result
      }

      // Step 1: Create backup if requested
      if (migrationOptions.createBackup && !migrationOptions.dryRun) {
        const backupSuccess = await this.createMigrationBackup()
        result.backupCreated = backupSuccess
        if (!backupSuccess) {
          result.warnings.push('Kunne ikke opprette sikkerhetskopi')
        }
      }

      // Step 2: Detect legacy stock modal data
      const legacyData = await this.detectLegacyStockModalData()

      if (legacyData.length === 0) {
        this.log(
          'ℹ️ No legacy stock modal data found',
          migrationOptions.logVerbose
        )
        result.success = true
        return result
      }

      this.log(
        `📊 Found ${legacyData.length} legacy stock modal configurations`,
        migrationOptions.logVerbose
      )

      // Step 3: Transform legacy data to new widget format
      const transformResult =
        await this.transformLegacyDataToWidgets(legacyData)

      if (!transformResult.success) {
        result.errors.push(...transformResult.errors)
        result.warnings.push(...transformResult.warnings)
        return result
      }

      // Step 4: Migrate dashboard layouts
      const dashboardResult =
        await this.migrateDashboardLayouts(migrationOptions)
      result.warnings.push(...dashboardResult.warnings)
      result.errors.push(...dashboardResult.errors)

      // Step 5: Apply transformed data
      if (!migrationOptions.dryRun) {
        const applyResult = await this.applyMigratedLayouts(
          transformResult.transformedData,
          migrationOptions
        )

        result.migratedLayouts = applyResult.migratedLayouts
        result.errors.push(...applyResult.errors)
        result.warnings.push(...applyResult.warnings)
      } else {
        result.migratedLayouts = transformResult.transformedData.length
        this.log(
          '🏃 Dry run completed - no data was actually migrated',
          migrationOptions.logVerbose
        )
      }

      // Step 6: Set migration version
      if (!migrationOptions.dryRun) {
        await this.setMigrationVersion(CURRENT_MIGRATION_VERSION)
      }

      result.success = result.errors.length === 0

      this.log(
        `✅ Migration completed: ${result.migratedLayouts} layouts migrated`,
        migrationOptions.logVerbose
      )

      return result
    } catch (error) {
      this.log(`❌ Migration failed: ${error}`, true)
      result.errors.push(`Migration failed: ${error}`)
      return result
    }
  }

  /**
   * Detect legacy stock modal data
   */
  private async detectLegacyStockModalData(): Promise<LegacyStockModalData[]> {
    const legacyData: LegacyStockModalData[] = []

    try {
      // Check localStorage for legacy data
      const stockModalData = localStorage.getItem('lifedash-stock-modal-state')
      if (stockModalData) {
        const parsedData = JSON.parse(stockModalData)

        // Transform localStorage data to legacy format
        if (parsedData.activeStocks) {
          Object.entries(parsedData.activeStocks).forEach(
            ([symbol, data]: [string, any]) => {
              legacyData.push({
                activeTab: data.activeTab || 'overview',
                stockSymbol: symbol,
                portfolioId: data.portfolioId || '',
                preferences: {
                  showHeader: data.showHeader !== false,
                  showChart: data.showChart !== false,
                  showTransactions: data.showTransactions !== false,
                  showPerformance: data.showPerformance !== false,
                  chartType: data.chartType || 'line',
                  timeframe: data.timeframe || '1M',
                  theme: data.theme || 'light',
                },
                position: {
                  x: data.position?.x || 0,
                  y: data.position?.y || 0,
                  width: data.position?.width || 800,
                  height: data.position?.height || 600,
                },
                lastUsed: data.lastUsed || new Date().toISOString(),
              })
            }
          )
        }
      }

      // Check for legacy database entries
      const { data: legacyEntries } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', this.userId)
        .like('preference_key', 'stock_modal_%')

      if (legacyEntries) {
        legacyEntries.forEach(entry => {
          try {
            const stockSymbol = entry.preference_key.replace('stock_modal_', '')
            const preferences = JSON.parse(entry.preference_value)

            legacyData.push({
              activeTab: preferences.activeTab || 'overview',
              stockSymbol: stockSymbol,
              portfolioId: preferences.portfolioId || '',
              preferences: preferences.preferences || {},
              position: preferences.position || {},
              lastUsed: entry.updated_at || new Date().toISOString(),
            })
          } catch (error) {
            console.warn('Failed to parse legacy entry:', error)
          }
        })
      }

      return legacyData
    } catch (error) {
      console.error('Error detecting legacy stock modal data:', error)
      return []
    }
  }

  /**
   * Transform legacy data to new widget format
   */
  private async transformLegacyDataToWidgets(
    legacyData: LegacyStockModalData[]
  ): Promise<DataTransformationResult> {
    const result: DataTransformationResult = {
      success: true,
      transformedData: [],
      errors: [],
      warnings: [],
    }

    try {
      for (const legacy of legacyData) {
        // Create stock detail widget
        const stockDetailWidget: WidgetLayoutRow = {
          id: `migrated_stock_${legacy.stockSymbol}_${Date.now()}`,
          user_id: this.userId!,
          portfolio_id: legacy.portfolioId || null,
          stock_symbol: legacy.stockSymbol,
          layout_name: `Stock ${legacy.stockSymbol} Layout`,
          layout_type: 'stock' as LayoutType,
          is_default: false,
          is_active: true,
          widget_type: 'STOCK_DETAIL_CARD' as WidgetType,
          widget_category: 'STOCKS' as WidgetCategory,
          widget_size: 'LARGE' as WidgetSize,
          grid_row: 1,
          grid_column: 1,
          grid_row_span: 2,
          grid_column_span: 2,
          widget_config: {
            activeTab: legacy.activeTab,
            showHeader: legacy.preferences.showHeader,
            showChart: legacy.preferences.showChart,
            showTransactions: legacy.preferences.showTransactions,
            showPerformance: legacy.preferences.showPerformance,
            chartType: legacy.preferences.chartType,
            timeframe: legacy.preferences.timeframe,
            theme: legacy.preferences.theme,
            migrated: true,
            migratedFrom: 'stock_modal',
            migratedAt: new Date().toISOString(),
          },
          title: `${legacy.stockSymbol} Detaljer`,
          description: `Migrert fra aksje-modal for ${legacy.stockSymbol}`,
          show_header: legacy.preferences.showHeader,
          show_footer: false,
          mobile_hidden: false,
          tablet_config: {
            size: 'MEDIUM' as WidgetSize,
            gridRowSpan: 2,
            gridColumnSpan: 1,
          },
          mobile_config: {
            size: 'SMALL' as WidgetSize,
            gridRowSpan: 1,
            gridColumnSpan: 1,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        result.transformedData.push(stockDetailWidget)

        // Create additional widgets based on preferences
        if (legacy.preferences.showChart) {
          const chartWidget: WidgetLayoutRow = {
            id: `migrated_chart_${legacy.stockSymbol}_${Date.now()}`,
            user_id: this.userId!,
            portfolio_id: legacy.portfolioId || null,
            stock_symbol: legacy.stockSymbol,
            layout_name: `Stock ${legacy.stockSymbol} Chart`,
            layout_type: 'stock' as LayoutType,
            is_default: false,
            is_active: true,
            widget_type: 'STOCK_PERFORMANCE_CHART' as WidgetType,
            widget_category: 'STOCKS' as WidgetCategory,
            widget_size: 'MEDIUM' as WidgetSize,
            grid_row: 1,
            grid_column: 3,
            grid_row_span: 1,
            grid_column_span: 1,
            widget_config: {
              chartType: legacy.preferences.chartType,
              timeframe: legacy.preferences.timeframe,
              showVolume: true,
              showGrid: true,
              migrated: true,
              migratedFrom: 'stock_modal_chart',
              migratedAt: new Date().toISOString(),
            },
            title: `${legacy.stockSymbol} Graf`,
            description: `Kursgraf for ${legacy.stockSymbol}`,
            show_header: true,
            show_footer: false,
            mobile_hidden: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          result.transformedData.push(chartWidget)
        }

        if (legacy.preferences.showTransactions) {
          const transactionWidget: WidgetLayoutRow = {
            id: `migrated_transactions_${legacy.stockSymbol}_${Date.now()}`,
            user_id: this.userId!,
            portfolio_id: legacy.portfolioId || null,
            stock_symbol: legacy.stockSymbol,
            layout_name: `Stock ${legacy.stockSymbol} Transactions`,
            layout_type: 'stock' as LayoutType,
            is_default: false,
            is_active: true,
            widget_type: 'TRANSACTION_HISTORY' as WidgetType,
            widget_category: 'STOCKS' as WidgetCategory,
            widget_size: 'MEDIUM' as WidgetSize,
            grid_row: 2,
            grid_column: 3,
            grid_row_span: 1,
            grid_column_span: 1,
            widget_config: {
              showFilters: true,
              showSummary: true,
              pageSize: 10,
              migrated: true,
              migratedFrom: 'stock_modal_transactions',
              migratedAt: new Date().toISOString(),
            },
            title: `${legacy.stockSymbol} Transaksjoner`,
            description: `Transaksjonshistorikk for ${legacy.stockSymbol}`,
            show_header: true,
            show_footer: false,
            mobile_hidden: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          result.transformedData.push(transactionWidget)
        }
      }

      this.log(
        `🔄 Transformed ${legacyData.length} legacy configurations into ${result.transformedData.length} widgets`
      )

      return result
    } catch (error) {
      result.success = false
      result.errors.push(`Transformation failed: ${error}`)
      return result
    }
  }

  /**
   * Migrate dashboard layouts
   */
  private async migrateDashboardLayouts(
    options: MigrationOptions
  ): Promise<{ errors: string[]; warnings: string[] }> {
    const result = { errors: [], warnings: [] }

    try {
      // Check for legacy dashboard layout
      const legacyDashboard = localStorage.getItem('lifedash-dashboard-layout')
      if (!legacyDashboard) {
        return result
      }

      const dashboardData: LegacyDashboardLayout = JSON.parse(legacyDashboard)

      // Create dashboard widgets from legacy layout
      const dashboardWidgets: WidgetLayoutRow[] = []

      // Portfolio chart
      if (dashboardData.portfolioChart) {
        dashboardWidgets.push({
          id: `migrated_portfolio_chart_${Date.now()}`,
          user_id: this.userId!,
          portfolio_id: null,
          stock_symbol: null,
          layout_name: 'Hovedside Layout',
          layout_type: 'dashboard' as LayoutType,
          is_default: true,
          is_active: true,
          widget_type: 'HERO_PORTFOLIO_CHART' as WidgetType,
          widget_category: 'STOCKS' as WidgetCategory,
          widget_size:
            dashboardData.portfolioChart.type === 'hero' ? 'HERO' : 'LARGE',
          grid_row: dashboardData.portfolioChart.position[0] || 1,
          grid_column: dashboardData.portfolioChart.position[1] || 1,
          grid_row_span: dashboardData.portfolioChart.size[0] || 2,
          grid_column_span: dashboardData.portfolioChart.size[1] || 2,
          widget_config: {
            ...dashboardData.portfolioChart.config,
            migrated: true,
            migratedFrom: 'dashboard_portfolio_chart',
            migratedAt: new Date().toISOString(),
          },
          title: 'Portefølje Oversikt',
          description: 'Migrert fra gammelt dashboard',
          show_header: true,
          show_footer: false,
          mobile_hidden: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      // Holdings table
      if (dashboardData.holdingsTable) {
        dashboardWidgets.push({
          id: `migrated_holdings_table_${Date.now()}`,
          user_id: this.userId!,
          portfolio_id: null,
          stock_symbol: null,
          layout_name: 'Hovedside Layout',
          layout_type: 'dashboard' as LayoutType,
          is_default: false,
          is_active: true,
          widget_type: 'HOLDINGS_TABLE_RICH' as WidgetType,
          widget_category: 'STOCKS' as WidgetCategory,
          widget_size: 'LARGE' as WidgetSize,
          grid_row: dashboardData.holdingsTable.position[0] || 3,
          grid_column: dashboardData.holdingsTable.position[1] || 1,
          grid_row_span: dashboardData.holdingsTable.size[0] || 2,
          grid_column_span: dashboardData.holdingsTable.size[1] || 4,
          widget_config: {
            ...dashboardData.holdingsTable.config,
            migrated: true,
            migratedFrom: 'dashboard_holdings_table',
            migratedAt: new Date().toISOString(),
          },
          title: 'Beholdninger',
          description: 'Migrert fra gammelt dashboard',
          show_header: true,
          show_footer: false,
          mobile_hidden: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      // Activity feed
      if (dashboardData.activityFeed) {
        dashboardWidgets.push({
          id: `migrated_activity_feed_${Date.now()}`,
          user_id: this.userId!,
          portfolio_id: null,
          stock_symbol: null,
          layout_name: 'Hovedside Layout',
          layout_type: 'dashboard' as LayoutType,
          is_default: false,
          is_active: true,
          widget_type: 'ACTIVITY_FEED' as WidgetType,
          widget_category: 'STOCKS' as WidgetCategory,
          widget_size: 'MEDIUM' as WidgetSize,
          grid_row: dashboardData.activityFeed.position[0] || 1,
          grid_column: dashboardData.activityFeed.position[1] || 3,
          grid_row_span: dashboardData.activityFeed.size[0] || 2,
          grid_column_span: dashboardData.activityFeed.size[1] || 2,
          widget_config: {
            ...dashboardData.activityFeed.config,
            migrated: true,
            migratedFrom: 'dashboard_activity_feed',
            migratedAt: new Date().toISOString(),
          },
          title: 'Aktivitet',
          description: 'Migrert fra gammelt dashboard',
          show_header: true,
          show_footer: false,
          mobile_hidden: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      // Apply dashboard widgets if not in dry run
      if (!options.dryRun && dashboardWidgets.length > 0) {
        const applyResult = await this.applyMigratedLayouts(
          dashboardWidgets,
          options
        )
        result.errors.push(...applyResult.errors)
        result.warnings.push(...applyResult.warnings)
      }

      this.log(`📊 Migrated ${dashboardWidgets.length} dashboard widgets`)

      return result
    } catch (error) {
      result.errors.push(`Dashboard migration failed: ${error}`)
      return result
    }
  }

  /**
   * Apply migrated layouts to database
   */
  private async applyMigratedLayouts(
    layouts: WidgetLayoutRow[],
    options: MigrationOptions
  ): Promise<{
    migratedLayouts: number
    errors: string[]
    warnings: string[]
  }> {
    const result = { migratedLayouts: 0, errors: [], warnings: [] }

    try {
      for (const layout of layouts) {
        try {
          // Check if layout already exists
          const { data: existingLayout } = await this.supabase
            .from('widget_layouts')
            .select('id')
            .eq('user_id', this.userId!)
            .eq('layout_name', layout.layout_name)
            .eq('widget_type', layout.widget_type)
            .eq('layout_type', layout.layout_type)
            .maybeSingle()

          if (existingLayout && !options.overwriteExisting) {
            result.warnings.push(
              `Layout "${layout.layout_name}" (${layout.widget_type}) already exists`
            )
            continue
          }

          // Insert or update layout
          const { error } = await this.supabase
            .from('widget_layouts')
            .upsert(layout, { onConflict: 'id' })

          if (error) {
            result.errors.push(
              `Failed to migrate layout "${layout.layout_name}": ${error.message}`
            )
            continue
          }

          result.migratedLayouts++
          this.log(
            `✅ Migrated layout: ${layout.layout_name} (${layout.widget_type})`
          )
        } catch (error) {
          result.errors.push(
            `Error migrating layout "${layout.layout_name}": ${error}`
          )
        }
      }

      return result
    } catch (error) {
      result.errors.push(`Failed to apply migrated layouts: ${error}`)
      return result
    }
  }

  /**
   * Create backup before migration
   */
  private async createMigrationBackup(): Promise<boolean> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupName = `migration_backup_${timestamp}`

      // Backup current widget layouts
      const { data: currentLayouts } = await this.supabase
        .from('widget_layouts')
        .select('*')
        .eq('user_id', this.userId!)

      // Backup user preferences
      const { data: preferences } = await this.supabase
        .from('widget_preferences')
        .select('*')
        .eq('user_id', this.userId!)

      const backupData = {
        layouts: currentLayouts || [],
        preferences: preferences?.[0] || null,
        timestamp: new Date().toISOString(),
        version: CURRENT_MIGRATION_VERSION,
      }

      // Store backup in localStorage
      localStorage.setItem(
        `lifedash-migration-backup-${timestamp}`,
        JSON.stringify(backupData)
      )

      this.log(`💾 Created migration backup: ${backupName}`)
      return true
    } catch (error) {
      console.error('Failed to create migration backup:', error)
      return false
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupTimestamp: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedLayouts: 0,
      errors: [],
      warnings: [],
      backupCreated: false,
      version: CURRENT_MIGRATION_VERSION,
    }

    try {
      if (!this.userId) {
        result.errors.push('User not authenticated')
        return result
      }

      const backupData = localStorage.getItem(
        `lifedash-migration-backup-${backupTimestamp}`
      )
      if (!backupData) {
        result.errors.push('Backup not found')
        return result
      }

      const backup = JSON.parse(backupData)

      // Restore layouts
      if (backup.layouts && backup.layouts.length > 0) {
        const { error } = await this.supabase
          .from('widget_layouts')
          .delete()
          .eq('user_id', this.userId!)

        if (error) {
          result.errors.push(
            `Failed to clear existing layouts: ${error.message}`
          )
          return result
        }

        for (const layout of backup.layouts) {
          const { error } = await this.supabase
            .from('widget_layouts')
            .insert(layout)

          if (error) {
            result.errors.push(
              `Failed to restore layout ${layout.id}: ${error.message}`
            )
            continue
          }

          result.migratedLayouts++
        }
      }

      // Restore preferences
      if (backup.preferences) {
        const { error } = await this.supabase
          .from('widget_preferences')
          .upsert(backup.preferences)

        if (error) {
          result.warnings.push(
            `Failed to restore preferences: ${error.message}`
          )
        }
      }

      result.success = result.errors.length === 0
      this.log(`🔄 Restored from backup: ${result.migratedLayouts} layouts`)

      return result
    } catch (error) {
      result.errors.push(`Restore failed: ${error}`)
      return result
    }
  }

  /**
   * Get available backups
   */
  getAvailableBackups(): Array<{
    timestamp: string
    date: string
    layoutCount: number
  }> {
    const backups = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('lifedash-migration-backup-')) {
        const timestamp = key.replace('lifedash-migration-backup-', '')
        const backupData = localStorage.getItem(key)

        if (backupData) {
          try {
            const backup = JSON.parse(backupData)
            backups.push({
              timestamp,
              date: backup.timestamp,
              layoutCount: backup.layouts?.length || 0,
            })
          } catch (error) {
            console.warn('Invalid backup data:', error)
          }
        }
      }
    }

    return backups.sort((a, b) => b.date.localeCompare(a.date))
  }

  /**
   * Check migration version compatibility
   */
  async checkVersionCompatibility(): Promise<{
    compatible: boolean
    currentVersion: string
    migrationVersion: string
    requiredActions: string[]
  }> {
    try {
      const { data: preferences } = await this.supabase
        .from('widget_preferences')
        .select('*')
        .eq('user_id', this.userId!)
        .single()

      const currentVersion =
        preferences?.category_preferences?.migrationVersion || '1.0.0'
      const compatible =
        MIGRATION_COMPATIBILITY_MAP[
          currentVersion as keyof typeof MIGRATION_COMPATIBILITY_MAP
        ]?.includes(CURRENT_MIGRATION_VERSION) || false

      const requiredActions = []
      if (!compatible) {
        requiredActions.push('Migration required to latest version')
        requiredActions.push('Create backup before migration')
        requiredActions.push('Review migrated layouts after completion')
      }

      return {
        compatible,
        currentVersion,
        migrationVersion: CURRENT_MIGRATION_VERSION,
        requiredActions,
      }
    } catch (error) {
      return {
        compatible: false,
        currentVersion: 'unknown',
        migrationVersion: CURRENT_MIGRATION_VERSION,
        requiredActions: ['Unable to determine compatibility'],
      }
    }
  }

  /**
   * Set migration version
   */
  private async setMigrationVersion(version: string): Promise<void> {
    try {
      await this.supabase.from('widget_preferences').upsert({
        user_id: this.userId!,
        category_preferences: {
          migrationVersion: version,
          migratedAt: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error('Failed to set migration version:', error)
    }
  }

  /**
   * Clean up migration data
   */
  async cleanupMigrationData(): Promise<void> {
    try {
      // Clean up localStorage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key?.startsWith('lifedash-migration-backup-')) {
          const timestamp = key.replace('lifedash-migration-backup-', '')
          const backupDate = new Date(timestamp.replace(/-/g, ':'))
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

          if (backupDate < thirtyDaysAgo) {
            localStorage.removeItem(key)
          }
        }
      }

      // Clean up legacy data
      localStorage.removeItem('lifedash-stock-modal-state')
      localStorage.removeItem('lifedash-dashboard-layout')

      this.log('🧹 Cleaned up migration data')
    } catch (error) {
      console.error('Failed to cleanup migration data:', error)
    }
  }

  /**
   * Logging utility
   */
  private log(message: string, verbose = false): void {
    if (verbose) {
      console.log(`[WidgetMigration] ${message}`)
    }
    this.migrationLog.push(`${new Date().toISOString()}: ${message}`)
  }

  /**
   * Get migration log
   */
  getMigrationLog(): string[] {
    return [...this.migrationLog]
  }

  /**
   * Clear migration log
   */
  clearMigrationLog(): void {
    this.migrationLog = []
  }
}

// Export singleton instance
export const widgetMigration = new WidgetMigrationSystem()

// Export utility functions
export const createMigrationBackup = () =>
  widgetMigration.createMigrationBackup()
export const restoreFromBackup = (timestamp: string) =>
  widgetMigration.restoreFromBackup(timestamp)
export const checkVersionCompatibility = () =>
  widgetMigration.checkVersionCompatibility()
export const cleanupMigrationData = () => widgetMigration.cleanupMigrationData()
export const getAvailableBackups = () => widgetMigration.getAvailableBackups()

// Export types
export type {
  MigrationResult,
  MigrationOptions,
  DataTransformationResult,
  LegacyStockModalData,
  LegacyDashboardLayout,
}
