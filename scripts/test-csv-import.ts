#!/usr/bin/env tsx

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { NordnetCSVParser } from '../lib/integrations/nordnet/csv-parser';
import { importNordnetTransactions } from '../lib/actions/transactions/csv-import';

config({ path: '.env.local' });

async function testCSVImport() {
  console.log('🧪 Testing full CSV import flow...\n');

  try {
    // Step 1: Parse the CSV file
    const csvBuffer = readFileSync('./test-nordnet-export.csv');
    const file = new File([csvBuffer], 'test-nordnet-export.csv', { type: 'text/csv' });
    
    console.log('📁 Parsing CSV file...');
    const parseResult = await NordnetCSVParser.parseFile(file);
    
    if (!parseResult || parseResult.errors.length > 0) {
      console.log('❌ CSV parsing failed:', parseResult?.errors);
      return;
    }

    console.log(`✅ CSV parsed successfully: ${parseResult.totalRows} rows`);

    // Step 2: Import to database
    console.log('\n📤 Importing transactions to database...');
    const importResult = await importNordnetTransactions(parseResult);

    console.log('📊 Import Results:');
    console.log(`  - Success: ${importResult.success}`);
    
    if (importResult.success && importResult.data) {
      console.log(`  - Created transactions: ${importResult.data.createdTransactions}`);
      console.log(`  - Created accounts: ${importResult.data.createdAccounts}`);
      console.log(`  - Skipped rows: ${importResult.data.skippedRows}`);
      console.log(`  - Errors: ${importResult.data.errors.length}`);
      console.log(`  - Warnings: ${importResult.data.warnings.length}`);
      
      if (importResult.data.errors.length > 0) {
        console.log('\n❌ Import Errors:');
        importResult.data.errors.slice(0, 3).forEach(error => console.log(`  - ${error}`));
      }
      
      if (importResult.data.warnings.length > 0) {
        console.log('\n⚠️ Import Warnings:');
        importResult.data.warnings.slice(0, 3).forEach(warning => console.log(`  - ${warning}`));
      }
    } else {
      console.log(`  - Error: ${importResult.error}`);
    }

    console.log('\n✅ CSV import test completed');

  } catch (error) {
    console.error('❌ CSV import test failed:', error);
  }
}

testCSVImport().catch(console.error);