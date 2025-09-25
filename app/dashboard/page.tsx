"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Award, Download, CheckCircle, XCircle, Clock, FileText, User, Calendar, BookOpen } from "lucide-react"
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

interface ModuleEnrollment {
  id: string
  module_id: string
  module_title: string
  progress_percentage: number
  payment_status: string
  completed_at: string | null
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
   const [moduleEnrollments, setModuleEnrollments] = useState<ModuleEnrollment[]>([])
   const [isLoading, setIsLoading] = useState(true)
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

      // Get user's module enrollments with module details
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("module_enrollments")
        .select(`
          id,
          module_id,
          progress_percentage,
          payment_status,
          completed_at
        `)
        .eq("user_id", authUser.id)
        .eq("payment_status", "completed")

      if (!enrollmentsError && enrollments) {
        // Get module titles separately to avoid join issues
        const moduleIds = enrollments.map(e => e.module_id)
        if (moduleIds.length > 0) {
          const { data: modules, error: modulesError } = await supabase
            .from("modules")
            .select("id, title")
            .in("id", moduleIds)

          if (!modulesError && modules) {
            const moduleMap = modules.reduce((acc, module) => {
              acc[module.id] = module.title
              return acc
            }, {} as Record<string, string>)

            const formattedEnrollments = enrollments.map(enrollment => ({
              id: enrollment.id,
              module_id: enrollment.module_id,
              module_title: moduleMap[enrollment.module_id] || 'Unknown Module',
              progress_percentage: enrollment.progress_percentage,
              payment_status: enrollment.payment_status,
              completed_at: enrollment.completed_at
            }))
            setModuleEnrollments(formattedEnrollments)
          }
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
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-8">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>Please complete your registration first.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-muted/10 to-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground text-base md:text-lg">
                Welcome back, {user.first_name}! Here's your certification progress.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 md:mb-12">
          {/* Profile Card */}
          <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Profile Information</CardTitle>
                <div className="text-2xl font-bold mt-2">{user.first_name} {user.last_name}</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <User className="h-6 w-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-muted-foreground">
                  Member since {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Membership</span>
                  <Badge variant={user.membership_fee_paid ? "default" : "secondary"}>
                    {user.membership_fee_paid ? "Active" : "Pending"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Test Access</span>
                  <Badge variant={user.payment_status === "completed" ? "default" : "secondary"}>
                    {user.payment_status === "completed" ? "Paid" : "Pending"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Status Card */}
          <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Test Status</CardTitle>
                <div className="text-2xl font-bold mt-2">
                  {ongoingTest ? "In Progress" : user.test_completed ? "Completed" : "Not Started"}
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                {ongoingTest ? (
                  <>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-muted-foreground">
                      Question {ongoingTest.current_question + 1} of {ongoingTest.questions_data.length}
                    </p>
                  </>
                ) : user.test_completed ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm text-muted-foreground">
                      Completed {testAttempt ? new Date(testAttempt.completed_at).toLocaleDateString() : ''}
                    </p>
                  </>
                ) : user.payment_status === "completed" ? (
                  <>
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-sm text-muted-foreground">
                      Ready to start
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <p className="text-sm text-muted-foreground">
                      Payment required
                    </p>
                  </>
                )}
              </div>

              {ongoingTest && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round((ongoingTest.current_question / ongoingTest.questions_data.length) * 100)}%</span>
                  </div>
                  <Progress value={(ongoingTest.current_question / ongoingTest.questions_data.length) * 100} />
                  {ongoingTest.test_started && (
                    <p className="text-xs text-muted-foreground">
                      Time: {Math.floor(ongoingTest.time_left / 60)}:{(ongoingTest.time_left % 60).toString().padStart(2, '0')} remaining
                    </p>
                  )}
                </div>
              )}

              {user.test_completed && testAttempt && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Score</span>
                    <span>{Math.round((testAttempt.score / testAttempt.total_questions) * 100)}%</span>
                  </div>
                  <Progress value={(testAttempt.score / testAttempt.total_questions) * 100} />
                  <p className="text-xs text-muted-foreground">
                    {testAttempt.score}/{testAttempt.total_questions} - {testAttempt.passed ? "Passed" : "Failed"}
                  </p>
                </div>
              )}

