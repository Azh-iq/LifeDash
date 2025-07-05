// Charles Schwab API Client
// Handles Schwab API OAuth2 authentication, rate limiting, and data fetching

import {
  SchwabAuthConfig,
  SchwabTokenResponse,
  SchwabAccount,
  SchwabTransaction,
  SchwabPosition,
  SchwabTransactionResponse,
  SchwabAccountResponse,
  SchwabPositionResponse,
  SchwabQuote,
  SchwabMarketHours,
  SchwabPriceHistory,
  SchwabPriceHistoryParams,
  SchwabOptionsChain,
  SchwabOptionsChainParams,
  SchwabApiError,
  SchwabAuthState,
  SchwabSyncConfig,
  SchwabSyncResult,
  SchwabConnectionStatus,
  SchwabRateLimitInfo,
  SCHWAB_API_ENDPOINTS,
  SCHWAB_OAUTH_SCOPES,
  SCHWAB_RATE_LIMITS
} from './types'

export class SchwabApiClient {
  private config: SchwabAuthConfig
  private authState: SchwabAuthState
  private requestCounts: Map<string, Map<string, number>> = new Map()
  private rateLimitInfo: Map<string, SchwabRateLimitInfo> = new Map()
  private lastRequestTime: number = 0
  private retryCount: number = 0

  constructor(config: SchwabAuthConfig) {
    this.config = config
    this.authState = {
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      userId: null,
      lastRefresh: null,
      scope: []
    }
  }

