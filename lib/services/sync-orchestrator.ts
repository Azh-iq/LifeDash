// Sync Orchestrator Service for Multi-Broker Portfolio Management
// Manages automated synchronization across all connected brokers

import { createClient } from '@/lib/supabase/client'
import { BrokerId } from '@/lib/integrations/brokers/types'
import { PortfolioAggregationService } from './portfolio-aggregation'

interface SyncJob {
  id: string
  userId: string
  brokerId: BrokerId
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt: string
  completedAt?: string
  error?: string
  retryCount: number
  nextRetryAt?: string
}

interface SyncSchedule {
  brokerId: BrokerId
  intervalMinutes: number
  priority: number
  maxRetries: number
  backoffMultiplier: number
}

interface SyncResult {
  success: boolean
  duration: number
  recordsSynced: number
  errors: string[]
  nextSyncAt: string
}

export class SyncOrchestrator {
  private supabase = createClient()
  private syncSchedules: Map<BrokerId, SyncSchedule> = new Map()
  private activeSyncJobs: Map<string, SyncJob> = new Map()
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map()

  // Default sync schedules (can be customized per user)
  private defaultSchedules: SyncSchedule[] = [
    {
      brokerId: BrokerId.INTERACTIVE_BROKERS,
      intervalMinutes: 15, // Real-time broker - sync every 15 minutes
      priority: 1,
      maxRetries: 3,
      backoffMultiplier: 2
    },
    {
      brokerId: BrokerId.SCHWAB,
      intervalMinutes: 30, // Near real-time - sync every 30 minutes
      priority: 2,
      maxRetries: 3,
      backoffMultiplier: 2
    },
    {
      brokerId: BrokerId.NORDNET,
      intervalMinutes: 60, // Regular updates - sync every hour
      priority: 3,
      maxRetries: 2,
      backoffMultiplier: 1.5
    },
    {
      brokerId: BrokerId.PLAID,
      intervalMinutes: 240, // Daily aggregation - sync every 4 hours
      priority: 4,
      maxRetries: 2,
      backoffMultiplier: 1.5
    }
  ]

  constructor() {
    this.initializeSchedules()
  }

  /**
   * Initialize sync schedules for all brokers
   */
  private initializeSchedules(): void {
    this.defaultSchedules.forEach(schedule => {
      this.syncSchedules.set(schedule.brokerId, schedule)
    })
  }

  /**
   * Start automated synchronization for a user
   */
  async startAutomatedSync(userId: string): Promise<void> {
    console.log(`[SyncOrchestrator] Starting automated sync for user ${userId}`)
    
    try {
      // Get user's active broker connections
      const { data: connections } = await this.supabase
        .from('brokerage_connections')
        .select('broker_id, status, last_synced_at')
        .eq('user_id', userId)
        .eq('status', 'connected')

      if (!connections || connections.length === 0) {
        console.log(`[SyncOrchestrator] No active connections for user ${userId}`)
        return
      }

      // Start sync intervals for each connected broker
      for (const connection of connections) {
        await this.scheduleBrokerSync(userId, connection.broker_id)
      }

      console.log(`[SyncOrchestrator] Automated sync started for ${connections.length} brokers`)
    } catch (error) {
      console.error('[SyncOrchestrator] Error starting automated sync:', error)
    }
  }

  /**
   * Schedule synchronization for a specific broker
   */
  private async scheduleBrokerSync(userId: string, brokerId: BrokerId): Promise<void> {
    const schedule = this.syncSchedules.get(brokerId)
    if (!schedule) {
      console.warn(`[SyncOrchestrator] No schedule found for broker ${brokerId}`)
      return
    }

    const intervalKey = `${userId}-${brokerId}`
    
    // Clear existing interval if any
    if (this.syncIntervals.has(intervalKey)) {
      clearInterval(this.syncIntervals.get(intervalKey)!)
    }

    // Create new sync interval
    const interval = setInterval(async () => {
      await this.executeBrokerSync(userId, brokerId)
    }, schedule.intervalMinutes * 60 * 1000)

    this.syncIntervals.set(intervalKey, interval)
    
    // Execute initial sync
    await this.executeBrokerSync(userId, brokerId)
  }

