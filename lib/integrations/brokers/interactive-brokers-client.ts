// Interactive Brokers API client for investment portfolio data
// Free API access for IBKR clients (requires TWS/Gateway)

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

interface IBKRConfig extends BrokerageClientConfig {
  gatewayUrl?: string // Default: https://localhost:5000
  username?: string
  password?: string
}

interface IBKRAccount {
  id: string
  accountId: string
  accountVan: string
  accountTitle: string
  displayName: string
  accountAlias: string
  accountStatus: string
  accountType: string
  tradingType: string
  faclient: boolean
  clearingStatus: string
  covestor: boolean
  parent: any
  desc: string
}

interface IBKRPosition {
  acctId: string
  conid: number
  contractDesc: string
  assetClass: string
  position: number
  mktPrice: number
  mktValue: number
  currency: string
  avgCost: number
  avgPrice: number
  realizedPnl: number
  unrealizedPnl: number
  exchs: string
  expiry: string
  putOrCall: string
  multiplier: number
  strike: number
  exerciseStyle: string
  undConid: number
  model: string
  time: number
  chgToday: number
  baseMktValue: number
  baseMktPrice: number
  baseAvgCost: number
  baseAvgPrice: number
  baseRealizedPnl: number
  baseUnrealizedPnl: number
}

interface IBKRTransaction {
  accountId: string
  acctAlias: string
  model: string
  currency: string
  fxRateToBase: number
  assetCategory: string
  symbol: string
  description: string
  conid: number
  securityID: string
  securityIDType: string
  cusip: string
  isin: string
  listingExchange: string
  underlyingConid: number
  underlyingSymbol: string
  underlyingSecurityID: string
  underlyingListingExchange: string
  issuer: string
  multiplier: number
  strike: number
  expiry: string
  putCall: string
  principalAdjustFactor: number
  dateTime: string
  settleDateTarget: string
  transactionID: number
  buySell: string
  ibCommission: number
  ibCommissionCurrency: string
  netCash: number
  closePrice: number
  openCloseIndicator: string
  notes: {
    [key: string]: string
  }
  cost: number
  fifoPnlRealized: number
  fxPnl: number
  mtmPnl: number
  origTradePrice: number
  origTradeDate: string
  origTradeID: string
  origOrderID: number
  clearingFirmID: string
  transactionType: string
  exchange: string
  quantity: number
  tradePrice: number
  tradeMoney: number
  proceeds: number
  taxes: number
  ibOrderID: number
  ibExecID: string
  brokerageOrderID: string
  orderReference: string
  volatilityOrderLink: string
  exchOrderId: string
  extExecID: string
  orderTime: string
  reportDate: string
  tradeDate: string
  whenRealized: string
  whenReopened: string
}

interface IBKRContractDetails {
  conid: number
  symbol: string
  secType: string
  exchange: string
  isUS: boolean
  hasOptions: boolean
  fullName: string
  description: string
}

export class InteractiveBrokersClient extends BaseBrokerageClient {
  readonly brokerId = BrokerId.INTERACTIVE_BROKERS
  private gatewayUrl: string
  private username?: string
  private password?: string
  private sessionId?: string

  constructor(config: IBKRConfig) {
    super(config)
    this.gatewayUrl = config.gatewayUrl || 'https://localhost:5000'
    this.username = config.username
    this.password = config.password
    this.baseUrl = this.gatewayUrl
  }

  // Check authentication status with IBKR Gateway
  async checkAuthStatus(): Promise<{ authenticated: boolean; connected: boolean; competing: boolean }> {
    try {
      const response = await this.makeRequest<{
        authenticated: boolean
        connected: boolean
        competing: boolean
        message?: string
        MAC?: string
        serverInfo?: any
      }>('GET', '/iserver/auth/status')

      return {
        authenticated: response.authenticated,
        connected: response.connected,
        competing: response.competing || false
      }
    } catch (error) {
      this.log('error', 'Failed to check auth status', error)
      return { authenticated: false, connected: false, competing: false }
    }
  }

