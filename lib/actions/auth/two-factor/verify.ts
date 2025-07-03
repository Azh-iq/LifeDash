'use server'

import { createServerClient } from '@/lib/supabase/server'
import { verifyTOTPCode, verifyBackupCode } from '@/lib/auth/totp'
import { rateLimitTwoFactor } from '@/lib/auth/rate-limit'
import { z } from 'zod'

// Schema for 2FA verification
const verify2FASchema = z
  .object({
    code: z.string().optional(),
    backupCode: z.string().optional(),
  })
  .refine(data => data.code || data.backupCode, {
    message: 'Either a 2FA code or backup code is required',
    path: ['code'],
  })

export interface Verify2FAResult {
  success: boolean
  error?: string
  rateLimitInfo?: {
    remainingAttempts: number
    resetTime: number
  }
  remainingBackupCodes?: number
}

/**
 * Verify 2FA code or backup code for an authenticated user
 * @param formData Form data with 2FA code or backup code
 * @returns Verification result
 */
export async function verify2FACodeAction(
  formData: FormData
): Promise<Verify2FAResult> {
  try {
    // Parse form data
    const rawData = {
      code: formData.get('code') as string,
      backupCode: formData.get('backupCode') as string,
    }

    const validatedData = verify2FASchema.parse(rawData)

    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Rate limit 2FA attempts
    const rateLimitResult = await rateLimitTwoFactor(user.id)
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

    // Get user's 2FA settings
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('two_factor_enabled, two_factor_secret, two_factor_backup_codes')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return {
        success: false,
        error: '2FA configuration not found',
      }
    }

    if (!profileData?.two_factor_enabled || !profileData.two_factor_secret) {
      return {
        success: false,
        error: '2FA is not enabled for this account',
      }
    }

    let isValid = false
    let remainingBackupCodes = profileData.two_factor_backup_codes || []

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
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ two_factor_backup_codes: remainingBackupCodes })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating backup codes:', updateError)
        // Don't fail the verification, just log the error
      }
    }

    return {
      success: true,
      remainingBackupCodes: remainingBackupCodes.length,
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
 * Check if user has 2FA enabled
 * @returns 2FA status
 */
export async function check2FAStatusAction(): Promise<{
  success: boolean
  enabled: boolean
  error?: string
  hasBackupCodes?: boolean
  backupCodesCount?: number
}> {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        enabled: false,
        error: 'Authentication required',
      }
    }

    // Get user's 2FA settings
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('two_factor_enabled, two_factor_backup_codes')
      .eq('id', user.id)
      .single()

    if (profileError) {
      // If profile doesn't exist, 2FA is not enabled
      if (profileError.code === 'PGRST116') {
        return {
          success: true,
          enabled: false,
          hasBackupCodes: false,
          backupCodesCount: 0,
        }
      }

      console.error('Error fetching user profile:', profileError)
      return {
        success: false,
        enabled: false,
        error: 'Failed to check 2FA status',
      }
    }

    const backupCodes = profileData?.two_factor_backup_codes || []

    return {
      success: true,
      enabled: profileData?.two_factor_enabled || false,
      hasBackupCodes: backupCodes.length > 0,
      backupCodesCount: backupCodes.length,
    }
  } catch (error) {
    console.error('Check 2FA status error:', error)
    return {
      success: false,
      enabled: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Validate a 2FA code without consuming it (for setup verification)
 * @param formData Form data with 2FA code
 * @returns Validation result
 */
export async function validate2FACodeAction(formData: FormData): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const code = formData.get('code') as string
    const secret = formData.get('secret') as string

    if (!code || !secret) {
      return {
        success: false,
        error: 'Code and secret are required',
      }
    }

    // Verify the TOTP code
    const verificationResult = verifyTOTPCode(code, secret)

    return {
      success: verificationResult.isValid,
      error: verificationResult.error,
    }
  } catch (error) {
    console.error('2FA code validation error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get 2FA recovery information
 * @returns Recovery information
 */
export async function get2FARecoveryInfoAction(): Promise<{
  success: boolean
  error?: string
  backupCodes?: string[]
  enabledAt?: string
}> {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Get user's 2FA settings
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select(
        'two_factor_enabled, two_factor_backup_codes, two_factor_enabled_at'
      )
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return {
        success: false,
        error: '2FA configuration not found',
      }
    }

    if (!profileData?.two_factor_enabled) {
      return {
        success: false,
        error: '2FA is not enabled for this account',
      }
    }

    return {
      success: true,
      backupCodes: profileData.two_factor_backup_codes || [],
      enabledAt: profileData.two_factor_enabled_at,
    }
  } catch (error) {
    console.error('Get 2FA recovery info error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
