"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Navigation from "@/components/navigation"
import { emailValidation, rateLimiting } from "@/lib/validationUtils"
import { useUser } from "@/components/user-context"
import { UserRole } from "@/lib/rbac"

const loginSchema = z.object({
  email: emailValidation,
  password: z.string().min(1, "Password is required").max(128, "Password is too long"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0)
  const router = useRouter()
  const supabase = createClient()
  const { setProfile, setRole } = useUser()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const email = watch("email")

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isBlocked && blockTimeRemaining > 0) {
      interval = setInterval(() => {
        setBlockTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsBlocked(false)
            setAttemptCount(0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isBlocked, blockTimeRemaining])

  const onSubmit = async (data: LoginForm) => {
    const clientId = `login_${data.email}_${window.navigator.userAgent.slice(0, 50)}`
    const rateCheck = rateLimiting.checkRateLimit(clientId, 5, 15 * 60 * 1000) // 5 attempts per 15 minutes

    if (!rateCheck.allowed) {
      setError(rateCheck.message || "Too many login attempts. Please try again later.")
      setIsBlocked(true)
      setBlockTimeRemaining(Math.ceil((rateCheck.resetTime! - Date.now()) / 1000))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        setAttemptCount((prev) => prev + 1)

        if (authError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please check your credentials and try again.")
        } else if (authError.message.includes("Email not confirmed")) {
          setError("Please check your email and click the confirmation link before signing in.")
        } else if (authError.message.includes("Too many requests")) {
          setError("Too many login attempts. Please wait a few minutes before trying again.")
          setIsBlocked(true)
          setBlockTimeRemaining(300) // 5 minutes
        } else {
          setError(authError.message || "Login failed. Please try again.")
        }
        throw authError
      }

      rateLimiting.clearAttempts(clientId)
      setAttemptCount(0)

      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single()

        if (profileError || !profile) {
          router.push("/register/step-1")
          return
        }

        setProfile(profile)

        let userRole: UserRole = 'practitioner'
        // Special case for admin email
        if (authData.user.email === 'admin@gmail.com') {
          userRole = 'admin'
        } else if (profile.role_id) {
          const { data: roleData, error: roleError } = await supabase
            .from("roles")
            .select("name")
            .eq("id", profile.role_id)
            .single()

          if (!roleError && roleData?.name) {
            userRole = roleData.name as UserRole
          }
        }

        setRole(userRole)

        if (userRole === 'admin') {
          router.push('/admin/master-dashboard')
        } else if (userRole === 'master_practitioner') {
          router.push('/master-practitioner')
        } else if (profile.membership_fee_paid) {
          router.push('/practitioner')
        } else {
          router.push('/payment')
        }
      }
    } catch (error: any) {
      console.error("[v0] Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/10 to-background">
      <Navigation />

      <main className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl"></div>
          </div>

          <Card className="relative border-0 shadow-2xl bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-lg"></div>
                  <div className="relative bg-background border border-border/50 rounded-2xl p-4 shadow-xl">
                    <img
                      src="/Global-Security-Practitioners-Alliance.png"
                      alt="GSPA Logo"
                      className="h-20 w-auto"
                    />
                  </div>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold mb-2">Welcome Back</CardTitle>
              <CardDescription className="text-lg">
                Sign in to your GSPA account to continue your certification journey.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}

              {attemptCount >= 3 && !isBlocked && (
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <AlertDescription className="font-medium text-amber-800 dark:text-amber-200">
                    Warning: {5 - attemptCount} attempts remaining before temporary lockout.
                  </AlertDescription>
                </Alert>
              )}

              {isBlocked && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
                  <Lock className="h-5 w-5" />
                  <AlertDescription className="font-medium">
                    Account temporarily locked. Try again in {Math.floor(blockTimeRemaining / 60)}:
                    {String(blockTimeRemaining % 60).padStart(2, "0")}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-semibold flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    className="h-12 bg-black/5 text-base rounded-xl placeholder-gray-300 focus:border-primary/60 focus:ring-0"
                    {...register("email")}
                    placeholder="your.email@example.com"
                    autoComplete="email"
                    disabled={isBlocked}
                  />

                  {errors.email && (
                    <p className="text-sm text-red-600 font-medium">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="h-12 text-base bg-black/5 text-black  focus:border-primary/50 transition-colors pr-12"
                      {...register("password")}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={isBlocked}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isBlocked}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.password && <p className="text-sm text-red-600 font-medium">{errors.password.message}</p>}
                </div>

                <div className="text-right">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={isLoading || isBlocked}
                >
                  {isLoading ? "Signing in..." : isBlocked ? "Account Locked" : "Sign In"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-background text-muted-foreground font-medium">Don't have an account?</span>
                </div>
              </div>

              <div className="text-center">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors group"
                >
                  Register here
                  <Shield className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="text-center pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">Your connection is secured with 256-bit SSL encryption</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
