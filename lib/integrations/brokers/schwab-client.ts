// Charles Schwab API client for investment portfolio data
// Free for individual developers with active Schwab account

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

interface SchwabConfig extends BrokerageClientConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  environment: 'sandbox' | 'production'
}

interface SchwabTokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  scope: string
}

interface SchwabAccount {
  accountId: string
  accountNumber: string
  accountType: string
  currentBalances: {
    totalCash: number
    totalValue: number
    longMarketValue?: number
    shortMarketValue?: number
    mutualFundValue?: number
    bondValue?: number
    optionDelta?: number
    cashBalance?: number
    pendingDeposits?: number
  }
  isClosingOnlyRestricted: boolean
  isDayTrader: boolean
  isProjectedBalancesEnabled: boolean
  positions: SchwabPosition[]
}

interface SchwabPosition {
  shortQuantity: number
  averagePrice: number
  currentDayProfitLoss: number
  currentDayProfitLossPercentage: number
  longQuantity: number
  settledLongQuantity: number
  settledShortQuantity: number
  instrument: {
    assetType: string
    cusip?: string
    symbol: string
    description?: string
    instrumentId: number
    netChange?: number
  }
  marketValue: number
  maintenanceRequirement?: number
  previousSessionLongQuantity: number
}

interface SchwabTransaction {
  activityId: number
  time: string
  user: {
    cdDomainId: string
    login: string
    type: string
    userId: number
    systemUserName: string
    firstName: string
    lastName: string
    brokerageUserId: string
  }
  description: string
  accountNumber: string
  type: string
  status: string
  subAccount: string
  tradeDate: string
  positionId: number
  orderId: number
  netAmount: number
  activityType: string
  transferItems: Array<{
    instrument: {
      symbol: string
      cusip: string
      description: string
      assetType: string
    }
    amount: number
    cost: number
    price: number
    feeType: string
    positionEffect: string
  }>
}

export class SchwabClient extends BaseBrokerageClient {
  readonly brokerId = BrokerId.SCHWAB
  private clientId: string
  private clientSecret: string
  private redirectUri: string
  private environment: string

  constructor(config: SchwabConfig) {
    super(config)
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.redirectUri = config.redirectUri
    this.environment = config.environment
    this.baseUrl = this.getBaseUrl(config.environment)
  }

  private getBaseUrl(environment: string): string {
    switch (environment) {
      case 'sandbox':
        return 'https://api.schwabapi.com'
      case 'production':
        return 'https://api.schwabapi.com'
      default:
        return 'https://api.schwabapi.com'
    }
  }

