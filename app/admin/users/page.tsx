"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, UserCheck, UserX, Mail, Calendar, Menu, Settings } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllRoles, updateUserRole } from "@/lib/rbac"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { isAdmin as checkAdminRole } from "@/lib/rbac"

interface UserProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  membership_fee_paid: boolean
  payment_status: string
  test_completed: boolean
  test_score: number | null
  certificate_issued: boolean
  created_at: string
  role_id: string | null
  role_name?: string
  role_display_name?: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAdminAndLoadUsers = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/auth/login")
        return
      }

      // Check if admin using role-based access control
      const adminCheck = await checkAdminRole()
      if (!adminCheck) {
        router.push("/dashboard")
        return
      }

      setIsAdmin(true)
      setUserName(`${authUser.user_metadata?.first_name || ''} ${authUser.user_metadata?.last_name || ''}`.trim() || 'Admin')
      setUserEmail(authUser.email || '')

      // Load roles
      const availableRoles = await getAllRoles()
      setRoles(availableRoles)

      // Load all users with role information
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          *,
          roles:role_id (
            id,
            name,
            display_name
          )
        `)
        .order("created_at", { ascending: false })

      if (!error && profiles) {
        // Transform the data to include role information
        const usersWithRoles = profiles.map(profile => ({
          ...profile,
          role_name: profile.roles?.name || 'practitioner',
          role_display_name: profile.roles?.display_name || 'Practitioner'
        }))
        setUsers(usersWithRoles)
      }

      setIsLoading(false)
    }

    checkAdminAndLoadUsers()
  }, [supabase, router])

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    const success = await updateUserRole(userId, newRoleId)
    if (success) {
      // Refresh the users list
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          *,
          roles:role_id (
            id,
            name,
            display_name
          )
        `)
        .order("created_at", { ascending: false })

      if (!error && profiles) {
        const usersWithRoles = profiles.map(profile => ({
          ...profile,
          role_name: profile.roles?.name || 'practitioner',
          role_display_name: profile.roles?.display_name || 'Practitioner'
        }))
        setUsers(usersWithRoles)
      }
    }
  }

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
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 md:hidden
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <DashboardSidebar
          userRole="admin"
          userName={userName}
          userEmail={userEmail}
          isMobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Desktop Sidebar */}
      <DashboardSidebar
        userRole="admin"
        userName={userName}
        userEmail={userEmail}
      />

      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-background border-b border-border p-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileMenuOpen(true)}
            className="border-border hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">User Management</h1>
          <div className="w-8" /> {/* Spacer */}
        </div>

        <div className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">User Management</h1>
              <p className="text-muted-foreground">
                Manage registered users and their certification status.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {users.filter(u => u.membership_fee_paid).length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Test Completed</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {users.filter(u => u.test_completed).length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Certified</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {users.filter(u => u.certificate_issued).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  A list of all registered users and their current status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Name</TableHead>
                        <TableHead className="min-w-[200px]">Email</TableHead>
                        <TableHead className="min-w-[120px]">Role</TableHead>
                        <TableHead className="min-w-[100px]">Membership</TableHead>
                        <TableHead className="min-w-[120px]">Test Status</TableHead>
                        <TableHead className="min-w-[100px]">Certificate</TableHead>
                        <TableHead className="min-w-[120px]">Registered</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.first_name} {user.last_name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Select
                              value={user.role_id || ""}
                              onValueChange={(value) => handleRoleChange(user.id, value)}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map((role) => (
                                  <SelectItem key={role.id} value={role.id}>
                                    {role.display_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.membership_fee_paid ? "default" : "secondary"}>
                              {user.membership_fee_paid ? "Active" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.test_completed ? (
                              <Badge variant="default">
                                Completed ({user.test_score}%)
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Not Taken</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.certificate_issued ? "default" : "secondary"}>
                              {user.certificate_issued ? "Issued" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