  /**
   * Execute synchronization for a specific broker
   */
  private async executeBrokerSync(userId: string, brokerId: BrokerId): Promise<SyncResult> {
    const jobId = `${userId}-${brokerId}-${Date.now()}`
    const schedule = this.syncSchedules.get(brokerId)!
    
    const syncJob: SyncJob = {
      id: jobId,
      userId,
      brokerId,
      status: 'pending',
      startedAt: new Date().toISOString(),
      retryCount: 0
    }

    this.activeSyncJobs.set(jobId, syncJob)
    
    try {
      console.log(`[SyncOrchestrator] Starting sync job ${jobId} for ${brokerId}`)
      
      // Update job status
      syncJob.status = 'running'
      await this.updateSyncJobStatus(syncJob)

      const startTime = Date.now()
      
      // Execute broker-specific sync
      const syncResult = await this.performBrokerSync(userId, brokerId)
      
      const duration = Date.now() - startTime
      
      // Update job as completed
      syncJob.status = 'completed'
      syncJob.completedAt = new Date().toISOString()
      await this.updateSyncJobStatus(syncJob)
      
      // Trigger portfolio aggregation if sync was successful
      if (syncResult.success) {
        await this.triggerPortfolioAggregation(userId)
      }
      
      console.log(`[SyncOrchestrator] Sync job ${jobId} completed in ${duration}ms`)
      
      return {
        success: true,
        duration,
        recordsSynced: syncResult.recordsSynced,
        errors: syncResult.errors,
        nextSyncAt: new Date(Date.now() + schedule.intervalMinutes * 60 * 1000).toISOString()
      }
      
    } catch (error) {
      console.error(`[SyncOrchestrator] Sync job ${jobId} failed:`, error)
      
      // Update job as failed
      syncJob.status = 'failed'
      syncJob.error = error instanceof Error ? error.message : 'Unknown error'
      await this.updateSyncJobStatus(syncJob)
      
      // Schedule retry if within retry limits
      if (syncJob.retryCount < schedule.maxRetries) {
        await this.scheduleRetry(syncJob, schedule)
      }
      
      return {
        success: false,
        duration: Date.now() - new Date(syncJob.startedAt).getTime(),
        recordsSynced: 0,
        errors: [syncJob.error],
        nextSyncAt: syncJob.nextRetryAt || new Date(Date.now() + schedule.intervalMinutes * 60 * 1000).toISOString()
      }
    } finally {
      this.activeSyncJobs.delete(jobId)
    }
  }

