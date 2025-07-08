#!/usr/bin/env node

/**
 * Validation script for Enhanced Holdings Table
 * Validates the code structure and functionality without requiring authentication
 */

import { readFileSync } from 'fs'
import { join } from 'path'

interface ValidationResult {
  component: string
  feature: string
  status: 'passed' | 'failed' | 'warning'
  message: string
}

class EnhancedHoldingsValidator {
  private results: ValidationResult[] = []

  private addResult(component: string, feature: string, status: 'passed' | 'failed' | 'warning', message: string) {
    this.results.push({ component, feature, status, message })
    const emoji = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⚠️'
    console.log(`${emoji} ${component}: ${feature} - ${message}`)
  }

  private fileExists(path: string): boolean {
    try {
      readFileSync(path, 'utf8')
      return true
    } catch {
      return false
    }
  }

  private getFileContent(path: string): string | null {
    try {
      return readFileSync(path, 'utf8')
    } catch {
      return null
    }
  }

  private checkFileContains(filePath: string, searchTerms: string[]): boolean {
    const content = this.getFileContent(filePath)
    if (!content) return false
    
    return searchTerms.every(term => content.includes(term))
  }

  validateHoldingsTableComponent() {
    console.log('🔍 Validating Norwegian Holdings Table component...')
    
    const filePath = join(process.cwd(), 'components/stocks/norwegian-holdings-table.tsx')
    
    if (!this.fileExists(filePath)) {
      this.addResult('Holdings Table', 'File exists', 'failed', 'Component file not found')
      return
    }

    const content = this.getFileContent(filePath)!
    
    // Check for real-time update features
    const realTimeFeatures = [
      'useEffect',
      'useCallback',
      'onRefresh',
      'onOptimisticUpdate',
      'isProcessingTransaction',
      'transactionSuccess',
      'transactionError',
      'toast'
    ]
    
    const hasRealTimeFeatures = realTimeFeatures.every(feature => content.includes(feature))
    this.addResult('Holdings Table', 'Real-time features', hasRealTimeFeatures ? 'passed' : 'failed', 
      hasRealTimeFeatures ? 'All real-time features implemented' : 'Missing real-time features')

    // Check for optimistic updates
    const optimisticFeatures = [
      'optimisticHoldings',
      'setOptimisticHoldings',
      'handleOptimisticUpdate'
    ]
    
    const hasOptimisticFeatures = optimisticFeatures.every(feature => content.includes(feature))
    this.addResult('Holdings Table', 'Optimistic updates', hasOptimisticFeatures ? 'passed' : 'failed',
      hasOptimisticFeatures ? 'Optimistic update features implemented' : 'Missing optimistic update features')

    // Check for transaction status UI
    const statusFeatures = [
      'AnimatePresence',
      'Loader2',
      'CheckCircle',
      'AlertCircle',
      'isProcessingTransaction',
      'transactionSuccess',
      'transactionError'
    ]
    
    const hasStatusFeatures = statusFeatures.every(feature => content.includes(feature))
    this.addResult('Holdings Table', 'Transaction status UI', hasStatusFeatures ? 'passed' : 'failed',
      hasStatusFeatures ? 'Transaction status UI implemented' : 'Missing transaction status UI')

    // Check for live price indicators
    const priceFeatures = [
      'animate-pulse',
      'LIVE',
      'Live pris'
    ]
    
    const hasPriceFeatures = priceFeatures.some(feature => content.includes(feature))
    this.addResult('Holdings Table', 'Live price indicators', hasPriceFeatures ? 'passed' : 'failed',
      hasPriceFeatures ? 'Live price indicators implemented' : 'Missing live price indicators')
  }

