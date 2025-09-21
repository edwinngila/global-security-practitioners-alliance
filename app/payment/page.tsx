"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import Navigation from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const PaystackButton = dynamic(() => import("react-paystack").then((mod) => mod.PaystackButton), { ssr: false })

interface UserProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  payment_status: string
}

export default function PaymentPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_your_key_here"
  const CERTIFICATION_FEE = 50000 // ₦50,000 in kobo

  useEffect(() => {
    const getUserProfile = async () => {
      const registrationUserId = localStorage.getItem("registration-user-id")

      if (registrationUserId) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", registrationUserId)
          .single()

        if (profile) {
          setUser(profile)

          if (profile.payment_status === "completed") {
            router.push("/test")
            return
          }

          setIsLoading(false)
          return
        }
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/auth/login")
        return
      }

      const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", authUser.id).single()

      if (error || !profile) {
        router.push("/register")
        return
      }

      setUser(profile)

      if (profile.payment_status === "completed") {
        router.push("/test")
      }

      setIsLoading(false)
    }

    getUserProfile()
  }, [supabase, router])

  const handlePaymentSuccess = async (reference: any) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          payment_status: "completed",
          payment_reference: reference.reference,
        })
        .eq("id", user.id)

      if (error) throw error

      setPaymentSuccess(true)

      localStorage.setItem("paid-user-id", user.id)
      localStorage.removeItem("registration-user-id")

      setTimeout(() => {
        router.push("/test")
      }, 3000)
    } catch (error) {
      console.error("Payment update error:", error)
      alert("Payment was successful but there was an error updating your status. Please contact support.")
    }
  }

  const handlePaymentClose = () => {
    console.log("Payment cancelled")
  }

  const paystackConfig = {
    reference: `GSPA-${user?.id}-${Date.now()}`,
    email: user?.email || "",
    amount: CERTIFICATION_FEE,
    publicKey: PAYSTACK_PUBLIC_KEY,
    currency: "NGN",
    metadata: {
      user_id: user?.id,
      custom_fields: [
        {
          display_name: "Certification",
          variable_name: "certification_type",
          value: "GSPA Security Professional",
        },
      ],
    },
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please complete your registration first.</AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center py-20">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
              <CardDescription>
                Your payment has been processed successfully. You can now access the security aptitude test.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => router.push("/test")} className="w-full">
                Start Security Test
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

      <main className="flex-1">
        <section className="py-20 lg:py-32 bg-gradient-to-br from-background via-background to-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl lg:text-6xl font-bold text-balance mb-6">Complete Payment</h1>
              <p className="text-xl text-muted-foreground text-pretty mb-8 leading-relaxed">
                Secure your certification journey with our trusted payment system.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <CreditCard className="h-6 w-6" />
                  Certification Fee Payment
                </CardTitle>
                <CardDescription>
                  Complete your payment to access the security aptitude test and earn your certification.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Applicant Information</h3>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Name:</strong> {user.first_name} {user.last_name}
                    </p>
                    <p>
                      <strong>Email:</strong> {user.email}
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Certification Fee</span>
                    <span className="text-2xl font-bold">₦{CERTIFICATION_FEE / 100}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    This fee covers the security aptitude test (50 questions), certificate issuance upon passing, and
                    lifetime access to GSPA resources.
                  </p>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Payment is processed securely through Paystack. We accept Visa, Mastercard, and other major cards.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="pt-4">
                  <PaystackButton
                    {...paystackConfig}
                    onSuccess={handlePaymentSuccess}
                    onClose={handlePaymentClose}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-4 py-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Pay ₦{CERTIFICATION_FEE / 100} with Paystack
                  </PaystackButton>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  <p>By proceeding with payment, you agree to our terms and conditions.</p>
                  <p className="mt-2">
                    After payment, you'll have access to take the 50-question security aptitude test.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
