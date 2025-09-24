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
  const [userRole, setUserRole] = useState<string>("")
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

      // Set basic user info from auth
      setUserName(authUser.user_metadata?.first_name && authUser.user_metadata?.last_name
        ? `${authUser.user_metadata.first_name} ${authUser.user_metadata.last_name}`
        : authUser.email?.split('@')[0] || 'User')
      setUserEmail(authUser.email || '')

      // Get profile for additional info
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, email, role_id")
        .eq("id", authUser.id)
        .single()

      if (!profileError && profile) {
        // Update with profile data if available
        setUserName(`${profile.first_name || authUser.user_metadata?.first_name || 'User'} ${profile.last_name || authUser.user_metadata?.last_name || ''}`.trim())
        setUserEmail(profile.email || authUser.email || '')

        // Get role if role_id exists
        if (profile.role_id) {
          const { data: roleData } = await supabase
            .from("roles")
            .select("name")
            .eq("id", profile.role_id)
            .single()

          setUserRole(roleData?.name || "practitioner")
        } else {
          setUserRole("practitioner") // default
        }
      } else {
        setUserRole("practitioner") // default
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

  const isTestPage = pathname === '/dashboard/test'

  return (
    <div className="min-h-screen flex">
      {/* Mobile Sidebar - Hide on test page */}
      {!isTestPage && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <DashboardSidebar
              userRole={userRole}
              userName={userName}
              userEmail={userEmail}
              isMobileOpen={mobileMenuOpen}
              onMobileClose={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar - Hide on test page */}
      {!isTestPage && (
        <div className="hidden md:block">
          <DashboardSidebar
            userRole={userRole}
            userName={userName}
            userEmail={userEmail}
          />
        </div>
      )}

      <main
        className={[
          "flex-1 min-h-screen overflow-y-auto", // base styles
          !isTestPage ? "md:ml-1" : "", // sidebar spacing only on non-test pages
        ].join(" ")}
      >
        {/* Mobile Header - only render if not test page */}
        {!isTestPage && (
          <header className="md:hidden bg-background/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <h1 className="text-lg font-semibold truncate text-foreground">{getPageTitle()}</h1>

            {/* Spacer for alignment */}
            <div className="w-8" />
          </header>
        )}

        {/* Page content */}
        <div className="p-4 md:p-6">{children}</div>
      </main>

    </div>
  )
}