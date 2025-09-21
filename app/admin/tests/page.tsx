"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Plus, Edit, Trash2, Menu, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface TestQuestion {
  id: string
  question: string
  category: string
  difficulty: string
  is_active: boolean
  created_at: string
}

export default function AdminTestsPage() {
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAdminAndLoadQuestions = async () => {
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

      // Load test questions
      const { data: questionsData, error } = await supabase
        .from("test_questions")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && questionsData) {
        setQuestions(questionsData)
      }

      setIsLoading(false)
    }

    checkAdminAndLoadQuestions()
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
          <h1 className="text-lg font-semibold">Test Management</h1>
          <div className="w-8" />
        </div>

        <div className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Test Management</h1>
                <p className="text-muted-foreground">
                  Manage test questions and assessment content.
                </p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{questions.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Questions</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {questions.filter(q => q.is_active).length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Categories</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(questions.map(q => q.category)).size}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Easy Questions</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {questions.filter(q => q.difficulty === 'easy').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Questions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Test Questions</CardTitle>
                <CardDescription>
                  All test questions in the system. You can add, edit, or deactivate questions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[300px]">Question</TableHead>
                        <TableHead className="min-w-[120px]">Category</TableHead>
                        <TableHead className="min-w-[100px]">Difficulty</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[120px]">Created</TableHead>
                        <TableHead className="min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions.map((question) => (
                        <TableRow key={question.id}>
                          <TableCell className="font-medium">
                            <div className="max-w-xs truncate" title={question.question}>
                              {question.question}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{question.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                question.difficulty === 'easy' ? 'default' :
                                question.difficulty === 'medium' ? 'secondary' : 'destructive'
                              }
                            >
                              {question.difficulty}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={question.is_active ? "default" : "secondary"}>
                              {question.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(question.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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