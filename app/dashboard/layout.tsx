"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/auth/login")
        return
      }

      setIsAdmin(authUser.email === 'admin@gmail.com')

      // Get profile for name and email
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", authUser.id)
        .single()

      if (profile) {
        setUserName(`${profile.first_name} ${profile.last_name}`)
        setUserEmail(profile.email)
      }
    }

    getUser()
  }, [supabase, router])

  const getPageTitle = () => {
    switch (pathname) {
      case "/dashboard":
        return "Dashboard"
      case "/dashboard/profile":
        return "Profile"
      case "/dashboard/test":
        return "Test"
      case "/dashboard/certificate":
        return "Certificate"
      case "/dashboard/payment":
        return "Payment"
      case "/dashboard/results":
        return "Results"
      default:
        return "Dashboard"
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <DashboardSidebar
              isAdmin={isAdmin}
              userName={userName}
              userEmail={userEmail}
              isMobileOpen={mobileMenuOpen}
              onMobileClose={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <DashboardSidebar
          isAdmin={isAdmin}
          userName={userName}
          userEmail={userEmail}
        />
      </div>

      <main className="flex-1 overflow-y-auto md:ml-56 min-h-screen">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
          <div className="w-8" /> {/* Spacer */}
        </div>

        {children}
      </main>
    </div>
  )
}