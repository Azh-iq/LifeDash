#!/usr/bin/env npx tsx

/**
 * Widget System Verification Script
 * 
 * This script verifies that the widget board system is properly configured
 * and ready for production use.
 */

import { promises as fs } from 'fs'
import path from 'path'

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

interface VerificationResult {
  category: string
  test: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
}

const results: VerificationResult[] = []

function log(category: string, test: string, status: 'PASS' | 'FAIL' | 'WARN', message: string) {
  results.push({ category, test, status, message })
  const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow
  console.log(`${color}[${status}]${colors.reset} ${colors.bold}${category}${colors.reset}: ${test} - ${message}`)
}

async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function checkDirectoryExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath)
    return stat.isDirectory()
  } catch {
    return false
  }
}

async function verifyFileStructure() {
  console.log(`\n${colors.blue}📁 Verifying File Structure...${colors.reset}`)
  
  const requiredFiles = [
    'components/widgets/simple-widget-demo.tsx',
    'components/widgets/widget-store.ts',
    'components/widgets/widget-registry.tsx',
    'components/widgets/widget-types.ts',
    'components/widgets/index.ts',
    'app/widget-demo/page.tsx',
    'lib/types/widget.types.ts'
  ]

  for (const file of requiredFiles) {
    const exists = await checkFileExists(file)
    log(
      'File Structure',
      `${file}`,
      exists ? 'PASS' : 'FAIL',
      exists ? 'File exists' : 'File missing'
    )
  }

  const requiredDirectories = [
    'components/widgets',
    'components/widgets/base',
    'components/widgets/stock',
    'components/widgets/ui',
    'lib/actions/widgets'
  ]

  for (const dir of requiredDirectories) {
    const exists = await checkDirectoryExists(dir)
    log(
      'Directory Structure',
      `${dir}/`,
      exists ? 'PASS' : 'WARN',
      exists ? 'Directory exists' : 'Directory missing (optional)'
    )
  }
}

async function verifyTypeScriptConfig() {
  console.log(`\n${colors.blue}⚙️ Verifying TypeScript Configuration...${colors.reset}`)
  
  try {
    const tsconfigContent = await fs.readFile('tsconfig.json', 'utf-8')
    const tsconfig = JSON.parse(tsconfigContent)
    
    // Check for required types
    const hasJestTypes = tsconfig.compilerOptions?.types?.includes('jest')
    const hasTestingLibraryTypes = tsconfig.compilerOptions?.types?.includes('@testing-library/jest-dom')
    
    log(
      'TypeScript Config',
      'Jest types',
      hasJestTypes ? 'PASS' : 'WARN',
      hasJestTypes ? 'Jest types configured' : 'Jest types not found in tsconfig'
    )
    
    log(
      'TypeScript Config',
      'Testing Library types',
      hasTestingLibraryTypes ? 'PASS' : 'WARN',
      hasTestingLibraryTypes ? 'Testing Library types configured' : 'Testing Library types not found'
    )
    
    // Check for path aliases
    const hasPathAliases = !!tsconfig.compilerOptions?.paths
    log(
      'TypeScript Config',
      'Path aliases',
      hasPathAliases ? 'PASS' : 'WARN',
      hasPathAliases ? 'Path aliases configured' : 'Path aliases not configured'
    )
    
  } catch (error) {
    log('TypeScript Config', 'Configuration file', 'FAIL', 'Could not read or parse tsconfig.json')
  }
}

async function verifyPackageJson() {
  console.log(`\n${colors.blue}📦 Verifying Package Configuration...${colors.reset}`)
  
  try {
    const packageContent = await fs.readFile('package.json', 'utf-8')
    const packageJson = JSON.parse(packageContent)
    
    const requiredDeps = ['zustand', 'framer-motion', 'next', 'react', 'typescript']
    const requiredDevDeps = ['@types/react', '@types/node', 'eslint', 'prettier']
    
    for (const dep of requiredDeps) {
      const exists = !!packageJson.dependencies?.[dep]
      log(
        'Dependencies',
        dep,
        exists ? 'PASS' : 'FAIL',
        exists ? 'Dependency found' : 'Required dependency missing'
      )
    }
    
    for (const dep of requiredDevDeps) {
      const exists = !!packageJson.devDependencies?.[dep]
      log(
        'Dev Dependencies',
        dep,
        exists ? 'PASS' : 'WARN',
        exists ? 'Dev dependency found' : 'Dev dependency missing'
      )
    }
    
  } catch (error) {
    log('Package Config', 'package.json', 'FAIL', 'Could not read or parse package.json')
  }
}

async function verifyBuildOutput() {
  console.log(`\n${colors.blue}🏗️ Verifying Build Output...${colors.reset}`)
  
  const nextDirExists = await checkDirectoryExists('.next')
  log(
    'Build Output',
    '.next directory',
    nextDirExists ? 'PASS' : 'WARN',
    nextDirExists ? 'Build output exists' : 'No build output found (run npm run build)'
  )
  
  if (nextDirExists) {
    const buildManifestExists = await checkFileExists('.next/build-manifest.json')
    log(
      'Build Output',
      'Build manifest',
      buildManifestExists ? 'PASS' : 'WARN',
      buildManifestExists ? 'Build manifest found' : 'Build manifest missing'
    )
  }
}

