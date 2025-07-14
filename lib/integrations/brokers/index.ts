// Broker integration exports and factory registration
// Centralized exports for all broker API clients

export * from './types'
export * from './base-client'
export * from './plaid-client'
export * from './schwab-client'
export * from './interactive-brokers-client'
export * from './nordnet-client'

// Re-export the factory and register all clients
import { BrokerageClientFactory } from './base-client'
import { PlaidClient } from './plaid-client'
import { SchwabClient } from './schwab-client'
import { InteractiveBrokersClient } from './interactive-brokers-client'
import { NordnetClient } from './nordnet-client'
import { BrokerId } from './types'

// Register all broker clients with the factory
BrokerageClientFactory.register(BrokerId.PLAID, PlaidClient as any)
BrokerageClientFactory.register(BrokerId.SCHWAB, SchwabClient as any)
BrokerageClientFactory.register(BrokerId.INTERACTIVE_BROKERS, InteractiveBrokersClient as any)
BrokerageClientFactory.register(BrokerId.NORDNET, NordnetClient as any)

// Broker configuration templates
export const BROKER_CONFIGS = {
  [BrokerId.PLAID]: {
    brokerId: BrokerId.PLAID,
    displayName: 'Plaid (USA Brokers)',
    description: 'Connect to 1000+ USA financial institutions including Fidelity, Robinhood, E*TRADE',
    authType: 'API_KEY' as const,
    requiredCredentials: ['client_id', 'secret'],
    supportedCountries: ['US', 'CA'],
    supportedAssetClasses: ['EQUITY', 'ETF', 'FUND', 'FIXED_INCOME', 'CRYPTOCURRENCY', 'CASH'],
    rateLimits: {
      requestsPerDay: 200 // Free tier limit
    },
    features: {
      realTimeData: false, // Daily updates only
      historicalData: true,
      tradingSupport: false,
      multiCurrency: true
    }
  },
  [BrokerId.SCHWAB]: {
    brokerId: BrokerId.SCHWAB,
    displayName: 'Charles Schwab',
    description: 'Connect to your Charles Schwab brokerage account',
    authType: 'OAUTH' as const,
    requiredCredentials: ['client_id', 'client_secret', 'redirect_uri'],
    supportedCountries: ['US'],
    supportedAssetClasses: ['EQUITY', 'ETF', 'FUND', 'FIXED_INCOME', 'OPTION', 'CASH'],
    rateLimits: {
      requestsPerSecond: 20
    },
    features: {
      realTimeData: true,
      historicalData: true,
      tradingSupport: true,
      multiCurrency: false
    }
  },
  [BrokerId.INTERACTIVE_BROKERS]: {
    brokerId: BrokerId.INTERACTIVE_BROKERS,
    displayName: 'Interactive Brokers',
    description: 'Connect to your IBKR account (requires TWS/Gateway)',
    authType: 'OAUTH' as const,
    requiredCredentials: ['gateway_url'],
    supportedCountries: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'CH', 'AT', 'BE', 'DK', 'FI', 'NO', 'SE'],
    supportedAssetClasses: ['EQUITY', 'ETF', 'FUND', 'FIXED_INCOME', 'OPTION', 'COMMODITY', 'CASH', 'CRYPTOCURRENCY'],
    rateLimits: {
      requestsPerSecond: 10
    },
    features: {
      realTimeData: true,
      historicalData: true,
      tradingSupport: true,
      multiCurrency: true
    }
  },
  [BrokerId.NORDNET]: {
    brokerId: BrokerId.NORDNET,
    displayName: 'Nordnet',
    description: 'Connect to your Nordnet account (Nordic countries)',
    authType: 'SSH_KEY' as const,
    requiredCredentials: ['api_key', 'private_key', 'country'],
    supportedCountries: ['SE', 'NO', 'DK', 'FI'],
    supportedAssetClasses: ['EQUITY', 'ETF', 'FUND', 'FIXED_INCOME', 'OPTION', 'CASH', 'COMMODITY'],
    rateLimits: {
      requestsPerSecond: 10
    },
    features: {
      realTimeData: true,
      historicalData: true,
      tradingSupport: false, // Read-only access in this implementation
      multiCurrency: true
    }
  }
} as const

// Helper functions
export function getSupportedBrokers(): BrokerId[] {
  return BrokerageClientFactory.getSupportedBrokers()
}

export function getBrokerConfig(brokerId: BrokerId) {
  return BROKER_CONFIGS[brokerId]
}

export function isBrokerSupported(brokerId: string): brokerId is BrokerId {
  return Object.values(BrokerId).includes(brokerId as BrokerId)
}

export function getBrokersByCountry(countryCode: string): BrokerId[] {
  return Object.entries(BROKER_CONFIGS)
    .filter(([_, config]) => config.supportedCountries.includes(countryCode.toUpperCase()))
    .map(([brokerId]) => brokerId as BrokerId)
}

export function getBrokersByAssetClass(assetClass: string): BrokerId[] {
  return Object.entries(BROKER_CONFIGS)
    .filter(([_, config]) => config.supportedAssetClasses.includes(assetClass))
    .map(([brokerId]) => brokerId as BrokerId)
}

// Error handling utilities
export class BrokerIntegrationError extends Error {
  constructor(
    public brokerId: BrokerId,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(`[${brokerId}] ${message}`)
    this.name = 'BrokerIntegrationError'
  }
}

export function isBrokerError(error: any): error is BrokerIntegrationError {
  return error instanceof BrokerIntegrationError
}

// Validation utilities
export function validateBrokerCredentials(brokerId: BrokerId, credentials: Record<string, any>): string[] {
  const config = BROKER_CONFIGS[brokerId]
  const errors: string[] = []
  
  for (const required of config.requiredCredentials) {
    if (!credentials[required]) {
      errors.push(`Missing required credential: ${required}`)
    }
  }
  
  return errors
}

// Rate limiting utilities
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  canMakeRequest(brokerId: BrokerId): boolean {
    const config = BROKER_CONFIGS[brokerId]
    const now = Date.now()
    const key = brokerId
    
    if (!this.requests.has(key)) {
      this.requests.set(key, [])
    }
    
    const requests = this.requests.get(key)!
    
    // Clean old requests
    const cutoff = now - 1000 // 1 second window
    const recentRequests = requests.filter(time => time > cutoff)
    
    this.requests.set(key, recentRequests)
    
    // Check limits
    if (config.rateLimits.requestsPerSecond && recentRequests.length >= config.rateLimits.requestsPerSecond) {
      return false
    }
    
    return true
  }
  
  recordRequest(brokerId: BrokerId): void {
    const now = Date.now()
    const key = brokerId
    
    if (!this.requests.has(key)) {
      this.requests.set(key, [])
    }
    
    this.requests.get(key)!.push(now)
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter()

// Connection status utilities
export function getConnectionStatusColor(status: string): string {
  switch (status) {
    case 'connected':
      return 'green'
    case 'disconnected':
      return 'gray'
    case 'error':
      return 'red'
    case 'expired':
      return 'orange'
    case 'pending':
      return 'blue'
    default:
      return 'gray'
  }
}

export function getConnectionStatusText(status: string): string {
  switch (status) {
    case 'connected':
      return 'Connected'
    case 'disconnected':
      return 'Disconnected'
    case 'error':
      return 'Error'
    case 'expired':
      return 'Expired'
    case 'pending':
      return 'Connecting...'
    default:
      return 'Unknown'
  }
}