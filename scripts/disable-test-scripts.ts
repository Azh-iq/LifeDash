#!/usr/bin/env tsx

// Rename test scripts to .disabled to prevent accidental execution
import { promises as fs } from 'fs'
import { join } from 'path'

const scriptsToDisable = [
  'add-test-holdings.ts',
  'create-test-portfolio.ts',
  'create-skip-test-user.ts',
  'create-persistent-test-user.ts',
  'add-realistic-test-transactions.ts',
  'add-realistic-test-transactions-final.ts',
  'test-finnhub-integration.ts',
]

async function disableTestScripts() {
  console.log('🔒 Disabling test scripts to prevent accidental execution...')

  const scriptsDir = join(process.cwd(), 'scripts')

  for (const scriptName of scriptsToDisable) {
    const scriptPath = join(scriptsDir, scriptName)
    const disabledPath = join(scriptsDir, `${scriptName}.disabled`)

    try {
      // Check if script exists
      await fs.access(scriptPath)

      // Rename to .disabled
      await fs.rename(scriptPath, disabledPath)
      console.log(`✅ Disabled: ${scriptName} → ${scriptName}.disabled`)
    } catch (error) {
      console.log(`ℹ️  Script not found or already disabled: ${scriptName}`)
    }
  }

  console.log('\n🎉 Test scripts have been disabled!')
  console.log(
    'ℹ️  You can re-enable them by removing the .disabled extension if needed'
  )
}

// Run the disable process
disableTestScripts().catch(console.error)
