"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RegistrationProgress } from "@/components/registration-progress"
import { CheckCircle2, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const stepTitles = ["Personal Info", "Professional Info", "Documents", "Review"]

export default function RegisterStep4() {
  const router = useRouter()
  const [allData, setAllData] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const step1Data = JSON.parse(localStorage.getItem("registration-step-1") || "{}")
    const step2Data = JSON.parse(localStorage.getItem("registration-step-2") || "{}")
    const step3Data = JSON.parse(localStorage.getItem("registration-step-3") || "{}")

    setAllData({
      ...step1Data,
      ...step2Data,
      ...step3Data,
    })
  }, [])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      console.log("[v0] Starting registration process")
      console.log("[v0] Registration data:", allData)

      // Create new auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: allData.email,
        password: allData.password,
        options: {
          data: {
            first_name: allData.firstName,
            last_name: allData.lastName,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      })

      if (authError) {
        console.error("[v0] Auth signup error:", authError)
        throw new Error(`Failed to create account: ${authError.message}`)
      }

      if (!authData.user) {
        throw new Error("Failed to create user account")
      }

      const userId = authData.user.id
      console.log("[v0] Created auth user ID:", userId)

      // Store registration data temporarily for after email confirmation
      localStorage.setItem("pending-registration", JSON.stringify({
        userId,
        ...allData
      }))

      // Don't sign in yet - user needs to confirm email
      console.log("[v0] User account created, email confirmation sent")

      // Upload documents now that user is authenticated
      let passportPhotoUrl = null
      let signatureUrl = null

      // Upload passport photo
      const tempPhoto = localStorage.getItem("temp-passport-photo")
      if (tempPhoto) {
        try {
          // Convert base64 to blob
          const photoBlob = await fetch(tempPhoto).then(res => res.blob())
          const photoFile = new File([photoBlob], `passport-${userId}.jpg`, { type: "image/jpeg" })

          const fileName = `passports/${photoFile.name}`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("documents")
            .upload(fileName, photoFile)

          if (uploadError) {
            console.error("Photo upload error:", uploadError)
            // Don't throw error, continue without photo
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from("documents")
              .getPublicUrl(fileName)
            passportPhotoUrl = publicUrl
          }
        } catch (photoError) {
          console.error("Photo processing error:", photoError)
        }
      }

      // Upload signature
      const tempSignature = localStorage.getItem("temp-signature")
      if (tempSignature) {
        try {
          // Convert base64 to blob
          const signatureBlob = await fetch(tempSignature).then(res => res.blob())
          const signatureFile = new File([signatureBlob], `signature-${userId}.png`, { type: "image/png" })

          const fileName = `signatures/${signatureFile.name}`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("documents")
            .upload(fileName, signatureFile)

          if (uploadError) {
            console.error("Signature upload error:", uploadError)
            // Don't throw error, continue without signature
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from("documents")
              .getPublicUrl(fileName)
            signatureUrl = publicUrl
          }
        } catch (sigError) {
          console.error("Signature processing error:", sigError)
        }
      }

      // Insert profile data in Supabase
      const profileData = {
        id: userId,
        first_name: allData.firstName,
        last_name: allData.lastName,
        email: allData.email,
        phone_number: allData.phone,
        date_of_birth: allData.dateOfBirth,
        nationality: allData.nationality,
        gender: allData.gender,
        designation: allData.designation,
        organization_name: allData.organization,
        document_type: allData.documentType,
        document_number: allData.documentNumber,
        declaration_accepted: allData.declarationAccepted || false,
        passport_photo_url: passportPhotoUrl || null,
        signature_data: signatureUrl || null,
        membership_fee_paid: false,
        payment_status: "pending",
        test_completed: false,
        certificate_issued: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("[v0] Inserting profile data:", profileData)

      // Insert or update the profile
      const { data, error: insertError } = await supabase
        .from("profiles")
        .upsert(profileData)
        .select()

      if (insertError) {
        console.error("[v0] Database insert error:", insertError)
        throw new Error(`Failed to save registration: ${insertError.message}`)
      }

      console.log("[v0] Registration saved successfully:", data)

      // Store user ID for payment process
      localStorage.setItem("registration-user-id", userId)

      // Don't clear registration data yet - wait for email confirmation
      // Data will be cleared after successful confirmation

      setSubmitSuccess(true)

      // Don't auto-redirect - user needs to confirm email first
    } catch (error: any) {
      console.error("[v0] Registration submission error:", error)
      setError(error.message || "Registration failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const goBack = () => {
    router.push("/register/step-3")
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-foreground">Check Your Email!</h2>
              <p className="text-muted-foreground">
                We've sent a confirmation link to {allData.email}. Please check your email and click the link to verify your account. Once verified, you'll be able to proceed with payment and access the security aptitude test.
              </p>
              <Button onClick={() => router.push("/")} className="w-full">
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSubmitting) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-card rounded-lg p-8 shadow-2xl max-w-sm w-full mx-4">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h3 className="text-xl font-semibold text-foreground">Submitting Registration</h3>
            <p className="text-muted-foreground">
              Please wait while we process your information and create your account...
            </p>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <RegistrationProgress currentStep={4} totalSteps={4} stepTitles={stepTitles} />

      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl md:text-2xl font-bold text-foreground">Review Your Information</CardTitle>
              <CardDescription className="text-sm md:text-base">Please review all details before submitting</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Personal Information */}
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3 text-sm md:text-base">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs md:text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {allData.firstName} {allData.lastName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {allData.email}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {allData.phone}
                  </div>
                  <div>
                    <span className="font-medium">Date of Birth:</span> {allData.dateOfBirth}
                  </div>
                  <div>
                    <span className="font-medium">Nationality:</span> {allData.nationality}
                  </div>
                  <div>
                    <span className="font-medium">Gender:</span> {allData.gender}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Password:</span> ********
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3 text-sm md:text-base">Professional Information</h3>
                <div className="grid grid-cols-1 gap-2 text-xs md:text-sm">
                  <div>
                    <span className="font-medium">Designation:</span> {allData.designation}
                  </div>
                  <div>
                    <span className="font-medium">Organization:</span> {allData.organization}
                  </div>
                </div>
              </div>

              {/* Document Information */}
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3 text-sm md:text-base">Document Information</h3>
                <div className="grid grid-cols-1 gap-2 text-xs md:text-sm">
                  <div>
                    <span className="font-medium">Document Type:</span> {allData.documentType}
                  </div>
                  <div>
                    <span className="font-medium">Document Number:</span> {allData.documentNumber}
                  </div>
                  <div>
                    <span className="font-medium">Declaration:</span>{" "}
                    {allData.declarationAccepted ? "Accepted" : "Not Accepted"}
                  </div>
                  {allData.signatureData && (
                    <div>
                      <span className="font-medium">Signature:</span> ✓ Provided
                    </div>
                  )}
                  {allData.passportPhotoUrl && (
                    <div>
                      <span className="font-medium">Passport Photo:</span> ✓ Uploaded
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
                <Button type="button" variant="outline" onClick={goBack} className="px-6 md:px-8">
                  Previous
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="px-6 md:px-8">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
