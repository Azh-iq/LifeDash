# Holdings Filter Enhancement

## Overview

Enhanced the `AddTransactionModal` to filter stock selection to only show user's current holdings when the transaction type is "SELL". This prevents users from attempting to sell stocks they don't own and provides a better user experience.

## Files Modified

### 1. `lib/actions/holdings/fetch-holdings.ts` (New)
- **Purpose**: Server action to fetch user's current holdings for sale transactions
- **Key Features**:
  - Fetches holdings with positive quantities only
  - Includes stock information (symbol, name, currency, etc.)
  - Includes account information (name, platform)
  - Supports portfolio filtering
  - Returns holdings formatted for stock search component

### 2. `components/stocks/stock-search.tsx`
- **Enhanced Interface**: Added holdings-specific fields to `StockSearchResult`
- **New Props**:
  - `holdingsOnly`: Boolean to enable holdings-only mode
  - `portfolioId`: Filter holdings by specific portfolio
- **New Features**:
  - Fetches user holdings when `holdingsOnly` is true
  - Filters search results to only show owned stocks
  - Displays holding information (quantity, account, average cost)
  - Shows "Dine beholdninger" header for holdings mode
  - Handles empty holdings state

### 3. `components/stocks/add-transaction-modal.tsx`
- **Enhanced Interface**: Added `portfolioId` prop
- **New State Variables**:
  - `selectedHolding`: Stores selected holding information
  - `maxQuantity`: Maximum quantity available for sale
- **New Features**:
  - Automatically switches to holdings mode when type is "SELL"
  - Pre-populates account selection for sell transactions
  - Shows maximum quantity available
  - Adds "Max" button for quick quantity selection
  - Validates quantity against available holdings
  - Displays holding information (account, average cost)
  - Enhanced error messages for sell transactions

### 4. `app/investments/stocks/page.tsx`
- **Update**: Pass `portfolioId` to `AddTransactionModal`

### 5. `components/stocks/empty-stocks-page.tsx`
- **Update**: Pass `portfolioId` (undefined) to `AddTransactionModal`

## Key Features Implemented

### 1. Holdings-Only Stock Search
- When transaction type is "SELL", only user's holdings are shown
- Search filters through owned stocks only
- Displays holding-specific information (quantity, account)

### 2. Quantity Validation
- Prevents selling more than owned
- Shows maximum available quantity
- "Max" button for quick quantity selection
- Real-time validation with error messages

### 3. Pre-populated Transaction Data
- Account automatically selected for sell transactions
- Stock information pre-filled from holdings
- Average cost displayed for reference

### 4. Enhanced User Experience
- Clear visual indicators for holdings mode
- Contextual placeholders and labels
- Better error messages for sell transactions
- Holding information displayed in search results

## Usage Examples

### Buy Transaction (Normal Mode)
```typescript
// Shows all stocks from registry
<StockSearch
  onSelect={handleStockSelect}
  placeholder="Søk etter aksjer (Apple, Equinor, Tesla...)"
  holdingsOnly={false}
/>
```

### Sell Transaction (Holdings Mode)
```typescript
// Shows only user's holdings
<StockSearch
  onSelect={handleStockSelect}
  placeholder="Søk i dine beholdninger..."
  holdingsOnly={true}
  portfolioId={portfolioId}
/>
```

## Database Schema

The holdings filter uses the existing database schema:
- `holdings` table: Contains user's current positions
- `stocks` table: Stock information via foreign key
- `accounts` table: Account information via foreign key

## Error Handling

- Graceful handling of empty holdings
- Validation for sell quantity limits
- Clear error messages for users
- Fallback to empty state when no holdings exist

## Testing

Run the test script to verify functionality:
```bash
npx tsx scripts/test-holdings-filter.ts
```

## Security Considerations

- Server-side validation of holdings ownership
- User authentication required for holdings access
- Portfolio-specific filtering prevents cross-portfolio sales
- Row Level Security (RLS) enforced on database level

## Future Enhancements

1. **Multi-Account Sales**: Support for selling from multiple accounts
2. **Partial Holdings**: Support for partial share sales
3. **Tax Lot Selection**: Choose specific tax lots for sales
4. **Batch Sales**: Sell multiple holdings at once
5. **Order Types**: Support for limit orders and stop losses