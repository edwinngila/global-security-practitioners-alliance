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
      const { error: ongoingError } = await supabase.from("ongoing_tests").delete().eq("user_id", user.id)

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

    // Get certificate template
    const { data: template } = await supabase.from("certificate_templates").select("*").eq("is_active", true).single()

    const certificateTemplate = template || {
      organization_name: "Global Security Practitioners Alliance",
      certificate_title: "Certificate of Excellence",
      certificate_subtitle: "Professional Security Certification",
      main_title: "Certificate of Excellence",
      recipient_title: "This certifies that",
      achievement_description:
        "has demonstrated exceptional mastery and professional excellence in the field of Cybersecurity and Risk Management, successfully completing the comprehensive Security Aptitude Assessment with distinction. This achievement represents a commitment to the highest standards of professional competency in security protocols, threat analysis, compliance frameworks, and emergency response procedures.",
      date_label: "Date of Achievement",
      score_label: "Excellence Score",
      certificate_id_label: "Certification ID",
      signature_name: "Dr. Alexandra Sterling",
      signature_title: "Director of Professional Certification",
      signature_organization: "Global Security Institute",
      background_color: "#fef7e6",
      primary_color: "#1a2332",
      accent_color: "#c9aa68",
      font_family: "Georgia, Times New Roman, serif",
      watermark_text: "CERTIFIED",
    }

    const certificateHTML = `
    <div style="
  width: 1000px;
  height: 750px;
  background: linear-gradient(135deg, #f8f6f0 0%, #f5f1e8 25%, #f2ede0 50%, #efe8d8 75%, #ece3d0 100%);
  border: 20px solid #1a365d;
  padding: 0;
  box-shadow: 
    0 0 0 8px #d4af37,
    0 0 0 12px #1a365d,
    0 20px 60px rgba(0,0,0,0.3),
    inset 0 0 100px rgba(212,175,55,0.1);
  text-align: center;
  position: relative;
  overflow: hidden;
  font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
  margin: 0 auto;
">
  <!-- Elegant parchment texture overlay -->
  <div style="
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" opacity=\"0.03\"><filter id=\"noise\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.7\" numOctaves=\"2\" /></filter><rect width=\"200\" height=\"200\" filter=\"url(%23noise)\" /></svg>'),
      radial-gradient(circle at 25% 25%, rgba(255,255,255,0.3) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(255,255,255,0.2) 0%, transparent 50%),
      linear-gradient(45deg, transparent 48%, rgba(212,175,55,0.05) 49%, rgba(212,175,55,0.05) 51%, transparent 52%);
    pointer-events: none;
    z-index: 1;
  "></div>

  <!-- Ornate corner flourishes -->
  <div style="
    position: absolute;
    top: 30px;
    left: 30px;
    width: 120px;
    height: 120px;
    background: radial-gradient(circle, #d4af37 0%, transparent 70%);
    opacity: 0.1;
    border-radius: 50%;
  "></div>
  <div style="
    position: absolute;
    top: 30px;
    right: 30px;
    width: 120px;
    height: 120px;
    background: radial-gradient(circle, #d4af37 0%, transparent 70%);
    opacity: 0.1;
    border-radius: 50%;
  "></div>
  <div style="
    position: absolute;
    bottom: 30px;
    left: 30px;
    width: 120px;
    height: 120px;
    background: radial-gradient(circle, #d4af37 0%, transparent 70%);
    opacity: 0.1;
    border-radius: 50%;
  "></div>
  <div style="
    position: absolute;
    bottom: 30px;
    right: 30px;
    width: 120px;
    height: 120px;
    background: radial-gradient(circle, #d4af37 0%, transparent 70%);
    opacity: 0.1;
    border-radius: 50%;
  "></div>

  <!-- Decorative corner borders -->
  <div style="
    position: absolute;
    top: 40px;
    left: 40px;
    width: 100px;
    height: 100px;
    border-top: 4px solid #d4af37;
    border-left: 4px solid #d4af37;
    opacity: 0.8;
  "></div>
  <div style="
    position: absolute;
    top: 50px;
    left: 50px;
    width: 80px;
    height: 80px;
    border-top: 2px solid #1a365d;
    border-left: 2px solid #1a365d;
    opacity: 0.6;
  "></div>
  <div style="
    position: absolute;
    top: 40px;
    right: 40px;
    width: 100px;
    height: 100px;
    border-top: 4px solid #d4af37;
    border-right: 4px solid #d4af37;
    opacity: 0.8;
  "></div>
  <div style="
    position: absolute;
    top: 50px;
    right: 50px;
    width: 80px;
    height: 80px;
    border-top: 2px solid #1a365d;
    border-right: 2px solid #1a365d;
    opacity: 0.6;
  "></div>
  <div style="
    position: absolute;
    bottom: 40px;
    left: 40px;
    width: 100px;
    height: 100px;
    border-bottom: 4px solid #d4af37;
    border-left: 4px solid #d4af37;
    opacity: 0.8;
  "></div>
  <div style="
    position: absolute;
    bottom: 50px;
    left: 50px;
    width: 80px;
    height: 80px;
    border-bottom: 2px solid #1a365d;
    border-left: 2px solid #1a365d;
    opacity: 0.6;
  "></div>
  <div style="
    position: absolute;
    bottom: 40px;
    right: 40px;
    width: 100px;
    height: 100px;
    border-bottom: 4px solid #d4af37;
    border-right: 4px solid #d4af37;
    opacity: 0.8;
  "></div>
  <div style="
    position: absolute;
    bottom: 50px;
    right: 50px;
    width: 80px;
    height: 80px;
    border-bottom: 2px solid #1a365d;
    border-right: 2px solid #1a365d;
    opacity: 0.6;
  "></div>

  <!-- Organization logo at the top -->
  <div style="
    position: absolute;
    top: 100px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
  ">
    <div style="
      background: linear-gradient(135deg, #1a365d, #2d4a6b);
      padding: 20px;
      border-radius: 50%;
      box-shadow: 
        0 8px 25px rgba(0,0,0,0.3),
        0 0 0 5px #d4af37,
        0 0 0 8px #1a365d;
      border: 3px solid #f8f6f0;
    ">
      <img src="/Global-Security-Practitioners-Alliance.png" alt="GSPA Logo" style="height: 80px; width: auto;" />
    </div>
  </div>

  <!-- Main content container -->
  <div style="
    position: relative;
    z-index: 10;
    padding: 160px 80px 60px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  ">

    <!-- Organization Name with elegant styling -->
    <div style="
      font-size: 28px;
      font-weight: 700;
      color: #1a365d;
      margin-bottom: 15px;
      letter-spacing: 3px;
      text-transform: uppercase;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    ">Global Security Practitioners Alliance</div>

    <!-- Decorative line -->
    <div style="
      width: 300px;
      height: 3px;
      background: linear-gradient(90deg, transparent, #d4af37, transparent);
      margin: 0 auto 20px;
    "></div>

    <!-- Certificate Title with enhanced typography -->
    <div style="margin-bottom: 40px;">
      <div style="
        font-size: 48px;
        font-weight: bold;
        color: #1a365d;
        letter-spacing: 4px;
        margin-bottom: 8px;
        text-shadow: 0 3px 6px rgba(0,0,0,0.1);
      ">CERTIFICATE</div>
      <div style="
        font-size: 24px;
        color: #d4af37;
        letter-spacing: 8px;
        font-weight: 600;
        margin-top: -5px;
      ">OF PROFESSIONAL EXCELLENCE</div>
    </div>

    <!-- Recipient section with elegant presentation -->
    <div style="margin: 30px 0;">
      <div style="
        font-size: 18px;
        color: #1a365d;
        margin-bottom: 15px;
        font-style: italic;
      ">This is to certify that</div>
      <div style="
        font-size: 36px;
        font-weight: bold;
        color: #1a365d;
        margin: 20px 0;
        padding: 12px 0;
        border-top: 3px solid #d4af37;
        border-bottom: 3px solid #d4af37;
        background: linear-gradient(90deg, transparent, rgba(212,175,55,0.1), transparent);
        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
      ">${user?.first_name || "First Name"} ${user?.last_name || "Last Name"}</div>
    </div>

    <!-- Achievement description with professional formatting -->
    <div style="
      font-size: 16px;
      line-height: 1.6;
      color: #1a365d;
      margin: 25px 0;
      max-width: 700px;
      margin-left: auto;
      margin-right: auto;
      text-align: justify;
      font-style: italic;
    ">has demonstrated exceptional mastery and professional excellence in the field of Cybersecurity and Risk Management, successfully completing the comprehensive Security Aptitude Assessment with distinction. This achievement represents a commitment to the highest standards of professional competency in security protocols, threat analysis, compliance frameworks, and emergency response procedures.</div>

    <!-- Score and Date section -->
    <div style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 30px 0;
      padding: 0 50px;
    ">
      <div style="text-align: left;">
        <div style="
          font-size: 16px;
          color: #1a365d;
          margin-bottom: 8px;
          font-weight: 600;
        ">Excellence Score</div>
        <div style="
          font-size: 24px;
          font-weight: bold;
          color: #d4af37;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ">${results?.score || 0}%</div>
      </div>
      <div style="text-align: right;">
        <div style="
          font-size: 16px;
          color: #1a365d;
          margin-bottom: 8px;
          font-weight: 600;
        ">Date of Achievement</div>
        <div style="
          font-size: 20px;
          font-weight: bold;
          color: #1a365d;
        ">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
      </div>
    </div>

    <!-- Signature and Enhanced Seal Section -->
    <div style="
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 0 40px;
    ">
      <!-- Signature -->
      <div style="text-align: center; width: 45%;">
        <div style="
          border-top: 2px solid #1a365d;
          margin: 40px 0 15px;
        "></div>
        <div style="
          font-size: 18px;
          font-weight: bold;
          color: #1a365d;
          margin-bottom: 5px;
        ">Dr. Alexandra Sterling</div>
        <div style="
          font-size: 14px;
          color: #1a365d;
          margin-bottom: 3px;
        ">Director of Professional Certification</div>
        <div style="
          font-size: 12px;
          color: #d4af37;
          font-style: italic;
        ">Global Security Practitioners Alliance</div>
      </div>

      <!-- Enhanced Professional Seal -->
      <div style="
        flex-shrink: 0;
        margin-bottom: 15px;
        position: relative;
      ">
        <!-- Outer Seal Ring with enhanced design -->
        <div style="
          width: 140px;
          height: 140px;
          border: 8px double #d4af37;
          border-radius: 50%;
          background: radial-gradient(circle, #1a365d 0%, #0f1419 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 
            0 0 0 4px #f8f6f0,
            0 0 0 8px #1a365d,
            0 10px 30px rgba(0,0,0,0.4),
            inset 0 0 20px rgba(0,0,0,0.3);
        ">
          <!-- Inner Seal with organization branding -->
          <div style="
            width: 100px;
            height: 100px;
            border: 3px solid #d4af37;
            border-radius: 50%;
            background: radial-gradient(circle, #2d4a6b 0%, #1a365d 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
          ">
            <!-- Globe and Shield Icon -->
            <div style="
              width: 35px;
              height: 40px;
              background: linear-gradient(135deg, #d4af37, #f4d03f);
              clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">
              <div style="
                width: 20px;
                height: 20px;
                border: 2px solid #1a365d;
                border-radius: 50%;
                background: linear-gradient(135deg, #1a365d, #2d4a6b);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <span style="color: #d4af37; font-size: 10px; font-weight: bold;">🌍</span>
              </div>
            </div>
            
            <!-- Organization Text -->
            <div style="color: #d4af37; font-size: 9px; font-weight: bold; letter-spacing: 0.5px; text-align: center; line-height: 1.2;">
              CERTIFIED<br/>
              <span style="font-size: 7px; color: #f4d03f;">PROFESSIONAL</span><br/>
              <span style="font-size: 6px; color: #f8f6f0;">GSPA</span>
            </div>
          </div>
        </div>
        
        <!-- Enhanced Ribbon Effect -->
        <div style="
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 16px;
          background: linear-gradient(90deg, #d4af37, #f4d03f, #d4af37);
          clip-path: polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%);
          box-shadow: 0 3px 8px rgba(0,0,0,0.2);
        "></div>
        
        <!-- Seal Authentication Text -->
        <div style="
          position: absolute;
          bottom: -25px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 8px;
          color: #1a365d;
          font-weight: bold;
          letter-spacing: 1px;
          text-align: center;
        ">OFFICIAL SEAL</div>
      </div>
    </div>
  </div>

  <!-- Enhanced Watermark -->
  <div style="
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 120px;
    color: rgba(212,175,55,0.08);
    letter-spacing: 20px;
    z-index: 0;
    white-space: nowrap;
    font-weight: bold;
  ">CERTIFIED</div>

  <!-- Certificate ID and Security Features -->
  <div style="
    position: absolute;
    bottom: 20px;
    left: 20px;
    font-size: 9px;
    color: rgba(26,54,93,0.4);
    font-family: 'Courier New', monospace;
    letter-spacing: 1px;
    z-index: 2;
  ">Certificate ID: GSPA-${user?.id ? user.id.slice(0, 8).toUpperCase() : "CERT-XXXX"}</div>
  
  <div style="
    position: absolute;
    bottom: 20px;
    right: 20px;
    font-size: 9px;
    color: rgba(26,54,93,0.4);
    font-family: 'Courier New', monospace;
    letter-spacing: 1px;
    z-index: 2;
  ">Verification: gspa.org/verify</div>
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
        backgroundColor: "#f8f6f0",
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
      pdf.save(`GSPA-Certificate-${user?.first_name}-${user?.last_name}.pdf`)
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
                  : "Your certificate will be available for download in 48 hours"}
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
                      Available on:{" "}
                      {user?.certificate_available_at
                        ? new Date(user.certificate_available_at).toLocaleString()
                        : "N/A"}
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
                You can retake the test after reviewing the study materials. Each attempt will have different questions
                to ensure a fair assessment.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={handleRetakeTest}>Retake Test</Button>
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