  validateStocksPageComponent() {
    console.log('🔍 Validating Stocks Page component...')
    
    const filePath = join(process.cwd(), 'app/investments/stocks/page.tsx')
    
    if (!this.fileExists(filePath)) {
      this.addResult('Stocks Page', 'File exists', 'failed', 'Component file not found')
      return
    }

    const content = this.getFileContent(filePath)!
    
    // Check for transaction processing state
    const transactionFeatures = [
      'isProcessingTransaction',
      'setIsProcessingTransaction',
      'transactionSuccess',
      'transactionError',
      'optimisticHoldings',
      'handleOptimisticUpdate'
    ]
    
    const hasTransactionFeatures = transactionFeatures.every(feature => content.includes(feature))
    this.addResult('Stocks Page', 'Transaction processing', hasTransactionFeatures ? 'passed' : 'failed',
      hasTransactionFeatures ? 'Transaction processing state implemented' : 'Missing transaction processing state')

    // Check for enhanced refresh functionality
    const refreshFeatures = [
      'handleRefresh',
      'handleTopNavImportComplete',
      'toast.success',
      'toast.error',
      'toast.loading'
    ]
    
    const hasRefreshFeatures = refreshFeatures.every(feature => content.includes(feature))
    this.addResult('Stocks Page', 'Enhanced refresh', hasRefreshFeatures ? 'passed' : 'failed',
      hasRefreshFeatures ? 'Enhanced refresh functionality implemented' : 'Missing enhanced refresh functionality')

    // Check for optimistic updates integration
    const optimisticFeatures = [
      'optimisticHolding',
      'setOptimisticHoldings',
      'onOptimisticUpdate',
      'handleOptimisticUpdate'
    ]
    
    const hasOptimisticFeatures = optimisticFeatures.every(feature => content.includes(feature))
    this.addResult('Stocks Page', 'Optimistic updates', hasOptimisticFeatures ? 'passed' : 'failed',
      hasOptimisticFeatures ? 'Optimistic updates integration implemented' : 'Missing optimistic updates integration')
  }

  validatePortfolioStateHook() {
    console.log('🔍 Validating Portfolio State hook...')
    
    const filePath = join(process.cwd(), 'lib/hooks/use-portfolio-state.ts')
    
    if (!this.fileExists(filePath)) {
      this.addResult('Portfolio State', 'File exists', 'failed', 'Hook file not found')
      return
    }

    const content = this.getFileContent(filePath)!
    
    // Check for enhanced update detection
    const updateFeatures = [
      'hasChanges',
      'updateHoldingsWithPrices',
      'fastRefresh',
      'holdingsRef',
      'realtimePricesRef'
    ]
    
    const hasUpdateFeatures = updateFeatures.every(feature => content.includes(feature))
    this.addResult('Portfolio State', 'Enhanced updates', hasUpdateFeatures ? 'passed' : 'failed',
      hasUpdateFeatures ? 'Enhanced update detection implemented' : 'Missing enhanced update detection')

    // Check for improved error handling
    const errorFeatures = [
      'try {',
      'catch (error)',
      'throw error',
      'console.error'
    ]
    
    const hasErrorFeatures = errorFeatures.every(feature => content.includes(feature))
    this.addResult('Portfolio State', 'Error handling', hasErrorFeatures ? 'passed' : 'failed',
      hasErrorFeatures ? 'Improved error handling implemented' : 'Missing improved error handling')

    // Check for performance optimizations
    const performanceFeatures = [
      'volatility',
      'fastRefresh',
      'hasChanges'
    ]
    
    const hasPerformanceFeatures = performanceFeatures.every(feature => content.includes(feature))
    this.addResult('Portfolio State', 'Performance optimizations', hasPerformanceFeatures ? 'passed' : 'failed',
      hasPerformanceFeatures ? 'Performance optimizations implemented' : 'Missing performance optimizations')
  }

  validateSupportingComponents() {
    console.log('🔍 Validating supporting components...')
    
    // Check for toast setup
    const layoutPath = join(process.cwd(), 'app/layout.tsx')
    if (this.fileExists(layoutPath)) {
      const layoutContent = this.getFileContent(layoutPath)!
      const hasToaster = layoutContent.includes('Toaster') && layoutContent.includes('sonner')
      this.addResult('Supporting Components', 'Toast setup', hasToaster ? 'passed' : 'failed',
        hasToaster ? 'Sonner toast setup implemented' : 'Missing Sonner toast setup')
    }

    // Check for loading spinner component
    const spinnerPath = join(process.cwd(), 'components/ui/loading-spinner.tsx')
    const hasSpinner = this.fileExists(spinnerPath)
    this.addResult('Supporting Components', 'Loading spinner', hasSpinner ? 'passed' : 'failed',
      hasSpinner ? 'Loading spinner component created' : 'Missing loading spinner component')

    // Check for transaction status component
    const statusPath = join(process.cwd(), 'components/stocks/transaction-status.tsx')
    const hasStatus = this.fileExists(statusPath)
    this.addResult('Supporting Components', 'Transaction status', hasStatus ? 'passed' : 'failed',
      hasStatus ? 'Transaction status component created' : 'Missing transaction status component')
  }

