"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import ExamPopup from "./exam-popup"
import { createClient } from "@/lib/supabase/client"

interface ExamPopupWrapperProps {
  children: React.ReactNode
}

export default function ExamPopupWrapper({ children }: ExamPopupWrapperProps) {
  const [showPopup, setShowPopup] = useState(false)
  const [isRegisteredUser, setIsRegisteredUser] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const checkUserAndShowPopup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Check if user has paid and hasn't taken the test
        const { data: profile } = await supabase
          .from("profiles")
          .select("membership_fee_paid, test_completed")
          .eq("id", user.id)
          .single()

        if (profile && profile.membership_fee_paid && !profile.test_completed) {
          // User has paid but hasn't taken the test - show popup
          setIsRegisteredUser(true)
          setShowPopup(true)
        }
      } else if (pathname === "/" && !localStorage.getItem("exam-popup-seen")) {
        // First-time visitor on homepage - show popup after a short delay
        setTimeout(() => {
          setShowPopup(true)
        }, 3000) // Show after 3 seconds
      }
    }

    checkUserAndShowPopup()
  }, [pathname, supabase])

  const handleClosePopup = () => {
    setShowPopup(false)
  }

  return (
    <>
      {children}
      <ExamPopup
        isOpen={showPopup}
        onClose={handleClosePopup}
        isRegisteredUser={isRegisteredUser}
      />
    </>
  )
}