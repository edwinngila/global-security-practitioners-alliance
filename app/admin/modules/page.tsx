"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Eye, Users, Clock, DollarSign, Menu } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Module {
  id: string
  title: string
  description: string
  short_description: string
  category: string
  difficulty: string
  duration_hours: number
  price_kes: number
  price_usd: number
  is_active: boolean
  max_students: number
  instructor_name: string
  created_at: string
}

export default function AdminModulesPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    category: '',
    difficulty: 'beginner',
    duration_hours: 0,
    price_kes: 0,
    price_usd: 0,
    max_students: 0,
    instructor_name: '',
    instructor_bio: '',
    prerequisites: '',
    syllabus: ''
  })

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkAdminAndLoadData = async () => {
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

      fetchModules()
    }

    checkAdminAndLoadData()
  }, [supabase, router])

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setModules(data || [])
    } catch (error) {
      console.error('Error fetching modules:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const moduleData = {
        ...formData,
        learning_objectives: [], // Will be added later
        is_active: true
      }

      if (editingModule) {
        const { error } = await supabase
          .from('modules')
          .update(moduleData)
          .eq('id', editingModule.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('modules')
          .insert(moduleData)

        if (error) throw error
      }

      setIsDialogOpen(false)
      setEditingModule(null)
      resetForm()
      fetchModules()
    } catch (error) {
      console.error('Error saving module:', error)
      alert('Error saving module. Please try again.')
    }
  }

  const handleEdit = (module: Module) => {
    setEditingModule(module)
    setFormData({
      title: module.title,
      description: module.description,
      short_description: module.short_description || '',
      category: module.category,
      difficulty: module.difficulty,
      duration_hours: module.duration_hours,
      price_kes: module.price_kes,
      price_usd: module.price_usd,
      max_students: module.max_students || 0,
      instructor_name: module.instructor_name,
      instructor_bio: '',
      prerequisites: '',
      syllabus: ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return

    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId)

      if (error) throw error
      fetchModules()
    } catch (error) {
      console.error('Error deleting module:', error)
      alert('Error deleting module. Please try again.')
    }
  }

  const toggleActive = async (moduleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('modules')
        .update({ is_active: !isActive })
        .eq('id', moduleId)

      if (error) throw error
      fetchModules()
    } catch (error) {
      console.error('Error updating module status:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      short_description: '',
      category: '',
      difficulty: 'beginner',
      duration_hours: 0,
      price_kes: 0,
      price_usd: 0,
      max_students: 0,
      instructor_name: '',
      instructor_bio: '',
      prerequisites: '',
      syllabus: ''
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Admin privileges required.</p>
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
          <h1 className="text-lg font-semibold">Module Management</h1>
          <div className="w-8" />
        </div>

        <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Module Management</h1>
          <p className="text-muted-foreground">Create and manage training modules</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingModule(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingModule ? 'Edit Module' : 'Add New Module'}</DialogTitle>
              <DialogDescription>
                {editingModule ? 'Update the module details below.' : 'Fill in the details to create a new training module.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="short_description">Short Description</Label>
                  <Input
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Full Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration_hours">Duration (Hours)</Label>
                  <Input
                    id="duration_hours"
                    type="number"
                    value={formData.duration_hours}
                    onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="max_students">Max Students</Label>
                  <Input
                    id="max_students"
                    type="number"
                    value={formData.max_students}
                    onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="price_kes">Price (KES)</Label>
                  <Input
                    id="price_kes"
                    type="number"
                    value={formData.price_kes}
                    onChange={(e) => setFormData({ ...formData, price_kes: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price_usd">Price (USD)</Label>
                  <Input
                    id="price_usd"
                    type="number"
                    step="0.01"
                    value={formData.price_usd}
                    onChange={(e) => setFormData({ ...formData, price_usd: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="instructor_name">Instructor Name</Label>
                  <Input
                    id="instructor_name"
                    value={formData.instructor_name}
                    onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingModule ? 'Update Module' : 'Create Module'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Modules</CardTitle>
          <CardDescription>Manage your training modules and courses</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((module) => (
                <TableRow key={module.id}>
                  <TableCell className="font-medium">{module.title}</TableCell>
                  <TableCell>{module.category}</TableCell>
                  <TableCell>
                    <Badge className={getDifficultyColor(module.difficulty)}>
                      {module.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>{module.duration_hours}h</TableCell>
                  <TableCell>KES {module.price_kes.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={module.is_active ? "default" : "secondary"}>
                      {module.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(module)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(module.id, module.is_active)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(module.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </div>
      </main>
    </div>
  )
}