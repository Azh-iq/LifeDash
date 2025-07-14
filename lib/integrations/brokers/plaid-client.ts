// Plaid API client for investment portfolio data
// Supports free tier: 200 API calls per month

import { 
  BaseBrokerageClient, 
  BrokerageClientConfig 
} from './base-client'
import {
  BrokerId,
  BrokerageConnection,
  AuthResult,
  BrokerageAccount,
  BrokerageHolding,
  BrokerageTransaction,
  BrokerageSecurity,
  AssetClass,
  TransactionType
} from './types'

interface PlaidConfig extends BrokerageClientConfig {
  clientId: string
  secret: string
  environment: 'sandbox' | 'development' | 'production'
}

interface PlaidItem {
  access_token: string
  item_id: string
  institution_id: string
  webhook?: string
}

interface PlaidLinkTokenCreateRequest {
  client_id: string
  secret: string
  client_name: string
  country_codes: string[]
  language: string
  user: {
    client_user_id: string
  }
  products: string[]
  required_if_supported_products?: string[]
  redirect_uri?: string
  webhook?: string
}

interface PlaidInvestmentsHoldingsRequest {
  client_id: string
  secret: string
  access_token: string
  options?: {
    account_ids?: string[]
    cursor?: string
    offset?: number
    count?: number
  }
}

interface PlaidInvestmentsTransactionsRequest {
  client_id: string
  secret: string
  access_token: string
  start_date: string
  end_date: string
  options?: {
    account_ids?: string[]
    count?: number
    offset?: number
  }
}

export class PlaidClient extends BaseBrokerageClient {
  readonly brokerId = BrokerId.PLAID
  private clientId: string
  private secret: string
  private environment: string

  constructor(config: PlaidConfig) {
    super(config)
    this.clientId = config.clientId
    this.secret = config.secret
    this.environment = config.environment
    this.baseUrl = this.getBaseUrl(config.environment)
  }

  private getBaseUrl(environment: string): string {
    switch (environment) {
      case 'sandbox':
        return 'https://sandbox.plaid.com'
      case 'development':
        return 'https://development.plaid.com'
      case 'production':
        return 'https://production.plaid.com'
      default:
        return 'https://sandbox.plaid.com'
    }
  }

  // Create Link token for Plaid Link initialization
  async createLinkToken(userId: string, products: string[] = ['investments']): Promise<string> {
    const request: PlaidLinkTokenCreateRequest = {
      client_id: this.clientId,
      secret: this.secret,
      client_name: 'LifeDash Portfolio Tracker',
      country_codes: ['US', 'CA'],
      language: 'en',
      user: {
        client_user_id: userId
      },
      products,
      required_if_supported_products: ['investments']
    }

    try {
      const response = await this.makeRequest<{ link_token: string }>(
        'POST',
        '/link/token/create',
        request
      )
      
      return response.link_token
    } catch (error) {
      this.log('error', 'Failed to create Link token', error)
      throw error
    }
  }

  // Exchange public token for access token after Link flow
  async exchangePublicToken(publicToken: string): Promise<PlaidItem> {
    const request = {
      client_id: this.clientId,
      secret: this.secret,
      public_token: publicToken
    }

    try {
      const response = await this.makeRequest<{
        access_token: string
        item_id: string
        request_id: string
      }>('POST', '/link/token/exchange', request)

      // Get institution info
      const itemResponse = await this.makeRequest<{
        item: {
          institution_id: string
          webhook: string
        }
      }>('POST', '/item/get', {
        client_id: this.clientId,
        secret: this.secret,
        access_token: response.access_token
      })

      return {
        access_token: response.access_token,
        item_id: response.item_id,
        institution_id: itemResponse.item.institution_id,
        webhook: itemResponse.item.webhook
      }
    } catch (error) {
      this.log('error', 'Failed to exchange public token', error)
      throw error
    }
  }

  async authenticate(credentials: { public_token: string }): Promise<AuthResult> {
    try {
      const item = await this.exchangePublicToken(credentials.public_token)
      
      return {
        success: true,
        connectionId: item.access_token,
        accessToken: item.access_token
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Authentication failed'
      }
    }
  }

