"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function VerifySuccessPage() {
  const router = useRouter()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleVerification = async () => {
      // read token from URL fragment (#token=...)
      const hash = window.location.hash || ''
      const m = hash.match(/token=([^&]+)/)
      const token = m ? decodeURIComponent(m[1]) : null

      if (token) {
        try {
          // Store token for API calls
          localStorage.setItem('auth_token', token)

          // Decode token to get user info for NextAuth sign in
          const payload = JSON.parse(atob(token.split('.')[1]))
          const email = payload.email

          // Sign in with NextAuth using credentials
          const result = await signIn('credentials', {
            email,
            password: 'verified-user', // Special password for verified users
            redirect: false,
          })

          if (result?.error) {
            console.error('NextAuth sign in failed:', result.error)
            setError('Session setup failed. Please try logging in manually.')
          } else {
            console.log('Successfully signed in with NextAuth')
          }
        } catch (e) {
          console.error('Token processing error:', e)
          setError('Verification processing failed.')
        }
      } else {
        setError('Verification token missing.')
      }

      // redirect after delay
      setTimeout(() => {
        setDone(true)
        if (!error) {
          router.push('/dashboard')
        }
      }, 1500)
    }

    handleVerification()
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Email Verified</CardTitle>
          <CardDescription>Your account has been verified.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            {error ? (
              <div className="space-y-4">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
                <p className="text-sm text-red-700">{error}</p>
                <p className="text-xs text-muted-foreground">
                  Your email has been verified, but there was an issue setting up your session.
                  Please try logging in manually.
                </p>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
                >
                  Go to Login
                </button>
              </div>
            ) : !done ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">Setting up your session...</p>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <p className="mt-4 text-sm text-foreground">Welcome! Redirecting to your dashboard…</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
