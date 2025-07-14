# Broker API Integration Guide

## Overview

LifeDash now supports direct API integration with 4 major brokerage platforms offering free API access. This eliminates the need for CSV imports and provides real-time portfolio synchronization.

## Supported Brokers

### 1. Plaid (USA Brokers) 🇺🇸
- **Coverage**: 1000+ institutions (Fidelity, Robinhood, E*TRADE, etc.)
- **Free Tier**: 200 API calls/month
- **Authentication**: API Key (client_id + secret)
- **Data**: Portfolio holdings, transactions (read-only)
- **Update Frequency**: Daily

### 2. Charles Schwab 🇺🇸
- **Coverage**: Schwab brokerage accounts
- **Free Tier**: Unlimited for individual developers
- **Authentication**: OAuth 2.0
- **Data**: Real-time holdings, transactions, trading
- **Requirements**: Active Schwab account

### 3. Interactive Brokers 🌍
- **Coverage**: Global markets (USA, Europe, Asia)
- **Free Tier**: Unlimited for IBKR clients
- **Authentication**: OAuth via TWS/Gateway
- **Data**: Real-time everything, most comprehensive
- **Requirements**: IBKR Pro account

### 4. Nordnet 🇳🇴🇸🇪🇩🇰🇫🇮
- **Coverage**: Nordic markets
- **Free Tier**: Unlimited for customers
- **Authentication**: SSH Ed25519 keys
- **Data**: Real-time holdings, transactions
- **Countries**: Norway, Sweden, Denmark, Finland

## Quick Start

### 1. Installation

The broker clients are already integrated into LifeDash. No additional packages needed.

```typescript
import { 
  BrokerageClientFactory, 
  BrokerId, 
  PlaidClient,
  SchwabClient,
  InteractiveBrokersClient,
  NordnetClient
} from '@/lib/integrations/brokers'
```

### 2. Create a Broker Client

```typescript
// Example: Plaid client
const plaidClient = BrokerageClientFactory.create(BrokerId.PLAID, {
  apiKey: process.env.PLAID_CLIENT_ID!,
  secret: process.env.PLAID_SECRET!,
  environment: 'sandbox' // or 'production'
})

// Example: Schwab client
const schwabClient = BrokerageClientFactory.create(BrokerId.SCHWAB, {
  clientId: process.env.SCHWAB_CLIENT_ID!,
  clientSecret: process.env.SCHWAB_CLIENT_SECRET!,
  redirectUri: 'https://yourapp.com/auth/schwab/callback',
  environment: 'production'
})
```

### 3. Authenticate User

```typescript
// Plaid: Exchange public token from Plaid Link
const authResult = await plaidClient.authenticate({
  public_token: publicTokenFromPlaidLink
})

// Schwab: OAuth authorization code flow
const authUrl = schwabClient.generateAuthUrl('random-state')
// Redirect user to authUrl, then:
const authResult = await schwabClient.authenticate({
  authorization_code: codeFromCallback
})
```

### 4. Fetch Portfolio Data

```typescript
if (authResult.success) {
  const connectionId = authResult.connectionId!
  
  // Get accounts
  const accounts = await client.getAccounts(connectionId)
  
  // Get holdings
  const holdings = await client.getHoldings(connectionId)
  
  // Get transactions
  const transactions = await client.getTransactions(
    connectionId,
    undefined, // accountId (optional)
    '2024-01-01', // startDate
    '2024-12-31'  // endDate
  )
}
```

## Environment Variables

Add these to your `.env.local`:

```bash
# Plaid
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENVIRONMENT=sandbox

# Charles Schwab
SCHWAB_CLIENT_ID=your_schwab_client_id
SCHWAB_CLIENT_SECRET=your_schwab_client_secret
SCHWAB_REDIRECT_URI=http://localhost:3000/auth/schwab/callback

# Interactive Brokers
IBKR_GATEWAY_URL=https://localhost:5000

# Nordnet
NORDNET_API_KEY=your_nordnet_api_key
NORDNET_PRIVATE_KEY=your_ed25519_private_key
NORDNET_COUNTRY=no
```

## Database Schema Updates

Based on Ghostfolio patterns, add these tables:

