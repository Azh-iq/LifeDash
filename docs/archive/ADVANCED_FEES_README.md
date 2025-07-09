# Advanced Fees System - Implementation Guide

## Overview

The Advanced Fees System allows users to separately track different types of fees (kurtasje, valutaveksling, andre gebyrer) instead of using a single "fees" field. This provides better insight into trading costs and enables fee optimization analysis.

## 🎯 Features Implemented

### 1. AdvancedFeesInput Component

**File**: `/components/stocks/advanced-fees-input.tsx`

- **Expandable Interface**: Collapsed by default showing total fees, expandable to show breakdown
- **Three Fee Categories**:
  - **Kurtasje** (Commission): Brokerage fees for trading
  - **Valutaveksling** (Currency Exchange): Currency conversion fees for foreign stocks
  - **Andre gebyrer** (Other Fees): Miscellaneous fees (market fees, clearing, etc.)
- **Auto-calculation**: Total fees automatically calculated from individual components
- **Smart Defaults**: Pre-configured defaults for Norwegian brokers
- **Help Tooltips**: User guidance for each fee type
- **Norwegian Localization**: All text in Norwegian

### 2. Broker Defaults

Pre-configured fee structures for common Norwegian brokers:

```typescript
- Nordnet (NOK): 99 NOK commission
- Nordnet (USD): $0.99 commission + 25 NOK currency exchange
- DNB: 149 NOK commission (+ 50 NOK for foreign stocks)
- Handelsbanken: 199 NOK commission (+ 35 NOK for foreign stocks)
```

### 3. Database Schema Enhancement

**Migration**: `016_advanced_fees_system.sql`

- **Reused Existing Columns**:
  - `commission` (kurtasje)
  - `sec_fees` (repurposed for valutaveksling)
  - `other_fees` (andre gebyrer)
  - `total_fees` (auto-calculated)
- **Fee Analysis View**: `transaction_fee_analysis` for comprehensive fee reporting
- **Fee Statistics Function**: `get_user_fee_statistics()` for fee optimization insights
- **Validation Triggers**: Ensures all fee components are non-negative

### 4. Updated Transaction Modal

**File**: `/components/stocks/add-transaction-modal.tsx`

- **Interface Update**: Added `AdvancedFees` to `TransactionData`
- **Seamless Integration**: Replaces simple fee input with advanced component
- **Backward Compatibility**: Still supports simple fee entry when collapsed
- **Smart Calculation**: Total amount calculation uses advanced fees when available

### 5. Enhanced Transaction Processing

**File**: `/lib/actions/transactions/add-transaction.ts`

- **Fee Mapping**: Maps advanced fees to database columns
- **Fallback Logic**: Uses legacy `fees` field if advanced fees not provided
- **Database Integration**: Correctly stores fee breakdown in database

## 🚀 Usage Examples

### Basic Usage (Collapsed State)

```typescript
// User sees simple "Gebyrer" field with total amount
<AdvancedFeesInput
  fees={{ commission: 0, currencyExchange: 0, otherFees: 0, total: 99 }}
  onChange={setFees}
  currency="NOK"
  symbol="EQNR.OL"
/>
```

### Advanced Usage (Expanded State)

```typescript
// User sees breakdown of all fee components
const advancedFees = {
  commission: 99, // Nordnet commission
  currencyExchange: 0, // No currency exchange for NOK
  otherFees: 0, // No additional fees
  total: 99, // Auto-calculated
}
```

### Broker Default Application

```typescript
// Apply Nordnet defaults for US stocks
const nordnetUSD = {
  commission: 0.99,
  currencyExchange: 25,
  otherFees: 0,
  total: 25.99,
}
```

## 📊 Database Structure

### Updated Transaction Record

```sql
INSERT INTO transactions (
  commission,           -- 99.00 (kurtasje)
  sec_fees,            -- 25.00 (valutaveksling)
  other_fees,          -- 5.00 (andre gebyrer)
  total_fees,          -- 129.00 (auto-calculated)
  -- ... other fields
);
```

### Fee Analysis View

```sql
SELECT * FROM transaction_fee_analysis
WHERE user_id = 'user-uuid'
ORDER BY fee_percentage DESC;
-- Shows comprehensive fee breakdown and platform detection
```

### Fee Statistics Function

```sql
SELECT * FROM get_user_fee_statistics('user-uuid');
-- Returns total fees paid, average per transaction, potential savings, etc.
```

## 🔧 Technical Implementation Details

### Component Architecture

```
AddTransactionModal
├── AdvancedFeesInput (expandable)
│   ├── Simple Input (collapsed state)
│   └── Advanced Breakdown (expanded state)
│       ├── Commission Input
│       ├── Currency Exchange Input
│       ├── Other Fees Input
│       ├── Broker Defaults Panel
│       └── Auto-calculated Total
```

### State Management

```typescript
const [advancedFees, setAdvancedFees] = useState<AdvancedFees>({
  commission: 0,
  currencyExchange: 0,
  otherFees: 0,
  total: 0,
})

// Auto-sync total when components change
useEffect(() => {
  const total = commission + currencyExchange + otherFees
  if (total !== fees.total) {
    onChange({ ...fees, total })
  }
}, [commission, currencyExchange, otherFees])
```

### Currency Detection

```typescript
const isNorwegianStock = currency === 'NOK' || symbol.includes('.OL')
// Automatically suggests appropriate fee defaults
```

## 🎨 UI/UX Features

- **Progressive Disclosure**: Advanced features hidden by default
- **Visual Feedback**: Badge shows total fees when collapsed
- **Smart Defaults**: Intelligent fee suggestions based on currency/broker
- **Error Prevention**: Validation prevents negative fees
- **Accessibility**: Proper labels, tooltips, and keyboard navigation
- **Mobile Responsive**: Works on all screen sizes

## 🔄 Migration Path

### Existing Data

- Existing transactions with simple `fees` values are preserved
- Can be migrated to advanced structure using provided migration function
- No data loss during transition

### Backward Compatibility

- Simple fee entry still works when component is collapsed
- Legacy `fees` field acts as fallback for older transactions
- API supports both simple and advanced fee structures

## 📈 Benefits

1. **Better Cost Tracking**: Users can see exactly where their money goes
2. **Fee Optimization**: Compare brokers and optimize trading costs
3. **Tax Reporting**: Separate tracking helps with tax calculations
4. **Norwegian Focus**: Tailored for Norwegian investors and brokers
5. **User Education**: Helps users understand different types of fees
6. **Data Analysis**: Rich data for portfolio optimization insights

## 🔧 Future Enhancements

- **Platform Integration**: Automatic fee detection from imported data
- **Fee Alerts**: Notifications when fees are unusually high
- **Broker Comparison**: Side-by-side fee comparison tools
- **Fee Trends**: Historical fee tracking and optimization suggestions
- **Tax Integration**: Automated fee categorization for tax reports

---

**Status**: ✅ Complete and Ready for Production
**Testing**: ✅ All components tested and validated
**Documentation**: ✅ Comprehensive implementation guide provided