  // Generate OAuth authorization URL
  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'readonly',
      state: state || ''
    })

    return `${this.baseUrl}/oauth/authorize?${params.toString()}`
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(authorizationCode: string): Promise<SchwabTokenResponse> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: this.redirectUri
    })

    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      })

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.log('error', 'Failed to exchange code for token', error)
      throw error
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<SchwabTokenResponse> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
    
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })

    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      })

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.log('error', 'Failed to refresh token', error)
      throw error
    }
  }

  async authenticate(credentials: { authorization_code: string }): Promise<AuthResult> {
    try {
      const tokenResponse = await this.exchangeCodeForToken(credentials.authorization_code)
      
      const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
      
      return {
        success: true,
        connectionId: tokenResponse.access_token,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Authentication failed'
      }
    }
  }

  async refreshAuth(connection: BrokerageConnection): Promise<AuthResult> {
    if (!connection.refreshToken) {
      return {
        success: false,
        error: 'No refresh token available'
      }
    }

    try {
      const tokenResponse = await this.refreshAccessToken(connection.refreshToken)
      
      const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
      
      return {
        success: true,
        connectionId: tokenResponse.access_token,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Token refresh failed'
      }
    }
  }

  async getAccounts(connectionId: string): Promise<BrokerageAccount[]> {
    try {
      const response = await this.makeRequest<SchwabAccount[]>(
        'GET',
        '/trader/v1/accounts',
        undefined,
        {
          'Authorization': `Bearer ${connectionId}`
        }
      )

      return response.map(account => ({
        id: account.accountId,
        brokerId: this.brokerId,
        accountType: this.mapAccountType(account.accountType),
        accountNumber: account.accountNumber,
        displayName: `Schwab ${account.accountType} (${account.accountNumber})`,
        currency: 'USD', // Schwab primarily uses USD
        isActive: !account.isClosingOnlyRestricted,
        institutionName: 'Charles Schwab'
      }))
    } catch (error) {
      this.log('error', 'Failed to get accounts', error)
      throw error
    }
  }

  async getHoldings(connectionId: string, accountId?: string): Promise<BrokerageHolding[]> {
    try {
      let accounts: SchwabAccount[]
      
      if (accountId) {
        const account = await this.makeRequest<SchwabAccount>(
          'GET',
          `/trader/v1/accounts/${accountId}`,
          undefined,
          {
            'Authorization': `Bearer ${connectionId}`,
            'Accept': 'application/json'
          }
        )
        accounts = [account]
      } else {
        accounts = await this.makeRequest<SchwabAccount[]>(
          'GET',
          '/trader/v1/accounts',
          undefined,
          {
            'Authorization': `Bearer ${connectionId}`,
            'Accept': 'application/json'
          }
        )
      }

      const holdings: BrokerageHolding[] = []

      for (const account of accounts) {
        if (account.positions) {
          for (const position of account.positions) {
            const totalQuantity = position.longQuantity - position.shortQuantity
            
            if (totalQuantity !== 0) {
              holdings.push({
                accountId: account.accountId,
                symbol: position.instrument.symbol,
                quantity: totalQuantity,
                marketValue: position.marketValue,
                costBasis: position.averagePrice * totalQuantity,
                marketPrice: position.marketValue / totalQuantity,
                currency: 'USD',
                assetClass: this.mapAssetClass(position.instrument.assetType),
                institutionSecurityId: position.instrument.cusip,
                metadata: {
                  description: position.instrument.description,
                  instrumentId: position.instrument.instrumentId,
                  currentDayProfitLoss: position.currentDayProfitLoss,
                  currentDayProfitLossPercentage: position.currentDayProfitLossPercentage,
                  averagePrice: position.averagePrice,
                  longQuantity: position.longQuantity,
                  shortQuantity: position.shortQuantity
                }
              })
            }
          }
        }
      }

      return holdings
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
    try {
      const accounts = accountId ? [accountId] : await this.getAccountIds(connectionId)
      const transactions: BrokerageTransaction[] = []

      for (const accId of accounts) {
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        params.append('types', 'TRADE,RECEIVE_AND_DELIVER,DIVIDEND_OR_INTEREST,ACH_RECEIPT,ACH_DISBURSEMENT,CASH_RECEIPT,CASH_DISBURSEMENT,ELECTRONIC_FUND,WIRE_OUT,WIRE_IN')

        const endpoint = `/trader/v1/accounts/${accId}/transactions?${params.toString()}`
        
        const response = await this.makeRequest<SchwabTransaction[]>(
          'GET',
          endpoint,
          undefined,
          {
            'Authorization': `Bearer ${connectionId}`,
            'Accept': 'application/json'
          }
        )

        for (const transaction of response) {
          transactions.push({
            id: transaction.activityId.toString(),
            accountId: accId,
            symbol: this.extractSymbolFromTransaction(transaction),
            type: this.mapTransactionType(transaction.type, transaction.activityType),
            quantity: this.extractQuantityFromTransaction(transaction),
            price: this.extractPriceFromTransaction(transaction),
            amount: Math.abs(transaction.netAmount),
            currency: 'USD',
            date: transaction.tradeDate || transaction.time.split('T')[0],
            fees: this.extractFeesFromTransaction(transaction),
            description: transaction.description,
            metadata: {
              activityType: transaction.activityType,
              status: transaction.status,
              orderId: transaction.orderId,
              positionId: transaction.positionId,
              user: transaction.user
            }
          })
        }
      }

      return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } catch (error) {
      this.log('error', 'Failed to get transactions', error)
      throw error
    }
  }

  async searchSecurities(query: string): Promise<BrokerageSecurity[]> {
    try {
      const response = await this.makeRequest<{
        instruments: Array<{
          cusip: string
          symbol: string
          description: string
          exchange: string
          assetType: string
          fundamental?: {
            symbol: string
            high52: number
            low52: number
            dividendAmount: number
            dividendYield: number
            peRatio: number
            marketCap: number
          }
        }>
      }>(
        'GET',
        `/marketdata/v1/instruments?symbol=${encodeURIComponent(query)}&projection=symbol-search`,
        undefined,
        {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      )

      return response.instruments.map(instrument => ({
        symbol: instrument.symbol,
        name: instrument.description,
        type: this.mapAssetClass(instrument.assetType),
        exchange: instrument.exchange,
        currency: 'USD',
        cusip: instrument.cusip,
        currentPrice: instrument.fundamental?.high52,
        metadata: {
          fundamental: instrument.fundamental
        }
      }))
    } catch (error) {
      this.log('error', 'Failed to search securities', error)
      return []
    }
  }

  async getSecurityDetails(symbol: string): Promise<BrokerageSecurity | null> {
    try {
      const response = await this.makeRequest<{
        [symbol: string]: {
          cusip: string
          symbol: string
          description: string
          exchange: string
          assetType: string
          fundamental?: any
        }
      }>(
        'GET',
        `/marketdata/v1/instruments?symbol=${encodeURIComponent(symbol)}&projection=fundamental`,
        undefined,
        {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      )

      const instrument = response[symbol]
      if (!instrument) return null

      return {
        symbol: instrument.symbol,
        name: instrument.description,
        type: this.mapAssetClass(instrument.assetType),
        exchange: instrument.exchange,
        currency: 'USD',
        cusip: instrument.cusip,
        metadata: {
          fundamental: instrument.fundamental
        }
      }
    } catch (error) {
      this.log('error', 'Failed to get security details', error)
      return null
    }
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
    // Schwab doesn't have an explicit disconnect endpoint
    // The access token will expire naturally
    this.log('info', 'Schwab connection marked for disconnection')
  }

  // Helper methods
  private async getAccountIds(connectionId: string): Promise<string[]> {
    const accounts = await this.getAccounts(connectionId)
    return accounts.map(account => account.id)
  }

  private mapAccountType(schwabType: string): 'CASH' | 'MARGIN' | 'RETIREMENT' | 'CUSTODIAL' {
    switch (schwabType.toLowerCase()) {
      case 'ira':
      case 'roth_ira':
      case '401k':
      case 'retirement':
        return 'RETIREMENT'
      case 'custodial':
        return 'CUSTODIAL'
      case 'margin':
        return 'MARGIN'
      default:
        return 'CASH'
    }
  }

  private mapAssetClass(schwabAssetType: string): AssetClass {
    switch (schwabAssetType.toLowerCase()) {
      case 'equity':
        return AssetClass.EQUITY
      case 'etf':
        return AssetClass.ETF
      case 'mutual_fund':
        return AssetClass.FUND
      case 'fixed_income':
      case 'bond':
        return AssetClass.FIXED_INCOME
      case 'option':
        return AssetClass.OPTION
      case 'cash_equivalent':
        return AssetClass.CASH
      case 'commodity':
        return AssetClass.COMMODITY
      default:
        return AssetClass.EQUITY
    }
  }

  private mapTransactionType(type: string, activityType: string): TransactionType {
    switch (activityType.toLowerCase()) {
      case 'buy':
      case 'buy_to_open':
      case 'buy_to_close':
        return TransactionType.BUY
      case 'sell':
      case 'sell_to_open':
      case 'sell_to_close':
        return TransactionType.SELL
      case 'dividend':
        return TransactionType.DIVIDEND
      case 'interest':
        return TransactionType.INTEREST
      case 'deposit':
      case 'ach_receipt':
      case 'wire_in':
        return TransactionType.DEPOSIT
      case 'withdrawal':
      case 'ach_disbursement':
      case 'wire_out':
        return TransactionType.WITHDRAWAL
      case 'fee':
        return TransactionType.FEE
      case 'tax':
        return TransactionType.TAX
      default:
        return TransactionType.BUY
    }
  }

  private extractSymbolFromTransaction(transaction: SchwabTransaction): string | undefined {
    if (transaction.transferItems && transaction.transferItems.length > 0) {
      return transaction.transferItems[0].instrument.symbol
    }
    return undefined
  }

  private extractQuantityFromTransaction(transaction: SchwabTransaction): number | undefined {
    if (transaction.transferItems && transaction.transferItems.length > 0) {
      return Math.abs(transaction.transferItems[0].amount)
    }
    return undefined
  }

  private extractPriceFromTransaction(transaction: SchwabTransaction): number | undefined {
    if (transaction.transferItems && transaction.transferItems.length > 0) {
      return transaction.transferItems[0].price
    }
    return undefined
  }

  private extractFeesFromTransaction(transaction: SchwabTransaction): number | undefined {
    if (transaction.transferItems && transaction.transferItems.length > 0) {
      const item = transaction.transferItems[0]
      if (item.feeType && item.cost) {
        return Math.abs(item.cost)
      }
    }
    return undefined
  }
}