```sql
-- Broker connections table
CREATE TABLE brokerage_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  broker_id VARCHAR(50) NOT NULL,
  connection_id VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  error_message TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brokerage accounts table  
CREATE TABLE brokerage_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES brokerage_connections(id),
  broker_account_id VARCHAR(255) NOT NULL,
  account_number VARCHAR(100) NOT NULL,
  account_type VARCHAR(20) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  institution_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced transactions table
ALTER TABLE transactions ADD COLUMN broker_transaction_id VARCHAR(255);
ALTER TABLE transactions ADD COLUMN brokerage_account_id UUID REFERENCES brokerage_accounts(id);
ALTER TABLE transactions ADD COLUMN institution_security_id VARCHAR(255);
ALTER TABLE transactions ADD COLUMN metadata JSONB;

-- Enhanced stocks table for multi-asset support
ALTER TABLE stocks ADD COLUMN asset_class VARCHAR(50) DEFAULT 'EQUITY';
ALTER TABLE stocks ADD COLUMN asset_sub_class VARCHAR(50);
ALTER TABLE stocks ADD COLUMN sectors JSONB;
ALTER TABLE stocks ADD COLUMN countries JSONB;
```

## API Rate Limits

| Broker | Free Limit | Rate Limit | Notes |
|--------|------------|------------|--------|
| Plaid | 200 calls/month | Not specified | $0.60/call after limit |
| Schwab | Unlimited* | ~20 req/sec | *Requires active account |
| IBKR | Unlimited* | 10-50 req/sec | *Requires IBKR Pro account |
| Nordnet | Unlimited* | 10 req/sec | *Requires Nordnet account |

## Error Handling

All clients implement standardized error handling:

```typescript
try {
  const holdings = await client.getHoldings(connectionId)
} catch (error) {
  if (error.code === 'UNAUTHORIZED') {
    // Token expired, refresh auth
    await client.refreshAuth(connection)
  } else if (error.code === 'RATE_LIMITED') {
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, 10000))
  } else {
    console.error('Broker API error:', error)
  }
}
```

## Common Patterns

### 1. Connection Health Check

```typescript
const isHealthy = await client.testConnection(connectionId)
if (!isHealthy) {
  // Mark connection as disconnected
  await updateConnectionStatus(connectionId, 'error')
}
```

### 2. Batch Account Processing

```typescript
const accounts = await client.getAccounts(connectionId)

for (const account of accounts) {
  try {
    const holdings = await client.getHoldings(connectionId, account.id)
    const transactions = await client.getTransactions(connectionId, account.id)
    
    // Process and store data
    await syncAccountData(account, holdings, transactions)
  } catch (error) {
    console.error(`Failed to sync account ${account.id}:`, error)
    // Continue with other accounts
  }
}
```

### 3. Unified Data Mapping

```typescript
function mapBrokerageHoldingToDatabase(holding: BrokerageHolding) {
  return {
    symbol: holding.symbol,
    quantity: holding.quantity,
    market_value: holding.marketValue,
    cost_basis: holding.costBasis,
    current_price: holding.marketPrice,
    currency: holding.currency,
    asset_class: holding.assetClass,
    broker_security_id: holding.institutionSecurityId,
    metadata: holding.metadata
  }
}
```

## Next Steps

1. **Database Schema**: Implement the enhanced schema
2. **OAuth Flows**: Create Next.js API routes for OAuth callbacks
3. **UI Components**: Build connection management interface
4. **Sync Service**: Implement background portfolio synchronization
5. **Testing**: Test with sandbox/demo accounts

## Deployment Considerations

### Development
- Use sandbox environments for all brokers
- Test with demo accounts
- Implement proper error logging

### Production
- Obtain production API keys
- Set up proper OAuth redirect URIs
- Implement rate limiting and retry logic
- Add monitoring and alerting

## Security Notes

- Store API keys as environment variables
- Encrypt access tokens in database
- Implement proper OAuth state validation
- Use HTTPS for all OAuth redirects
- Regular token rotation where supported

## Support & Documentation

- **Plaid**: https://plaid.com/docs/
- **Schwab**: https://developer.schwab.com/
- **IBKR**: https://www.interactivebrokers.com/campus/ibkr-api-page/
- **Nordnet**: https://github.com/nordnet/next-api-v2-examples