              <div className="mt-4">
                {ongoingTest ? (
                  <Button asChild className="w-full">
                    <Link href="/dashboard/test">Continue Test</Link>
                  </Button>
                ) : user.test_completed ? (
                  !testAttempt?.passed && (
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/dashboard/payment?type=retake">Retake Test ($35)</Link>
                    </Button>
                  )
                ) : !user.membership_fee_paid ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/payment">Complete Membership</Link>
                  </Button>
                ) : user.payment_status === "completed" ? (
                  <Button asChild className="w-full">
                    <Link href="/dashboard/test">Start Test</Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/payment">Complete Payment</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Certificate Card */}
          <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Certificate</CardTitle>
                <div className="text-2xl font-bold mt-2">
                  {user.certificate_issued ? "Issued" : user.test_completed && testAttempt?.passed ? "Available" : "Pending"}
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Award className="h-6 w-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                {user.certificate_issued ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm text-muted-foreground">
                      Certificate issued and ready for download
                    </p>
                  </>
                ) : user.test_completed && testAttempt?.passed ? (
                  <>
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-sm text-muted-foreground">
                      Ready to generate certificate
                    </p>
                  </>
                ) : user.test_completed && testAttempt && !testAttempt.passed ? (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <p className="text-sm text-muted-foreground">
                      Test failed - minimum 70% required
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <p className="text-sm text-muted-foreground">
                      Complete test to earn certificate
                    </p>
                  </>
                )}
              </div>

              <div className="mt-4">
                {user.certificate_issued ? (
                  <Button onClick={downloadCertificate} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Certificate
                  </Button>
                ) : user.test_completed && testAttempt?.passed ? (
                  <Button onClick={generateCertificate} className="w-full">
                    Generate Certificate
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modules Section */}
        {moduleEnrollments.length > 0 && (
          <div className="mb-8 md:mb-12">
            <Card className="border-0 bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">My Modules</CardTitle>
                    <CardDescription>Your enrolled training modules</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {moduleEnrollments.map((enrollment) => (
                    <Card key={enrollment.id} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {enrollment.module_title}
                          </h4>
                          {enrollment.completed_at && (
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 ml-2" />
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span>{enrollment.progress_percentage}%</span>
                          </div>
                          <Progress value={enrollment.progress_percentage} className="h-2" />

                          <Button
                            asChild
                            size="sm"
                            className="w-full text-xs"
                            variant={enrollment.progress_percentage === 100 ? "outline" : "default"}
                          >
                            <Link href={`/dashboard/my-modules/${enrollment.module_id}`}>
                              {enrollment.progress_percentage === 100 ? 'Review Module' : 'Continue Learning'}
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions & Next Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mt-8 md:mt-12">
          <Card className="border-0 bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Next Steps</CardTitle>
                  <CardDescription>Your certification journey</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {!user.test_completed && user.payment_status === "completed" && (
                  <div className="group p-4 bg-gradient-to-br from-muted/20 to-muted/10 rounded-xl border border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-base mb-1">Take the Test</div>
                        <div className="text-sm text-muted-foreground mb-3 leading-relaxed">
                          Complete the security aptitude assessment to earn your certification.
                        </div>
                        <Button asChild size="sm">
                          <Link href="/dashboard/test">Start Test</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {user.test_completed && testAttempt?.passed && !user.certificate_issued && (
                  <div className="group p-4 bg-gradient-to-br from-muted/20 to-muted/10 rounded-xl border border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <Award className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-base mb-1">Get Certified</div>
                        <div className="text-sm text-muted-foreground mb-3 leading-relaxed">
                          Generate your official GSPA certificate.
                        </div>
                        <Button onClick={generateCertificate} size="sm">
                          Generate Certificate
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {user.certificate_issued && (
                  <div className="group p-4 bg-gradient-to-br from-muted/20 to-muted/10 rounded-xl border border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-base mb-1">Share Your Achievement</div>
                        <div className="text-sm text-muted-foreground mb-3 leading-relaxed">
                          Share your certification on LinkedIn and other professional networks.
                        </div>
                        <Button variant="outline" size="sm">
                          Share on LinkedIn
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Module Enrollment Suggestion */}
                <div className="group p-4 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-base mb-1">Explore Training Modules</div>
                      <div className="text-sm text-muted-foreground mb-3 leading-relaxed">
                        Enhance your skills with our comprehensive training modules covering various cybersecurity topics.
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/modules">Browse Modules</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Community & Resources</CardTitle>
                  <CardDescription>Connect and learn more</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="group p-4 bg-gradient-to-br from-muted/20 to-muted/10 rounded-xl border border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-base mb-1">Join the Community</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        Connect with other certified security professionals worldwide.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group p-4 bg-gradient-to-br from-muted/20 to-muted/10 rounded-xl border border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-base mb-1">Learning Resources</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        Access additional training materials and security best practices.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