  async refreshAuth(connection: BrokerageConnection): Promise<AuthResult> {
    // Plaid access tokens don't expire, but we can test the connection
    const isValid = await this.testConnection(connection.connectionId)
    
    if (isValid) {
      return {
        success: true,
        connectionId: connection.connectionId,
        accessToken: connection.accessToken
      }
    } else {
      return {
        success: false,
        error: 'Connection is no longer valid'
      }
    }
  }

  async getAccounts(connectionId: string): Promise<BrokerageAccount[]> {
    const request = {
      client_id: this.clientId,
      secret: this.secret,
      access_token: connectionId
    }

    try {
      const response = await this.makeRequest<{
        accounts: Array<{
          account_id: string
          balances: {
            available: number | null
            current: number | null
            iso_currency_code: string | null
            unofficial_currency_code: string | null
          }
          mask: string | null
          name: string
          official_name: string | null
          subtype: string | null
          type: string
        }>
        item: {
          institution_id: string
        }
      }>('POST', '/accounts/get', request)

      // Get institution name
      const institutionResponse = await this.makeRequest<{
        institution: {
          name: string
        }
      }>('POST', '/institutions/get_by_id', {
        client_id: this.clientId,
        secret: this.secret,
        institution_id: response.item.institution_id,
        country_codes: ['US', 'CA']
      })

      return response.accounts
        .filter(account => account.type === 'investment')
        .map(account => ({
          id: account.account_id,
          brokerId: this.brokerId,
          accountType: this.mapAccountType(account.subtype),
          accountNumber: account.mask || account.account_id.slice(-4),
          displayName: account.official_name || account.name,
          currency: account.balances.iso_currency_code || 'USD',
          isActive: true,
          institutionName: institutionResponse.institution.name
        }))
    } catch (error) {
      this.log('error', 'Failed to get accounts', error)
      throw error
    }
  }

  async getHoldings(connectionId: string, accountId?: string): Promise<BrokerageHolding[]> {
    const request: PlaidInvestmentsHoldingsRequest = {
      client_id: this.clientId,
      secret: this.secret,
      access_token: connectionId,
      options: accountId ? { account_ids: [accountId] } : undefined
    }

    try {
      const response = await this.makeRequest<{
        accounts: Array<{
          account_id: string
        }>
        holdings: Array<{
          account_id: string
          security_id: string
          institution_price: number
          institution_value: number
          cost_basis: number | null
          quantity: number
          iso_currency_code: string | null
          unofficial_currency_code: string | null
        }>
        securities: Array<{
          security_id: string
          isin: string | null
          cusip: string | null
          sedol: string | null
          institution_security_id: string | null
          institution_id: string | null
          proxy_security_id: string | null
          name: string | null
          ticker_symbol: string | null
          is_cash_equivalent: boolean | null
          type: string | null
          close_price: number | null
          close_price_as_of: string | null
          iso_currency_code: string | null
          unofficial_currency_code: string | null
        }>
      }>('POST', '/investments/holdings/get', request)

      // Create security lookup map
      const securities = new Map(
        response.securities.map(security => [security.security_id, security])
      )

      return response.holdings.map(holding => {
        const security = securities.get(holding.security_id)
        
        return {
          accountId: holding.account_id,
          symbol: security?.ticker_symbol || `PLAID_${holding.security_id}`,
          quantity: holding.quantity,
          marketValue: holding.institution_value,
          costBasis: holding.cost_basis || undefined,
          marketPrice: holding.institution_price,
          currency: holding.iso_currency_code || 'USD',
          assetClass: this.mapAssetClass(security?.type),
          institutionSecurityId: holding.security_id,
          metadata: {
            securityName: security?.name,
            isin: security?.isin,
            cusip: security?.cusip,
            sedol: security?.sedol,
            closePrice: security?.close_price,
            closePriceAsOf: security?.close_price_as_of
          }
        }
      })
    } catch (error) {
      this.log('error', 'Failed to get holdings', error)
      throw error
    }
  }

