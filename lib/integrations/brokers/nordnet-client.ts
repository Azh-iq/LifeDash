// Nordnet API client for Nordic investment portfolio data
// Free API access for Nordnet customers in Norway, Sweden, Denmark, Finland

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

interface NordnetConfig extends BrokerageClientConfig {
  apiKey: string
  privateKey: string // SSH Ed25519 private key
  country: 'se' | 'no' | 'dk' | 'fi'
}

interface NordnetAuthChallenge {
  challenge: string
  public_key: string
}

interface NordnetAuthResponse {
  session_key: string
  expires_in: number
  country: string
  user_id: number
}

interface NordnetAccount {
  accid: number
  accno: string
  type: string
  alias: string
  is_default: boolean
  is_blocked: boolean
  blocked_reason?: string
}

interface NordnetPosition {
  acq_price: {
    value: number
    currency: string
  }
  acq_value: {
    value: number
    currency: string
  }
  instrument: {
    instrument_id: number
    instrument_type: string
    symbol: string
    name: string
    currency: string
    main_market_id: number
    tradables: Array<{
      market_id: number
      identifier: string
      tick_size_id: number
      lot_size: number
    }>
  }
  qty: number
  market_value: {
    value: number
    currency: string
  }
  pnl: {
    value: number
    currency: string
  }
  pnl_pct: number
  morning_price: {
    value: number
    currency: string
  }
}

interface NordnetTransaction {
  transaction_id: number
  account_id: number
  instrument: {
    instrument_id: number
    instrument_type: string
    symbol: string
    name: string
    currency: string
  }
  market: {
    market_id: number
    country: string
    name: string
    identifier: string
  }
  trade_type: string
  price: {
    value: number
    currency: string
  }
  volume: number
  consideration: {
    value: number
    currency: string
  }
  transaction_time: string
  trade_time: string
  venue: string
  order_id?: number
  courtage?: {
    value: number
    currency: string
  }
}

interface NordnetInstrumentSearch {
  total_hits: number
  hits: Array<{
    instrument_id: number
    instrument_type: string
    symbol: string
    name: string
    currency: string
    market_id: number
    country: string
    tradables: Array<{
      market_id: number
      identifier: string
      market_name: string
    }>
  }>
}

export class NordnetClient extends BaseBrokerageClient {
  readonly brokerId = BrokerId.NORDNET
  private apiKey: string
  private privateKey: string
  private country: string
  private sessionKey?: string
  private expiresAt?: Date

  constructor(config: NordnetConfig) {
    super(config)
    this.apiKey = config.apiKey
    this.privateKey = config.privateKey
    this.country = config.country
    this.baseUrl = this.getBaseUrl(config.country)
  }

  private getBaseUrl(country: string): string {
    switch (country) {
      case 'se':
        return 'https://public.nordnet.se/api/2'
      case 'no':
        return 'https://public.nordnet.no/api/2'
      case 'dk':
        return 'https://public.nordnet.dk/api/2'
      case 'fi':
        return 'https://public.nordnet.fi/api/2'
      default:
        return 'https://public.nordnet.se/api/2'
    }
  }

  // SSH signature generation for authentication
  private async signChallenge(challenge: string): Promise<string> {
    try {
      // In a real implementation, you would use a crypto library to sign with Ed25519
      // This is a placeholder that would need actual crypto implementation
      
      const crypto = await import('crypto')
      const { createSign } = crypto
      
      const sign = createSign('ed25519')
      sign.update(Buffer.from(challenge, 'base64'))
      sign.end()
      
      const signature = sign.sign(this.privateKey, 'base64')
      return signature
    } catch (error) {
      this.log('error', 'Failed to sign challenge', error)
      throw new Error('Failed to sign authentication challenge')
    }
  }

  // Start authentication challenge
  private async startAuth(): Promise<NordnetAuthChallenge> {
    try {
      const response = await this.makeRequest<NordnetAuthChallenge>(
        'POST',
        '/login/start',
        { api_key: this.apiKey }
      )
      
      return response
    } catch (error) {
      this.log('error', 'Failed to start authentication', error)
      throw error
    }
  }

  // Verify authentication with signed challenge
  private async verifyAuth(challenge: string, signature: string): Promise<NordnetAuthResponse> {
    try {
      const response = await this.makeRequest<NordnetAuthResponse>(
        'POST',
        '/login/verify',
        {
          service: 'NEXTAPI',
          api_key: this.apiKey,
          signature: signature
        }
      )
      
      return response
    } catch (error) {
      this.log('error', 'Failed to verify authentication', error)
      throw error
    }
  }

