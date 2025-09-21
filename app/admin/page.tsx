"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Award, CreditCard, TrendingUp, Activity, Menu } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Stats {
  totalUsers: number
  activeMembers: number
  testCompleted: number
  certificatesIssued: number
  totalRevenue: number
  recentActivity: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeMembers: 0,
    testCompleted: 0,
    certificatesIssued: 0,
    totalRevenue: 0,
    recentActivity: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAdminAndLoadStats = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/auth/login")
        return
      }

      // Check if admin
      if (authUser.email !== 'admin@gmail.com') {
        router.push("/dashboard")
        return
      }

      setIsAdmin(true)
      setUserName(`${authUser.user_metadata?.first_name || ''} ${authUser.user_metadata?.last_name || ''}`.trim() || 'Admin')
      setUserEmail(authUser.email || '')

      // Load stats
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")

      if (!error && profiles) {
        const totalUsers = profiles.length
        const activeMembers = profiles.filter(p => p.membership_fee_paid).length
        const testCompleted = profiles.filter(p => p.test_completed).length
        const certificatesIssued = profiles.filter(p => p.certificate_issued).length

        // Calculate revenue (simplified - assuming $50 membership + $50 test fee)
        const totalRevenue = (activeMembers * 50) + (testCompleted * 50)

        // Recent activity (users registered in last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const recentActivity = profiles.filter(p =>
          new Date(p.created_at) > thirtyDaysAgo
        ).length

        setStats({
          totalUsers,
          activeMembers,
          testCompleted,
          certificatesIssued,
          totalRevenue,
          recentActivity,
        })
      }

      setIsLoading(false)
    }

    checkAdminAndLoadStats()
  }, [supabase, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">
            <DashboardSidebar
              isAdmin={isAdmin}
              userName={userName}
              userEmail={userEmail}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <DashboardSidebar
        isAdmin={isAdmin}
        userName={userName}
        userEmail={userEmail}
      />

      <main className="flex-1 overflow-y-auto md:ml-64">
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
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          <div className="w-8" /> {/* Spacer */}
        </div>

        <div className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Overview of the GSPA certification platform.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats.recentActivity} in last 30 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeMembers}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalUsers > 0 ? Math.round((stats.activeMembers / stats.totalUsers) * 100) : 0}% of total users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tests Completed</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.testCompleted}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeMembers > 0 ? Math.round((stats.testCompleted / stats.activeMembers) * 100) : 0}% completion rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Certificates Issued</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.certificatesIssued}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.testCompleted > 0 ? Math.round((stats.certificatesIssued / stats.testCompleted) * 100) : 0}% success rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.totalRevenue}</div>
                  <p className="text-xs text-muted-foreground">
                    From memberships and tests
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.recentActivity}</div>
                  <p className="text-xs text-muted-foreground">
                    New registrations (30 days)
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-4">
                    <button className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
                      <Users className="h-6 w-6 mb-2" />
                      <div className="font-medium">Manage Users</div>
                      <div className="text-sm text-muted-foreground">View and edit user accounts</div>
                    </button>
                    <button className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
                      <FileText className="h-6 w-6 mb-2" />
                      <div className="font-medium">Test Management</div>
                      <div className="text-sm text-muted-foreground">Manage test questions</div>
                    </button>
                    <button className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
                      <Award className="h-6 w-6 mb-2" />
                      <div className="font-medium">Certificates</div>
                      <div className="text-sm text-muted-foreground">Issue and manage certificates</div>
                    </button>
                    <button className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
                      <TrendingUp className="h-6 w-6 mb-2" />
                      <div className="font-medium">Reports</div>
                      <div className="text-sm text-muted-foreground">View analytics and reports</div>
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Current system health and status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <span className="text-sm text-green-600 font-medium">Healthy</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Authentication</span>
                    <span className="text-sm text-green-600 font-medium">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment Processing</span>
                    <span className="text-sm text-green-600 font-medium">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Service</span>
                    <span className="text-sm text-green-600 font-medium">Working</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
