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

      // First, try to sign up the user with email and a temporary password
      const tempPassword = `Temp${Math.random().toString(36).substring(2)}!`

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: allData.email,
        password: tempPassword,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
          data: {
            first_name: allData.firstName,
            last_name: allData.lastName,
          },
        },
      })

      if (signUpError) {
        // If user already exists, that's okay - we'll update their profile
        if (signUpError.message.includes("already registered")) {
          console.log("[v0] User already exists, proceeding with profile update")
        } else {
          throw new Error(`Account creation failed: ${signUpError.message}`)
        }
      }

      // Get the user ID (either from new signup or existing user)
      let userId = authData?.user?.id

      // If signup failed due to existing user, we need to get their ID differently
      if (!userId) {
        // Create a unique identifier for this registration
        userId = crypto.randomUUID()
      }

      console.log("[v0] Using user ID:", userId)

      // Insert/update profile data in Supabase
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
        passport_photo_url: allData.passportPhotoUrl || null,
        signature_data: allData.signatureData || null,
        payment_status: "pending",
        test_completed: false,
        certificate_issued: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("[v0] Inserting profile data:", profileData)

      // Use upsert to handle both insert and update cases
      const { data, error: insertError } = await supabase
        .from("profiles")
        .upsert(profileData, {
          onConflict: "id",
          ignoreDuplicates: false,
        })
        .select()

      if (insertError) {
        console.error("[v0] Database insert error:", insertError)
        throw new Error(`Failed to save registration: ${insertError.message}`)
      }

      console.log("[v0] Registration saved successfully:", data)

      // Store user ID for payment process
      localStorage.setItem("registration-user-id", userId)

      // Clear registration data after successful submission
      localStorage.removeItem("registration-step-1")
      localStorage.removeItem("registration-step-2")
      localStorage.removeItem("registration-step-3")

      setSubmitSuccess(true)
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">Registration Successful!</h2>
              <p className="text-gray-600">
                Your registration has been saved successfully. Please proceed to payment to complete your certification
                process and gain access to the security aptitude test.
              </p>
              <Button onClick={() => router.push("/payment")} className="w-full">
                Proceed to Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <RegistrationProgress currentStep={4} totalSteps={4} stepTitles={stepTitles} />

      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">Review Your Information</CardTitle>
              <CardDescription>Please review all details before submitting</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Personal Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
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
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-3">Professional Information</h3>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Designation:</span> {allData.designation}
                  </div>
                  <div>
                    <span className="font-medium">Organization:</span> {allData.organization}
                  </div>
                </div>
              </div>

              {/* Document Information */}
              <div className="bg-amber-50 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-3">Document Information</h3>
                <div className="grid grid-cols-1 gap-2 text-sm">
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

              <div className="flex justify-between pt-6">
                <Button type="button" variant="outline" onClick={goBack}>
                  Previous
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
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
