"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

export default function ConfirmPage() {
   const router = useRouter()
   const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the tokens from URL hash (Supabase email confirmation links use hash)
        if (typeof window === 'undefined') return

        const hash = window.location.hash.substring(1) // Remove the '#'
        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type = params.get('type')

        if (!accessToken || !refreshToken || type !== 'signup') {
          setStatus('error')
          setMessage('Invalid confirmation link')
          return
        }

        // Set the session with the tokens from the email link
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })

        if (error) {
          console.error('Email confirmation error:', error)
          setStatus('error')
          setMessage('Failed to confirm email. The link may be expired or invalid.')
          return
        }

        // Email confirmed successfully
        setStatus('success')
        setMessage('Email confirmed successfully!')

        // Check if there's pending registration data
        const pendingData = localStorage.getItem('pending-registration')
        if (pendingData) {
          const registrationData = JSON.parse(pendingData)

          // Get the current session to get access token
          const { data: { session } } = await supabase.auth.getSession()
          if (!session?.access_token) {
            throw new Error('No access token available')
          }

          // Now that user is confirmed and signed in, save the profile
          await saveProfileData(registrationData, session.access_token)

          // Clear the pending data
          localStorage.removeItem('pending-registration')
          localStorage.removeItem('registration-step-1')
          localStorage.removeItem('registration-step-2')
          localStorage.removeItem('registration-step-3')
          localStorage.removeItem('temp-passport-photo')
          localStorage.removeItem('temp-signature')

          // Redirect to payment after a delay
          setTimeout(() => {
            router.push('/payment')
          }, 3000)
        } else {
          // No pending registration, just redirect to dashboard
          setTimeout(() => {
            router.push('/dashboard')
          }, 3000)
        }

      } catch (error) {
        console.error('Confirmation error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred')
      }
    }

    handleEmailConfirmation()
  }, [supabase.auth, router])

  const saveProfileData = async (data: any, accessToken: string) => {
    try {
      // Upload documents if they exist
      let passportPhotoUrl = null
      let signatureUrl = null

      // Upload passport photo
      const tempPhoto = localStorage.getItem("temp-passport-photo")
      if (tempPhoto) {
        const photoBlob = await fetch(tempPhoto).then(res => res.blob())
        const photoFile = new File([photoBlob], `passport-${data.userId}.jpg`, { type: "image/jpeg" })

        const fileName = `passports/${photoFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documents")
          .upload(fileName, photoFile)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("documents")
            .getPublicUrl(fileName)
          passportPhotoUrl = publicUrl
        }
      }

      // Upload signature
      const tempSignature = localStorage.getItem("temp-signature")
      if (tempSignature) {
        const signatureBlob = await fetch(tempSignature).then(res => res.blob())
        const signatureFile = new File([signatureBlob], `signature-${data.userId}.png`, { type: "image/png" })

        const fileName = `signatures/${signatureFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documents")
          .upload(fileName, signatureFile)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("documents")
            .getPublicUrl(fileName)
          signatureUrl = publicUrl
        }
      }

      // Prepare profile data
      const profileData = {
        id: data.userId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone_number: data.phone,
        date_of_birth: data.dateOfBirth,
        nationality: data.nationality,
        gender: data.gender,
        designation: data.designation,
        organization_name: data.organization,
        document_type: data.documentType,
        document_number: data.documentNumber,
        declaration_accepted: data.declarationAccepted || false,
        passport_photo_url: passportPhotoUrl || null,
        signature_data: signatureUrl || null,
        membership_fee_paid: false,
        payment_status: "pending",
        test_completed: false,
        certificate_issued: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Save profile data via API route with user's access token
      const response = await fetch('/api/save-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileData, accessToken }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save profile')
      }

      console.log('Profile saved successfully')
    } catch (error) {
      console.error('Error saving profile:', error)
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                <h2 className="text-2xl font-bold text-foreground">Confirming Email</h2>
                <p className="text-muted-foreground">
                  Please wait while we confirm your email address...
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold text-foreground">Email Confirmed!</h2>
                <p className="text-muted-foreground">
                  {message} You will be redirected to complete your registration in a few seconds.
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="h-16 w-16 text-destructive mx-auto" />
                <h2 className="text-2xl font-bold text-foreground">Confirmation Failed</h2>
                <p className="text-muted-foreground">
                  {message}
                </p>
                <div className="space-y-2">
                  <Button onClick={() => router.push('/register')} className="w-full">
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/')} className="w-full">
                    Go Home
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}