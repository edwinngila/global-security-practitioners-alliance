"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Download, Award, User } from "lucide-react"
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
  signature_data: string | null
  created_at: string
}

export default function DashboardResultsPage() {
  const [results, setResults] = useState<TestResults | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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

      // Check if admin - handled in layout

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
        const correctAnswers = attempt.answers_data.filter((a: any) => a.is_correct).length
        const calculatedScore = Math.min(100, Math.max(0, Math.round((correctAnswers / attempt.total_questions) * 100)))

        setResults({
          score: calculatedScore,
          passed: attempt.passed,
          correctAnswers: correctAnswers,
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

    // Get certificate template (for now using default, later can be configurable)
    const { data: template } = await supabase
      .from("certificate_templates")
      .select("*")
      .eq("is_active", true)
      .single()

    const certificateTemplate = template || {
      organization_name: 'Global Security Practitioners Alliance',
      certificate_title: 'Certificate of Excellence',
      certificate_subtitle: 'Professional Security Certification',
      main_title: 'Certificate of Excellence',
      recipient_title: 'This certifies that',
      achievement_description: 'has demonstrated exceptional mastery and professional excellence in the field of Cybersecurity and Risk Management, successfully completing the comprehensive Security Aptitude Assessment with distinction. This achievement represents a commitment to the highest standards of professional competency in security protocols, threat analysis, compliance frameworks, and emergency response procedures.',
      date_label: 'Date of Achievement',
      score_label: 'Excellence Score',
      certificate_id_label: 'Certification ID',
      signature_name: 'Dr. Alexandra Sterling',
      signature_title: 'Director of Professional Certification',
      signature_organization: 'Global Security Institute',
      background_color: '#fefefe',
      primary_color: '#1a2332',
      accent_color: '#c9aa68',
      font_family: 'Cormorant Garamond, Times New Roman, serif',
      watermark_text: 'CERTIFIED'
    }

    const certificateHTML = `
      <div style="
        width: 1400px;
        height: 1000px;
        background: linear-gradient(135deg, ${certificateTemplate.background_color} 0%, #f8fafc 50%, #ffffff 100%);
        border: 20px solid #1e40af;
        border-radius: 0;
        padding: 0;
        box-shadow: 0 25px 50px rgba(0,0,0,0.15);
        text-align: center;
        position: relative;
        overflow: hidden;
        font-family: ${certificateTemplate.font_family};
        margin: 0 auto;
      ">
        <!-- Logo at the top -->
        <div style="
          position: absolute;
          top: 60px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
        ">
          <img src="/Global-Security-Practitioners-Alliance.png" alt="GSPA Logo" style="height: 100px; width: auto;" />
        </div>

        <!-- Decorative border -->
        <div style="
          position: absolute;
          top: 40px;
          left: 40px;
          right: 40px;
          bottom: 40px;
          border: 4px solid #d97706;
          border-radius: 0;
          pointer-events: none;
        "></div>

        <!-- Decorative corner circles -->
        <div style="
          position: absolute;
          top: 60px;
          left: 60px;
          width: 80px;
          height: 80px;
          border: 6px solid #eab308;
          border-radius: 50%;
          opacity: 0.3;
        "></div>

        <div style="
          position: absolute;
          top: 60px;
          right: 60px;
          width: 80px;
          height: 80px;
          border: 6px solid #1e40af;
          border-radius: 50%;
          opacity: 0.3;
        "></div>

        <div style="
          position: absolute;
          bottom: 60px;
          left: 60px;
          width: 80px;
          height: 80px;
          border: 6px solid #eab308;
          border-radius: 50%;
          opacity: 0.3;
        "></div>

        <div style="
          position: absolute;
          bottom: 60px;
          right: 60px;
          width: 80px;
          height: 80px;
          border: 6px solid #1e40af;
          border-radius: 50%;
          opacity: 0.3;
        "></div>

        <!-- Main content container -->
        <div style="
          position: relative;
          z-index: 10;
          padding: 140px 120px 100px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        ">

          <!-- Header -->
          <div style="margin-bottom: 60px;">
            <div style="
              font-size: 48px;
              font-weight: 900;
              color: #1e40af;
              margin-bottom: 16px;
              letter-spacing: 3px;
              text-transform: uppercase;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">${certificateTemplate.organization_name}</div>

            <div style="
              font-size: 32px;
              font-weight: 700;
              color: #d97706;
              letter-spacing: 2px;
              text-transform: uppercase;
              margin-bottom: 20px;
            ">${certificateTemplate.certificate_subtitle}</div>

            <div style="
              width: 300px;
              height: 6px;
              background: linear-gradient(90deg, #1e40af 0%, #eab308 50%, #d97706 100%);
              margin: 30px auto;
              border-radius: 3px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            "></div>
          </div>

          <!-- Certificate title with elegant typography -->
          <h1 style="
            font-family: 'Playfair Display', serif;
            font-size: 72px;
            font-weight: 700;
            color: ${certificateTemplate.primary_color};
            margin-bottom: 50px;
            line-height: 1.1;
            text-shadow: 0 3px 6px rgba(0,0,0,0.1);
            font-style: italic;
          ">${certificateTemplate.main_title}</h1>

          <!-- Certification text with premium styling -->
          <div style="margin-bottom: 55px;">
            <p style="
              font-size: 28px;
              color: #5a6c7d;
              margin-bottom: 25px;
              font-weight: 600;
              font-style: italic;
              text-align: center;
            ">${certificateTemplate.recipient_title}</p>

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
              ">${certificateTemplate.date_label}</div>
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
              ">${certificateTemplate.score_label}</div>
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
              ">${certificateTemplate.certificate_id_label}</div>
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
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 0 60px;
          ">
            <!-- Signatures on the left -->
            <div style="display: flex; gap: 80px; align-items: flex-end;">
              <!-- Director's Signature -->
              <div style="text-align: center;">
                <div style="
                  width: 300px;
                  height: 3px;
                  background: linear-gradient(90deg, transparent 0%, #1a2332 50%, transparent 100%);
                  margin: 0 auto 15px;
                "></div>
                ${(certificateTemplate as any).director_signature ? `
                <div style="margin-bottom: 15px;">
                  <img src="${(certificateTemplate as any).director_signature}" alt="Director's Signature" style="height: 60px; width: auto; margin: 0 auto; display: block;" />
                </div>
                ` : ''}
                <div style="
                  font-family: 'Playfair Display', serif;
                  font-size: 22px;
                  font-weight: 600;
                  color: ${certificateTemplate.primary_color};
                  margin-bottom: 8px;
                  font-style: italic;
                ">${certificateTemplate.signature_name}</div>
                <div style="
                  font-size: 18px;
                  color: #5a6c7d;
                  font-weight: 500;
                ">${certificateTemplate.signature_title}</div>
                <div style="
                  font-size: 16px;
                  color: #8b7355;
                  margin-top: 4px;
                ">${certificateTemplate.signature_organization}</div>
              </div>

              <!-- User's Signature -->
              ${user?.signature_data ? `
              <div style="text-align: center;">
                <div style="
                  width: 200px;
                  height: 2px;
                  background: linear-gradient(90deg, transparent 0%, #666 50%, transparent 100%);
                  margin: 0 auto 10px;
                "></div>
                <div style="margin-bottom: 10px;">
                  <img src="${user.signature_data}" alt="Recipient's Signature" style="height: 40px; width: auto; margin: 0 auto; display: block;" />
                </div>
                <div style="
                  font-size: 16px;
                  color: #666;
                  font-weight: 500;
                  font-style: italic;
                ">Recipient's Signature</div>
                <div style="
                  font-size: 14px;
                  color: #888;
                  margin-top: 2px;
                ">${user.first_name} ${user.last_name}</div>
              </div>
              ` : ''}
            </div>

            <!-- Certificate Seal on the right -->
            <div style="
              flex-shrink: 0;
              margin-bottom: 20px;
            ">
              <svg width="140" height="140" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r="58" fill="#0d2340" stroke="#a37e37" strokeWidth="2" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#a37e37" strokeWidth="1" strokeDasharray="2 2" />
                <circle cx="60" cy="60" r="42" fill="#a37e37" />
                <circle cx="60" cy="60" r="40" fill="#0d2340" />
                <g fill="#a37e37">
                  <polygon points="60,25 62,31 68,31 63,35 65,41 60,37 55,41 57,35 52,31 58,31" transform="translate(0, 5)" />
                  <polygon points="60,25 62,31 68,31 63,35 65,41 60,37 55,41 57,35 52,31 58,31" transform="translate(0, 45) rotate(180 60 35)" />
                  <polygon points="60,25 62,31 68,31 63,35 65,41 60,37 55,41 57,35 52,31 58,31" transform="translate(-25, 25) rotate(270 60 35)" />
                  <polygon points="60,25 62,31 68,31 63,35 65,41 60,37 55,41 57,35 52,31 58,31" transform="translate(25, 25) rotate(90 60 35)" />
                </g>
                <text x="60" y="55" textAnchor="middle" fill="#a37e37" fontSize="11" fontWeight="bold" fontFamily="serif">GSPA</text>
                <text x="60" y="70" textAnchor="middle" fill="#a37e37" fontSize="9" fontWeight="bold" fontFamily="serif">CERTIFIED</text>
                <path d="M35 85 L45 80 L55 85 L45 90 Z" fill="#a37e37" />
                <path d="M65 85 L75 80 L85 85 L75 90 Z" fill="#a37e37" />
              </svg>
            </div>
          </div>
        </div>

        <!-- GSPA Certified Watermark -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-family: 'Playfair Display', serif;
          font-size: 120px;
          color: rgba(30, 64, 175, 0.08);
          font-weight: 900;
          z-index: 1;
          pointer-events: none;
          letter-spacing: 8px;
        ">GSPA CERTIFIED</div>

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
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!results || !user) {
    return (
      <div className="flex items-center justify-center py-8">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p>No test results found. Please take the test first.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
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
  )
}
