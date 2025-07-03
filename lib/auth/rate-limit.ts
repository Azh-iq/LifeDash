import { Redis } from 'redis'

// Redis client instance
let redisClient: Redis | null = null

/**
 * Initialize Redis client
 * @returns Redis client instance
 */
async function getRedisClient(): Promise<Redis> {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      retry_delay_on_failover: 100,
      retry_delay_on_cluster_down: 300,
      max_attempts: 3,
    })

    redisClient.on('error', error => {
      console.error('Redis connection error:', error)
    })

    redisClient.on('connect', () => {
      console.log('Redis connected successfully')
    })
  }

  return redisClient
}

export interface RateLimitResult {
  allowed: boolean
  remainingAttempts: number
  resetTime: number
  totalAttempts: number
}

export interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxAttempts: number // Maximum attempts per window
  blockDurationMs?: number // How long to block after max attempts (optional)
}

/**
 * Rate limit authentication attempts
 * @param key Unique key for rate limiting (e.g., IP address, user ID)
 * @param options Rate limiting options
 * @returns Rate limit result
 */
export async function rateLimitAuth(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  try {
    const redis = await getRedisClient()
    const now = Date.now()
    const windowStart = now - options.windowMs

    // Create a sorted set key for this rate limit
    const rateLimitKey = `rate_limit:${key}`
    const blockKey = `rate_limit_block:${key}`

    // Check if currently blocked
    const blockExpiry = await redis.get(blockKey)
    if (blockExpiry && parseInt(blockExpiry) > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: parseInt(blockExpiry),
        totalAttempts: options.maxAttempts,
      }
    }

    // Remove old attempts outside the window
    await redis.zremrangebyscore(rateLimitKey, '-inf', windowStart)

    // Get current attempt count
    const currentAttempts = await redis.zcard(rateLimitKey)

    // Check if limit exceeded
    if (currentAttempts >= options.maxAttempts) {
      // Set block if blockDurationMs is specified
      if (options.blockDurationMs) {
        const blockUntil = now + options.blockDurationMs
        await redis.setex(
          blockKey,
          Math.ceil(options.blockDurationMs / 1000),
          blockUntil.toString()
        )

        return {
          allowed: false,
          remainingAttempts: 0,
          resetTime: blockUntil,
          totalAttempts: currentAttempts,
        }
      }

      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: windowStart + options.windowMs,
        totalAttempts: currentAttempts,
      }
    }

    // Add current attempt
    await redis.zadd(rateLimitKey, now, `${now}-${Math.random()}`)

    // Set expiry for the rate limit key
    await redis.expire(rateLimitKey, Math.ceil(options.windowMs / 1000))

    return {
      allowed: true,
      remainingAttempts: options.maxAttempts - currentAttempts - 1,
      resetTime: windowStart + options.windowMs,
      totalAttempts: currentAttempts + 1,
    }
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Fail open - allow request if Redis is unavailable
    return {
      allowed: true,
      remainingAttempts: options.maxAttempts - 1,
      resetTime: Date.now() + options.windowMs,
      totalAttempts: 1,
    }
  }
}

/**
 * Rate limit login attempts by IP address
 * @param ip IP address
 * @returns Rate limit result
 */
export async function rateLimitLogin(ip: string): Promise<RateLimitResult> {
  return rateLimitAuth(`login:${ip}`, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5, // 5 attempts per 15 minutes
    blockDurationMs: 30 * 60 * 1000, // Block for 30 minutes after max attempts
  })
}

/**
 * Rate limit login attempts by user email
 * @param email User email
 * @returns Rate limit result
 */
export async function rateLimitLoginByEmail(
  email: string
): Promise<RateLimitResult> {
  return rateLimitAuth(`login:email:${email.toLowerCase()}`, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 10, // 10 attempts per 15 minutes per email
    blockDurationMs: 60 * 60 * 1000, // Block for 1 hour after max attempts
  })
}

/**
 * Rate limit 2FA attempts
 * @param userId User ID
 * @returns Rate limit result
 */
export async function rateLimitTwoFactor(
  userId: string
): Promise<RateLimitResult> {
  return rateLimitAuth(`2fa:${userId}`, {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxAttempts: 5, // 5 attempts per 5 minutes
    blockDurationMs: 15 * 60 * 1000, // Block for 15 minutes after max attempts
  })
}

/**
 * Rate limit password reset requests
 * @param email User email
 * @returns Rate limit result
 */
export async function rateLimitPasswordReset(
  email: string
): Promise<RateLimitResult> {
  return rateLimitAuth(`password_reset:${email.toLowerCase()}`, {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3, // 3 attempts per hour
  })
}

/**
 * Rate limit registration attempts by IP
 * @param ip IP address
 * @returns Rate limit result
 */
export async function rateLimitRegistration(
  ip: string
): Promise<RateLimitResult> {
  return rateLimitAuth(`registration:${ip}`, {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3, // 3 registration attempts per hour
  })
}

/**
 * Clear rate limit for a specific key
 * @param key Rate limit key
 */
export async function clearRateLimit(key: string): Promise<void> {
  try {
    const redis = await getRedisClient()
    await redis.del(`rate_limit:${key}`)
    await redis.del(`rate_limit_block:${key}`)
  } catch (error) {
    console.error('Error clearing rate limit:', error)
  }
}

/**
 * Get rate limit status without incrementing
 * @param key Unique key for rate limiting
 * @param options Rate limiting options
 * @returns Current rate limit status
 */
export async function getRateLimitStatus(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  try {
    const redis = await getRedisClient()
    const now = Date.now()
    const windowStart = now - options.windowMs

    const rateLimitKey = `rate_limit:${key}`
    const blockKey = `rate_limit_block:${key}`

    // Check if currently blocked
    const blockExpiry = await redis.get(blockKey)
    if (blockExpiry && parseInt(blockExpiry) > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: parseInt(blockExpiry),
        totalAttempts: options.maxAttempts,
      }
    }

    // Remove old attempts outside the window
    await redis.zremrangebyscore(rateLimitKey, '-inf', windowStart)

    // Get current attempt count
    const currentAttempts = await redis.zcard(rateLimitKey)

    return {
      allowed: currentAttempts < options.maxAttempts,
      remainingAttempts: Math.max(0, options.maxAttempts - currentAttempts),
      resetTime: windowStart + options.windowMs,
      totalAttempts: currentAttempts,
    }
  } catch (error) {
    console.error('Error getting rate limit status:', error)
    return {
      allowed: true,
      remainingAttempts: options.maxAttempts,
      resetTime: Date.now() + options.windowMs,
      totalAttempts: 0,
    }
  }
}

/**
 * Close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
  }
}

/**
 * Get client IP address from request headers
 * @param request Request object
 * @returns Client IP address
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  // Fallback to a default IP if none found
  return '127.0.0.1'
}
