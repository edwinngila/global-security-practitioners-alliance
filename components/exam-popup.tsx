"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Award, X, Star, Shield, Globe, Rocket } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface ExamPopupProps {
  isOpen: boolean
  onClose: () => void
  isRegisteredUser?: boolean
}

export default function ExamPopup({ isOpen, onClose, isRegisteredUser = false }: ExamPopupProps) {
  const [user, setUser] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 100)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  const handleTakeExam = () => {
    if (isRegisteredUser && user) {
      router.push("/dashboard/test")
    } else {
      router.push("/register")
    }
    onClose()
  }

  const handleMaybeLater = () => {
    if (!isRegisteredUser) {
      localStorage.setItem("exam-popup-seen", "true")
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-0 bg-transparent shadow-none overflow-visible">
        <div className={`
          relative bg-gradient-to-br from-background via-muted/50 to-background
          dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-800
          rounded-3xl p-10 shadow-2xl border border-border/50
          transform transition-all duration-500 ease-out
          ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10'}
        `}>

          {/* Company Logo */}
          <div className="absolute top-6 left-6 z-20">
            <div className="bg-background/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-3 border border-border/50 shadow-lg">
              <img
                src="/Global-Security-Practitioners-Alliance.png"
                alt="GSPA Logo"
                className="h-12 w-auto"
              />
            </div>
          </div>

          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-40 bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute -top-3 -right-3 z-10 h-9 w-9 rounded-full bg-background hover:bg-muted border border-border text-foreground shadow-lg hover:scale-110 transition-all duration-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
            {/* Left side - Visual content */}
            <div className="text-center md:text-left">
              <DialogHeader className="pb-6">
                {/* Animated icon */}
                <div className="flex justify-center md:justify-start mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-lg opacity-75 animate-pulse"></div>
                    <div className="relative bg-background dark:bg-slate-800 border border-border rounded-2xl p-6 shadow-2xl">
                      <Award className="h-20 w-20 text-transparent bg-gradient-to-r from-primary to-accent bg-clip-text" />
                    </div>
                    {/* Floating stars */}
                    <Star className="absolute -top-3 -right-3 h-6 w-6 text-yellow-400 animate-bounce" />
                    <Star className="absolute -bottom-3 -left-3 h-5 w-5 text-yellow-300 animate-bounce delay-300" />
                  </div>
                </div>

                <DialogTitle className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent leading-tight">
                  Unlock Your Global Potential
                </DialogTitle>
                <DialogDescription className="text-xl text-muted-foreground mt-4 font-light">
                  Take the Security Aptitude Exam & Get Certified
                </DialogDescription>
              </DialogHeader>

              {/* Benefits list */}
              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-3 text-foreground">
                  <div className="bg-primary/20 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">Professional Accreditation</span>
                </div>
                <div className="flex items-center gap-3 text-foreground">
                  <div className="bg-accent/20 p-2 rounded-lg">
                    <Globe className="h-5 w-5 text-accent" />
                  </div>
                  <span className="font-medium">Global Recognition</span>
                </div>
                <div className="flex items-center gap-3 text-foreground">
                  <div className="bg-secondary/20 p-2 rounded-lg">
                    <Rocket className="h-5 w-5 text-secondary" />
                  </div>
                  <span className="font-medium">Career Advancement</span>
                </div>
              </div>
            </div>

            {/* Right side - Content and actions */}
            <div className="space-y-6">
              {/* Description */}
              <div className="text-center md:text-left">
                <p className="text-muted-foreground leading-relaxed text-lg font-light">
                  {isRegisteredUser
                    ? "Complete your certification journey and join elite security professionals worldwide. Demonstrate your expertise and advance your career."
                    : "Join thousands of certified professionals across 150+ countries. Start your journey to becoming a globally recognized security expert today!"
                  }
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-xl backdrop-blur-sm border border-border/50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">10K+</div>
                  <div className="text-xs text-muted-foreground mt-1">Certified</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">150+</div>
                  <div className="text-xs text-muted-foreground mt-1">Countries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">98%</div>
                  <div className="text-xs text-muted-foreground mt-1">Success Rate</div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-4 pt-2">
                <Button
                  onClick={handleTakeExam}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90
                           text-primary-foreground font-bold py-4 rounded-xl shadow-2xl hover:shadow-3xl
                           transition-all duration-300 hover:scale-105 group relative overflow-hidden text-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <Award className="h-6 w-6 mr-3 relative z-10" />
                  <span className="relative z-10">
                    {isRegisteredUser ? "Take Exam Now" : "Start Your Journey Today"}
                  </span>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleMaybeLater}
                  className="w-full bg-background/50 hover:bg-muted text-foreground border-border
                           hover:border-primary/50 font-medium py-4 rounded-xl transition-all duration-300
                           hover:scale-105 backdrop-blur-sm text-lg"
                >
                  Maybe Later
                </Button>
              </div>

              {/* Trust indicator */}
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Trusted by professionals worldwide
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}