  async authenticate(credentials: { api_key?: string; private_key?: string }): Promise<AuthResult> {
    try {
      // Use provided credentials or fall back to constructor values
      const apiKey = credentials.api_key || this.apiKey
      const privateKey = credentials.private_key || this.privateKey

      if (!apiKey || !privateKey) {
        return {
          success: false,
          error: 'API key and private key are required'
        }
      }

      // Start authentication challenge
      const challenge = await this.startAuth()
      
      // Sign the challenge
      const signature = await this.signChallenge(challenge.challenge)
      
      // Verify authentication
      const authResponse = await this.verifyAuth(challenge.challenge, signature)
      
      this.sessionKey = authResponse.session_key
      this.expiresAt = new Date(Date.now() + authResponse.expires_in * 1000)
      
      return {
        success: true,
        connectionId: authResponse.session_key,
        accessToken: authResponse.session_key,
        expiresAt: this.expiresAt.toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Authentication failed'
      }
    }
  }

  async refreshAuth(connection: BrokerageConnection): Promise<AuthResult> {
    // Nordnet sessions don't refresh - need to re-authenticate
    return await this.authenticate({})
  }

  private getAuthHeaders(sessionKey?: string): Record<string, string> {
    const session = sessionKey || this.sessionKey
    if (!session) {
      throw new Error('No active session. Please authenticate first.')
    }
    
    return {
      'Authorization': `Basic ${Buffer.from(`${this.apiKey}:${session}`).toString('base64')}`
    }
  }

  async getAccounts(connectionId: string): Promise<BrokerageAccount[]> {
    try {
      const response = await this.makeRequest<NordnetAccount[]>(
        'GET',
        '/accounts',
        undefined,
        this.getAuthHeaders(connectionId)
      )

      return response.map(account => ({
        id: account.accid.toString(),
        brokerId: this.brokerId,
        accountType: this.mapAccountType(account.type),
        accountNumber: account.accno,
        displayName: account.alias || `${account.type} (${account.accno})`,
        currency: this.getDefaultCurrency(this.country),
        isActive: !account.is_blocked,
        institutionName: 'Nordnet'
      }))
    } catch (error) {
      this.log('error', 'Failed to get accounts', error)
      throw error
    }
  }

  async getHoldings(connectionId: string, accountId?: string): Promise<BrokerageHolding[]> {
    try {
      let accounts: string[]
      
      if (accountId) {
        accounts = [accountId]
      } else {
        const accountsResponse = await this.getAccounts(connectionId)
        accounts = accountsResponse.map(acc => acc.id)
      }

      const allHoldings: BrokerageHolding[] = []

      for (const accId of accounts) {
        try {
          const response = await this.makeRequest<NordnetPosition[]>(
            'GET',
            `/accounts/${accId}/positions`,
            undefined,
            this.getAuthHeaders(connectionId)
          )

          const holdings = response.map(position => ({
            accountId: accId,
            symbol: position.instrument.symbol,
            quantity: position.qty,
            marketValue: position.market_value.value,
            costBasis: position.acq_value.value,
            marketPrice: position.market_value.value / position.qty,
            currency: position.market_value.currency,
            assetClass: this.mapAssetClass(position.instrument.instrument_type),
            institutionSecurityId: position.instrument.instrument_id.toString(),
            metadata: {
              instrumentName: position.instrument.name,
              instrumentType: position.instrument.instrument_type,
              pnl: position.pnl.value,
              pnlPct: position.pnl_pct,
              morningPrice: position.morning_price.value,
              mainMarketId: position.instrument.main_market_id,
              tradables: position.instrument.tradables
            }
          }))

          allHoldings.push(...holdings)
        } catch (error) {
          this.log('warn', `Failed to get positions for account ${accId}`, error)
          // Continue with other accounts
        }
      }

      return allHoldings
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
      let accounts: string[]
      
      if (accountId) {
        accounts = [accountId]
      } else {
        const accountsResponse = await this.getAccounts(connectionId)
        accounts = accountsResponse.map(acc => acc.id)
      }

      const allTransactions: BrokerageTransaction[] = []

      for (const accId of accounts) {
        try {
          // Build query parameters
          const params = new URLSearchParams()
          if (startDate) params.append('from', startDate)
          if (endDate) params.append('to', endDate)

          const endpoint = `/accounts/${accId}/returns/transactions/today?${params.toString()}`
          
          const response = await this.makeRequest<NordnetTransaction[]>(
            'GET',
            endpoint,
            undefined,
            this.getAuthHeaders(connectionId)
          )

          const transactions = response.map(transaction => ({
            id: transaction.transaction_id.toString(),
            accountId: accId,
            symbol: transaction.instrument.symbol,
            type: this.mapTransactionType(transaction.trade_type),
            quantity: transaction.volume,
            price: transaction.price.value,
            amount: transaction.consideration.value,
            currency: transaction.consideration.currency,
            date: transaction.trade_time || transaction.transaction_time,
            fees: transaction.courtage?.value,
            description: `${transaction.trade_type} ${transaction.instrument.name}`,
            metadata: {
              instrumentId: transaction.instrument.instrument_id,
              instrumentType: transaction.instrument.instrument_type,
              instrumentName: transaction.instrument.name,
              marketId: transaction.market.market_id,
              marketName: transaction.market.name,
              marketCountry: transaction.market.country,
              venue: transaction.venue,
              orderId: transaction.order_id
            }
          }))

          allTransactions.push(...transactions)
        } catch (error) {
          this.log('warn', `Failed to get transactions for account ${accId}`, error)
          // Continue with other accounts
        }
      }

      return allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } catch (error) {
      this.log('error', 'Failed to get transactions', error)
      throw error
    }
  }

