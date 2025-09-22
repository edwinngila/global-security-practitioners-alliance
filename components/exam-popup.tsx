"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Award, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface ExamPopupProps {
  isOpen: boolean
  onClose: () => void
  isRegisteredUser?: boolean
}

export default function ExamPopup({ isOpen, onClose, isRegisteredUser = false }: ExamPopupProps) {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const handleTakeExam = () => {
    if (isRegisteredUser && user) {
      // Registered user - redirect to dashboard test page
      router.push("/dashboard/test")
    } else {
      // Public visitor - redirect to register page
      router.push("/register")
    }
    onClose()
  }

  const handleMaybeLater = () => {
    // Mark as seen for public visitors
    if (!isRegisteredUser) {
      localStorage.setItem("exam-popup-seen", "true")
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 shadow-2xl bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
        <DialogHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-lg"></div>
              <div className="relative bg-background border border-border/50 rounded-2xl p-4 shadow-xl">
                <Award className="h-12 w-12 text-primary" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Get Accredited Globally
          </DialogTitle>
          <DialogDescription className="text-lg text-muted-foreground mt-2">
            Take the Security Aptitude Exam
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground leading-relaxed">
              {isRegisteredUser
                ? "Complete your certification journey by taking the security aptitude exam and earn your professional accreditation."
                : "Join thousands of professionals worldwide who have earned their GSPA certification. Start your journey today!"
              }
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleTakeExam}
              className="flex-1 bg-gradient-to-r from-accent to-secondary hover:from-accent/90 hover:to-secondary/90 text-primary font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <Award className="h-4 w-4 mr-2" />
              {isRegisteredUser ? "Take Exam Now" : "Register to Take Exam Today"}
            </Button>
            <Button
              variant="outline"
              onClick={handleMaybeLater}
              className="flex-1 hover:bg-muted/50 transition-colors duration-200"
            >
              Maybe Some Other Time
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Professional certification • Global recognition • Career advancement
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}