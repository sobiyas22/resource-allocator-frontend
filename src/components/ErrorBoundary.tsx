import React from 'react'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-50">
      <Card className="max-w-lg w-full rounded-2xl border-neutral-200">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <CardTitle className="text-2xl text-neutral-900">Something went wrong</CardTitle>
          <CardDescription className="text-neutral-500 mt-2">
            We're sorry for the inconvenience. An unexpected error occurred.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {import.meta.env.DEV && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-medium text-red-800 mb-2">Error Details:</p>
              <pre className="text-xs text-red-700 overflow-auto max-h-32">
                {error instanceof Error ? error.message : String(error)}
              </pre>
            </div>
          )}
          <div className="flex gap-3">
            <Button onClick={resetErrorBoundary} className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl">
              Try Again
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="outline" className="flex-1 rounded-xl border-neutral-300">
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ErrorBoundaryProps { children: React.ReactNode }

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => { console.error('Error caught by boundary:', error, errorInfo) }}
      onReset={() => { window.location.href = '/' }}
    >
      {children}
    </ReactErrorBoundary>
  )
}