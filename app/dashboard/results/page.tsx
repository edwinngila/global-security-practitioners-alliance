"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Download, Award, User, CreditCard, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { generateCertificateHTML } from "@/components/certificate-HTML"

const PaystackButton = dynamic(() => import("react-paystack").then((mod) => mod.PaystackButton), { ssr: false })

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
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const certificateRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_your_key_here"
  const RETAKE_FEE = 455000 // 4550 KES in cents

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

  const handlePaymentSuccess = async (reference: any) => {
    if (!user) return

    setIsPaymentProcessing(true)

    try {
      // Update profile for retake
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          test_completed: false,
          test_score: null,
          certificate_issued: false,
          certificate_available_at: null,
          payment_reference: reference.reference,
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

      setPaymentSuccess(true)

      // Redirect to test page after a delay
      setTimeout(() => {
        router.push("/dashboard/test")
      }, 3000)
    } catch (error) {
      console.error("Payment update error:", error)
      alert("Payment was successful but there was an error preparing your retake. Please contact support.")
    } finally {
      setIsPaymentProcessing(false)
    }
  }

  const handlePaymentClose = () => {
    console.log("Payment cancelled")
  }

  const paystackConfig = {
    reference: `GSPA-retake-${user?.id}-${Date.now()}`,
    email: user?.email || "",
    amount: RETAKE_FEE,
    publicKey: PAYSTACK_PUBLIC_KEY,
    currency: "KES",
    metadata: {
      user_id: user?.id,
      payment_type: "retake",
      custom_fields: [
        {
          display_name: "Test Retake Fee",
          variable_name: "payment_type",
          value: "retake",
        },
      ],
    },
  }

const downloadCertificate = async () => {
  if (!user || !results?.passed) return;

  try {
    // Dynamically import client-side libraries
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");

    const certificateHTML = generateCertificateHTML(user, results);

    // Create temporary element with proper styling
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = certificateHTML;
    
    // Position off-screen but visible to html2canvas
    tempDiv.style.position = "fixed";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "0";
    tempDiv.style.width = "1000px";
    tempDiv.style.height = "750px";
    tempDiv.style.zIndex = "9999";
    document.body.appendChild(tempDiv);

    // Get the certificate element
    const certificateElement = tempDiv.firstElementChild as HTMLElement;
    
    // Ensure it's visible and properly sized
    certificateElement.style.visibility = "visible";
    certificateElement.style.opacity = "1";

    // Wait for images to load
    const images = tempDiv.getElementsByTagName('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });

    await Promise.all(imagePromises);

    // Add a small delay to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Use html2canvas to capture the certificate with better settings
    const canvas = await html2canvas(certificateElement, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: true, // Enable logging to see what's happening
      width: certificateElement.offsetWidth,
      height: certificateElement.offsetHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: certificateElement.scrollWidth,
      windowHeight: certificateElement.scrollHeight
    });

    // Check if canvas has content
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error("Canvas is empty - certificate not rendered properly");
    }

    // Create PDF in landscape
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    // Add the canvas image to PDF
    const imgData = canvas.toDataURL("image/png", 1.0);
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);

    // Download the PDF
    pdf.save(`GSPA-Certificate-${user?.first_name}-${user?.last_name}.pdf`);

  } catch (error) {
    console.error("Error generating certificate PDF:", error);
    alert("Error generating certificate. Please try again.");
  } finally {
    // Clean up - more specific selector
    const tempDiv = document.querySelector('div[style*="left: -9999px"]');
    if (tempDiv && tempDiv.parentNode) {
      tempDiv.parentNode.removeChild(tempDiv);
    }
  }
};
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
                  <div className="space-y-6">
                    {/* Download Section */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-dashed border-green-200">
                      <Award className="h-16 w-16 text-green-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-green-900 mb-2 text-center">Download Your Certificate</h3>
                      <p className="text-green-700 mb-4 text-center">
                        Congratulations on achieving your certification! Download your official certificate below.
                      </p>
                      <div className="text-center">
                        <Button onClick={downloadCertificate} size="lg" className="gap-2">
                          <Download className="h-5 w-5" />
                          Download Certificate (PDF)
                        </Button>
                      </div>
                    </div>
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
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">Don't Give Up!</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                You can retake the test after paying the retake fee. Each attempt will have different questions to
                ensure a fair assessment.
              </p>

              {paymentSuccess ? (
                <div className="text-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  <h4 className="text-xl font-semibold text-green-600">Payment Successful!</h4>
                  <p className="text-muted-foreground">
                    Your retake payment has been processed. You will be redirected to the test in a few seconds.
                  </p>
                </div>
              ) : (
                <Card className="max-w-md mx-auto">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CreditCard className="h-5 w-5" />
                      Test Retake Fee
                    </CardTitle>
                    <CardDescription>
                      Pay KES 4,550 (approximately $35 USD) to retake the security aptitude test
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Retake Fee</span>
                        <span className="text-2xl font-bold">KES 4,550</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Includes access to a new set of 30 questions and immediate results
                      </p>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Payment is processed securely through Paystack. All amounts in KES.
                      </AlertDescription>
                    </Alert>

                    <PaystackButton
                      {...paystackConfig}
                      onSuccess={handlePaymentSuccess}
                      onClose={handlePaymentClose}
                      disabled={isPaymentProcessing}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-4 py-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isPaymentProcessing ? "Processing..." : "Pay KES 4,550 with Paystack"}
                    </PaystackButton>

                    <div className="text-center">
                      <Button variant="outline" asChild className="w-full bg-transparent">
                        <Link href="/dashboard">Return to Dashboard</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
