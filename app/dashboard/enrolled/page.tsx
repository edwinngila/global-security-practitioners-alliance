"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon, Clock, Users, DollarSign, Search, Filter, BookOpen, CheckCircle, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import Link from "next/link"

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
  max_students: number
  instructor_name: string
  is_enrolled?: boolean
}

interface EnrollmentData {
  moduleId: string
  examDate: Date | undefined
}

export default function EnrolledPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [filteredModules, setFilteredModules] = useState<Module[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData>({ moduleId: "", examDate: undefined })
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchModules()
  }, [])

  useEffect(() => {
    filterModules()
  }, [modules, searchTerm, categoryFilter, difficultyFilter])

  const fetchModules = async () => {
    try {
      // Get all active modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (modulesError) throw modulesError

      // Check user authentication and enrollment status
      const { data: { user } } = await supabase.auth.getUser()

      if (user && modulesData) {
        // Get user's enrollments
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('module_enrollments')
          .select('module_id')
          .eq('user_id', user.id)

        if (!enrollmentsError && enrollments) {
          // Mark enrolled modules
          const modulesWithEnrollment = modulesData.map((module: any) => {
            const isEnrolled = enrollments.some((e: any) => e.module_id === module.id)
            return {
              ...module,
              is_enrolled: isEnrolled
            }
          })
          setModules(modulesWithEnrollment)
        } else {
          setModules(modulesData)
        }
      } else {
        setModules(modulesData || [])
      }
    } catch (error) {
      console.error('Error fetching modules:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterModules = () => {
    let filtered = modules

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(module =>
        module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(module => module.category === categoryFilter)
    }

    // Difficulty filter
    if (difficultyFilter !== "all") {
      filtered = filtered.filter(module => module.difficulty === difficultyFilter)
    }

    setFilteredModules(filtered)
  }

  const handleEnrollClick = (module: Module) => {
    setSelectedModule(module)
    setEnrollmentData({ moduleId: module.id, examDate: undefined })
    setEnrollmentDialogOpen(true)
  }

  const handleEnrollSubmit = async () => {
    if (!selectedModule || !enrollmentData.examDate) {
      alert('Please select an exam date')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    setIsEnrolling(true)

    try {
      // Create enrollment record
      const enrollmentRecord = {
        user_id: user.id,
        module_id: selectedModule.id,
        payment_status: 'pending',
        exam_date: enrollmentData.examDate.toISOString().split('T')[0] // Convert to YYYY-MM-DD format
      }

      const { error: enrollmentError } = await supabase
        .from('module_enrollments')
        .insert(enrollmentRecord)

      if (enrollmentError) throw enrollmentError

      // Redirect to payment with exam date
      const examDateParam = enrollmentData.examDate ? `&examDate=${enrollmentData.examDate.toISOString().split('T')[0]}` : ''
      router.push(`/payment?type=module&moduleId=${selectedModule.id}${examDateParam}`)
    } catch (error) {
      console.error('Error creating enrollment:', error)
      alert('Error creating enrollment. Please try again.')
    } finally {
      setIsEnrolling(false)
      setEnrollmentDialogOpen(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const categories = [...new Set(modules.map(m => m.category))]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Enroll in Modules</h1>
          <p className="text-muted-foreground">Select training modules, choose your exam date, and start your learning journey.</p>
        </div>

        {/* Filters Section */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search modules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredModules.length} module{filteredModules.length !== 1 ? 's' : ''} available
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modules Grid */}
        {filteredModules.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No modules found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => (
              <Card key={module.id} className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={getDifficultyColor(module.difficulty)}>
                      {module.difficulty}
                    </Badge>
                    {module.is_enrolled && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Enrolled
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2">
                    {module.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {module.short_description || module.description.substring(0, 100) + '...'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{module.duration_hours}h</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{module.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-primary">
                      KES {module.price_kes.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ${module.price_usd}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <strong>Instructor:</strong> {module.instructor_name}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1" onClick={() => setSelectedModule(module)}>
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl">{module.title}</DialogTitle>
                          <DialogDescription className="text-base">
                            {module.short_description}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold mb-2">Description</h4>
                            <p className="text-muted-foreground">{module.description}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>Duration:</strong> {module.duration_hours} hours
                            </div>
                            <div>
                              <strong>Difficulty:</strong> {module.difficulty}
                            </div>
                            <div>
                              <strong>Category:</strong> {module.category}
                            </div>
                            <div>
                              <strong>Instructor:</strong> {module.instructor_name}
                            </div>
                          </div>

                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <div className="text-2xl font-bold text-primary">
                                  KES {module.price_kes.toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  (${module.price_usd} USD)
                                </div>
                              </div>
                              {module.is_enrolled ? (
                                <Badge className="bg-green-100 text-green-800">
                                  Already Enrolled
                                </Badge>
                              ) : (
                                <Button onClick={() => handleEnrollClick(module)} className="px-6">
                                  Enroll Now
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {!module.is_enrolled && (
                      <Button onClick={() => handleEnrollClick(module)} className="flex-1">
                        Enroll
                      </Button>
                    )}

                    {module.is_enrolled && (
                      <Button asChild variant="outline" className="flex-1">
                        <Link href={`/dashboard/my-modules/${module.id}`}>
                          View Course
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Enrollment Dialog */}
        <Dialog open={enrollmentDialogOpen} onOpenChange={setEnrollmentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Enroll in {selectedModule?.title}</DialogTitle>
              <DialogDescription>
                Select your preferred exam date and complete enrollment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="exam-date">Exam Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !enrollmentData.examDate && "text-muted-foreground"
                      }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {enrollmentData.examDate ? (
                        format(enrollmentData.examDate, "PPP")
                      ) : (
                        <span>Pick an exam date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={enrollmentData.examDate}
                      onSelect={(date) => setEnrollmentData({ ...enrollmentData, examDate: date })}
                      disabled={(date) => date < new Date() || date < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground mt-1">
                  Exam date must be at least 7 days from today
                </p>
              </div>

              {selectedModule && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Enrollment Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Module:</span>
                      <span>{selectedModule.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fee:</span>
                      <span>KES {selectedModule.price_kes.toLocaleString()}</span>
                    </div>
                    {enrollmentData.examDate && (
                      <div className="flex justify-between">
                        <span>Exam Date:</span>
                        <span>{format(enrollmentData.examDate, "PPP")}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  After enrollment, you'll have access to study materials and can prepare for your exam on the selected date.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEnrollmentDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEnrollSubmit}
                  disabled={!enrollmentData.examDate || isEnrolling}
                  className="flex-1"
                >
                  {isEnrolling ? "Processing..." : "Proceed to Payment"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}