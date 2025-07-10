#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { NordnetCSVParser } from '../lib/integrations/nordnet/csv-parser';

async function testCSVParser() {
  console.log('🧪 Testing Nordnet CSV parser...\n');

  try {
    // Read the CSV file as a File object
    const csvBuffer = readFileSync('./test-nordnet-export.csv');
    console.log('📁 File loaded, size:', csvBuffer.length, 'bytes');

    // Create a File object from buffer
    const file = new File([csvBuffer], 'test-nordnet-export.csv', { type: 'text/csv' });

    // Parse with the Nordnet parser
    const result = await NordnetCSVParser.parseFile(file);

    console.log('📊 Parse Results:');
    console.log(`  - Success: ${result.success}`);
    console.log(`  - Total rows: ${result.totalRows}`);
    console.log(`  - Valid rows: ${result.validRows}`);
    console.log(`  - Errors: ${result.errors.length}`);
    console.log(`  - Warnings: ${result.warnings.length}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.slice(0, 3).forEach(error => console.log(`  - ${error}`));
      if (result.errors.length > 3) {
        console.log(`  ... and ${result.errors.length - 3} more`);
      }
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      result.warnings.slice(0, 3).forEach(warning => console.log(`  - ${warning}`));
      if (result.warnings.length > 3) {
        console.log(`  ... and ${result.warnings.length - 3} more`);
      }
    }

    if (result.rows && result.rows.length > 0) {
      console.log('\n📋 Sample parsed transactions:');
      result.rows.slice(0, 3).forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.Verdipapir} - ${row.Transaksjontype} ${row.Antall} @ ${row.Kurs}`);
      });
      if (result.rows.length > 3) {
        console.log(`  ... and ${result.rows.length - 3} more transactions`);
      }
    }

    console.log('\n✅ CSV parser test completed');
    return result.success;

  } catch (error) {
    console.error('❌ CSV parser test failed:', error);
    return false;
  }
}

testCSVParser().catch(console.error);