  /**
   * Perform actual broker synchronization
   */
  private async performBrokerSync(userId: string, brokerId: BrokerId): Promise<{ success: boolean; recordsSynced: number; errors: string[] }> {
    try {
      // Call broker-specific sync endpoint
      const response = await fetch('/api/brokers/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          brokerId,
          force: true
        })
      })

      if (!response.ok) {
        throw new Error(`Broker sync failed: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Broker sync failed')
      }

      return {
        success: true,
        recordsSynced: result.data?.recordsSynced || 0,
        errors: result.errors || []
      }
    } catch (error) {
      return {
        success: false,
        recordsSynced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Schedule retry for failed sync job
   */
  private async scheduleRetry(syncJob: SyncJob, schedule: SyncSchedule): Promise<void> {
    syncJob.retryCount += 1
    const retryDelay = schedule.intervalMinutes * schedule.backoffMultiplier * syncJob.retryCount
    syncJob.nextRetryAt = new Date(Date.now() + retryDelay * 60 * 1000).toISOString()
    
    console.log(`[SyncOrchestrator] Scheduling retry ${syncJob.retryCount} for job ${syncJob.id} in ${retryDelay} minutes`)
    
    setTimeout(async () => {
      await this.executeBrokerSync(syncJob.userId, syncJob.brokerId)
    }, retryDelay * 60 * 1000)
  }

  /**
   * Update sync job status in database
   */
  private async updateSyncJobStatus(syncJob: SyncJob): Promise<void> {
    try {
      await this.supabase
        .from('sync_jobs')
        .upsert({
          id: syncJob.id,
          user_id: syncJob.userId,
          broker_id: syncJob.brokerId,
          status: syncJob.status,
          started_at: syncJob.startedAt,
          completed_at: syncJob.completedAt,
          error: syncJob.error,
          retry_count: syncJob.retryCount,
          next_retry_at: syncJob.nextRetryAt
        })
    } catch (error) {
      console.error('[SyncOrchestrator] Error updating sync job status:', error)
    }
  }

  /**
   * Trigger portfolio aggregation after successful sync
   */
  private async triggerPortfolioAggregation(userId: string): Promise<void> {
    try {
      await PortfolioAggregationService.triggerAggregation(userId, 'NOK')
    } catch (error) {
      console.error('[SyncOrchestrator] Error triggering portfolio aggregation:', error)
    }
  }

  /**
   * Stop automated synchronization for a user
   */
  async stopAutomatedSync(userId: string): Promise<void> {
    console.log(`[SyncOrchestrator] Stopping automated sync for user ${userId}`)
    
    // Clear all intervals for this user
    for (const [key, interval] of this.syncIntervals.entries()) {
      if (key.startsWith(userId)) {
        clearInterval(interval)
        this.syncIntervals.delete(key)
      }
    }
    
    // Cancel active sync jobs
    for (const [jobId, job] of this.activeSyncJobs.entries()) {
      if (job.userId === userId) {
        job.status = 'failed'
        job.error = 'Sync cancelled by user'
        await this.updateSyncJobStatus(job)
        this.activeSyncJobs.delete(jobId)
      }
    }
  }

  /**
   * Get sync status for a user
   */
  async getSyncStatus(userId: string): Promise<{
    activeSyncs: number
    lastSuccessfulSync: string | null
    nextScheduledSync: string | null
    errors: string[]
  }> {
    const activeSyncs = Array.from(this.activeSyncJobs.values())
      .filter(job => job.userId === userId && job.status === 'running').length

    try {
      const { data: lastSync } = await this.supabase
        .from('sync_jobs')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      const { data: nextSync } = await this.supabase
        .from('sync_jobs')
        .select('next_retry_at')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('next_retry_at', { ascending: true })
        .limit(1)
        .single()

      const { data: errors } = await this.supabase
        .from('sync_jobs')
        .select('error')
        .eq('user_id', userId)
        .eq('status', 'failed')
        .order('started_at', { ascending: false })
        .limit(5)

      return {
        activeSyncs,
        lastSuccessfulSync: lastSync?.completed_at || null,
        nextScheduledSync: nextSync?.next_retry_at || null,
        errors: errors?.map(e => e.error).filter(Boolean) || []
      }
    } catch (error) {
      console.error('[SyncOrchestrator] Error getting sync status:', error)
      return {
        activeSyncs,
        lastSuccessfulSync: null,
        nextScheduledSync: null,
        errors: ['Error retrieving sync status']
      }
    }
  }

  /**
   * Update sync schedule for a broker
   */
  async updateSyncSchedule(brokerId: BrokerId, intervalMinutes: number, priority?: number): Promise<void> {
    const currentSchedule = this.syncSchedules.get(brokerId)
    if (!currentSchedule) {
      throw new Error(`No schedule found for broker ${brokerId}`)
    }

    const updatedSchedule: SyncSchedule = {
      ...currentSchedule,
      intervalMinutes,
      priority: priority || currentSchedule.priority
    }

    this.syncSchedules.set(brokerId, updatedSchedule)
    console.log(`[SyncOrchestrator] Updated sync schedule for ${brokerId}: ${intervalMinutes} minutes`)
  }

  /**
   * Force immediate sync for all brokers
   */
  async forceImmediateSync(userId: string): Promise<SyncResult[]> {
    console.log(`[SyncOrchestrator] Force immediate sync for user ${userId}`)
    
    const { data: connections } = await this.supabase
      .from('brokerage_connections')
      .select('broker_id')
      .eq('user_id', userId)
      .eq('status', 'connected')

    if (!connections || connections.length === 0) {
      return []
    }

    const syncPromises = connections.map(connection =>
      this.executeBrokerSync(userId, connection.broker_id)
    )

    return Promise.all(syncPromises)
  }
}