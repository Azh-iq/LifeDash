# CSV Import Troubleshooting Guide

This guide helps resolve common issues with CSV import functionality in LifeDash.

## 🔍 Common Issues and Solutions

### 1. Norwegian Characters Display as Garbled Text

**Problem**: Headers like "Bokføringsdag" appear as "B o k f ø r i n g s d a g" or with question marks.

**Solution**:

- The system automatically detects UTF-16LE encoding (common for Norwegian Nordnet exports)
- If characters still appear garbled, the file may have been saved in an incompatible encoding
- Try exporting the CSV again from Nordnet or ensure it's saved as UTF-16 or UTF-8

**Technical Details**:

```typescript
// The system tries encodings in this order:
1. UTF-16LE (with BOM detection)
2. Windows-1252 (Nordic banking standard)
3. ISO-8859-1 (fallback)
4. UTF-8 (final fallback)
```

### 2. "File doesn't match Nordnet export patterns" Warning

**Problem**: Warning appears even though the file is from Nordnet.

**Solution**:

- This is a warning, not an error - the import can still proceed
- The file validation looks for patterns like "nordnet", "transaksjoner", "export" in filename
- Rename your file to include "nordnet" or "transaksjoner" to suppress the warning

**Expected Filename Patterns**:

- `nordnet_export_2025.csv`
- `transaksjoner_2025.csv`
- `transactions-and-notes-export.csv`

### 3. Missing Required Headers Error

**Problem**: Error about missing required Nordnet headers.

**Solution**:

- Ensure your CSV export includes all necessary columns
- Required headers: `Id`, `Bokføringsdag`, `Transaksjonstype`, `Portefølje`, `Beløp`, `Valuta`
- Re-export from Nordnet with all transaction details included

**Verification**:

```bash
# Check if your CSV has the required headers
head -1 your_file.csv | grep -E "(Id|Bokføringsdag|Transaksjonstype)"
```

### 4. Date Parsing Errors

**Problem**: Dates in transactions are not being parsed correctly.

**Solution**:

- The system supports multiple date formats:
  - `YYYY-MM-DD` (ISO format)
  - `DD.MM.YYYY` (Norwegian format)
  - `DD/MM/YYYY` (Alternative format)
  - `DD-MM-YYYY` (Alternative format)
- Ensure dates are in one of these formats

**Example Valid Dates**:

- `2025-01-15`
- `15.01.2025`
- `15/01/2025`

### 5. Number Parsing Issues

**Problem**: Norwegian decimal numbers (using comma) not parsing correctly.

**Solution**:

- The system automatically handles Norwegian number formats
- Supports both comma (`,`) and dot (`.`) as decimal separators
- Handles thousand separators correctly

**Supported Number Formats**:

- `1234.56` (International)
- `1234,56` (Norwegian)
- `1 234,56` (With space thousand separator)
- `-1234,56` (Negative amounts)

### 6. Duplicate Transaction Warnings

**Problem**: Warning about duplicate transactions during import.

**Solution**:

- The system automatically skips duplicates based on transaction ID
- This is normal behavior when re-importing the same file
- Check the import summary to see how many were skipped vs. created

**Configuration**:

```typescript
// Duplicate handling options:
duplicateTransactionHandling: 'skip' // Default - skip duplicates
duplicateTransactionHandling: 'update' // Update existing
duplicateTransactionHandling: 'error' // Fail on duplicates
```

### 7. Unknown Transaction Types

**Problem**: Some transaction types are not recognized.

**Solution**:

- The system recognizes common Nordnet transaction types
- Unknown types are still imported but marked with warnings
- Check the supported transaction types list below

**Supported Transaction Types**:

- `KJØPT` (Purchase)
- `SALG` (Sale)
- `UTBETALING` (Withdrawal)
- `Overføring via Trustly` (Trustly Transfer)
- `FORSIKRINGSKOSTNAD` (Insurance Cost)
- `PREMIEINNBETALING` (Premium Payment)
- `Utbetaling aksjeutlån` (Share Lending Payout)

### 8. Large File Processing Timeout

**Problem**: Large CSV files timeout during processing.

**Solution**:

- Maximum supported file size: 50MB
- For very large files, consider splitting them by date range
- The system processes approximately 1000 rows per second

**Performance Tips**:

- Close other browser tabs during import
- Ensure stable internet connection
- Import during off-peak hours

### 9. Portfolio/Account Creation Issues

**Problem**: New portfolios or accounts are not being created correctly.

**Solution**:

- The system automatically creates missing portfolios based on CSV data
- Portfolio names are taken from the "Portefølje" column
- If you have multiple portfolios, they will be created separately

**Default Portfolio Mapping**:

```typescript
// Portfolio types inferred from names:
"IPS" → PENSION (Individual Pension Savings)
"BSU" → SAVINGS (Housing Savings for Youth)
"ISK" → TFSA (Investment Savings Account)
Numeric ID → TAXABLE (Regular Investment Account)
```

### 10. UI Navigation Issues

**Problem**: Can't find the CSV import option.

**Solution**:

- **Top Navigation**: Click the hamburger menu (☰) → "CSV Import"
- **Empty State**: If you have no transactions, the import button is prominently displayed
- **Stocks Page**: Available in the top navigation when viewing portfolio

**Access Points**:

1. `Top Navigation Menu` → Tools → CSV Import
2. `Empty Stocks Page` → "Importer CSV" button
3. `Keyboard Shortcut`: Press `Ctrl+I` (planned feature)

## 🧪 Testing Your CSV File

Before importing, you can test your CSV file:

```bash
# Run the test script (from project root)
npx tsx scripts/test-csv-import.ts

# Check file encoding
file -I your_nordnet_export.csv

# Preview first few lines
head -5 your_nordnet_export.csv
```

## 📧 Getting Help

If you encounter issues not covered in this guide:

1. **Check the Console**: Open browser dev tools (F12) and check for errors
2. **Export Logs**: The import process logs detailed information
3. **File Support**: Ensure your file is a genuine Nordnet CSV export
4. **Browser Compatibility**: Use Chrome, Firefox, Safari, or Edge (latest versions)

## 🔧 Technical Debugging

For developers debugging import issues:

### Enable Debug Mode

```typescript
// Add to localStorage in browser console
localStorage.setItem('csv_import_debug', 'true')
```

### Check Parse Results

```typescript
// In browser console after import attempt
console.log(window.csvImportDebugData)
```

### Verify Field Mappings

```typescript
// Check if specific fields are being mapped correctly
const testRow = { Bokføringsdag: '2025-01-15', Beløp: '1234,56' }
const mapped = NordnetFieldMapper.transformRow(testRow)
console.log(mapped)
```

## 📋 Validation Checklist

Before reporting an issue, verify:

- [ ] File is genuine Nordnet CSV export
- [ ] File size is under 50MB
- [ ] Norwegian characters display correctly in text editor
- [ ] Required headers are present
- [ ] Dates are in supported format
- [ ] Browser is supported version
- [ ] No browser extensions blocking file upload
- [ ] Stable internet connection during import

---

_Last updated: January 2025_
_For technical support, refer to the main documentation in CLAUDE.md_