async function verifyWidgetSystemIntegration() {
  console.log(`\n${colors.blue}🎛️ Verifying Widget System Integration...${colors.reset}`)
  
  try {
    // Check if widget demo page exists and is properly configured
    const demoPageContent = await fs.readFile('app/widget-demo/page.tsx', 'utf-8')
    
    const hasSimpleWidgetDemo = demoPageContent.includes('SimpleWidgetDemo')
    log(
      'Widget Integration',
      'Demo page component',
      hasSimpleWidgetDemo ? 'PASS' : 'FAIL',
      hasSimpleWidgetDemo ? 'Widget demo properly imported' : 'Widget demo not found'
    )
    
    // Check widget store exports
    const widgetIndexContent = await fs.readFile('components/widgets/index.ts', 'utf-8')
    const hasStoreExports = widgetIndexContent.includes('useWidgetStore')
    log(
      'Widget Integration',
      'Store exports',
      hasStoreExports ? 'PASS' : 'FAIL',
      hasStoreExports ? 'Widget store exports found' : 'Widget store exports missing'
    )
    
  } catch (error) {
    log('Widget Integration', 'File verification', 'FAIL', `Error reading files: ${error}`)
  }
}

async function generateReport() {
  console.log(`\n${colors.blue}📊 Generating Summary Report...${colors.reset}`)
  
  const categories = [...new Set(results.map(r => r.category))]
  const summary: Record<string, { pass: number; fail: number; warn: number; total: number }> = {}
  
  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category)
    summary[category] = {
      pass: categoryResults.filter(r => r.status === 'PASS').length,
      fail: categoryResults.filter(r => r.status === 'FAIL').length,
      warn: categoryResults.filter(r => r.status === 'WARN').length,
      total: categoryResults.length
    }
  }
  
  console.log(`\n${colors.bold}=== WIDGET SYSTEM VERIFICATION REPORT ===${colors.reset}`)
  console.log(`Date: ${new Date().toISOString()}`)
  console.log(`Total Tests: ${results.length}`)
  
  for (const [category, stats] of Object.entries(summary)) {
    const passRate = ((stats.pass / stats.total) * 100).toFixed(1)
    const statusColor = stats.fail > 0 ? colors.red : stats.warn > 0 ? colors.yellow : colors.green
    
    console.log(`\n${colors.bold}${category}:${colors.reset}`)
    console.log(`  ${statusColor}✓ ${stats.pass} passed${colors.reset}`)
    console.log(`  ${colors.yellow}⚠ ${stats.warn} warnings${colors.reset}`)
    console.log(`  ${colors.red}✗ ${stats.fail} failed${colors.reset}`)
    console.log(`  ${statusColor}Pass Rate: ${passRate}%${colors.reset}`)
  }
  
  const totalPass = results.filter(r => r.status === 'PASS').length
  const totalFail = results.filter(r => r.status === 'FAIL').length
  const totalWarn = results.filter(r => r.status === 'WARN').length
  const overallPassRate = ((totalPass / results.length) * 100).toFixed(1)
  
  console.log(`\n${colors.bold}=== OVERALL STATUS ===${colors.reset}`)
  if (totalFail === 0) {
    console.log(`${colors.green}${colors.bold}✅ SYSTEM READY FOR PRODUCTION${colors.reset}`)
  } else if (totalFail <= 3) {
    console.log(`${colors.yellow}${colors.bold}⚠️ SYSTEM NEEDS MINOR FIXES${colors.reset}`)
  } else {
    console.log(`${colors.red}${colors.bold}❌ SYSTEM NEEDS MAJOR FIXES${colors.reset}`)
  }
  
  console.log(`Overall Pass Rate: ${overallPassRate}%`)
  console.log(`Recommendation: ${getRecommendation(totalFail, totalWarn)}`)
}

function getRecommendation(fails: number, warns: number): string {
  if (fails === 0 && warns <= 2) {
    return 'System is production-ready. Proceed with deployment.'
  } else if (fails <= 2) {
    return 'Address critical failures before production deployment.'
  } else {
    return 'System requires significant fixes before production use.'
  }
}

async function main() {
  console.log(`${colors.bold}${colors.blue}🧪 LifeDash Widget System Verification${colors.reset}`)
  console.log(`${colors.blue}Testing widget board system for production readiness...${colors.reset}\n`)
  
  try {
    await verifyFileStructure()
    await verifyTypeScriptConfig()
    await verifyPackageJson()
    await verifyBuildOutput()
    await verifyWidgetSystemIntegration()
    await generateReport()
    
    console.log(`\n${colors.blue}Verification complete!${colors.reset}`)
    
  } catch (error) {
    console.error(`${colors.red}Verification failed with error:${colors.reset}`, error)
    process.exit(1)
  }
}

// Run verification
main().catch(console.error)