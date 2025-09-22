"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Award, Download, CheckCircle, XCircle, Clock, FileText, User, Calendar, Menu } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

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

interface OngoingTest {
  id: string
  user_id: string
  questions_data: any[]
  answers_data: Record<string, string>
  current_question: number
  time_left: number
  test_started: boolean
  started_at: string
  updated_at: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null)
  const [ongoingTest, setOngoingTest] = useState<OngoingTest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
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

      // Check if user is admin
      setIsAdmin(authUser.email === 'admin@gmail.com')

      // Check and issue certificate if available
      await checkAndIssueCertificate()

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
      } else {
        // Check for ongoing test
        const { data: ongoing, error: ongoingError } = await supabase
          .from("ongoing_tests")
          .select("*")
          .eq("user_id", authUser.id)
          .single()

        if (!ongoingError && ongoing) {
          setOngoingTest(ongoing)
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
            certificate_url: `certificate-${user.id}.pdf`, // Placeholder URL
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
      // For now, we'll just confirm it's issued
      alert("Certificate is ready for download!")
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

  return (
    <div className="min-h-screen flex">
      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">
            <DashboardSidebar
              isAdmin={isAdmin}
              userName={`${user.first_name} ${user.last_name}`}
              userEmail={user.email}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <DashboardSidebar
        isAdmin={isAdmin}
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
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <div className="w-8" /> {/* Spacer */}
        </div>

        {/* Dashboard Content */}
        <div className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user.first_name}! Here's your certification progress.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {/* Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-semibold">
                      {user.first_name} {user.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registration Date</p>
                    <p className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Membership Status</p>
                    <Badge variant={user.membership_fee_paid ? "default" : "secondary"}>
                      {user.membership_fee_paid ? "Active Member" : "Pending Payment"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Test Payment Status</p>
                    <Badge variant={user.payment_status === "completed" ? "default" : "secondary"}>
                      {user.payment_status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Test Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Test Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ongoingTest ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-600">Test In Progress</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You have an ongoing security aptitude test. Continue where you left off.
                      </p>
                      <div className="text-sm space-y-1">
                        <p>Progress: Question {ongoingTest.current_question + 1} of {ongoingTest.questions_data.length}</p>
                        <p>Answered: {Object.keys(ongoingTest.answers_data).length} questions</p>
                        {ongoingTest.test_started && (
                          <p>Time Remaining: {Math.floor(ongoingTest.time_left / 60)}:{(ongoingTest.time_left % 60).toString().padStart(2, '0')}</p>
                        )}
                      </div>
                      <Button asChild className="w-full">
                        <Link href="/dashboard/test">Continue Test</Link>
                      </Button>
                    </>
                  ) : user.test_completed ? (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-600">Test Completed</span>
                      </div>
                      {testAttempt && (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground">Score</p>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={(testAttempt.score / testAttempt.total_questions) * 100}
                                className="flex-1"
                              />
                              <span className="font-semibold">
                                {testAttempt.score}/{testAttempt.total_questions}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {Math.round((testAttempt.score / testAttempt.total_questions) * 100)}% -{" "}
                              {testAttempt.passed ? "Passed" : "Failed"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Completed On</p>
                            <p className="font-semibold">{new Date(testAttempt.completed_at).toLocaleDateString()}</p>
                          </div>
                          {!testAttempt.passed && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-800">
                                You scored below 50%. You can retake the test for $35.
                              </p>
                              <Button asChild variant="outline" className="w-full mt-2">
                                <Link href="/dashboard/payment?type=retake">Retake Test ($35)</Link>
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : !user.membership_fee_paid ? (
                    <>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-600">Membership Required</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Complete your membership payment to access the test.</p>
                      <Button asChild variant="outline" className="w-full bg-transparent">
                        <Link href="/dashboard/payment">Complete Membership Payment</Link>
                      </Button>
                    </>
                  ) : user.payment_status === "completed" ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-600">Test Available</span>
                      </div>
                      <p className="text-sm text-muted-foreground">You can now take the security aptitude test.</p>
                      <Button asChild className="w-full">
                        <Link href="/dashboard/test">Start Test</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-600">Test Payment Required</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Complete your test payment to access the aptitude test.</p>
                      <Button asChild variant="outline" className="w-full bg-transparent">
                        <Link href="/dashboard/payment">Complete Test Payment</Link>
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Certificate Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certificate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.certificate_issued ? (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-600">Certificate Issued</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Your GSPA certification has been issued successfully.
                      </p>
                      <Button onClick={downloadCertificate} className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download Certificate
                      </Button>
                    </>
                  ) : user.test_completed && testAttempt?.passed ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-600">Certificate Available</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Congratulations! Generate your certificate now.</p>
                      <Button onClick={generateCertificate} className="w-full">
                        Generate Certificate
                      </Button>
                    </>
                  ) : user.test_completed && testAttempt && !testAttempt.passed ? (
                    <>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-600">Test Failed</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You need to score at least 70% to receive a certificate. You can retake the test after 30 days.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-gray-600" />
                        <span className="font-semibold text-gray-600">Not Available</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Complete the test successfully to receive your certificate.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Next Steps */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
                <CardDescription>Here's what you can do next in your certification journey.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {!user.test_completed && user.payment_status === "completed" && (
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <h3 className="font-semibold mb-2">Take the Test</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Complete the security aptitude assessment to earn your certification.
                      </p>
                      <Button asChild size="sm">
                        <Link href="/dashboard/test">Start Test</Link>
                      </Button>
                    </div>
                  )}

                  {user.test_completed && testAttempt?.passed && !user.certificate_issued && (
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <h3 className="font-semibold mb-2">Get Certified</h3>
                      <p className="text-sm text-muted-foreground mb-4">Generate your official GSPA certificate.</p>
                      <Button onClick={generateCertificate} size="sm">
                        Generate Certificate
                      </Button>
                    </div>
                  )}

                  {user.certificate_issued && (
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold mb-2">Share Your Achievement</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Share your certification on LinkedIn and other professional networks.
                      </p>
                      <Button variant="outline" size="sm">
                        Share on LinkedIn
                      </Button>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">Join the Community</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect with other certified security professionals worldwide.
                    </p>
                    <Button variant="outline" size="sm">
                      Join Community
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
