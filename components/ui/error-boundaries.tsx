'use client'

import React, { Component, ReactNode, ErrorInfo } from 'react'
import {
  AlertCircle,
  RefreshCw,
  WifiOff,
  Database,
  Code,
  Smartphone,
} from 'lucide-react'
import { Button } from './button'
import { Card } from './card'
import { Badge } from './badge'

// Base error boundary interface
interface BaseErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showErrorDetails?: boolean
  className?: string
}

interface BaseErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

// Error logging utility
class ErrorLogger {
  static log(error: Error, errorInfo: ErrorInfo, context: string) {
    const errorData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      context,
      timestamp: new Date().toISOString(),
      userAgent:
        typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔴 Error Boundary: ${context}`)
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Full Context:', errorData)
      console.groupEnd()
    }

    // In production, you might want to send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: send to Sentry, LogRocket, etc.
      try {
        // errorReportingService.captureException(error, { extra: errorData })
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError)
      }
    }
  }
}

// API Error Boundary - for handling API and data fetching errors
export class APIErrorBoundary extends Component<
  BaseErrorBoundaryProps,
  BaseErrorBoundaryState
> {
  public state: BaseErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): BaseErrorBoundaryState {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    ErrorLogger.log(error, errorInfo, 'API_ERROR_BOUNDARY')
    this.props.onError?.(error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  private isNetworkError = (error: Error) => {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch') ||
      error.name === 'NetworkError'
    )
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isNetworkError = this.isNetworkError(this.state.error!)

      return (
        <Card className="border-red-200 bg-red-50 p-6">
          <div className="flex items-start space-x-3">
            {isNetworkError ? (
              <WifiOff className="mt-1 h-5 w-5 flex-shrink-0 text-red-600" />
            ) : (
              <Database className="mt-1 h-5 w-5 flex-shrink-0 text-red-600" />
            )}
            <div className="flex-1">
              <div className="mb-2 flex items-center space-x-2">
                <h3 className="text-sm font-medium text-red-800">
                  {isNetworkError ? 'Tilkoblingsfeil' : 'Datafeil'}
                </h3>
                <Badge variant="outline" className="text-xs text-red-600">
                  API
                </Badge>
              </div>
              <p className="text-sm text-red-700">
                {isNetworkError
                  ? 'Kunne ikke koble til tjenesten. Sjekk internettforbindelsen din.'
                  : 'Det oppstod en feil under henting av data. Prøv igjen om litt.'}
              </p>
              {this.props.showErrorDetails &&
                this.state.error &&
                process.env.NODE_ENV === 'development' && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-red-600">
                      Tekniske detaljer
                    </summary>
                    <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              <div className="mt-4 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleRetry}
                  className="border-red-300 bg-white text-red-700 hover:bg-red-50"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Prøv igjen
                </Button>
                {isNetworkError && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="text-red-700 hover:bg-red-50"
                  >
                    Last siden på nytt
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}

// Render Error Boundary - for handling component rendering errors
export class RenderErrorBoundary extends Component<
  BaseErrorBoundaryProps,
  BaseErrorBoundaryState
> {
  public state: BaseErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): BaseErrorBoundaryState {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    ErrorLogger.log(error, errorInfo, 'RENDER_ERROR_BOUNDARY')
    this.props.onError?.(error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="border-orange-200 bg-orange-50 p-6">
          <div className="flex items-start space-x-3">
            <Code className="mt-1 h-5 w-5 flex-shrink-0 text-orange-600" />
            <div className="flex-1">
              <div className="mb-2 flex items-center space-x-2">
                <h3 className="text-sm font-medium text-orange-800">
                  Komponentfeil
                </h3>
                <Badge variant="outline" className="text-xs text-orange-600">
                  Rendering
                </Badge>
              </div>
              <p className="text-sm text-orange-700">
                En del av siden kunne ikke lastes. Dette påvirker ikke resten av
                applikasjonen.
              </p>
              {this.props.showErrorDetails &&
                this.state.error &&
                process.env.NODE_ENV === 'development' && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-orange-600">
                      Tekniske detaljer
                    </summary>
                    <pre className="mt-2 overflow-auto rounded bg-orange-100 p-2 text-xs">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleRetry}
                  className="border-orange-300 bg-white text-orange-700 hover:bg-orange-50"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Last komponenten på nytt
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}

// Mobile Error Boundary - specialized for mobile components
export class MobileErrorBoundary extends Component<
  BaseErrorBoundaryProps,
  BaseErrorBoundaryState
> {
  public state: BaseErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): BaseErrorBoundaryState {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    ErrorLogger.log(error, errorInfo, 'MOBILE_ERROR_BOUNDARY')
    this.props.onError?.(error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[200px] items-center justify-center bg-blue-50 p-4">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-blue-100 p-3">
              <Smartphone className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mb-2 flex items-center justify-center space-x-2">
              <h3 className="text-sm font-medium text-blue-800">
                Mobilvisning utilgjengelig
              </h3>
              <Badge variant="outline" className="text-xs text-blue-600">
                Mobile
              </Badge>
            </div>
            <p className="mb-4 text-sm text-blue-700">
              Denne delen av mobilvisningen kunne ikke lastes.
            </p>
            {this.props.showErrorDetails &&
              this.state.error &&
              process.env.NODE_ENV === 'development' && (
                <details className="mb-4 text-left">
                  <summary className="cursor-pointer text-xs text-blue-600">
                    Tekniske detaljer
                  </summary>
                  <pre className="mt-2 overflow-auto rounded bg-blue-100 p-2 text-xs">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleRetry}
                className="border-blue-300 bg-white text-blue-700 hover:bg-blue-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Prøv igjen
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Page Error Boundary - for handling page-level errors
export class PageErrorBoundary extends Component<
  BaseErrorBoundaryProps,
  BaseErrorBoundaryState
> {
  public state: BaseErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): BaseErrorBoundaryState {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    ErrorLogger.log(error, errorInfo, 'PAGE_ERROR_BOUNDARY')
    this.props.onError?.(error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md border-red-200 bg-red-50 p-8">
            <div className="text-center">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-red-100 p-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="mb-2 text-xl font-semibold text-red-800">
                Siden kunne ikke lastes
              </h1>
              <p className="mb-6 text-sm text-red-700">
                Det oppstod en uventet feil. Prøv å laste siden på nytt eller gå
                tilbake til forsiden.
              </p>
              {this.props.showErrorDetails &&
                this.state.error &&
                process.env.NODE_ENV === 'development' && (
                  <details className="mb-6 text-left">
                    <summary className="cursor-pointer text-xs text-red-600">
                      Tekniske detaljer
                    </summary>
                    <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleRetry}
                  className="w-full border-red-300 bg-white text-red-700 hover:bg-red-50"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Prøv igjen
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={this.handleGoHome}
                  className="w-full text-red-700 hover:bg-red-50"
                >
                  Gå til forsiden
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order components for easier usage
export function withAPIErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <APIErrorBoundary
      fallback={fallback}
      showErrorDetails={process.env.NODE_ENV === 'development'}
    >
      <Component {...props} />
    </APIErrorBoundary>
  )

  WrappedComponent.displayName = `withAPIErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

export function withRenderErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <RenderErrorBoundary
      fallback={fallback}
      showErrorDetails={process.env.NODE_ENV === 'development'}
    >
      <Component {...props} />
    </RenderErrorBoundary>
  )