  /**
   * Initialize OAuth2 authentication flow
   */
  public initializeAuth(): string {
    const state = this.generateRandomString(32)
    const codeVerifier = this.generateCodeVerifier()
    const codeChallenge = this.generateCodeChallenge(codeVerifier)
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope.join(' '),
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    })

    const authUrl = `${this.config.baseUrl}/v1/oauth/authorize?${params.toString()}`
    
    // Store state and code verifier for validation
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('schwab_oauth_state', state)
      sessionStorage.setItem('schwab_code_verifier', codeVerifier)
    }
    
    return authUrl
  }

  /**
   * Complete OAuth2 authentication with authorization code
   */
  public async completeAuth(code: string, state: string): Promise<SchwabTokenResponse> {
    // Validate state parameter
    if (typeof window !== 'undefined') {
      const storedState = sessionStorage.getItem('schwab_oauth_state')
      if (storedState !== state) {
        throw new Error('Invalid OAuth state parameter')
      }
      
      const codeVerifier = sessionStorage.getItem('schwab_code_verifier')
      if (!codeVerifier) {
        throw new Error('Missing code verifier for PKCE')
      }

      const tokenData = {
        grant_type: 'authorization_code',
        code: code,
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        code_verifier: codeVerifier
      }

      const response = await this.makeRequest<SchwabTokenResponse>(
        'POST',
        SCHWAB_API_ENDPOINTS.AUTH,
        tokenData,
        false,
        'application/x-www-form-urlencoded'
      )

      // Store authentication state
      this.authState = {
        isAuthenticated: true,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresAt: Date.now() + (response.expires_in * 1000),
        userId: null, // Will be set after fetching user info
        lastRefresh: Date.now(),
        scope: response.scope.split(' ')
      }

      // Clean up temporary storage
      sessionStorage.removeItem('schwab_oauth_state')
      sessionStorage.removeItem('schwab_code_verifier')

      return response
    }
    
    throw new Error('OAuth completion requires browser environment')
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshToken(): Promise<SchwabTokenResponse> {
    if (!this.authState.refreshToken) {
      throw new Error('No refresh token available')
    }

    const tokenData = {
      grant_type: 'refresh_token',
      refresh_token: this.authState.refreshToken,
      client_id: this.config.clientId
    }

    const response = await this.makeRequest<SchwabTokenResponse>(
      'POST',
      SCHWAB_API_ENDPOINTS.REFRESH,
      tokenData,
      false,
      'application/x-www-form-urlencoded'
    )

    // Update authentication state
    this.authState = {
      ...this.authState,
      accessToken: response.access_token,
      refreshToken: response.refresh_token || this.authState.refreshToken,
      expiresAt: Date.now() + (response.expires_in * 1000),
      lastRefresh: Date.now(),
      scope: response.scope ? response.scope.split(' ') : this.authState.scope
    }

    return response
  }

  /**
   * Get all accounts for authenticated user
   */
  public async getAccounts(): Promise<SchwabAccount[]> {
    await this.ensureValidToken()
    
    const response = await this.makeRequest<SchwabAccount[]>(
      'GET',
      SCHWAB_API_ENDPOINTS.ACCOUNTS,
      null,
      true
    )

    return response
  }

  /**
   * Get account numbers (encrypted)
   */
  public async getAccountNumbers(): Promise<Array<{ accountNumber: string; hashValue: string }>> {
    await this.ensureValidToken()
    
    const response = await this.makeRequest<Array<{ accountNumber: string; hashValue: string }>>(
      'GET',
      SCHWAB_API_ENDPOINTS.ACCOUNT_NUMBERS,
      null,
      true
    )

    return response
  }

  /**
   * Get specific account details
   */
  public async getAccountDetails(accountId: string, fields?: string[]): Promise<SchwabAccount> {
    await this.ensureValidToken()
    
    const params = fields ? `?fields=${fields.join(',')}` : ''
    const endpoint = SCHWAB_API_ENDPOINTS.ACCOUNT_DETAILS.replace('{accountId}', accountId) + params

    const response = await this.makeRequest<SchwabAccount>(
      'GET',
      endpoint,
      null,
      true
    )

    return response
  }

  /**
   * Get positions for a specific account
   */
  public async getPositions(accountId: string, fields?: string[]): Promise<SchwabPosition[]> {
    await this.ensureValidToken()
    
    const params = fields ? `?fields=${fields.join(',')}` : ''
    const endpoint = SCHWAB_API_ENDPOINTS.POSITIONS.replace('{accountId}', accountId) + params

    const response = await this.makeRequest<SchwabPosition[]>(
      'GET',
      endpoint,
      null,
      true
    )

    return response
  }

  /**
   * Get transactions for a specific account
   */
  public async getTransactions(
    accountId: string,
    options: {
      type?: 'TRADE' | 'RECEIVE_AND_DELIVER' | 'DIVIDEND_OR_INTEREST' | 'ACH_RECEIPT' | 'ACH_DISBURSEMENT' | 'CASH_RECEIPT' | 'CASH_DISBURSEMENT' | 'ELECTRONIC_FUND' | 'WIRE_OUT' | 'WIRE_IN' | 'JOURNAL' | 'MEMORANDUM' | 'MARGIN_CALL' | 'MONEY_MARKET' | 'SMA_ADJUSTMENT'
      startDate?: string
      endDate?: string
      symbol?: string
    } = {}
  ): Promise<SchwabTransaction[]> {
    await this.ensureValidToken()
    
    const params = new URLSearchParams()
    if (options.type) params.append('type', options.type)
    if (options.startDate) params.append('startDate', options.startDate)
    if (options.endDate) params.append('endDate', options.endDate)
    if (options.symbol) params.append('symbol', options.symbol)

    const endpoint = SCHWAB_API_ENDPOINTS.TRANSACTIONS.replace('{accountId}', accountId)
    const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint

    const response = await this.makeRequest<SchwabTransaction[]>(
      'GET',
      url,
      null,
      true
    )

    return response
  }

  /**
   * Get specific transaction details
   */
  public async getTransactionDetails(accountId: string, transactionId: string): Promise<SchwabTransaction> {
    await this.ensureValidToken()
    
    const endpoint = SCHWAB_API_ENDPOINTS.TRANSACTION_DETAILS
      .replace('{accountId}', accountId)
      .replace('{transactionId}', transactionId)

    const response = await this.makeRequest<SchwabTransaction>(
      'GET',
      endpoint,
      null,
      true
    )

    return response
  }

  /**
   * Get quotes for multiple symbols
   */
  public async getQuotes(symbols: string[]): Promise<Record<string, SchwabQuote>> {
    await this.ensureValidToken()
    
    const params = new URLSearchParams({
      symbols: symbols.join(',')
    })

    const url = `${SCHWAB_API_ENDPOINTS.QUOTES}?${params.toString()}`

    const response = await this.makeRequest<Record<string, SchwabQuote>>(
      'GET',
      url,
      null,
      true
    )

    return response
  }

  /**
   * Get quote for a single symbol
   */
  public async getQuote(symbol: string): Promise<SchwabQuote> {
    await this.ensureValidToken()
    
    const endpoint = SCHWAB_API_ENDPOINTS.QUOTE_SINGLE.replace('{symbol}', symbol)

    const response = await this.makeRequest<SchwabQuote>(
      'GET',
      endpoint,
      null,
      true
    )

    return response
  }

  /**
   * Get price history for a symbol
   */
  public async getPriceHistory(params: SchwabPriceHistoryParams): Promise<SchwabPriceHistory> {
    await this.ensureValidToken()
    
    const searchParams = new URLSearchParams({
      symbol: params.symbol,
      periodType: params.periodType,
      frequencyType: params.frequencyType
    })

    if (params.period) searchParams.append('period', params.period.toString())
    if (params.frequency) searchParams.append('frequency', params.frequency.toString())
    if (params.startDate) searchParams.append('startDate', params.startDate.toString())
    if (params.endDate) searchParams.append('endDate', params.endDate.toString())
    if (params.needExtendedHoursData) searchParams.append('needExtendedHoursData', 'true')

    const url = `${SCHWAB_API_ENDPOINTS.PRICE_HISTORY}?${searchParams.toString()}`

    const response = await this.makeRequest<SchwabPriceHistory>(
      'GET',
      url,
      null,
      true
    )

    return response
  }

  /**
   * Get market hours
   */
  public async getMarketHours(markets: string[], date?: string): Promise<Record<string, SchwabMarketHours>> {
    await this.ensureValidToken()
    
    const params = new URLSearchParams({
      markets: markets.join(',')
    })

    if (date) params.append('date', date)

    const url = `${SCHWAB_API_ENDPOINTS.MARKET_HOURS}?${params.toString()}`

    const response = await this.makeRequest<Record<string, SchwabMarketHours>>(
      'GET',
      url,
      null,
      true
    )

    return response
  }

  /**
   * Get options chain
   */
  public async getOptionsChain(params: SchwabOptionsChainParams): Promise<SchwabOptionsChain> {
    await this.ensureValidToken()
    
    const searchParams = new URLSearchParams({
      symbol: params.symbol
    })

    if (params.contractType) searchParams.append('contractType', params.contractType)
    if (params.strikeCount) searchParams.append('strikeCount', params.strikeCount.toString())
    if (params.includeQuotes) searchParams.append('includeQuotes', 'true')
    if (params.strategy) searchParams.append('strategy', params.strategy)
    if (params.interval) searchParams.append('interval', params.interval.toString())
    if (params.strike) searchParams.append('strike', params.strike.toString())
    if (params.range) searchParams.append('range', params.range)
    if (params.fromDate) searchParams.append('fromDate', params.fromDate)
    if (params.toDate) searchParams.append('toDate', params.toDate)
    if (params.volatility) searchParams.append('volatility', params.volatility.toString())
    if (params.underlyingPrice) searchParams.append('underlyingPrice', params.underlyingPrice.toString())
    if (params.interestRate) searchParams.append('interestRate', params.interestRate.toString())
    if (params.daysToExpiration) searchParams.append('daysToExpiration', params.daysToExpiration.toString())
    if (params.expMonth) searchParams.append('expMonth', params.expMonth)
    if (params.optionType) searchParams.append('optionType', params.optionType)

    const url = `${SCHWAB_API_ENDPOINTS.OPTIONS_CHAINS}?${searchParams.toString()}`

    const response = await this.makeRequest<SchwabOptionsChain>(
      'GET',
      url,
      null,
      true
    )

    return response
  }

  /**
   * Synchronize all account data
   */
  public async syncAllData(config: SchwabSyncConfig): Promise<SchwabSyncResult> {
    const startTime = Date.now()
    const result: SchwabSyncResult = {
      success: false,
      accountsSynced: 0,
      transactionsSynced: 0,
      positionsSynced: 0,
      newTransactions: 0,
      updatedTransactions: 0,
      newPositions: 0,
      updatedPositions: 0,
      errors: [],
      warnings: [],
      lastSyncTime: new Date().toISOString(),
      nextSyncTime: new Date(Date.now() + config.syncInterval * 60000).toISOString(),
      dataStats: {
        totalValue: 0,
        totalCash: 0,
        totalSecurities: 0,
        positionCount: 0,
        transactionCount: 0
      }
    }

    try {
      // Get accounts
      const accounts = await this.getAccounts()
      const targetAccounts = config.accountIds.length > 0 
        ? accounts.filter(acc => config.accountIds.includes(acc.accountId))
        : accounts

      result.accountsSynced = targetAccounts.length

      // Sync data for each account
      for (const account of targetAccounts) {
        try {
          // Update account stats
          result.dataStats.totalValue += account.closingBalances.totalValue
          result.dataStats.totalCash += account.closingBalances.totalCash
          result.dataStats.totalSecurities += account.closingBalances.totalSecurities

          // Sync positions if requested
          if (config.includePositions) {
            const positions = await this.getPositions(account.accountId)
            result.positionsSynced += positions.length
            result.dataStats.positionCount += positions.length
            
            // Here you would typically save positions to database
            // This is a simplified example
          }

          // Sync transactions if requested
          if (config.includeTransactions) {
            const transactions = await this.getTransactions(account.accountId, {
              startDate: config.fromDate,
              endDate: config.toDate
            })
            
            result.transactionsSynced += transactions.length
            result.dataStats.transactionCount += transactions.length
            
            // Here you would typically save transactions to database
            // This is a simplified example
          }

          // Add delay to respect rate limits
          await this.rateLimitDelay('trading')
          
        } catch (error) {
          result.errors.push(`Failed to sync account ${account.accountId}: ${error}`)
        }
      }

      result.success = result.errors.length === 0
      
    } catch (error) {
      result.errors.push(`Sync failed: ${error}`)
    }

    return result
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): SchwabConnectionStatus {
    const now = Date.now()
    const rateLimitInfo = this.getRateLimitStatus()
    
    return {
      connected: this.authState.isAuthenticated && this.isTokenValid(),
      lastSync: this.authState.lastRefresh ? new Date(this.authState.lastRefresh).toISOString() : null,
      nextSync: null, // Would be calculated based on sync schedule
      status: this.getConnectionStatusString(),
      accountCount: 0, // Would be stored/cached
      transactionCount: 0, // Would be stored/cached
      positionCount: 0, // Would be stored/cached
      rateLimitStatus: {
        remainingRequests: rateLimitInfo.remaining,
        resetTime: new Date(rateLimitInfo.reset).toISOString(),
        currentUsage: rateLimitInfo.used,
      }
    }
  }

  /**
   * Disconnect and revoke tokens
   */
  public async disconnect(): Promise<void> {
    // Revoke tokens if possible
    if (this.authState.accessToken) {
      try {
        await this.makeRequest(
          'POST',
          SCHWAB_API_ENDPOINTS.REVOKE,
          { token: this.authState.accessToken },
          false,
          'application/x-www-form-urlencoded'
        )
      } catch (error) {
        // Ignore revoke errors, continue with cleanup
      }
    }

    // Clear auth state
    this.authState = {
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      userId: null,
      lastRefresh: null,
      scope: []
    }

    // Clear any stored tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('schwab_access_token')
      localStorage.removeItem('schwab_refresh_token')
    }
  }

  // Private helper methods

  private async ensureValidToken(): Promise<void> {
    if (!this.authState.isAuthenticated) {
      throw new Error('Not authenticated with Schwab API')
    }

    if (!this.isTokenValid()) {
      await this.refreshToken()
    }
  }

  private isTokenValid(): boolean {
    if (!this.authState.expiresAt) return false
    return Date.now() < this.authState.expiresAt - 120000 // 2 minute buffer
  }

  private getConnectionStatusString(): SchwabConnectionStatus['status'] {
    if (!this.authState.isAuthenticated) return 'disconnected'
    if (!this.isTokenValid()) return 'expired'
    
    const rateLimitInfo = this.getRateLimitStatus()
    if (rateLimitInfo.remaining <= 0) return 'rate_limited'
    
    return 'connected'
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    requiresAuth: boolean = false,
    contentType: string = 'application/json'
  ): Promise<T> {
    // Check rate limits before making request
    await this.checkRateLimit(endpoint)

    const url = `${this.config.baseUrl}${endpoint}`
    const headers: HeadersInit = {
      'Accept': 'application/json'
    }

    if (contentType) {
      headers['Content-Type'] = contentType
    }

    if (requiresAuth && this.authState.accessToken) {
      headers.Authorization = `Bearer ${this.authState.accessToken}`
    }

    let body: string | undefined
    if (data) {
      if (contentType === 'application/x-www-form-urlencoded') {
        body = new URLSearchParams(data).toString()
      } else {
        body = JSON.stringify(data)
      }
    }

    const options: RequestInit = {
      method,
      headers,
      body
    }

    // Add minimum delay between requests
    const timeSinceLastRequest = Date.now() - this.lastRequestTime
    if (timeSinceLastRequest < 100) {
      await new Promise(resolve => setTimeout(resolve, 100 - timeSinceLastRequest))
    }

    this.lastRequestTime = Date.now()

    let response: Response
    try {
      response = await fetch(url, options)
    } catch (error) {
      // Handle network errors with retry logic
      if (this.retryCount < 3) {
        this.retryCount++
        await this.exponentialBackoff(this.retryCount)
        return this.makeRequest(method, endpoint, data, requiresAuth, contentType)
      }
      throw new Error(`Network error: ${error}`)
    }

    // Update rate limit tracking
    this.updateRateLimit(endpoint, response)

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : SCHWAB_RATE_LIMITS.RATE_LIMIT_BACKOFF * 1000
      
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Retry the request
      return this.makeRequest(method, endpoint, data, requiresAuth, contentType)
    }

    // Handle other HTTP errors
    if (!response.ok) {
      const errorText = await response.text()
      let error: SchwabApiError
      
      try {
        error = JSON.parse(errorText)
      } catch {
        error = {
          error: 'HTTP_ERROR',
          error_description: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
          message: errorText
        }
      }

      // Handle authentication errors
      if (response.status === 401) {
        this.authState.isAuthenticated = false
        throw new Error('Authentication failed. Please re-authenticate.')
      }

      throw new Error(`Schwab API Error: ${error.error_description || error.error}`)
    }

    // Reset retry count on success
    this.retryCount = 0

    const responseText = await response.text()
    if (!responseText) {
      return {} as T
    }

    return JSON.parse(responseText)
  }

  private async checkRateLimit(endpoint: string): Promise<void> {
    const category = this.getRateLimitCategory(endpoint)
    const now = Date.now()
    const minute = Math.floor(now / 60000)
    
    if (!this.requestCounts.has(category)) {
      this.requestCounts.set(category, new Map())
    }
    
    const categoryRequests = this.requestCounts.get(category)!
    const requestsThisMinute = categoryRequests.get(minute.toString()) || 0
    
    const limit = this.getRateLimitForCategory(category)
    
    if (requestsThisMinute >= limit) {
      const waitTime = 60000 - (now % 60000)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  private updateRateLimit(endpoint: string, response: Response): void {
    const category = this.getRateLimitCategory(endpoint)
    const now = Date.now()
    const minute = Math.floor(now / 60000)
    
    if (!this.requestCounts.has(category)) {
      this.requestCounts.set(category, new Map())
    }
    
    const categoryRequests = this.requestCounts.get(category)!
    const key = minute.toString()
    
    categoryRequests.set(key, (categoryRequests.get(key) || 0) + 1)
    
    // Clean up old entries
    for (const [k, _] of categoryRequests.entries()) {
      if (parseInt(k) < minute - 5) {
        categoryRequests.delete(k)
      }
    }

    // Update rate limit info from response headers
    const remaining = response.headers.get('X-RateLimit-Remaining')
    const reset = response.headers.get('X-RateLimit-Reset')
    const limit = response.headers.get('X-RateLimit-Limit')
    
    if (remaining && reset && limit) {
      this.rateLimitInfo.set(category, {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: parseInt(reset) * 1000,
        used: parseInt(limit) - parseInt(remaining),
        window: 60000
      })
    }
  }

  private getRateLimitCategory(endpoint: string): string {
    if (endpoint.includes('/marketdata/')) {
      if (endpoint.includes('/quotes')) {
        return 'quotes'
      } else if (endpoint.includes('/pricehistory')) {
        return 'pricehistory'
      } else {
        return 'marketdata'
      }
    } else if (endpoint.includes('/trader/')) {
      return 'trading'
    } else {
      return 'auth'
    }
  }

  private getRateLimitForCategory(category: string): number {
    switch (category) {
      case 'quotes':
        return SCHWAB_RATE_LIMITS.QUOTE_REQUESTS_PER_MINUTE
      case 'pricehistory':
        return SCHWAB_RATE_LIMITS.PRICE_HISTORY_REQUESTS_PER_MINUTE
      case 'marketdata':
        return SCHWAB_RATE_LIMITS.MARKET_DATA_REQUESTS_PER_MINUTE
      case 'trading':
        return SCHWAB_RATE_LIMITS.ACCOUNT_REQUESTS_PER_MINUTE
      default:
        return 60
    }
  }

  private getRateLimitStatus(): SchwabRateLimitInfo {
    const tradingLimit = this.rateLimitInfo.get('trading')
    const marketDataLimit = this.rateLimitInfo.get('marketdata')
    
    // Return the most restrictive limit
    if (tradingLimit && marketDataLimit) {
      return tradingLimit.remaining < marketDataLimit.remaining ? tradingLimit : marketDataLimit
    } else if (tradingLimit) {
      return tradingLimit
    } else if (marketDataLimit) {
      return marketDataLimit
    } else {
      return {
        limit: 60,
        remaining: 60,
        reset: Date.now() + 60000,
        used: 0,
        window: 60000
      }
    }
  }

  private async rateLimitDelay(category: 'trading' | 'marketdata' = 'trading'): Promise<void> {
    const delay = category === 'marketdata' ? 500 : 200
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  private async exponentialBackoff(attemptNumber: number): Promise<void> {
    const delay = Math.min(1000 * Math.pow(2, attemptNumber), 30000)
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  private generateCodeVerifier(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return this.base64URLEncode(array)
  }

  private generateCodeChallenge(verifier: string): string {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    return crypto.subtle.digest('SHA-256', data).then(buffer => {
      return this.base64URLEncode(new Uint8Array(buffer))
    }) as any
  }

  private base64URLEncode(buffer: Uint8Array): string {
    return btoa(String.fromCharCode(...buffer))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  // Public getters for external access
  public get isAuthenticated(): boolean {
    return this.authState.isAuthenticated && this.isTokenValid()
  }

  public get accessToken(): string | null {
    return this.authState.accessToken
  }

  public get authConfig(): SchwabAuthConfig {
    return { ...this.config }
  }

  public get currentScope(): string[] {
    return [...this.authState.scope]
  }

  public get rateLimitStatus(): Record<string, SchwabRateLimitInfo> {
    const result: Record<string, SchwabRateLimitInfo> = {}
    for (const [category, info] of this.rateLimitInfo.entries()) {
      result[category] = { ...info }
    }
    return result
  }
}