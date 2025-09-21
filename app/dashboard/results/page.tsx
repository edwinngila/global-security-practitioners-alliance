"use client"

import { useState, useEffect, useRef } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Download, Award, User, Menu } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface TestResults {
  score: number
  passed: boolean
  correctAnswers: number
  totalQuestions: number
  userId: string
}

interface UserProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  test_score: number
  test_completed: boolean
  certificate_issued: boolean
  certificate_available_at: string | null
  created_at: string
}

export default function DashboardResultsPage() {
  const [results, setResults] = useState<TestResults | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const certificateRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getResultsAndUser = async () => {
      // First try to get results from localStorage (just completed test)
      const storedResults = localStorage.getItem("test-results")

      if (storedResults) {
        const parsedResults = JSON.parse(storedResults)
        setResults(parsedResults)

        // Get user profile
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", parsedResults.userId).single()

        if (profile) {
          setUser(profile)
        }

        setIsLoading(false)
        return
      }

      // Fallback to authenticated user
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/auth/login")
        return
      }

      // Check if admin
      setIsAdmin(authUser.email === 'admin@gmail.com')

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single()

      if (!profile || !profile.test_completed) {
        router.push("/dashboard")
        return
      }

      setUser(profile)

      // Get latest test attempt
      const { data: attempt } = await supabase
        .from("test_attempts")
        .select("*")
        .eq("user_id", authUser.id)
        .order("completed_at", { ascending: false })
        .limit(1)
        .single()

      if (attempt) {
        setResults({
          score: attempt.score,
          passed: attempt.passed,
          correctAnswers: attempt.answers_data.filter((a: any) => a.is_correct).length,
          totalQuestions: attempt.total_questions,
          userId: authUser.id,
        })
      }

      setIsLoading(false)
    }

    getResultsAndUser()
  }, [supabase, router])

  const isCertificateAvailable = () => {
    if (!user || !user.certificate_available_at) return false
    return new Date() >= new Date(user.certificate_available_at)
  }

  const handleRetakeTest = async () => {
    if (!user) return

    try {
      // Reset test_completed status to allow retaking
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          test_completed: false,
          test_score: null,
          certificate_issued: false,
          certificate_available_at: null,
        })
        .eq("id", user.id)

      if (profileError) throw profileError

      // Clear any ongoing tests
      const { error: ongoingError } = await supabase
        .from("ongoing_tests")
        .delete()
        .eq("user_id", user.id)

      if (ongoingError) console.error("Error clearing ongoing tests:", ongoingError)

      // Clear local storage
      localStorage.removeItem("test-results")
      localStorage.removeItem("test-progress")
      localStorage.removeItem("ongoing-test-backup")

      // Redirect to test page
      router.push("/dashboard/test")
    } catch (error) {
      console.error("Error resetting test status:", error)
      alert("Error preparing retake. Please try again.")
    }
  }

  const downloadCertificate = async () => {
    if (!user || !results?.passed) return

    // Dynamically import client-side libraries
    const { default: jsPDF } = await import("jspdf")
    const { default: html2canvas } = await import("html2canvas")

    const certificateHTML = `
      <div style="
        width: 1400px;
        height: 1000px;
        background: linear-gradient(135deg, #fefefe 0%, #f8f9fb 50%, #ffffff 100%);
        border: none;
        border-radius: 0;
        padding: 0;
        box-shadow: none;
        text-align: center;
        position: relative;
        overflow: hidden;
        font-family: 'Cormorant Garamond', 'Times New Roman', serif;
        margin: 0 auto;
      ">
        <!-- Elegant border frame -->
        <div style="
          position: absolute;
          top: 40px;
          left: 40px;
          right: 40px;
          bottom: 40px;
          border: 8px solid #1a2332;
          border-radius: 12px;
        "></div>

        <div style="
          position: absolute;
          top: 60px;
          left: 60px;
          right: 60px;
          bottom: 60px;
          border: 2px solid #c9aa68;
          border-radius: 8px;
        "></div>

        <!-- Decorative corner flourishes -->
        <div style="
          position: absolute;
          top: 80px;
          left: 80px;
          width: 120px;
          height: 120px;
          background: radial-gradient(circle, #c9aa68 0%, transparent 70%);
          opacity: 0.3;
          border-radius: 50%;
        "></div>

        <div style="
          position: absolute;
          top: 80px;
          right: 80px;
          width: 120px;
          height: 120px;
          background: radial-gradient(circle, #c9aa68 0%, transparent 70%);
          opacity: 0.3;
          border-radius: 50%;
        "></div>

        <div style="
          position: absolute;
          bottom: 80px;
          left: 80px;
          width: 120px;
          height: 120px;
          background: radial-gradient(circle, #c9aa68 0%, transparent 70%);
          opacity: 0.3;
          border-radius: 50%;
        "></div>

        <div style="
          position: absolute;
          bottom: 80px;
          right: 80px;
          width: 120px;
          height: 120px;
          background: radial-gradient(circle, #c9aa68 0%, transparent 70%);
          opacity: 0.3;
          border-radius: 50%;
        "></div>

        <!-- Main content container -->
        <div style="
          position: relative;
          z-index: 10;
          padding: 100px 120px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        ">

          <!-- Premium header with seal -->
          <div style="margin-bottom: 60px;">
            <div style="
              width: 140px;
              height: 140px;
              background: linear-gradient(135deg, #1a2332 0%, #2c3e50 100%);
              border-radius: 50%;
              margin: 0 auto 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #c9aa68;
              font-size: 64px;
              font-weight: 700;
              box-shadow: 0 15px 40px rgba(26, 35, 50, 0.4);
              border: 6px solid #c9aa68;
              position: relative;
            ">
              <div style="
                position: absolute;
                inset: -3px;
                border: 2px solid #1a2332;
                border-radius: 50%;
              "></div>
              ⚡
            </div>

            <div style="
              font-family: 'Playfair Display', serif;
              font-size: 42px;
              font-weight: 800;
              color: #1a2332;
              margin-bottom: 12px;
              letter-spacing: 2px;
              text-transform: uppercase;
            ">GLOBAL SECURITY INSTITUTE</div>

            <div style="
              font-size: 28px;
              font-weight: 600;
              color: #5a6c7d;
              letter-spacing: 4px;
              text-transform: uppercase;
            ">PROFESSIONAL CERTIFICATION</div>

            <div style="
              width: 200px;
              height: 4px;
              background: linear-gradient(90deg, #c9aa68 0%, #d4af37 50%, #c9aa68 100%);
              margin: 30px auto;
              border-radius: 2px;
            "></div>
          </div>

          <!-- Certificate title with elegant typography -->
          <h1 style="
            font-family: 'Playfair Display', serif;
            font-size: 72px;
            font-weight: 700;
            color: #1a2332;
            margin-bottom: 50px;
            line-height: 1.1;
            text-shadow: 0 3px 6px rgba(0,0,0,0.1);
            font-style: italic;
          ">Certificate of Excellence</h1>

          <!-- Certification text with premium styling -->
          <div style="margin-bottom: 55px;">
            <p style="
              font-size: 26px;
              color: #5a6c7d;
              margin-bottom: 25px;
              font-weight: 500;
              font-style: italic;
            ">This certifies that</p>

            <div style="
              font-family: 'Playfair Display', serif;
              font-size: 58px;
              font-weight: 700;
              color: #1a2332;
              margin-bottom: 40px;
              padding: 20px 50px;
              border-bottom: 6px solid #c9aa68;
              display: inline-block;
              min-width: 600px;
              background: linear-gradient(90deg, rgba(201,170,104,0.08) 0%, rgba(212,175,55,0.12) 50%, rgba(201,170,104,0.08) 100%);
              border-radius: 8px;
              position: relative;
            ">${user?.first_name} ${user?.last_name}
              <div style="
                position: absolute;
                bottom: -3px;
                left: 50%;
                transform: translateX(-50%);
                width: 80%;
                height: 2px;
                background: #d4af37;
              "></div>
            </div>
          </div>

          <!-- Achievement description with elegant formatting -->
          <p style="
            font-size: 24px;
            color: #5a6c7d;
            line-height: 1.8;
            margin-bottom: 60px;
            max-width: 900px;
            margin-left: auto;
            margin-right: auto;
            font-weight: 400;
            text-align: justify;
            text-justify: inter-word;
          ">
            has demonstrated exceptional mastery and professional excellence in the field of
            <strong style="color: #1a2332;">Cybersecurity and Risk Management</strong>, successfully completing
            the comprehensive Security Aptitude Assessment with distinction. This achievement represents
            a commitment to the highest standards of professional competency in security protocols,
            threat analysis, compliance frameworks, and emergency response procedures.
          </p>

          <!-- Premium bottom section with enhanced styling -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 70px;
            padding-top: 50px;
            border-top: 3px solid #c9aa68;
            position: relative;
          ">
            <!-- Decorative elements on border -->
            <div style="
              position: absolute;
              top: -8px;
              left: 50%;
              transform: translateX(-50%);
              width: 16px;
              height: 16px;
              background: #c9aa68;
              border-radius: 50%;
            "></div>

            <!-- Date with elegant styling -->
            <div style="text-align: center; flex: 1;">
              <div style="
                font-size: 16px;
                color: #8b7355;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-bottom: 12px;
                font-weight: 600;
              ">Date of Achievement</div>
              <div style="
                font-family: 'Playfair Display', serif;
                font-size: 22px;
                font-weight: 600;
                color: #1a2332;
              ">${new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</div>
            </div>

            <!-- Premium score badge -->
            <div style="text-align: center; flex: 1;">
              <div style="
                font-size: 16px;
                color: #8b7355;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-bottom: 12px;
                font-weight: 600;
              ">Excellence Score</div>
              <div style="
                background: linear-gradient(135deg, #c9aa68 0%, #d4af37 50%, #c9aa68 100%);
                color: #1a2332;
                padding: 16px 35px;
                border-radius: 30px;
                font-weight: 800;
                font-size: 24px;
                display: inline-block;
                box-shadow: 0 8px 25px rgba(201, 170, 104, 0.4);
                border: 2px solid #1a2332;
                font-family: 'Playfair Display', serif;
              ">${results?.score}%</div>
            </div>

            <!-- Certificate ID with premium styling -->
            <div style="text-align: center; flex: 1;">
              <div style="
                font-size: 16px;
                color: #8b7355;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-bottom: 12px;
                font-weight: 600;
              ">Certification ID</div>
              <div style="
                font-size: 20px;
                font-weight: 700;
                color: #1a2332;
                font-family: 'Courier New', monospace;
                background: rgba(201,170,104,0.1);
                padding: 8px 16px;
                border-radius: 6px;
                border: 1px solid #c9aa68;
              ">GSI-${user?.id.slice(0, 8).toUpperCase()}</div>
            </div>
          </div>

          <!-- Signature section with enhanced elegance -->
          <div style="
            margin-top: 60px;
            text-align: center;
          ">
            <div style="
              width: 300px;
              height: 3px;
              background: linear-gradient(90deg, transparent 0%, #1a2332 50%, transparent 100%);
              margin: 0 auto 15px;
            "></div>
            <div style="
              font-family: 'Playfair Display', serif;
              font-size: 22px;
              font-weight: 600;
              color: #1a2332;
              margin-bottom: 8px;
              font-style: italic;
            ">Dr. Alexandra Sterling</div>
            <div style="
              font-size: 18px;
              color: #5a6c7d;
              font-weight: 500;
            ">Director of Professional Certification</div>
            <div style="
              font-size: 16px;
              color: #8b7355;
              margin-top: 4px;
            ">Global Security Institute</div>
          </div>
        </div>

        <!-- Subtle watermark -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-family: 'Playfair Display', serif;
          font-size: 140px;
          color: rgba(26, 35, 50, 0.02);
          font-weight: 900;
          z-index: 1;
          pointer-events: none;
        ">CERTIFIED</div>

        <!-- Security pattern overlay -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: radial-gradient(circle at 20% 20%, rgba(201,170,104,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(26,35,50,0.02) 0%, transparent 50%);
          pointer-events: none;
          z-index: 1;
        "></div>
      </div>
    `

    // Create temporary element
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = certificateHTML
    tempDiv.style.position = "absolute"
    tempDiv.style.left = "-9999px"
    tempDiv.style.top = "-9999px"
    document.body.appendChild(tempDiv)

    try {
      // Use html2canvas to capture the certificate
      const canvas = await html2canvas(tempDiv.firstElementChild as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#f8fafc",
      })

      // Create PDF in landscape
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      })

      // Add the canvas image to PDF
      const imgData = canvas.toDataURL("image/png")
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height)

      // Download the PDF
      pdf.save(`GSI-Certificate-${user?.first_name}-${user?.last_name}.pdf`)
    } catch (error) {
      console.error("Error generating certificate PDF:", error)
      alert("Error generating certificate. Please try again.")
    } finally {
      // Clean up
      document.body.removeChild(tempDiv)
    }
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

  if (!results || !user) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <p>No test results found. Please take the test first.</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
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
          <h1 className="text-lg font-semibold">Test Results</h1>
          <div className="w-8" /> {/* Spacer */}
        </div>

        {/* Results Content */}
        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Results Header */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                {results.passed ? (
                  <CheckCircle className="h-20 w-20 text-green-500" />
                ) : (
                  <XCircle className="h-20 w-20 text-red-500" />
                )}
              </div>
              <h1 className="text-4xl font-bold mb-4">{results.passed ? "Congratulations!" : "Test Complete"}</h1>
              <p className="text-xl text-muted-foreground">
                {results.passed
                  ? "You have successfully passed the Security Aptitude Test"
                  : "You did not meet the passing requirements this time"}
              </p>
            </div>

            {/* Results Card */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-6 w-6" />
                  Test Results
                </CardTitle>
                <CardDescription>Your performance on the Security Aptitude Test</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{results.score}%</div>
                    <p className="text-sm text-muted-foreground">Final Score</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {results.correctAnswers}/{results.totalQuestions}
                    </div>
                    <p className="text-sm text-muted-foreground">Correct Answers</p>
                  </div>
                  <div className="text-center">
                    <Badge variant={results.passed ? "default" : "destructive"} className="text-lg px-4 py-2">
                      {results.passed ? "PASSED" : "FAILED"}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      {results.passed ? "70% or higher required" : "70% required to pass"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Information */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-6 w-6" />
                  Candidate Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <p className="text-sm text-muted-foreground">Test Date</p>
                    <p className="font-semibold">
                      {new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Certificate ID</p>
                    <p className="font-semibold">GSI-{user.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certificate Section */}
            {results.passed && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-6 w-6" />
                    Your Certificate
                  </CardTitle>
                  <CardDescription>
                    {isCertificateAvailable()
                      ? "Download your official Security Professional Certificate"
                      : "Your certificate will be available for download in 48 hours"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    {isCertificateAvailable() ? (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg border-2 border-dashed border-blue-200">
                        <Award className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-blue-900 mb-2">Security Professional Certificate</h3>
                        <p className="text-blue-700 mb-4">
                          Congratulations on achieving your certification! Your certificate is ready for download.
                        </p>
                        <Button onClick={downloadCertificate} size="lg" className="gap-2">
                          <Download className="h-5 w-5" />
                          Download Certificate
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-8 rounded-lg border-2 border-dashed border-yellow-200">
                        <Award className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-yellow-900 mb-2">Certificate Processing</h3>
                        <p className="text-yellow-700 mb-4">
                          Your certificate is being processed and will be available for download in 48 hours.
                        </p>
                        <p className="text-sm text-yellow-600">
                          Available on: {user?.certificate_available_at ? new Date(user.certificate_available_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Your certificate will be downloaded as a professional PDF file in landscape orientation.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            <div className="mt-12 text-center">
              {results.passed ? (
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold">What's Next?</h3>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    You are now a certified Security Professional! Share your achievement and continue your professional
                    development with advanced security courses and resources.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button asChild>
                      <Link href="/dashboard">View Dashboard</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/">Return Home</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold">Don't Give Up!</h3>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    You can retake the test after reviewing the study materials. Each attempt will have different
                    questions to ensure a fair assessment.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={handleRetakeTest}>
                      Retake Test
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/dashboard">Return to Dashboard</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}