  WrappedComponent.displayName = `withRenderErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

export function withMobileErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <MobileErrorBoundary
      fallback={fallback}
      showErrorDetails={process.env.NODE_ENV === 'development'}
    >
      <Component {...props} />
    </MobileErrorBoundary>
  )

  WrappedComponent.displayName = `withMobileErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// React Hook for error handling
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo, context?: string) => {
    ErrorLogger.log(
      error,
      errorInfo || { componentStack: '' },
      context || 'HOOK_ERROR'
    )
  }
}

// Error boundary component selector
export interface ErrorBoundaryProviderProps {
  children: ReactNode
  type?: 'page' | 'api' | 'render' | 'mobile'
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  className?: string
}

export function ErrorBoundaryProvider({
  children,
  type = 'render',
  fallback,
  onError,
  className,
}: ErrorBoundaryProviderProps) {
  const props = {
    fallback,
    onError,
    className,
    showErrorDetails: process.env.NODE_ENV === 'development',
  }

  switch (type) {
    case 'page':
      return <PageErrorBoundary {...props}>{children}</PageErrorBoundary>
    case 'api':
      return <APIErrorBoundary {...props}>{children}</APIErrorBoundary>
    case 'mobile':
      return <MobileErrorBoundary {...props}>{children}</MobileErrorBoundary>
    case 'render':
    default:
      return <RenderErrorBoundary {...props}>{children}</RenderErrorBoundary>
  }
}
