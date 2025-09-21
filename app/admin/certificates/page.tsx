"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Award, Download, Menu, Eye, Calendar, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface CertificateUser {
  id: string
  first_name: string
  last_name: string
  email: string
  certificate_issued: boolean
  certificate_url: string | null
  certificate_available_at: string | null
  test_completed: boolean
  test_score: number | null
  created_at: string
}

export default function AdminCertificatesPage() {
  const [certifiedUsers, setCertifiedUsers] = useState<CertificateUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAdminAndLoadCertificates = async () => {
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

      // Load users with certificates
      const { data: users, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("certificate_issued", true)
        .order("created_at", { ascending: false })

      if (!error && users) {
        setCertifiedUsers(users)
      }

      setIsLoading(false)
    }

    checkAdminAndLoadCertificates()
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
          <Alert variant="destructive">
            <AlertDescription>Access denied. Admin privileges required.</AlertDescription>
          </Alert>
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
          <h1 className="text-lg font-semibold">Certificates</h1>
          <div className="w-8" />
        </div>

        <div className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Certificate Management</h1>
              <p className="text-muted-foreground">
                View and manage issued certificates for certified users.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{certifiedUsers.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {certifiedUsers.filter(u => {
                      const certDate = new Date(u.certificate_available_at || u.created_at)
                      const now = new Date()
                      return certDate.getMonth() === now.getMonth() &&
                             certDate.getFullYear() === now.getFullYear()
                    }).length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">High Scorers</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {certifiedUsers.filter(u => (u.test_score || 0) >= 80).length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {certifiedUsers.length > 0
                      ? Math.round(certifiedUsers.reduce((sum, u) => sum + (u.test_score || 0), 0) / certifiedUsers.length)
                      : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Certificates Table */}
            <Card>
              <CardHeader>
                <CardTitle>Issued Certificates</CardTitle>
                <CardDescription>
                  All certificates that have been issued to certified users.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {certifiedUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Certificates Issued</h3>
                    <p className="text-muted-foreground">
                      No users have been issued certificates yet.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">Name</TableHead>
                          <TableHead className="min-w-[200px]">Email</TableHead>
                          <TableHead className="min-w-[100px]">Score</TableHead>
                          <TableHead className="min-w-[120px]">Issued Date</TableHead>
                          <TableHead className="min-w-[120px]">Certificate ID</TableHead>
                          <TableHead className="min-w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {certifiedUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.first_name} {user.last_name}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="default">
                                {user.test_score}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.certificate_available_at
                                ? new Date(user.certificate_available_at).toLocaleDateString()
                                : new Date(user.created_at).toLocaleDateString()
                              }
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                GSPA-{user.id.toUpperCase().slice(0, 8)}
                              </code>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}