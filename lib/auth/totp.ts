import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { randomBytes } from 'crypto'

export interface TOTPSecret {
  secret: string
  qrCodeUrl: string
  manualEntryKey: string
  backupCodes: string[]
}

export interface TOTPVerificationResult {
  isValid: boolean
  error?: string
}

/**
 * Generate a new TOTP secret for 2FA setup
 * @param userEmail User's email address
 * @param serviceName Name of the service (e.g., "LifeDash")
 * @returns TOTP secret with QR code and backup codes
 */
export async function generateTOTPSecret(
  userEmail: string,
  serviceName: string = 'LifeDash'
): Promise<TOTPSecret> {
  // Generate the secret
  const secret = speakeasy.generateSecret({
    name: `${serviceName}:${userEmail}`,
    issuer: serviceName,
    length: 32,
  })

  if (!secret.base32) {
    throw new Error('Failed to generate TOTP secret')
  }

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '')

  // Generate backup codes
  const backupCodes = generateBackupCodes(8)

  return {
    secret: secret.base32,
    qrCodeUrl,
    manualEntryKey: secret.base32,
    backupCodes,
  }
}

/**
 * Verify a TOTP code
 * @param token The 6-digit code from authenticator app
 * @param secret The user's TOTP secret
 * @param window Time window for validation (default: 2)
 * @returns Verification result
 */
export function verifyTOTPCode(
  token: string,
  secret: string,
  window: number = 2
): TOTPVerificationResult {
  try {
    // Remove any spaces or formatting
    const cleanToken = token.replace(/\s+/g, '')

    // Validate token format
    if (!/^\d{6}$/.test(cleanToken)) {
      return {
        isValid: false,
        error: 'Invalid code format. Please enter a 6-digit code.',
      }
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: cleanToken,
      window,
    })

    return {
      isValid: verified,
      error: verified
        ? undefined
        : 'Invalid or expired code. Please try again.',
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to verify code. Please try again.',
    }
  }
}

/**
 * Generate backup codes for 2FA recovery
 * @param count Number of backup codes to generate
 * @returns Array of backup codes
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = []

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }

  return codes
}

/**
 * Verify a backup code
 * @param inputCode The backup code entered by user
 * @param storedCodes Array of valid backup codes
 * @returns Verification result with remaining codes
 */
export function verifyBackupCode(
  inputCode: string,
  storedCodes: string[]
): { isValid: boolean; remainingCodes: string[]; error?: string } {
  try {
    // Clean and normalize the input code
    const cleanCode = inputCode.replace(/\s+/g, '').toUpperCase()

    // Validate code format
    if (!/^[A-F0-9]{8}$/.test(cleanCode)) {
      return {
        isValid: false,
        remainingCodes: storedCodes,
        error: 'Invalid backup code format.',
      }
    }

    // Check if code exists in stored codes
    const codeIndex = storedCodes.indexOf(cleanCode)

    if (codeIndex === -1) {
      return {
        isValid: false,
        remainingCodes: storedCodes,
        error: 'Invalid backup code.',
      }
    }

    // Remove used code and return remaining codes
    const remainingCodes = storedCodes.filter((_, index) => index !== codeIndex)

    return {
      isValid: true,
      remainingCodes,
    }
  } catch (error) {
    return {
      isValid: false,
      remainingCodes: storedCodes,
      error: 'Failed to verify backup code.',
    }
  }
}

/**
 * Get current TOTP code for testing/development
 * @param secret The TOTP secret
 * @returns Current 6-digit code
 */
export function getCurrentTOTPCode(secret: string): string {
  return speakeasy.totp({
    secret,
    encoding: 'base32',
  })
}

/**
 * Validate TOTP secret format
 * @param secret The secret to validate
 * @returns Whether the secret is valid
 */
export function isValidTOTPSecret(secret: string): boolean {
  try {
    // Check if it's a valid base32 string
    return /^[A-Z2-7]+=*$/.test(secret) && secret.length >= 16
  } catch {
    return false
  }
}

/**
 * Format backup codes for display
 * @param codes Array of backup codes
 * @returns Formatted codes for display
 */
export function formatBackupCodes(codes: string[]): string[] {
  return codes.map(code => {
    // Insert a space in the middle for better readability
    return `${code.slice(0, 4)} ${code.slice(4)}`
  })
}

/**
 * Generate a recovery key for account recovery
 * @returns A longer recovery key
 */
export function generateRecoveryKey(): string {
  // Generate a 32-character recovery key
  return randomBytes(16).toString('hex').toUpperCase()
}
