'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ToastContainer,
  useToast,
} from '@/components/ui'
import LoginForm from '@/components/features/auth/login-form'
import RegisterForm from '@/components/features/auth/register-form'
import { PasswordResetRequestForm } from '@/components/features/auth/password-reset-form'
import { TwoFactorSetup, TwoFactorVerify } from '@/components/features/auth/two-factor-auth'
import PasswordStrength from '@/components/features/auth/password-strength'
import { type LoginFormData, type RegisterFormData, type PasswordResetRequestData, type TwoFactorSetupData, type TwoFactorVerifyData } from '@/lib/validation/auth.schema'

type DemoSection = 'overview' | 'login' | 'register' | 'password-reset' | '2fa-setup' | '2fa-verify' | 'password-strength'

export default function AuthDemo() {
  return (
    <ToastContainer>
      <AuthDemoContent />
    </ToastContainer>
  )
}

function AuthDemoContent() {
  const [activeSection, setActiveSection] = useState<DemoSection>('overview')
  const [loading, setLoading] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const { toast } = useToast()

  const mockSubmit = async (data: any, delay = 1500) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, delay))
      toast({
        title: 'Success!',
        description: 'Form submitted successfully (demo mode)',
        variant: 'success',
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Something went wrong (demo mode)',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (data: LoginFormData) => {
    await mockSubmit(data)
  }

  const handleRegister = async (data: RegisterFormData) => {
    await mockSubmit(data, 2000)
  }

  const handlePasswordReset = async (data: PasswordResetRequestData) => {
    await mockSubmit(data)
  }

  const handle2FASetup = async (data: TwoFactorSetupData) => {
    await mockSubmit(data)
  }

  const handle2FAVerify = async (data: TwoFactorVerifyData) => {
    await mockSubmit(data, 1000)
  }

  const sections = [
    { id: 'overview', title: 'Overview', icon: '📋' },
    { id: 'login', title: 'Login Form', icon: '🔑' },
    { id: 'register', title: 'Register Form', icon: '✍️' },
    { id: 'password-reset', title: 'Password Reset', icon: '🔄' },
    { id: '2fa-setup', title: '2FA Setup', icon: '🔐' },
    { id: '2fa-verify', title: '2FA Verify', icon: '🔢' },
    { id: 'password-strength', title: 'Password Strength', icon: '💪' },
  ] as const

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              Authentication Components Demo
            </h1>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">
              Complete authentication flow with validation, error handling, and excellent UX.
            </p>
            
            <div className="mt-4 flex gap-2">
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  View Live Login Page
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="outline" size="sm">
                  View Live Register Page
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Navigation */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Components</CardTitle>
                </CardHeader>
                <CardContent>
                  <nav className="space-y-1">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id as DemoSection)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeSection === section.id
                            ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <span className="mr-2">{section.icon}</span>
                        {section.title}
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Authentication System Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-neutral-600 dark:text-neutral-400">
                        Our authentication system provides a complete, secure, and user-friendly experience with the following features:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">🔒 Security Features</h3>
                          <ul className="text-sm text-green-800 dark:text-green-300 space-y-1">
                            <li>• Strong password validation</li>
                            <li>• Two-factor authentication</li>
                            <li>• Secure password reset flow</li>
                            <li>• Input sanitization</li>
                            <li>• Rate limiting simulation</li>
                          </ul>
                        </div>
                        
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🎨 UX Features</h3>
                          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                            <li>• Real-time validation feedback</li>
                            <li>• Password strength indicator</li>
                            <li>• Clear error messages</li>
                            <li>• Loading states</li>
                            <li>• Accessibility support</li>
                          </ul>
                        </div>
                        
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                          <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-2">⚡ Technical Features</h3>
                          <ul className="text-sm text-purple-800 dark:text-purple-300 space-y-1">
                            <li>• React Hook Form integration</li>
                            <li>• Zod schema validation</li>
                            <li>• TypeScript support</li>
                            <li>• Responsive design</li>
                            <li>• Dark mode support</li>
                          </ul>
                        </div>
                        
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                          <h3 className="font-medium text-orange-900 dark:text-orange-100 mb-2">🚀 Developer Experience</h3>
                          <ul className="text-sm text-orange-800 dark:text-orange-300 space-y-1">
                            <li>• Reusable components</li>
                            <li>• Comprehensive validation</li>
                            <li>• Error handling patterns</li>
                            <li>• Demo credentials</li>
                            <li>• Testing scenarios</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeSection === 'login' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Login Form Component</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                        Features: Email validation, password field with toggle, remember me option, social login buttons, error handling, and loading states.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <LoginForm
                    onSubmit={handleLogin}
                    loading={loading}
                  />
                </div>
              )}

              {activeSection === 'register' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Register Form Component</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                        Features: Multi-field validation, real-time password strength meter, terms acceptance, marketing opt-in, and comprehensive error handling.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <RegisterForm
                    onSubmit={handleRegister}
                    loading={loading}
                  />
                </div>
              )}

              {activeSection === 'password-reset' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Password Reset Component</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                        Features: Email validation, success states, error handling, and user guidance throughout the reset process.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <PasswordResetRequestForm
                    onSubmit={handlePasswordReset}
                    loading={loading}
                  />
                </div>
              )}

              {activeSection === '2fa-setup' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Two-Factor Authentication Setup</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                        Features: QR code display, step-by-step guidance, code verification, backup codes generation, and comprehensive setup flow.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <TwoFactorSetup
                    qrCodeUrl="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNHB4IiBmaWxsPSIjMzMzIj5EZW1vIFFSIENvZGU8L3RleHQ+Cjwvc3ZnPgo="
                    backupCodes={['ABCD-1234', 'EFGH-5678', 'IJKL-9012', 'MNOP-3456', 'QRST-7890', 'UVWX-1234', 'YZAB-5678', 'CDEF-9012']}
                    onSubmit={handle2FASetup}
                    loading={loading}
                  />
                </div>
              )}

              {activeSection === '2fa-verify' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Two-Factor Authentication Verification</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                        Features: 6-digit code input, backup code option, auto-focus navigation, and clear error feedback.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <TwoFactorVerify
                    onSubmit={handle2FAVerify}
                    loading={loading}
                  />
                </div>
              )}

              {activeSection === 'password-strength' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Password Strength Indicator</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                        Features: Real-time strength calculation, visual progress bar, requirement checklist, and helpful feedback messages.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="space-y-4 pt-6">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Try typing a password to see the strength indicator in action:
                        </label>
                        <input
                          type="password"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="Type a password..."
                          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:border-primary-500 focus:ring-primary-500 focus:ring-1 transition-colors"
                        />
                      </div>
                      
                      <PasswordStrength
                        password={passwordInput}
                        showFeedback={true}
                        showScore={true}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  )
}