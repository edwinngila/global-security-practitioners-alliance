"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/user-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function VerifySuccessPage() {
  const router = useRouter()
  const { refresh } = useUser()
  const [done, setDone] = useState(false)

  useEffect(() => {
    // read token from URL fragment (#token=...)
    const hash = window.location.hash || ''
    const m = hash.match(/token=([^&]+)/)
    const token = m ? decodeURIComponent(m[1]) : null

    if (token) {
      try { localStorage.setItem('auth_token', token) } catch {}
      // refresh user context via provider
      ;(async () => {
        try {
          await refresh()
        } catch (e) {
          // ignore
        }
      })()
    }

    // redirect after small delay
    setTimeout(() => {
      setDone(true)
      router.push('/dashboard')
    }, 900)
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
            {!done ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">Finalizing sign-in...</p>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <p className="mt-4 text-sm text-foreground">Redirecting to your dashboard…</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
