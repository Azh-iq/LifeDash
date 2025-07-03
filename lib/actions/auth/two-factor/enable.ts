'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'
import { generateTOTPSecret, verifyTOTPCode } from '@/lib/auth/totp'
import { z } from 'zod'

// Schema for enabling 2FA
const enable2FASchema = z.object({
  code: z.string().length(6, '2FA code must be 6 digits'),
})

export interface Enable2FAResult {
  success: boolean
  error?: string
  secret?: string
  qrCodeUrl?: string
  backupCodes?: string[]
  manualEntryKey?: string
}

export interface Verify2FASetupResult {
  success: boolean
  error?: string
  backupCodes?: string[]
}

/**
 * Generate 2FA secret and QR code for setup
 * @returns 2FA setup data
 */
export async function generate2FASecretAction(): Promise<Enable2FAResult> {
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

    // Check if user already has 2FA enabled
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('two_factor_enabled')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return {
        success: false,
        error: 'Failed to check 2FA status',
      }
    }

    if (profileData?.two_factor_enabled) {
      return {
        success: false,
        error: '2FA is already enabled for this account',
      }
    }

    // Generate TOTP secret
    const totpData = await generateTOTPSecret(user.email || '', 'LifeDash')

    // Store temporary secret in cookies for verification
    const cookieStore = cookies()
    cookieStore.set('temp_2fa_secret', totpData.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 minutes
    })

    // Also store backup codes temporarily
    cookieStore.set(
      'temp_2fa_backup_codes',
      JSON.stringify(totpData.backupCodes),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60, // 10 minutes
      }
    )

    return {
      success: true,
      secret: totpData.secret,
      qrCodeUrl: totpData.qrCodeUrl,
      manualEntryKey: totpData.manualEntryKey,
      backupCodes: totpData.backupCodes,
    }
  } catch (error) {
    console.error('Generate 2FA secret error:', error)
    return {
      success: false,
      error: 'Failed to generate 2FA secret',
    }
  }
}

/**
 * Verify 2FA setup and enable 2FA for the user
 * @param formData Form data with verification code
 * @returns Verification result
 */
export async function verify2FASetupAction(
  formData: FormData
): Promise<Verify2FASetupResult> {
  try {
    // Parse form data
    const rawData = {
      code: formData.get('code') as string,
    }

    const validatedData = enable2FASchema.parse(rawData)

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

    // Get temporary secret from cookies
    const cookieStore = cookies()
    const tempSecret = cookieStore.get('temp_2fa_secret')?.value
    const tempBackupCodesStr = cookieStore.get('temp_2fa_backup_codes')?.value

    if (!tempSecret || !tempBackupCodesStr) {
      return {
        success: false,
        error:
          '2FA setup session expired. Please start the setup process again.',
      }
    }

    let tempBackupCodes: string[]
    try {
      tempBackupCodes = JSON.parse(tempBackupCodesStr)
    } catch {
      return {
        success: false,
        error: 'Invalid backup codes. Please restart the setup process.',
      }
    }

    // Verify the TOTP code
    const verificationResult = verifyTOTPCode(validatedData.code, tempSecret)

    if (!verificationResult.isValid) {
      return {
        success: false,
        error: verificationResult.error || 'Invalid 2FA code',
      }
    }

    // Check if user profile exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('Error checking user profile:', profileCheckError)
      return {
        success: false,
        error: 'Failed to update 2FA settings',
      }
    }

    // Update or insert user profile with 2FA settings
    const profileData = {
      id: user.id,
      email: user.email || '',
      two_factor_enabled: true,
      two_factor_secret: tempSecret,
      two_factor_backup_codes: tempBackupCodes,
      two_factor_enabled_at: new Date().toISOString(),
    }

    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          two_factor_enabled: true,
          two_factor_secret: tempSecret,
          two_factor_backup_codes: tempBackupCodes,
          two_factor_enabled_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating user profile:', updateError)
        return {
          success: false,
          error: 'Failed to enable 2FA',
        }
      }
    } else {
      // Insert new profile
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert(profileData)

      if (insertError) {
        console.error('Error inserting user profile:', insertError)
        return {
          success: false,
          error: 'Failed to enable 2FA',
        }
      }
    }

    // Clear temporary cookies
    cookieStore.delete('temp_2fa_secret')
    cookieStore.delete('temp_2fa_backup_codes')

    return {
      success: true,
      backupCodes: tempBackupCodes,
    }
  } catch (error) {
    console.error('2FA setup verification error:', error)

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
 * Disable 2FA for the current user
 * @param formData Form data with current password for security
 * @returns Disable result
 */
export async function disable2FAAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
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

    // Get current password for verification
    const currentPassword = formData.get('password') as string

    if (!currentPassword) {
      return {
        success: false,
        error: 'Current password is required to disable 2FA',
      }
    }

    // Verify current password
    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: user.email || '',
      password: currentPassword,
    })

    if (passwordError) {
      return {
        success: false,
        error: 'Incorrect password',
      }
    }

    // Disable 2FA
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_backup_codes: null,
        two_factor_enabled_at: null,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error disabling 2FA:', updateError)
      return {
        success: false,
        error: 'Failed to disable 2FA',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Disable 2FA error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Generate new backup codes for 2FA
 * @param formData Form data with current password for security
 * @returns New backup codes
 */
export async function regenerateBackupCodesAction(
  formData: FormData
): Promise<{ success: boolean; error?: string; backupCodes?: string[] }> {
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

    // Get current password for verification
    const currentPassword = formData.get('password') as string

    if (!currentPassword) {
      return {
        success: false,
        error: 'Current password is required to regenerate backup codes',
      }
    }

    // Verify current password
    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: user.email || '',
      password: currentPassword,
    })

    if (passwordError) {
      return {
        success: false,
        error: 'Incorrect password',
      }
    }

    // Check if 2FA is enabled
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('two_factor_enabled')
      .eq('id', user.id)
      .single()

    if (profileError || !profileData?.two_factor_enabled) {
      return {
        success: false,
        error: '2FA is not enabled for this account',
      }
    }

    // Generate new backup codes
    const { backupCodes } = await generateTOTPSecret(
      user.email || '',
      'LifeDash'
    )

    // Update backup codes in database
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        two_factor_backup_codes: backupCodes,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating backup codes:', updateError)
      return {
        success: false,
        error: 'Failed to regenerate backup codes',
      }
    }

    return {
      success: true,
      backupCodes,
    }
  } catch (error) {
    console.error('Regenerate backup codes error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
