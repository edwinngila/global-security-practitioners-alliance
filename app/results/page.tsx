"use client"

import { useState, useEffect, useRef } from "react"
import Navigation from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Download, Award, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

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
  created_at: string
}

export default function ResultsPage() {
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

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single()

      if (!profile || !profile.test_completed) {
        router.push("/test")
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

  const downloadCertificate = async () => {
    if (!user || !results?.passed) return

    // Dynamically import client-side libraries
    const { default: jsPDF } = await import("jspdf")
    const { default: html2canvas } = await import("html2canvas")

    const certificateHTML = `
      <div style="
        width: 1200px;
        height: 850px;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border: none;
        border-radius: 0;
        padding: 0;
        box-shadow: none;
        text-align: center;
        position: relative;
        overflow: hidden;
        font-family: 'Inter', sans-serif;
        margin: 0 auto;
      ">
        <!-- Decorative corner elements -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 200px;
          height: 200px;
          background: linear-gradient(135deg, #17375f 0%, #0d203a 100%);
          clip-path: polygon(0 0, 100% 0, 0 100%);
        "></div>
        
        <div style="
          position: absolute;
          top: 0;
          right: 0;
          width: 200px;
          height: 200px;
          background: linear-gradient(225deg, #e4c538 0%, #d3b051 100%);
          clip-path: polygon(100% 0, 100% 100%, 0 0);
        "></div>
        
        <div style="
          position: absolute;
          bottom: 0;
          left: 0;
          width: 200px;
          height: 200px;
          background: linear-gradient(45deg, #c9aa68 0%, #9b7c3c 100%);
          clip-path: polygon(0 100%, 100% 100%, 0 0);
        "></div>
        
        <div style="
          position: absolute;
          bottom: 0;
          right: 0;
          width: 200px;
          height: 200px;
          background: linear-gradient(315deg, #17375f 0%, #0d203a 100%);
          clip-path: polygon(100% 100%, 100% 0, 0 100%);
        "></div>

        <!-- Main content container -->
        <div style="
          position: relative;
          z-index: 10;
          padding: 80px 100px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        ">
          
          <!-- Header with logo and organization name -->
          <div style="margin-bottom: 50px;">
            <div style="
              width: 100px;
              height: 100px;
              background: linear-gradient(135deg, #17375f 0%, #0d203a 100%);
              border-radius: 50%;
              margin: 0 auto 25px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #e5d081;
              font-size: 42px;
              font-weight: bold;
              box-shadow: 0 10px 30px rgba(23, 55, 95, 0.3);
            ">G</div>
            
            <div style="
              font-size: 32px;
              font-weight: 700;
              color: #17375f;
              margin-bottom: 8px;
              letter-spacing: 1px;
            ">GLOBAL SECURITY PRACTITIONERS</div>
            
            <div style="
              font-size: 24px;
              font-weight: 600;
              color: #4d4937;
              letter-spacing: 2px;
            ">ALLIANCE</div>
            
            <div style="
              width: 120px;
              height: 3px;
              background: linear-gradient(90deg, #e4c538 0%, #d3b051 100%);
              margin: 20px auto;
            "></div>
          </div>

          <!-- Certificate title -->
          <h1 style="
            font-family: 'Playfair Display', serif;
            font-size: 56px;
            font-weight: 700;
            color: #17375f;
            margin-bottom: 40px;
            line-height: 1.1;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          ">CERTIFICATE OF ACHIEVEMENT</h1>

          <!-- Certification text -->
          <div style="margin-bottom: 45px;">
            <p style="
              font-size: 22px;
              color: #4d4937;
              margin-bottom: 20px;
              font-weight: 500;
            ">This is to certify that</p>
            
            <div style="
              font-family: 'Playfair Display', serif;
              font-size: 48px;
              font-weight: 700;
              color: #0d203a;
              margin-bottom: 35px;
              padding: 15px 40px;
              border-bottom: 4px solid #c9aa68;
              display: inline-block;
              min-width: 500px;
              background: linear-gradient(90deg, rgba(229,208,129,0.1) 0%, rgba(228,197,56,0.1) 100%);
            ">${user.first_name} ${user.last_name}</div>
          </div>

          <!-- Achievement description -->
          <p style="
            font-size: 20px;
            color: #4d4937;
            line-height: 1.7;
            margin-bottom: 50px;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
            font-weight: 400;
          ">
            has successfully completed the <strong>Security Aptitude Assessment</strong> and demonstrated
            exceptional proficiency in cybersecurity principles, physical security protocols,
            risk management strategies, compliance frameworks, and emergency response procedures,
            thereby earning recognition as a <strong>Certified Security Professional</strong>.
          </p>

          <!-- Bottom section with details -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 60px;
            padding-top: 40px;
            border-top: 2px solid #c9aa68;
          ">
            <!-- Date -->
            <div style="text-align: center; flex: 1;">
              <div style="
                font-size: 14px;
                color: #724e0f;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 8px;
                font-weight: 600;
              ">Date Issued</div>
              <div style="
                font-size: 18px;
                font-weight: 700;
                color: #17375f;
              ">${new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</div>
            </div>

            <!-- Score badge -->
            <div style="text-align: center; flex: 1;">
              <div style="
                font-size: 14px;
                color: #724e0f;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 8px;
                font-weight: 600;
              ">Achievement Score</div>
              <div style="
                background: linear-gradient(135deg, #e4c538 0%, #d3b051 100%);
                color: #0d203a;
                padding: 12px 25px;
                border-radius: 25px;
                font-weight: 700;
                font-size: 20px;
                display: inline-block;
                box-shadow: 0 4px 15px rgba(228, 197, 56, 0.3);
              ">${results.score}%</div>
            </div>

            <!-- Certificate ID -->
            <div style="text-align: center; flex: 1;">
              <div style="
                font-size: 14px;
                color: #724e0f;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 8px;
                font-weight: 600;
              ">Certificate ID</div>
              <div style="
                font-size: 18px;
                font-weight: 700;
                color: #17375f;
                font-family: 'Courier New', monospace;
              ">GSPA-${user.id.slice(0, 8).toUpperCase()}</div>
            </div>
          </div>

          <!-- Signature section -->
          <div style="
            margin-top: 50px;
            text-align: center;
          ">
            <div style="
              width: 250px;
              height: 2px;
              background: #17375f;
              margin: 0 auto 10px;
            "></div>
            <div style="
              font-size: 18px;
              font-weight: 600;
              color: #17375f;
              margin-bottom: 5px;
            ">Director of Certification</div>
            <div style="
              font-size: 16px;
              color: #4d4937;
            ">Global Security Practitioners Alliance</div>
          </div>
        </div>

        <!-- Watermark/Security pattern -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 120px;
          color: rgba(23, 55, 95, 0.03);
          font-weight: 900;
          z-index: 1;
          pointer-events: none;
        ">CERTIFIED</div>
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
      pdf.save(`GSPA-Certificate-${user.first_name}-${user.last_name}.pdf`)
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
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!results || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <p>No test results found. Please take the test first.</p>
              <Button onClick={() => router.push("/test")} className="mt-4">
                Take Test
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  <p className="font-semibold">GSPA-{user.id.slice(0, 8).toUpperCase()}</p>
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
                <CardDescription>Download your official Security Professional Certificate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
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
                  <Button onClick={() => router.push("/dashboard")}>View Dashboard</Button>
                  <Button variant="outline" onClick={() => router.push("/")}>
                    Return Home
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
                  <Button onClick={() => router.push("/test")}>Retake Test</Button>
                  <Button variant="outline" onClick={() => router.push("/")}>
                    Return Home
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
