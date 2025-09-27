"use client"

import { useState, useEffect } from "react"
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
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  GraduationCap,
  Mail,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { getNavigationItems, getCurrentUserRole, type UserRole } from "@/lib/rbac"

interface DashboardSidebarProps {
  userRole: string
  userName: string
  userEmail: string
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

const userMenuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Enrolled",
    href: "/dashboard/enrolled",
    icon: BookOpen,
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
    title: "Module Management",
    href: "/admin/modules",
    icon: BookOpen,
  },
  {
    title: "Content Management",
    href: "/admin/modules/content",
    icon: FileText,
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

export function DashboardSidebar({
  userRole,
  userName,
  userEmail,
  isMobileOpen = false,
  onMobileClose
}: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [actualUserRole, setActualUserRole] = useState<UserRole>('practitioner')
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchUserRole = async () => {
      const role = await getCurrentUserRole()
      setActualUserRole(role)
    }
    fetchUserRole()
  }, [])

  const getMenuItems = () => {
    const navigationItems = getNavigationItems(actualUserRole)

    // Convert the navigation items to the format expected by the sidebar
    return navigationItems.map(item => ({
      title: item.label,
      href: item.href,
      icon: getIconComponent(item.icon)
    }))
  }

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      LayoutDashboard,
      User,
      BookOpen,
      FileText,
      Award,
      CreditCard,
      BarChart3,
      Users,
      Settings,
      GraduationCap,
      Mail
    }
    return iconMap[iconName] || LayoutDashboard
  }

  const menuItems = getMenuItems()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <>
      {/* Mobile Overlay - Improved with smooth transitions */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-all duration-300 ease-in-out md:hidden",
          isMobileOpen 
            ? "opacity-100 pointer-events-auto" 
            : "opacity-0 pointer-events-none"
        )}
        onClick={onMobileClose}
      />

      {/* Sidebar - Enhanced with smoother transitions */}
      <div className={cn(
        "fixed top-0 left-0 z-50 flex flex-col h-screen bg-slate-900 border-r border-gray-600 transition-all duration-300 ease-in-out",
        // Mobile behavior
        "md:sticky md:top-0 md:z-auto",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        // Desktop collapse behavior
        collapsed ? "w-16 md:w-16" : "w-64 md:w-64",
        // Show/hide on different screens
        "md:flex" // Always show on desktop
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-600">
          <div className="flex items-center justify-between">
            {(!collapsed || isMobileOpen) && (
              <div className="flex items-center space-x-2 transition-opacity duration-200">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="h-4 w-4 text-yellow-400" />
                </div>
                <span className="font-semibold text-sm text-white">GSPA</span>
              </div>
            )}
            
            {/* Mobile close button */}
            {isMobileOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMobileClose}
                className="h-8 w-8 p-0 text-white hover:bg-amber-500 transition-colors duration-200 md:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            {/* Desktop collapse button */}
            {!isMobileOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(!collapsed)}
                className="h-8 w-8 p-0 text-white hover:bg-amber-500 transition-colors duration-200 hidden md:flex"
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                ) : (
                  <ChevronLeft className="h-4 w-4 transition-transform duration-200" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-600">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-white" />
            </div>
            {(!collapsed || isMobileOpen) && (
              <div className="flex-1 min-w-0 transition-opacity duration-200">
                <p className="text-sm font-medium truncate text-white">{userName}</p>
                <p className="text-xs text-gray-300 truncate">{userEmail}</p>
                {actualUserRole === 'admin' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600 text-white mt-1">
                    Admin
                  </span>
                )}
                {actualUserRole === 'master_practitioner' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-600 text-white mt-1">
                    Master Practitioner
                  </span>
                )}
                {actualUserRole === 'practitioner' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-600 text-white mt-1">
                    Practitioner
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
                      "w-full mt-2 justify-start h-10 text-white hover:bg-amber-500 transition-all duration-200 ease-in-out",
                      (collapsed && !isMobileOpen) ? "px-2" : "px-3",
                      isActive && "bg-blue-500 text-white hover:bg-blue-600"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 transition-all duration-200", 
                      (!collapsed || isMobileOpen) && "mr-3"
                    )} />
                    {(!collapsed || isMobileOpen) && (
                      <span className="text-sm transition-opacity duration-200">
                        {item.title}
                      </span>
                    )}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-600">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start h-10 text-white hover:bg-amber-500 transition-all duration-200 ease-in-out",
              (collapsed && !isMobileOpen) ? "px-2" : "px-3"
            )}
          >
            <LogOut className={cn(
              "h-4 w-4 transition-all duration-200", 
              (!collapsed || isMobileOpen) && "mr-3"
            )} />
            {(!collapsed || isMobileOpen) && (
              <span className="text-sm transition-opacity duration-200">Logout</span>
            )}
          </Button>
        </div>
      </div>
    </>
  )
}