  async searchSecurities(query: string): Promise<BrokerageSecurity[]> {
    try {
      const response = await this.makeRequest<NordnetInstrumentSearch>(
        'GET',
        `/instruments/search?query=${encodeURIComponent(query)}&limit=20`,
        undefined,
        this.getAuthHeaders()
      )

      return response.hits.map(instrument => ({
        symbol: instrument.symbol,
        name: instrument.name,
        type: this.mapAssetClass(instrument.instrument_type),
        exchange: instrument.tradables[0]?.market_name,
        currency: instrument.currency,
        metadata: {
          instrumentId: instrument.instrument_id,
          instrumentType: instrument.instrument_type,
          marketId: instrument.market_id,
          country: instrument.country,
          tradables: instrument.tradables
        }
      }))
    } catch (error) {
      this.log('error', 'Failed to search securities', error)
      return []
    }
  }

  async getSecurityDetails(symbol: string): Promise<BrokerageSecurity | null> {
    try {
      const searchResults = await this.searchSecurities(symbol)
      return searchResults.find(security => security.symbol === symbol) || null
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
    try {
      await this.makeRequest(
        'POST',
        '/login/logout',
        {},
        this.getAuthHeaders(connectionId)
      )
      
      this.sessionKey = undefined
      this.expiresAt = undefined
      this.log('info', 'Successfully logged out from Nordnet')
    } catch (error) {
      this.log('error', 'Failed to logout from Nordnet', error)
      throw error
    }
  }

  // Helper methods
  private getDefaultCurrency(country: string): string {
    switch (country) {
      case 'se':
        return 'SEK'
      case 'no':
        return 'NOK'
      case 'dk':
        return 'DKK'
      case 'fi':
        return 'EUR'
      default:
        return 'SEK'
    }
  }

  private mapAccountType(nordnetType: string): 'CASH' | 'MARGIN' | 'RETIREMENT' | 'CUSTODIAL' {
    switch (nordnetType?.toLowerCase()) {
      case 'isk':
      case 'kapitalförsäkring':
      case 'kapitalforsikring':
      case 'af':
      case 'pension':
        return 'RETIREMENT'
      case 'depå':
      case 'depot':
      case 'af_depå':
        return 'CUSTODIAL'
      case 'kreditkonto':
      case 'margin':
        return 'MARGIN'
      default:
        return 'CASH'
    }
  }

  private mapAssetClass(nordnetType: string): AssetClass {
    switch (nordnetType?.toLowerCase()) {
      case 'stock':
      case 'aktie':
      case 'equity':
        return AssetClass.EQUITY
      case 'etf':
      case 'exchange_traded_fund':
        return AssetClass.ETF
      case 'fund':
      case 'mutual_fund':
      case 'fond':
        return AssetClass.FUND
      case 'bond':
      case 'obligation':
      case 'fixed_income':
        return AssetClass.FIXED_INCOME
      case 'option':
      case 'warrant':
        return AssetClass.OPTION
      case 'currency':
      case 'cash':
        return AssetClass.CASH
      case 'commodity':
        return AssetClass.COMMODITY
      case 'certificate':
      case 'structured_product':
        return AssetClass.COMMODITY // Map certificates to commodity as closest match
      default:
        return AssetClass.EQUITY
    }
  }

  private mapTransactionType(nordnetType: string): TransactionType {
    switch (nordnetType?.toLowerCase()) {
      case 'köp':
      case 'kjøp':
      case 'buy':
      case 'osto':
        return TransactionType.BUY
      case 'sälj':
      case 'selg':
      case 'sell':
      case 'myynti':
        return TransactionType.SELL
      case 'utdelning':
      case 'dividend':
      case 'osinko':
        return TransactionType.DIVIDEND
      case 'ränta':
      case 'rente':
      case 'interest':
      case 'korko':
        return TransactionType.INTEREST
      case 'insättning':
      case 'innskudd':
      case 'deposit':
      case 'talletus':
        return TransactionType.DEPOSIT
      case 'uttag':
      case 'uttak':
      case 'withdrawal':
      case 'nosto':
        return TransactionType.WITHDRAWAL
      case 'avgift':
      case 'gebyr':
      case 'fee':
      case 'maksu':
        return TransactionType.FEE
      case 'skatt':
      case 'tax':
      case 'vero':
        return TransactionType.TAX
      case 'överföring':
      case 'overføring':
      case 'transfer':
      case 'siirto':
        return TransactionType.TRANSFER
      default:
        return TransactionType.BUY
    }
  }
}