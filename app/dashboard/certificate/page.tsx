"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Award,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Menu,
  Calendar,
  Trophy,
  Star
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface UserProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  membership_fee_paid: boolean
  payment_status: string
  test_completed: boolean
  test_score: number | null
  certificate_issued: boolean
  certificate_url: string | null
  certificate_available_at: string | null
  created_at: string
}

interface TestAttempt {
  id: string
  score: number
  total_questions: number
  passed: boolean
  completed_at: string
}

export default function CertificatePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUserData = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/auth/login")
        return
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single()

      if (profileError || !profile) {
        router.push("/register")
        return
      }

      setUser(profile)

      // Get latest test attempt if test completed
      if (profile.test_completed) {
        const { data: attempt, error: attemptError } = await supabase
          .from("test_attempts")
          .select("*")
          .eq("user_id", authUser.id)
          .order("completed_at", { ascending: false })
          .limit(1)
          .single()

        if (!attemptError && attempt) {
          setTestAttempt(attempt)
        }
      }

      setIsLoading(false)
    }

    getUserData()
  }, [supabase, router])

  const checkAndIssueCertificate = async () => {
    if (!user || !user.certificate_available_at) return

    const now = new Date()
    const availableAt = new Date(user.certificate_available_at)

    if (now >= availableAt && !user.certificate_issued) {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            certificate_issued: true,
            certificate_url: `certificate-${user.id}.pdf`,
          })
          .eq("id", user.id)

        if (error) throw error

        // Update local state
        setUser((prev) =>
          prev ? { ...prev, certificate_issued: true, certificate_url: `certificate-${user.id}.pdf` } : null,
        )
      } catch (error) {
        console.error("Certificate issuance error:", error)
      }
    }
  }

  const generateCertificate = async () => {
    if (!user || !testAttempt) return

    try {
      // Check if certificate is available
      await checkAndIssueCertificate()

      if (!user.certificate_issued) {
        alert("Certificate is not yet available. Please wait 48 hours after test completion.")
        return
      }

      // In a real implementation, you'd generate a PDF certificate
      alert("Certificate generated successfully!")
    } catch (error) {
      console.error("Certificate generation error:", error)
      alert("Error generating certificate. Please try again.")
    }
  }

  const downloadCertificate = () => {
    // In a real implementation, this would download the actual PDF
    alert("Certificate download feature would be implemented here with a PDF generation service.")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>Please complete your registration first.</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const canGenerateCertificate = user.test_completed && testAttempt?.passed
  const isCertificateAvailable = user.certificate_issued
  const certificateReady = isCertificateAvailable || (canGenerateCertificate && user.certificate_available_at &&
    new Date() >= new Date(user.certificate_available_at))

  return (
    <div className="min-h-screen flex">
      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">
            <DashboardSidebar
              isAdmin={false}
              userName={`${user.first_name} ${user.last_name}`}
              userEmail={user.email}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <DashboardSidebar
        isAdmin={false}
        userName={`${user.first_name} ${user.last_name}`}
        userEmail={user.email}
      />

      <main className="flex-1 overflow-y-auto md:ml-64">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Certificate</h1>
          <div className="w-8" />
        </div>

        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">My Certificate</h1>
              <p className="text-muted-foreground">
                View and download your GSPA certification.
              </p>
            </div>

            {/* Certificate Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Certification Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isCertificateAvailable ? (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-600">Certificate Issued</h3>
                        <p className="text-sm text-muted-foreground">
                          Your certification has been successfully issued
                        </p>
                      </div>
                    </div>
                  ) : certificateReady ? (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Award className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-600">Certificate Ready</h3>
                        <p className="text-sm text-muted-foreground">
                          Your certificate is available for download
                        </p>
                      </div>
                    </div>
                  ) : canGenerateCertificate ? (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-yellow-600">Processing</h3>
                        <p className="text-sm text-muted-foreground">
                          Certificate will be available in 48 hours
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <XCircle className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-600">Not Available</h3>
                        <p className="text-sm text-muted-foreground">
                          Complete the test successfully to earn your certificate
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.test_completed && testAttempt ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Score</span>
                        <Badge variant={testAttempt.passed ? "default" : "secondary"}>
                          {testAttempt.score}/{testAttempt.total_questions}
                        </Badge>
                      </div>
                      <Progress
                        value={(testAttempt.score / testAttempt.total_questions) * 100}
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground">
                        {Math.round((testAttempt.score / testAttempt.total_questions) * 100)}% -{" "}
                        {testAttempt.passed ? "Passed" : "Failed"}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Completed on {new Date(testAttempt.completed_at).toLocaleDateString()}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No test results available</p>
                      <Button asChild className="mt-4" size="sm">
                        <a href="/test">Take Test</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Certificate Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Certificate Actions
                </CardTitle>
                <CardDescription>
                  Generate or download your official GSPA certification.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  {certificateReady && !isCertificateAvailable && (
                    <Button onClick={generateCertificate} className="flex-1">
                      <Award className="h-4 w-4 mr-2" />
                      Generate Certificate
                    </Button>
                  )}

                  {isCertificateAvailable && (
                    <Button onClick={downloadCertificate} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download Certificate
                    </Button>
                  )}

                  {!certificateReady && !canGenerateCertificate && (
                    <div className="flex-1">
                      <Alert>
                        <AlertDescription>
                          Complete the security aptitude test with a passing score to earn your certificate.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {canGenerateCertificate && !certificateReady && (
                    <div className="flex-1">
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          Your certificate will be available 48 hours after test completion.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Certificate Preview Placeholder */}
            {isCertificateAvailable && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Certificate Preview</CardTitle>
                  <CardDescription>
                    Preview of your GSPA certification document.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                    <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Certificate Preview</h3>
                    <p className="text-muted-foreground mb-4">
                      In a production environment, this would display a preview of your certificate.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Certificate ID: GSPA-{user.id.toUpperCase().slice(0, 8)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
