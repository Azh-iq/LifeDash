import { z } from 'zod'

// Password validation utilities
export const passwordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
}

// Password strength scoring
export const getPasswordStrength = (password: string) => {
  let score = 0
  const feedback: string[] = []

  // Length check
  if (password.length >= passwordRequirements.minLength) {
    score += 20
  } else {
    feedback.push(`Password must be at least ${passwordRequirements.minLength} characters`)
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 20
  } else {
    feedback.push('Add at least one uppercase letter')
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 20
  } else {
    feedback.push('Add at least one lowercase letter')
  }

  // Numbers check
  if (/\d/.test(password)) {
    score += 20
  } else {
    feedback.push('Add at least one number')
  }

  // Special characters check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 20
  } else {
    feedback.push('Add at least one special character')
  }

  // Length bonus for very long passwords
  if (password.length >= 12) {
    score += 10
  }

  // Common patterns penalty
  if (/(.)\1{2,}/.test(password)) {
    score -= 10
    feedback.push('Avoid repeating characters')
  }

  if (/123|abc|qwe|password|admin/i.test(password)) {
    score -= 15
    feedback.push('Avoid common patterns and words')
  }

  const strength = score <= 40 ? 'weak' : score <= 70 ? 'medium' : score <= 90 ? 'strong' : 'very-strong'
  
  return {
    score: Math.max(0, Math.min(100, score)),
    strength,
    feedback,
    isValid: score >= 80 && feedback.length === 0
  }
}

// Base password schema
const passwordSchema = z
  .string()
  .min(passwordRequirements.minLength, `Password must be at least ${passwordRequirements.minLength} characters`)
  .max(passwordRequirements.maxLength, `Password must be no more than ${passwordRequirements.maxLength} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character')

// Email schema
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email address is too long')

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>

// Register form schema
export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be no more than 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be no more than 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
    marketingEmails: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type RegisterFormData = z.infer<typeof registerSchema>

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
})

export type PasswordResetRequestData = z.infer<typeof passwordResetRequestSchema>

// Password reset schema
export const passwordResetSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type PasswordResetData = z.infer<typeof passwordResetSchema>

// 2FA setup schema
export const twoFactorSetupSchema = z.object({
  code: z
    .string()
    .min(6, '2FA code must be 6 digits')
    .max(6, '2FA code must be 6 digits')
    .regex(/^\d{6}$/, '2FA code must contain only numbers'),
})

export type TwoFactorSetupData = z.infer<typeof twoFactorSetupSchema>

// 2FA verification schema
export const twoFactorVerifySchema = z.object({
  code: z
    .string()
    .min(6, '2FA code must be 6 digits')
    .max(6, '2FA code must be 6 digits')
    .regex(/^\d{6}$/, '2FA code must contain only numbers'),
  backupCode: z.string().optional(),
})

export type TwoFactorVerifyData = z.infer<typeof twoFactorVerifySchema>

// Change password schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })

export type ChangePasswordData = z.infer<typeof changePasswordSchema>

// Profile update schema
export const profileUpdateSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be no more than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be no more than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  email: emailSchema,
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?[\d\s\-\(\)]+$/.test(val), {
      message: 'Please enter a valid phone number',
    }),
  bio: z
    .string()
    .max(500, 'Bio must be no more than 500 characters')
    .optional(),
  website: z
    .string()
    .optional()
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: 'Please enter a valid URL',
    }),
  location: z
    .string()
    .max(100, 'Location must be no more than 100 characters')
    .optional(),
  timezone: z.string().optional(),
})

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>

// Account deletion schema
export const accountDeletionSchema = z.object({
  password: z.string().min(1, 'Password is required to delete account'),
  confirmation: z
    .string()
    .min(1, 'Please type "DELETE" to confirm')
    .refine((val) => val === 'DELETE', {
      message: 'Please type "DELETE" to confirm account deletion',
    }),
  reason: z.enum([
    'no-longer-needed',
    'found-alternative',
    'too-expensive',
    'missing-features',
    'privacy-concerns',
    'other',
  ]),
  feedback: z
    .string()
    .max(1000, 'Feedback must be no more than 1000 characters')
    .optional(),
})

export type AccountDeletionData = z.infer<typeof accountDeletionSchema>

// Validation error formatting utilities
export const formatZodError = (error: z.ZodError) => {
  const fieldErrors: Record<string, string> = {}
  
  error.errors.forEach((err) => {
    const path = err.path.join('.')
    if (!fieldErrors[path]) {
      fieldErrors[path] = err.message
    }
  })
  
  return fieldErrors
}

export const getFieldError = (errors: Record<string, string>, field: string) => {
  return errors[field] || null
}

// Security validation utilities
export const validatePasswordHistory = (newPassword: string, passwordHistory: string[]) => {
  return !passwordHistory.includes(newPassword)
}

export const validatePasswordAge = (lastChanged: Date, maxAgeInDays: number = 90) => {
  const daysSinceChange = Math.floor((Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24))
  return daysSinceChange <= maxAgeInDays
}

export const validateLoginAttempts = (attempts: number, maxAttempts: number = 5) => {
  return attempts < maxAttempts
}

export const calculateLockoutDuration = (attempts: number) => {
  // Progressive lockout: 1min, 5min, 15min, 30min, 1hr
  const durations = [1, 5, 15, 30, 60]
  const index = Math.min(attempts - 5, durations.length - 1)
  return durations[index] * 60 * 1000 // Convert to milliseconds
}