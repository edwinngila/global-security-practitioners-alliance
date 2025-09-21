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

    // Create certificate HTML
    const certificateHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>GSPA Security Professional Certificate</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap');
          
          body {
            margin: 0;
            padding: 40px;
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .certificate {
            width: 800px;
            height: 600px;
            background: white;
            border: 8px solid #2563eb;
            border-radius: 20px;
            padding: 60px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .certificate::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%);
            z-index: 0;
          }
          
          .content {
            position: relative;
            z-index: 1;
          }
          
          .header {
            margin-bottom: 40px;
          }
          
          .logo {
            width: 80px;
            height: 80px;
            background: #2563eb;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
            font-weight: bold;
          }
          
          .org-name {
            font-size: 24px;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 10px;
          }
          
          .cert-title {
            font-family: 'Playfair Display', serif;
            font-size: 36px;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 30px;
            line-height: 1.2;
          }
          
          .recipient {
            font-size: 18px;
            color: #374151;
            margin-bottom: 10px;
          }
          
          .name {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            display: inline-block;
            min-width: 300px;
          }
          
          .achievement {
            font-size: 16px;
            color: #4b5563;
            line-height: 1.6;
            margin-bottom: 40px;
            max-width: 500px;
            margin-left: auto;
            margin-right: auto;
          }
          
          .details {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
          }
          
          .detail-item {
            text-align: center;
          }
          
          .detail-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
          }
          
          .detail-value {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
          }
          
          .score-badge {
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="content">
            <div class="header">
              <div class="logo">G</div>
              <div class="org-name">Global Security Practitioners Alliance</div>
            </div>
            
            <h1 class="cert-title">Certificate of Achievement</h1>
            
            <p class="recipient">This is to certify that</p>
            <div class="name">${user.first_name} ${user.last_name}</div>
            
            <p class="achievement">
              has successfully completed the Security Aptitude Test and demonstrated 
              proficiency in cybersecurity, physical security, risk management, 
              compliance, and emergency response principles.
            </p>
            
            <div class="details">
              <div class="detail-item">
                <div class="detail-label">Date Issued</div>
                <div class="detail-value">${new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Test Score</div>
                <div class="score-badge">${results.score}%</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Certificate ID</div>
                <div class="detail-value">GSPA-${user.id.slice(0, 8).toUpperCase()}</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    // Create and download the certificate
    const blob = new Blob([certificateHTML], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `GSPA-Certificate-${user.first_name}-${user.last_name}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
                    Your certificate will be downloaded as an HTML file that you can open in any browser and print or
                    save as PDF.
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
