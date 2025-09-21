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

    // Create certificate HTML for landscape using project color palette
    const certificateHTML = `
      <div style="
        width: 1100px;
        height: 800px;
        background: white;
        border: 8px solid #17375f;
        border-radius: 20px;
        padding: 60px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        text-align: center;
        position: relative;
        overflow: hidden;
        font-family: 'Inter', sans-serif;
        margin: 0 auto;
      ">
        <div style="
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(229,208,129,0.08) 0%, transparent 70%);
          z-index: 0;
        "></div>

        <div style="position: relative; z-index: 1;">
          <div style="margin-bottom: 40px;">
            <div style="
              width: 80px;
              height: 80px;
              background: #17375f;
              border-radius: 50%;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #e5d081;
              font-size: 32px;
              font-weight: bold;
            ">G</div>
            <div style="
              font-size: 28px;
              font-weight: 600;
              color: #4d4937;
              margin-bottom: 10px;
            ">Global Security Practitioners Alliance</div>
          </div>

          <h1 style="
            font-family: 'Playfair Display', serif;
            font-size: 42px;
            font-weight: 700;
            color: #17375f;
            margin-bottom: 30px;
            line-height: 1.2;
          ">Certificate of Achievement</h1>

          <p style="
            font-size: 20px;
            color: #4d4937;
            margin-bottom: 15px;
          ">This is to certify that</p>
          <div style="
            font-family: 'Playfair Display', serif;
            font-size: 36px;
            font-weight: 700;
            color: #17375f;
            margin-bottom: 30px;
            border-bottom: 2px solid #c9aa68;
            padding-bottom: 10px;
            display: inline-block;
            min-width: 400px;
          ">${user.first_name} ${user.last_name}</div>

          <p style="
            font-size: 18px;
            color: #4d4937;
            line-height: 1.6;
            margin-bottom: 50px;
            max-width: 700px;
            margin-left: auto;
            margin-right: auto;
          ">
            has successfully completed the Security Aptitude Test and demonstrated
            proficiency in cybersecurity, physical security, risk management,
            compliance, and emergency response principles.
          </p>

          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px solid #c9aa68;
          ">
            <div style="text-align: center;">
              <div style="
                font-size: 12px;
                color: #724e0f;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 5px;
              ">Date Issued</div>
              <div style="
                font-size: 16px;
                font-weight: 600;
                color: #4d4937;
              ">${new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</div>
            </div>

            <div style="text-align: center;">
              <div style="
                font-size: 12px;
                color: #724e0f;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 5px;
              ">Test Score</div>
              <div style="
                background: #d3b051;
                color: #0d203a;
                padding: 10px 20px;
                border-radius: 20px;
                font-weight: 600;
                font-size: 16px;
                display: inline-block;
              ">${results.score}%</div>
            </div>

            <div style="text-align: center;">
              <div style="
                font-size: 12px;
                color: #724e0f;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 5px;
              ">Certificate ID</div>
              <div style="
                font-size: 16px;
                font-weight: 600;
                color: #4d4937;
              ">GSPA-${user.id.slice(0, 8).toUpperCase()}</div>
            </div>
          </div>
        </div>
      </div>
    `

    // Create temporary element
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = certificateHTML
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.top = '-9999px'
    document.body.appendChild(tempDiv)

    try {
      // Use html2canvas to capture the certificate
      const canvas = await html2canvas(tempDiv.firstElementChild as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f8fafc'
      })

      // Create PDF in landscape
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })

      // Add the canvas image to PDF
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)

      // Download the PDF
      pdf.save(`GSPA-Certificate-${user.first_name}-${user.last_name}.pdf`)
    } catch (error) {
      console.error('Error generating certificate PDF:', error)
      alert('Error generating certificate. Please try again.')
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
