"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  User,
  FileText,
  Award,
  CreditCard,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface DashboardSidebarProps {
  isAdmin: boolean
  userName: string
  userEmail: string
}

const userMenuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
  {
    title: "Test",
    href: "/dashboard/test",
    icon: FileText,
  },
  {
    title: "Results",
    href: "/dashboard/results",
    icon: BarChart3,
  },
  {
    title: "Certificate",
    href: "/dashboard/certificate",
    icon: Award,
  },
  {
    title: "Payment",
    href: "/dashboard/payment",
    icon: CreditCard,
  },
]

const adminMenuItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Profile",
    href: "/admin/profile",
    icon: User,
  },
  {
    title: "User Management",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Test Management",
    href: "/admin/tests",
    icon: FileText,
  },
  {
    title: "Certificates",
    href: "/admin/certificates",
    icon: Award,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function DashboardSidebar({ isAdmin, userName, userEmail }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const menuItems = isAdmin ? adminMenuItems : userMenuItems

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className={cn(
      "fixed top-0 left-0 z-40 flex flex-col h-screen bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] transition-all duration-300",
      "hidden md:flex", // Hide on mobile, show on md and up
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--sidebar-border)]">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[var(--sidebar-primary)] rounded-lg flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4 text-[var(--sidebar-primary-foreground)]" />
              </div>
              <span className="font-semibold text-sm text-[var(--sidebar-foreground)]">GSPA</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-[var(--sidebar-border)]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[var(--sidebar-accent)] rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-[var(--sidebar-accent-foreground)]" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-[var(--sidebar-foreground)]">{userName}</p>
              <p className="text-xs text-[var(--sidebar-foreground)]/70 truncate">{userEmail}</p>
              {isAdmin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]">
                  Admin
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-2 py-4 overflow-y-auto">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-10 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]",
                    collapsed ? "px-2" : "px-3",
                    isActive && "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
                  {!collapsed && (
                    <span className="text-sm">{item.title}</span>
                  )}
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--sidebar-border)]">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start h-10 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]",
            collapsed ? "px-2" : "px-3"
          )}
        >
          <LogOut className={cn("h-4 w-4", !collapsed && "mr-3")} />
          {!collapsed && <span className="text-sm">Logout</span>}
        </Button>
      </div>
    </div>
  )
}