  async getTransactions(
    connectionId: string,
    accountId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<BrokerageTransaction[]> {
    const end = endDate || new Date().toISOString().split('T')[0]
    const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const request: PlaidInvestmentsTransactionsRequest = {
      client_id: this.clientId,
      secret: this.secret,
      access_token: connectionId,
      start_date: start,
      end_date: end,
      options: accountId ? { account_ids: [accountId] } : undefined
    }

    try {
      const response = await this.makeRequest<{
        investment_transactions: Array<{
          investment_transaction_id: string
          account_id: string
          security_id: string | null
          date: string
          name: string
          quantity: number
          amount: number
          price: number
          fees: number | null
          type: string
          subtype: string | null
          iso_currency_code: string | null
          unofficial_currency_code: string | null
        }>
        securities: Array<{
          security_id: string
          ticker_symbol: string | null
          name: string | null
        }>
      }>('POST', '/investments/transactions/get', request)

      const securities = new Map(
        response.securities.map(security => [security.security_id, security])
      )

      return response.investment_transactions.map(transaction => {
        const security = transaction.security_id ? securities.get(transaction.security_id) : null
        
        return {
          id: transaction.investment_transaction_id,
          accountId: transaction.account_id,
          symbol: security?.ticker_symbol || undefined,
          type: this.mapTransactionType(transaction.type, transaction.subtype),
          quantity: transaction.quantity,
          price: transaction.price,
          amount: Math.abs(transaction.amount),
          currency: transaction.iso_currency_code || 'USD',
          date: transaction.date,
          fees: transaction.fees || undefined,
          description: transaction.name,
          metadata: {
            originalType: transaction.type,
            originalSubtype: transaction.subtype,
            securityName: security?.name
          }
        }
      })
    } catch (error) {
      this.log('error', 'Failed to get transactions', error)
      throw error
    }
  }

  async searchSecurities(query: string): Promise<BrokerageSecurity[]> {
    // Plaid doesn't have a direct security search endpoint
    // This would typically be done through their institutions/search
    // For now, return empty array as this is not a core feature for portfolio tracking
    this.log('warn', 'Security search not implemented for Plaid')
    return []
  }

  async getSecurityDetails(symbol: string): Promise<BrokerageSecurity | null> {
    // Plaid doesn't provide direct security lookup by symbol
    // Security details come through holdings/transactions
    this.log('warn', 'Security details lookup not available for Plaid')
    return null
  }

  async testConnection(connectionId: string): Promise<boolean> {
    try {
      await this.getAccounts(connectionId)
      return true
    } catch (error) {
      this.log('warn', 'Connection test failed', error)
      return false
    }
  }

  async disconnect(connectionId: string): Promise<void> {
    // Plaid requires explicit item removal
    const request = {
      client_id: this.clientId,
      secret: this.secret,
      access_token: connectionId
    }

    try {
      await this.makeRequest('POST', '/item/remove', request)
      this.log('info', 'Successfully disconnected Plaid item')
    } catch (error) {
      this.log('error', 'Failed to disconnect Plaid item', error)
      throw error
    }
  }

  // Helper methods
  private mapAccountType(subtype: string | null): 'CASH' | 'MARGIN' | 'RETIREMENT' | 'CUSTODIAL' {
    switch (subtype) {
      case 'ira':
      case 'roth':
      case '401k':
      case '403b':
      case 'pension':
      case 'retirement':
        return 'RETIREMENT'
      case 'custodial':
      case 'ugma':
      case 'utma':
        return 'CUSTODIAL'
      case 'margin':
        return 'MARGIN'
      default:
        return 'CASH'
    }
  }

  private mapAssetClass(plaidType: string | null): AssetClass {
    switch (plaidType) {
      case 'equity':
        return AssetClass.EQUITY
      case 'etf':
        return AssetClass.ETF
      case 'mutual fund':
        return AssetClass.FUND
      case 'fixed income':
        return AssetClass.FIXED_INCOME
      case 'cryptocurrency':
        return AssetClass.CRYPTOCURRENCY
      case 'cash':
        return AssetClass.CASH
      default:
        return AssetClass.EQUITY
    }
  }

  private mapTransactionType(type: string, subtype: string | null): TransactionType {
    switch (type) {
      case 'buy':
        return TransactionType.BUY
      case 'sell':
        return TransactionType.SELL
      case 'dividend':
        return TransactionType.DIVIDEND
      case 'interest':
        return TransactionType.INTEREST
      case 'deposit':
        return TransactionType.DEPOSIT
      case 'withdrawal':
        return TransactionType.WITHDRAWAL
      case 'fee':
        return TransactionType.FEE
      case 'tax':
        return TransactionType.TAX
      case 'transfer':
        return TransactionType.TRANSFER
      default:
        return TransactionType.BUY // Default fallback
    }
  }
}