  // Initiate authentication with IBKR
  async initiateAuth(): Promise<{ challenge?: string; error?: string }> {
    try {
      const response = await this.makeRequest<{
        challenge?: string
        error?: string
      }>('POST', '/iserver/auth/ssodh/init')

      return response
    } catch (error) {
      this.log('error', 'Failed to initiate auth', error)
      return { error: error.message }
    }
  }

  // Reauthenticate if session expired
  async reauthenticate(): Promise<{ message?: string; statusCode?: number }> {
    try {
      const response = await this.makeRequest<{
        message?: string
        statusCode?: number
      }>('POST', '/iserver/reauthenticate')

      return response
    } catch (error) {
      this.log('error', 'Failed to reauthenticate', error)
      return { message: error.message, statusCode: 500 }
    }
  }

  async authenticate(credentials: { username?: string; password?: string }): Promise<AuthResult> {
    try {
      // First check if already authenticated
      const authStatus = await this.checkAuthStatus()
      
      if (authStatus.authenticated && authStatus.connected) {
        this.log('info', 'Already authenticated with IBKR')
        return {
          success: true,
          connectionId: 'ibkr_session'
        }
      }

      // If not authenticated, user needs to manually log in through Gateway
      return {
        success: false,
        error: 'Please authenticate through IBKR Client Portal Gateway at https://localhost:5000',
        redirectUrl: this.gatewayUrl
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Authentication failed'
      }
    }
  }

