'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Glemt passord
          </CardTitle>
          <p className="mt-2 text-gray-600">Kommer snart...</p>
        </CardHeader>

        <CardContent className="text-center">
          <p className="mb-6 text-gray-500">
            Passord tilbakestilling er under utvikling.
          </p>

          <a
            href="/login"
            className="btn-primary inline-flex w-full items-center justify-center py-3 text-base"
          >
            Tilbake til innlogging
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
