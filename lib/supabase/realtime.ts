import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js'
import { supabase } from './client'

export interface PriceUpdate {
  symbol: string
  price: number
  timestamp: string
  change: number
  changePercent: number
  volume?: number
}

export interface PortfolioUpdate {
  portfolioId: string
  totalValue: number
  totalPnl: number
  totalPnlPercent: number
  lastUpdated: string
}

export interface RealtimeConnectionStatus {
  connected: boolean
  lastUpdate: Date | null
  errorMessage?: string
}

export class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map()
  private connectionStatus: RealtimeConnectionStatus = {
    connected: false,
    lastUpdate: null,
  }
  private statusCallbacks: ((status: RealtimeConnectionStatus) => void)[] = []

  constructor() {
    this.initializeConnection()
  }

  private initializeConnection() {
    // Note: Supabase realtime connection status will be handled via channel events
    // For now, we'll assume connected state
    this.connectionStatus = {
      connected: true,
      lastUpdate: new Date(),
    }
    this.notifyStatusCallbacks()
  }

  private notifyStatusCallbacks() {
    this.statusCallbacks.forEach(callback => callback(this.connectionStatus))
  }

  public onConnectionStatusChange(
    callback: (status: RealtimeConnectionStatus) => void
  ) {
    this.statusCallbacks.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback)
      if (index > -1) {
        this.statusCallbacks.splice(index, 1)
      }
    }
  }

  public subscribeToStockPrices(
    symbols: string[],
    callback: (update: PriceUpdate) => void
  ): () => void {
    const channelName = `stock-prices-${symbols.join('-')}`

    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe()
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stocks',
          filter: `symbol=in.(${symbols.join(',')})`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const updatedStock = payload.new

          // Calculate change from previous price
          this.calculatePriceChange(
            updatedStock.symbol,
            updatedStock.current_price
          ).then(change => {
            const update: PriceUpdate = {
              symbol: updatedStock.symbol,
              price: updatedStock.current_price,
              timestamp: updatedStock.last_updated || new Date().toISOString(),
              change: change.change,
              changePercent: change.changePercent,
              volume: 0, // Volume not stored in stocks table
            }
            callback(update)
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_prices',
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          const newPrice = payload.new

          // Get the stock symbol from the stock_id
          const { data: stock } = await supabase
            .from('stocks')
            .select('symbol')
            .eq('id', newPrice.stock_id)
            .single()

          if (stock && symbols.includes(stock.symbol)) {
            // This will trigger the stocks table update via the trigger
            // But we can also handle it directly for immediate updates
            this.calculatePriceChange(stock.symbol, newPrice.close_price).then(
              change => {
                const update: PriceUpdate = {
                  symbol: stock.symbol,
                  price: newPrice.close_price,
                  timestamp: newPrice.created_at,
                  change: change.change,
                  changePercent: change.changePercent,
                  volume: newPrice.volume,
                }
                callback(update)
              }
            )
          }
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)

    // Return unsubscribe function
    return () => {
      channel.unsubscribe()
      this.channels.delete(channelName)
    }
  }

  public subscribeToPortfolio(
    portfolioId: string,
    callback: (update: PortfolioUpdate) => void
  ): () => void {
    const channelName = `portfolio-${portfolioId}`

    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe()
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'portfolios',
          filter: `id=eq.${portfolioId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const portfolio = payload.new

          const update: PortfolioUpdate = {
            portfolioId: portfolio.id,
            totalValue: portfolio.total_value,
            totalPnl: portfolio.unrealized_pnl,
            totalPnlPercent:
              (portfolio.unrealized_pnl / portfolio.total_cost_basis) * 100,
            lastUpdated: portfolio.last_calculated,
          }
          callback(update)
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)

    // Return unsubscribe function
    return () => {
      channel.unsubscribe()
      this.channels.delete(channelName)
    }
  }

  public subscribeToHoldings(
    portfolioId: string,
    callback: (holdings: any[]) => void
  ): () => void {
    const channelName = `holdings-${portfolioId}`

    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe()
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'holdings',
          filter: `portfolio_id=eq.${portfolioId}`,
        },
        async () => {
          // Fetch updated holdings
          const { data: holdings } = await supabase
            .from('holdings')
            .select(
              `
              *,
              stocks (
                symbol,
                name,
                currency,
                asset_class
              )
            `
            )
            .eq('portfolio_id', portfolioId)

          if (holdings) {
            callback(holdings)
          }
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)

    // Return unsubscribe function
    return () => {
      channel.unsubscribe()
      this.channels.delete(channelName)
    }
  }

  private async calculatePriceChange(symbol: string, currentPrice: number) {
    // Get previous prices for comparison from stock_prices table
    const { data: stock } = await supabase
      .from('stocks')
      .select('id')
      .eq('symbol', symbol)
      .single()

    if (!stock) {
      return { change: 0, changePercent: 0 }
    }

    const { data: previousPrices } = await supabase
      .from('stock_prices')
      .select('close_price')
      .eq('stock_id', stock.id)
      .order('date', { ascending: false })
      .limit(2)

    if (previousPrices && previousPrices.length >= 2) {
      const prevPrice = previousPrices[1].close_price
      const change = currentPrice - prevPrice
      const changePercent = (change / prevPrice) * 100

      return { change, changePercent }
    }

    // If no previous prices, simulate a small change for demo
    const change = (Math.random() - 0.5) * currentPrice * 0.05 // ±2.5% random change
    const changePercent = (change / currentPrice) * 100

    return { change, changePercent }
  }

  public getConnectionStatus(): RealtimeConnectionStatus {
    return this.connectionStatus
  }

  public cleanup() {
    this.channels.forEach(channel => channel.unsubscribe())
    this.channels.clear()
    this.statusCallbacks.length = 0
  }
}

// Singleton instance
export const realtimeService = new RealtimeService()