  async refreshAuth(connection: BrokerageConnection): Promise<AuthResult> {
    try {
      const authStatus = await this.checkAuthStatus()
      
      if (!authStatus.authenticated) {
        const reauth = await this.reauthenticate()
        if (reauth.statusCode !== 200) {
          return {
            success: false,
            error: 'Session expired. Please reauthenticate through IBKR Gateway.'
          }
        }
      }

      return {
        success: true,
        connectionId: connection.connectionId
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
      const response = await this.makeRequest<IBKRAccount[]>('GET', '/iserver/accounts')

      return response.map(account => ({
        id: account.accountId,
        brokerId: this.brokerId,
        accountType: this.mapAccountType(account.accountType),
        accountNumber: account.accountId,
        displayName: account.displayName || account.accountTitle || account.accountId,
        currency: 'USD', // IBKR supports multiple currencies, but default to USD
        isActive: account.accountStatus === 'Open',
        institutionName: 'Interactive Brokers'
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
          const response = await this.makeRequest<IBKRPosition[]>(
            'GET',
            `/iserver/account/${accId}/positions`
          )

          const holdings = response
            .filter(position => position.position !== 0)
            .map(position => ({
              accountId: accId,
              symbol: this.extractSymbol(position.contractDesc),
              quantity: position.position,
              marketValue: position.mktValue,
              costBasis: position.avgCost * Math.abs(position.position),
              marketPrice: position.mktPrice,
              currency: position.currency,
              assetClass: this.mapAssetClass(position.assetClass),
              institutionSecurityId: position.conid.toString(),
              metadata: {
                contractDesc: position.contractDesc,
                conid: position.conid,
                unrealizedPnl: position.unrealizedPnl,
                realizedPnl: position.realizedPnl,
                avgPrice: position.avgPrice,
                chgToday: position.chgToday,
                exchange: position.exchs,
                expiry: position.expiry,
                strike: position.strike,
                putOrCall: position.putOrCall,
                multiplier: position.multiplier
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
          // IBKR uses Flex queries for historical data
          // For demo purposes, we'll use a simplified approach
          const params = new URLSearchParams()
          if (startDate) params.append('from', startDate)
          if (endDate) params.append('to', endDate)

          const endpoint = `/iserver/account/${accId}/trades?${params.toString()}`
          
          const response = await this.makeRequest<IBKRTransaction[]>('GET', endpoint)

          const transactions = response.map(transaction => ({
            id: transaction.transactionID.toString(),
            accountId: accId,
            symbol: transaction.symbol,
            type: this.mapTransactionType(transaction.buySell, transaction.transactionType),
            quantity: Math.abs(transaction.quantity),
            price: transaction.tradePrice,
            amount: Math.abs(transaction.tradeMoney || transaction.proceeds),
            currency: transaction.currency,
            date: transaction.tradeDate || transaction.dateTime.split('T')[0],
            fees: Math.abs(transaction.ibCommission || 0),
            description: transaction.description,
            metadata: {
              conid: transaction.conid,
              securityID: transaction.securityID,
              isin: transaction.isin,
              cusip: transaction.cusip,
              exchange: transaction.exchange,
              ibOrderID: transaction.ibOrderID,
              transactionType: transaction.transactionType,
              netCash: transaction.netCash,
              closePrice: transaction.closePrice,
              origTradePrice: transaction.origTradePrice
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
      const response = await this.makeRequest<IBKRContractDetails[]>(
        'GET',
        `/iserver/secdef/search?symbol=${encodeURIComponent(query)}`
      )

      return response.map(contract => ({
        symbol: contract.symbol,
        name: contract.fullName || contract.description,
        type: this.mapAssetClass(contract.secType),
        exchange: contract.exchange,
        currency: 'USD', // Default, would need additional call to get exact currency
        metadata: {
          conid: contract.conid,
          secType: contract.secType,
          isUS: contract.isUS,
          hasOptions: contract.hasOptions
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
      const authStatus = await this.checkAuthStatus()
      return authStatus.authenticated && authStatus.connected
    } catch (error) {
      this.log('warn', 'Connection test failed', error)
      return false
    }
  }

  async disconnect(connectionId: string): Promise<void> {
    try {
      await this.makeRequest('POST', '/iserver/logout')
      this.log('info', 'Successfully logged out from IBKR')
    } catch (error) {
      this.log('error', 'Failed to logout from IBKR', error)
      throw error
    }
  }

  // Helper methods
  private extractSymbol(contractDesc: string): string {
    // Extract symbol from contract description
    // Format is usually "SYMBOL YYYY-MM-DD C/P STRIKE" for options
    // or just "SYMBOL" for stocks
    const parts = contractDesc.split(' ')
    return parts[0] || contractDesc
  }

  private mapAccountType(ibkrType: string): 'CASH' | 'MARGIN' | 'RETIREMENT' | 'CUSTODIAL' {
    switch (ibkrType?.toLowerCase()) {
      case 'ira':
      case 'roth':
      case 'roth_ira':
      case 'sep_ira':
      case 'simple_ira':
        return 'RETIREMENT'
      case 'custodial':
      case 'ugma':
      case 'utma':
        return 'CUSTODIAL'
      case 'margin':
      case 'reg_t_margin':
        return 'MARGIN'
      default:
        return 'CASH'
    }
  }

  private mapAssetClass(ibkrAssetClass: string): AssetClass {
    switch (ibkrAssetClass?.toLowerCase()) {
      case 'stk':
      case 'stock':
        return AssetClass.EQUITY
      case 'opt':
      case 'option':
        return AssetClass.OPTION
      case 'fut':
      case 'future':
        return AssetClass.COMMODITY
      case 'bond':
      case 'fixed_income':
        return AssetClass.FIXED_INCOME
      case 'fund':
      case 'mutual_fund':
        return AssetClass.FUND
      case 'etf':
        return AssetClass.ETF
      case 'cash':
      case 'currency':
        return AssetClass.CASH
      case 'commodity':
      case 'cmdty':
        return AssetClass.COMMODITY
      case 'crypto':
      case 'cryptocurrency':
        return AssetClass.CRYPTOCURRENCY
      default:
        return AssetClass.EQUITY
    }
  }

  private mapTransactionType(buySell: string, transactionType?: string): TransactionType {
    if (transactionType) {
      switch (transactionType.toLowerCase()) {
        case 'trade':
          return buySell?.toLowerCase() === 'buy' ? TransactionType.BUY : TransactionType.SELL
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
      }
    }

    // Fallback to buy/sell mapping
    switch (buySell?.toLowerCase()) {
      case 'buy':
      case 'bot':
        return TransactionType.BUY
      case 'sell':
      case 'sld':
        return TransactionType.SELL
      default:
        return TransactionType.BUY
    }
  }
}