"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RegistrationProgress } from "@/components/registration-progress"
import { CheckCircle2, Loader2 } from "lucide-react"

const stepTitles = ["Personal Info", "Professional Info", "Documents", "Review"]

export default function RegisterStep4() {
  const router = useRouter()
  const [allData, setAllData] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

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
    try {
      console.log("Submitting registration:", allData)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Clear localStorage after successful submission
      localStorage.removeItem("registration-step-1")
      localStorage.removeItem("registration-step-2")
      localStorage.removeItem("registration-step-3")

      setSubmitSuccess(true)
    } catch (error) {
      console.error("Registration failed:", error)
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
              <p className="text-gray-600">Thank you for registering. You will receive a confirmation email shortly.</p>
              <Button onClick={() => router.push("/")} className="w-full">
                Go to Homepage
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