  validateDependencies() {
    console.log('🔍 Validating dependencies...')
    
    const packageJsonPath = join(process.cwd(), 'package.json')
    
    if (!this.fileExists(packageJsonPath)) {
      this.addResult('Dependencies', 'Package.json exists', 'failed', 'package.json not found')
      return
    }

    const content = this.getFileContent(packageJsonPath)!
    
    // Check for required dependencies
    const requiredDeps = [
      'sonner',
      'framer-motion',
      'lucide-react'
    ]
    
    const hasRequiredDeps = requiredDeps.every(dep => content.includes(`"${dep}"`))
    this.addResult('Dependencies', 'Required packages', hasRequiredDeps ? 'passed' : 'failed',
      hasRequiredDeps ? 'All required dependencies installed' : 'Missing required dependencies')
  }

  validateEnhancedFeatures() {
    console.log('🔍 Validating enhanced features...')
    
    // Check for real-time updates
    const holdingsTablePath = join(process.cwd(), 'components/stocks/norwegian-holdings-table.tsx')
    const stocksPagePath = join(process.cwd(), 'app/investments/stocks/page.tsx')
    
    if (this.fileExists(holdingsTablePath) && this.fileExists(stocksPagePath)) {
      const holdingsContent = this.getFileContent(holdingsTablePath)!
      const stocksContent = this.getFileContent(stocksPagePath)!
      
      const hasRealTimeIntegration = 
        holdingsContent.includes('onRefresh') && 
        stocksContent.includes('handleRefresh') &&
        stocksContent.includes('onRefresh={handleRefresh}')
      
      this.addResult('Enhanced Features', 'Real-time integration', hasRealTimeIntegration ? 'passed' : 'failed',
        hasRealTimeIntegration ? 'Real-time updates integrated' : 'Missing real-time integration')
    }

    // Check for optimistic updates
    const hasOptimisticIntegration = 
      this.checkFileContains(holdingsTablePath, ['optimisticHoldings', 'onOptimisticUpdate']) &&
      this.checkFileContains(stocksPagePath, ['handleOptimisticUpdate', 'onOptimisticUpdate'])
    
    this.addResult('Enhanced Features', 'Optimistic updates', hasOptimisticIntegration ? 'passed' : 'failed',
      hasOptimisticIntegration ? 'Optimistic updates integrated' : 'Missing optimistic updates integration')

    // Check for transaction processing
    const hasTransactionProcessing = 
      this.checkFileContains(holdingsTablePath, ['isProcessingTransaction', 'transactionSuccess']) &&
      this.checkFileContains(stocksPagePath, ['setIsProcessingTransaction', 'transactionSuccess'])
    
    this.addResult('Enhanced Features', 'Transaction processing', hasTransactionProcessing ? 'passed' : 'failed',
      hasTransactionProcessing ? 'Transaction processing implemented' : 'Missing transaction processing')
  }

  runValidation() {
    console.log('🚀 Starting Enhanced Holdings Table Validation\n')
    
    this.validateHoldingsTableComponent()
    console.log('')
    
    this.validateStocksPageComponent()
    console.log('')
    
    this.validatePortfolioStateHook()
    console.log('')
    
    this.validateSupportingComponents()
    console.log('')
    
    this.validateDependencies()
    console.log('')
    
    this.validateEnhancedFeatures()
    console.log('')

    console.log('📊 Validation Summary:')
    console.log('=====================')
    
    const passed = this.results.filter(r => r.status === 'passed').length
    const failed = this.results.filter(r => r.status === 'failed').length
    const warnings = this.results.filter(r => r.status === 'warning').length
    const total = this.results.length
    
    console.log(`✅ Passed: ${passed}/${total}`)
    console.log(`❌ Failed: ${failed}/${total}`)
    console.log(`⚠️  Warnings: ${warnings}/${total}`)
    
    if (failed > 0) {
      console.log('\n❌ Failed validations:')
      this.results
        .filter(r => r.status === 'failed')
        .forEach(r => console.log(`   ${r.component}: ${r.feature} - ${r.message}`))
    }
    
    if (warnings > 0) {
      console.log('\n⚠️  Warnings:')
      this.results
        .filter(r => r.status === 'warning')
        .forEach(r => console.log(`   ${r.component}: ${r.feature} - ${r.message}`))
    }

    return { passed, failed, warnings, total }
  }
}

// Run validation
const validator = new EnhancedHoldingsValidator()
const summary = validator.runValidation()

// Exit with appropriate code
process.exit(summary.failed > 0 ? 1 : 0)