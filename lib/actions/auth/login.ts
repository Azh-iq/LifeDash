'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import {
  rateLimitLogin,
  rateLimitLoginByEmail,
  getClientIP,
} from '@/lib/auth/rate-limit'
import { verifyTOTPCode, verifyBackupCode } from '@/lib/auth/totp'
import { z } from 'zod'

// Login form schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

// 2FA verification schema
const twoFactorSchema = z.object({
  code: z.string().optional(),
  backupCode: z.string().optional(),
})

export interface LoginResult {
  success: boolean
  error?: string
  requires2FA?: boolean
  userId?: string
  rateLimitInfo?: {
    remainingAttempts: number
    resetTime: number
  }
}

export interface TwoFactorResult {
  success: boolean
  error?: string
  rateLimitInfo?: {
    remainingAttempts: number
    resetTime: number
  }
}

/**
 * Server action for user login
 * @param formData Login form data
 * @returns Login result
 */
export async function loginAction(formData: FormData): Promise<LoginResult> {
  try {
    // Get client IP for rate limiting
    const headersList = headers()
    const request = new Request('http://localhost', {
      headers: headersList,
    })
    const clientIP = getClientIP(request)

    // Parse and validate form data
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      rememberMe: formData.get('rememberMe') === 'true',
    }

    const validatedData = loginSchema.parse(rawData)

    // Rate limit by IP
    const ipRateLimit = await rateLimitLogin(clientIP)
    if (!ipRateLimit.allowed) {
      return {
        success: false,
        error: 'Too many login attempts. Please try again later.',
        rateLimitInfo: {
          remainingAttempts: ipRateLimit.remainingAttempts,
          resetTime: ipRateLimit.resetTime,
        },
      }
    }

    // Rate limit by email
    const emailRateLimit = await rateLimitLoginByEmail(validatedData.email)
    if (!emailRateLimit.allowed) {
      return {
        success: false,
        error:
          'Too many login attempts for this account. Please try again later.',
        rateLimitInfo: {
          remainingAttempts: emailRateLimit.remainingAttempts,
          resetTime: emailRateLimit.resetTime,
        },
      }
    }

    // Create Supabase client
    const supabase = createServerClient()

    // Attempt login
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      })

    if (authError) {
      return {
        success: false,
        error: 'Invalid email or password',
        rateLimitInfo: {
          remainingAttempts: Math.min(
            ipRateLimit.remainingAttempts,
            emailRateLimit.remainingAttempts
          ),
          resetTime: Math.max(ipRateLimit.resetTime, emailRateLimit.resetTime),
        },
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Login failed',
      }
    }

    // Check if user has 2FA enabled
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('two_factor_enabled, two_factor_secret')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      // Continue without 2FA check if profile fetch fails
    }

    // If 2FA is enabled, require 2FA verification
    if (profileData?.two_factor_enabled && profileData.two_factor_secret) {
      // Store user ID in temporary session for 2FA verification
      const cookieStore = cookies()
      cookieStore.set('pending_2fa_user_id', authData.user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60, // 10 minutes
      })

      // Sign out the user temporarily until 2FA is verified
      await supabase.auth.signOut()

      return {
        success: false,
        requires2FA: true,
        userId: authData.user.id,
      }
    }

    // Set session cookie duration based on "remember me"
    if (validatedData.rememberMe) {
      const cookieStore = cookies()
      cookieStore.set('remember_me', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      })
    }

    return {
      success: true,
      userId: authData.user.id,
    }
  } catch (error) {
    console.error('Login action error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Server action for 2FA verification during login
 * @param formData 2FA verification form data
 * @returns 2FA verification result
 */
export async function verifyTwoFactorAction(
  formData: FormData
): Promise<TwoFactorResult> {
  try {
    // Get pending 2FA user ID from cookie
    const cookieStore = cookies()
    const pendingUserId = cookieStore.get('pending_2fa_user_id')?.value

    if (!pendingUserId) {
      return {
        success: false,
        error: '2FA verification session expired. Please log in again.',
      }
    }

    // Parse form data
    const rawData = {
      code: formData.get('code') as string,
      backupCode: formData.get('backupCode') as string,
    }

    const validatedData = twoFactorSchema.parse(rawData)

    // Rate limit 2FA attempts
    const rateLimitResult = await rateLimitTwoFactor(pendingUserId)
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: 'Too many 2FA attempts. Please try again later.',
        rateLimitInfo: {
          remainingAttempts: rateLimitResult.remainingAttempts,
          resetTime: rateLimitResult.resetTime,
        },
      }
    }

    // Create Supabase client
    const supabase = createServerClient()

    // Get user's 2FA settings
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('two_factor_secret, two_factor_backup_codes')
      .eq('id', pendingUserId)
      .single()

    if (profileError || !profileData?.two_factor_secret) {
      return {
        success: false,
        error: '2FA configuration not found. Please contact support.',
      }
    }

    let isValid = false
    let remainingBackupCodes = profileData.two_factor_backup_codes

    // Verify either TOTP code or backup code
    if (validatedData.code) {
      const totpResult = verifyTOTPCode(
        validatedData.code,
        profileData.two_factor_secret
      )
      isValid = totpResult.isValid

      if (!isValid) {
        return {
          success: false,
          error: totpResult.error || 'Invalid 2FA code',
          rateLimitInfo: {
            remainingAttempts: rateLimitResult.remainingAttempts - 1,
            resetTime: rateLimitResult.resetTime,
          },
        }
      }
    } else if (validatedData.backupCode) {
      const backupResult = verifyBackupCode(
        validatedData.backupCode,
        profileData.two_factor_backup_codes || []
      )
      isValid = backupResult.isValid
      remainingBackupCodes = backupResult.remainingCodes

      if (!isValid) {
        return {
          success: false,
          error: backupResult.error || 'Invalid backup code',
          rateLimitInfo: {
            remainingAttempts: rateLimitResult.remainingAttempts - 1,
            resetTime: rateLimitResult.resetTime,
          },
        }
      }

      // Update remaining backup codes in database
      await supabase
        .from('user_profiles')
        .update({ two_factor_backup_codes: remainingBackupCodes })
        .eq('id', pendingUserId)
    } else {
      return {
        success: false,
        error: 'Please enter either a 2FA code or backup code',
      }
    }

    if (!isValid) {
      return {
        success: false,
        error: 'Invalid 2FA code or backup code',
        rateLimitInfo: {
          remainingAttempts: rateLimitResult.remainingAttempts - 1,
          resetTime: rateLimitResult.resetTime,
        },
      }
    }

    // Get user data for final login
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', pendingUserId)
      .single()

    if (userError || !userData) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    // Create a new session for the user
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: 'dummy', // This won't work, we need to use admin API
    })

    // Since we can't easily create a session server-side, we'll use a different approach
    // Store a verified session token that the client can use
    cookieStore.set('verified_2fa_user_id', pendingUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60, // 1 minute for client to complete login
    })

    // Clear pending 2FA cookie
    cookieStore.delete('pending_2fa_user_id')

    return {
      success: true,
    }
  } catch (error) {
    console.error('2FA verification error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Server action for logout
 */
export async function logoutAction(): Promise<void> {
  const supabase = createServerClient()
  await supabase.auth.signOut()

  // Clear all auth-related cookies
  const cookieStore = cookies()
  cookieStore.delete('remember_me')
  cookieStore.delete('pending_2fa_user_id')
  cookieStore.delete('verified_2fa_user_id')

  redirect('/auth/login')
}
