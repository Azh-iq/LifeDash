// Base abstract class for all brokerage clients
// Provides common functionality and error handling patterns

import { 
  IBrokerageClient, 
  BrokerId, 
  BrokerageConnection, 
  AuthResult, 
  BrokerageAccount, 
  BrokerageHolding, 
  BrokerageTransaction, 
  BrokerageSecurity,
  BrokerageError
} from './types'

export abstract class BaseBrokerageClient implements IBrokerageClient {
  abstract readonly brokerId: BrokerId
  
  protected apiKey?: string
  protected secret?: string
  protected baseUrl: string
  protected timeout: number = 30000 // 30 seconds default
  
  constructor(config: BrokerageClientConfig) {
    this.apiKey = config.apiKey
    this.secret = config.secret
    this.baseUrl = config.baseUrl || ''
    this.timeout = config.timeout || 30000
  }

  // Abstract methods that must be implemented by each broker client
  abstract authenticate(credentials: any): Promise<AuthResult>
  abstract refreshAuth(connection: BrokerageConnection): Promise<AuthResult>
  abstract getAccounts(connectionId: string): Promise<BrokerageAccount[]>
  abstract getHoldings(connectionId: string, accountId?: string): Promise<BrokerageHolding[]>
  abstract getTransactions(
    connectionId: string, 
    accountId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<BrokerageTransaction[]>
  abstract searchSecurities(query: string): Promise<BrokerageSecurity[]>
  abstract getSecurityDetails(symbol: string): Promise<BrokerageSecurity | null>
  abstract testConnection(connectionId: string): Promise<boolean>
  abstract disconnect(connectionId: string): Promise<void>

  // Common HTTP utility methods
  protected async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorBody = await response.text()
        throw this.createBrokerageError(response.status, errorBody)
      }

      const result = await response.json()
      return result as T
    } catch (error) {
      if (error instanceof BrokerageError) {
        throw error
      }
      
      if (error.name === 'AbortError') {
        throw this.createBrokerageError(408, 'Request timeout')
      }
      
      throw this.createBrokerageError(500, `Network error: ${error.message}`)
    }
  }

  // Common error handling
  protected createBrokerageError(
    statusCode: number, 
    message: string, 
    details?: any
  ): BrokerageError {
    const retryable = this.isRetryableError(statusCode)
    
    return {
      code: this.getErrorCode(statusCode),
      message,
      details,
      retryable
    }
  }

  private getErrorCode(statusCode: number): string {
    switch (statusCode) {
      case 400: return 'BAD_REQUEST'
      case 401: return 'UNAUTHORIZED'
      case 403: return 'FORBIDDEN'
      case 404: return 'NOT_FOUND'
      case 408: return 'TIMEOUT'
      case 429: return 'RATE_LIMITED'
      case 500: return 'INTERNAL_ERROR'
      case 502: return 'BAD_GATEWAY'
      case 503: return 'SERVICE_UNAVAILABLE'
      default: return 'UNKNOWN_ERROR'
    }
  }

  private isRetryableError(statusCode: number): boolean {
    return [408, 429, 500, 502, 503].includes(statusCode)
  }

  // Rate limiting helper
  protected async handleRateLimit(retryAfter?: number): Promise<void> {
    const delay = retryAfter ? retryAfter * 1000 : 10000 // Default 10 seconds
    console.warn(`Rate limited. Waiting ${delay}ms before retry...`)
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  // Data validation helpers
  protected validateDate(dateString: string): boolean {
    const date = new Date(dateString)
    return !isNaN(date.getTime())
  }

  protected validateCurrency(currency: string): boolean {
    return /^[A-Z]{3}$/.test(currency)
  }

  protected validateSymbol(symbol: string): boolean {
    return symbol && symbol.length > 0 && symbol.length <= 20
  }

  // Data normalization helpers
  protected normalizeSymbol(symbol: string): string {
    return symbol.toUpperCase().trim()
  }

  protected normalizeCurrency(currency: string): string {
    return currency.toUpperCase().trim()
  }

  protected normalizeAmount(amount: number | string): number {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return Math.round(num * 100) / 100 // Round to 2 decimal places
  }

  // Connection health check
  protected async performHealthCheck(connectionId: string): Promise<boolean> {
    try {
      const accounts = await this.getAccounts(connectionId)
      return Array.isArray(accounts)
    } catch (error) {
      console.error(`Health check failed for ${this.brokerId}:`, error)
      return false
    }
  }

  // Logging helper
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logMessage = `[${this.brokerId.toUpperCase()}] ${message}`
    
    switch (level) {
      case 'info':
        console.log(logMessage, data)
        break
      case 'warn':
        console.warn(logMessage, data)
        break
      case 'error':
        console.error(logMessage, data)
        break
    }
  }
}

export interface BrokerageClientConfig {
  apiKey?: string
  secret?: string
  baseUrl?: string
  timeout?: number
  environment?: 'sandbox' | 'production'
}

// Factory for creating broker clients
export class BrokerageClientFactory {
  private static clients: Map<BrokerId, typeof BaseBrokerageClient> = new Map()

  static register(brokerId: BrokerId, clientClass: typeof BaseBrokerageClient): void {
    this.clients.set(brokerId, clientClass)
  }

  static create(brokerId: BrokerId, config: BrokerageClientConfig): IBrokerageClient {
    const ClientClass = this.clients.get(brokerId)
    if (!ClientClass) {
      throw new Error(`No client registered for broker: ${brokerId}`)
    }
    
    return new ClientClass(config) as IBrokerageClient
  }

  static getSupportedBrokers(): BrokerId[] {
    return Array.from(this.clients.keys())
  }
}