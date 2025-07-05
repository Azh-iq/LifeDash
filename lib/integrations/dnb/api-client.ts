// DNB API Client
// Handles DNB Bank API OAuth2 authentication and data fetching

import {
  DNBAuthConfig,
  DNBTokenResponse,
  DNBAccount,
  DNBTransaction,
  DNBTransactionResponse,
  DNBAccountResponse,
  DNBApiError,
  DNBAuthState,
  DNBSyncConfig,
  DNBSyncResult,
  DNBConnectionStatus,
  DNB_API_ENDPOINTS,
  DNB_OAUTH_SCOPES,
  DNB_RATE_LIMITS
} from './types'

export class DNBApiClient {
  private config: DNBAuthConfig
  private authState: DNBAuthState
  private requestCount: Map<string, number> = new Map()
  private rateLimitReset: Map<string, number> = new Map()

  constructor(config: DNBAuthConfig) {
    this.config = config
    this.authState = {
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      userId: null,
      lastRefresh: null
    }
  }

  /**
   * Initialize OAuth2 authentication flow
   */
  public initializeAuth(): string {
    const state = this.generateRandomString(32)
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope.join(' '),
      state: state
    })

    const authUrl = `${this.config.baseUrl}/auth/oauth/authorize?${params.toString()}`
    
    // Store state for validation
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dnb_oauth_state', state)
    }
    
    return authUrl
  }

  /**
   * Complete OAuth2 authentication with authorization code
   */
  public async completeAuth(code: string, state: string): Promise<DNBTokenResponse> {
    // Validate state parameter
    if (typeof window !== 'undefined') {
      const storedState = sessionStorage.getItem('dnb_oauth_state')
      if (storedState !== state) {
        throw new Error('Invalid OAuth state parameter')
      }
      sessionStorage.removeItem('dnb_oauth_state')
    }

    const tokenData = {
      grant_type: 'authorization_code',
      code: code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri
    }

    const response = await this.makeRequest<DNBTokenResponse>(
      'POST',
      DNB_API_ENDPOINTS.AUTH,
      tokenData,
      false
    )

    // Store authentication state
    this.authState = {
      isAuthenticated: true,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: Date.now() + (response.expires_in * 1000),
      userId: null, // Will be set after fetching customer info
      lastRefresh: Date.now()
    }

    return response
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshToken(): Promise<DNBTokenResponse> {
    if (!this.authState.refreshToken) {
      throw new Error('No refresh token available')
    }

    const tokenData = {
      grant_type: 'refresh_token',
      refresh_token: this.authState.refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    }

    const response = await this.makeRequest<DNBTokenResponse>(
      'POST',
      DNB_API_ENDPOINTS.REFRESH,
      tokenData,
      false
    )

    // Update authentication state
    this.authState = {
      ...this.authState,
      accessToken: response.access_token,
      refreshToken: response.refresh_token || this.authState.refreshToken,
      expiresAt: Date.now() + (response.expires_in * 1000),
      lastRefresh: Date.now()
    }

    return response
  }

  /**
   * Get all accounts for authenticated user
   */
  public async getAccounts(): Promise<DNBAccount[]> {
    await this.ensureValidToken()
    
    const response = await this.makeRequest<DNBAccountResponse>(
      'GET',
      DNB_API_ENDPOINTS.ACCOUNTS,
      null,
      true
    )

    return response.accounts
  }

  /**
   * Get transactions for a specific account
   */
  public async getTransactions(
    accountId: string,
    options: {
      fromDate?: string
      toDate?: string
      pageSize?: number
      pageNumber?: number
    } = {}
  ): Promise<DNBTransactionResponse> {
    await this.ensureValidToken()
    
    const params = new URLSearchParams()
    if (options.fromDate) params.append('fromDate', options.fromDate)
    if (options.toDate) params.append('toDate', options.toDate)
    if (options.pageSize) params.append('pageSize', options.pageSize.toString())
    if (options.pageNumber) params.append('pageNumber', options.pageNumber.toString())

    const endpoint = DNB_API_ENDPOINTS.TRANSACTIONS.replace('{accountId}', accountId)
    const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint

    return await this.makeRequest<DNBTransactionResponse>(
      'GET',
      url,
      null,
      true
    )
  }

  /**
   * Get all transactions for all accounts with pagination
   */
  public async getAllTransactions(
    options: {
      fromDate?: string
      toDate?: string
      pageSize?: number
    } = {}
  ): Promise<DNBTransaction[]> {
    const accounts = await this.getAccounts()
    const allTransactions: DNBTransaction[] = []

    for (const account of accounts) {
      let pageNumber = 1
      let hasMore = true

      while (hasMore) {
        const response = await this.getTransactions(account.accountId, {
          ...options,
          pageNumber,
          pageSize: options.pageSize || 100
        })

        allTransactions.push(...response.transactions)
        hasMore = response.hasMore
        pageNumber++

        // Add delay to respect rate limits
        await this.rateLimitDelay()
      }
    }

    return allTransactions
  }

  /**
   * Synchronize all account data
   */
  public async syncAllData(config: DNBSyncConfig): Promise<DNBSyncResult> {
    const startTime = Date.now()
    const result: DNBSyncResult = {
      success: false,
      accountsSynced: 0,
      transactionsSynced: 0,
      newTransactions: 0,
      updatedTransactions: 0,
      errors: [],
      warnings: [],
      lastSyncTime: new Date().toISOString(),
      nextSyncTime: new Date(Date.now() + config.syncInterval * 60000).toISOString()
    }

    try {
      // Get accounts
      const accounts = await this.getAccounts()
      const targetAccounts = config.accountIds.length > 0 
        ? accounts.filter(acc => config.accountIds.includes(acc.accountId))
        : accounts

      result.accountsSynced = targetAccounts.length

      // Sync transactions for each account
      for (const account of targetAccounts) {
        try {
          const transactions = await this.getAllTransactions({
            fromDate: config.fromDate,
            toDate: config.toDate,
            pageSize: config.pageSize
          })

          result.transactionsSynced += transactions.length
          // Here you would typically save to database
          // This is a simplified example
          
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
  public getConnectionStatus(): DNBConnectionStatus {
    return {
      connected: this.authState.isAuthenticated && this.isTokenValid(),
      lastSync: this.authState.lastRefresh ? new Date(this.authState.lastRefresh).toISOString() : null,
      nextSync: null, // Would be calculated based on sync schedule
      status: this.getConnectionStatusString(),
      accountCount: 0, // Would be stored/cached
      transactionCount: 0 // Would be stored/cached
    }
  }

  /**
   * Disconnect and revoke tokens
   */
  public async disconnect(): Promise<void> {
    // Clear auth state
    this.authState = {
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      userId: null,
      lastRefresh: null
    }

    // Clear any stored tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dnb_access_token')
      localStorage.removeItem('dnb_refresh_token')
    }
  }

  // Private helper methods

  private async ensureValidToken(): Promise<void> {
    if (!this.authState.isAuthenticated) {
      throw new Error('Not authenticated with DNB API')
    }

    if (!this.isTokenValid()) {
      await this.refreshToken()
    }
  }

  private isTokenValid(): boolean {
    if (!this.authState.expiresAt) return false
    return Date.now() < this.authState.expiresAt - 60000 // 1 minute buffer
  }

  private getConnectionStatusString(): DNBConnectionStatus['status'] {
    if (!this.authState.isAuthenticated) return 'disconnected'
    if (!this.isTokenValid()) return 'expired'
    return 'connected'
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    requiresAuth: boolean = false
  ): Promise<T> {
    // Check rate limits
    await this.checkRateLimit()

    const url = `${this.config.baseUrl}${endpoint}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    if (requiresAuth && this.authState.accessToken) {
      headers.Authorization = `Bearer ${this.authState.accessToken}`
    }

    const options: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    }

    const response = await fetch(url, options)
    
    // Update rate limit tracking
    this.updateRateLimit()

    if (!response.ok) {
      const error: DNBApiError = await response.json()
      throw new Error(`DNB API Error: ${error.error_description || error.error}`)
    }

    return await response.json()
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now()
    const minute = Math.floor(now / 60000)
    
    const requestsThisMinute = this.requestCount.get(minute.toString()) || 0
    
    if (requestsThisMinute >= DNB_RATE_LIMITS.REQUESTS_PER_MINUTE) {
      const waitTime = 60000 - (now % 60000)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  private updateRateLimit(): void {
    const now = Date.now()
    const minute = Math.floor(now / 60000)
    const key = minute.toString()
    
    this.requestCount.set(key, (this.requestCount.get(key) || 0) + 1)
    
    // Clean up old entries
    for (const [k, _] of this.requestCount.entries()) {
      if (parseInt(k) < minute - 5) {
        this.requestCount.delete(k)
      }
    }
  }

  private async rateLimitDelay(): Promise<void> {
    // Add small delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Public getters for external access
  public get isAuthenticated(): boolean {
    return this.authState.isAuthenticated && this.isTokenValid()
  }

  public get accessToken(): string | null {
    return this.authState.accessToken
  }

  public get authConfig(): DNBAuthConfig {
    return { ...this.config }
  }
}