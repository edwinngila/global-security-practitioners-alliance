"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Clock, BookOpen, FileText, Video, CheckCircle, Play, ExternalLink, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"

interface Module {
  id: string
  title: string
  description: string
  instructor_name: string
  duration_hours: number
}

interface Enrollment {
  id: string
  exam_date: string | null
  progress_percentage: number
  payment_status: string
  exam_completed: boolean
  exam_score: number | null
}

interface ModuleContent {
  id: string
  title: string
  description: string
  content_type: string
  content_url: string
  content_text: string
  duration_minutes: number
  is_required: boolean
  order_index: number
  is_published: boolean
}

interface UserProgress {
  content_id: string
  completed: boolean
  completed_at: string | null
}

export default function ModuleDetailPage() {
  const { moduleId } = useParams()
  const router = useRouter()
  const [module, setModule] = useState<Module | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [content, setContent] = useState<ModuleContent[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (moduleId) {
      fetchModuleData()
    }
  }, [moduleId])

  const fetchModuleData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get module details
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single()

      if (moduleError) throw moduleError
      setModule(moduleData)

      // Get enrollment details
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('module_enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_id', moduleId)
        .eq('payment_status', 'completed')
        .single()

      if (enrollmentError) {
        router.push('/dashboard/enrolled')
        return
      }
      setEnrollment(enrollmentData)

      // Get module content
      const { data: contentData, error: contentError } = await supabase
        .from('module_content')
        .select('*')
        .eq('module_id', moduleId)
        .eq('is_published', true)
        .order('order_index')

      if (!contentError && contentData) {
        setContent(contentData)
      }

      // Get user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('content_id, completed, completed_at')
        .eq('user_id', user.id)
        .eq('enrollment_id', enrollmentData.id)

      if (!progressError && progressData) {
        setUserProgress(progressData)
      }

    } catch (error) {
      console.error('Error fetching module data:', error)
      router.push('/dashboard/enrolled')
    } finally {
      setIsLoading(false)
    }
  }

  const markContentComplete = async (contentId: string) => {
    if (!enrollment) return

    try {
      const existingProgress = userProgress.find(p => p.content_id === contentId)

      if (existingProgress) {
        // Update existing progress
        const { error } = await supabase
          .from('user_progress')
          .update({
            completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .eq('content_id', contentId)

        if (error) throw error
      } else {
        // Create new progress record
        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            enrollment_id: enrollment.id,
            content_id: contentId,
            completed: true,
            completed_at: new Date().toISOString()
          })

        if (error) throw error
      }

      // Update local state
      setUserProgress(prev => {
        const existing = prev.find(p => p.content_id === contentId)
        if (existing) {
          return prev.map(p =>
            p.content_id === contentId
              ? { ...p, completed: true, completed_at: new Date().toISOString() }
              : p
          )
        } else {
          return [...prev, {
            content_id: contentId,
            completed: true,
            completed_at: new Date().toISOString()
          }]
        }
      })

      // Update enrollment progress
      await updateEnrollmentProgress()

    } catch (error) {
      console.error('Error marking content complete:', error)
      alert('Error updating progress. Please try again.')
    }
  }

  const updateEnrollmentProgress = async () => {
    if (!enrollment || !content.length) return

    const completedCount = userProgress.filter(p => p.completed).length
    const newProgress = Math.round((completedCount / content.length) * 100)

    try {
      const { error } = await supabase
        .from('module_enrollments')
        .update({ progress_percentage: newProgress })
        .eq('id', enrollment.id)

      if (error) throw error

      // Update local state
      setEnrollment(prev => prev ? { ...prev, progress_percentage: newProgress } : null)
    } catch (error) {
      console.error('Error updating enrollment progress:', error)
    }
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5" />
      case 'document': return <FileText className="h-5 w-5" />
      case 'notes': return <BookOpen className="h-5 w-5" />
      case 'quiz': return <FileText className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  const isContentCompleted = (contentId: string) => {
    return userProgress.some(p => p.content_id === contentId && p.completed)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!module || !enrollment) {
    return (
      <div className="flex items-center justify-center py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Module not found or access denied.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Module Header */}
        <div className="mb-8">
          <Button variant="outline" onClick={() => router.push('/dashboard/enrolled')} className="mb-4">
            ← Back to Modules
          </Button>

          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 mb-6">
            <h1 className="text-3xl font-bold mb-2">{module.title}</h1>
            <p className="text-muted-foreground mb-4">{module.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>Instructor: {module.instructor_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{module.duration_hours} hours</span>
              </div>
              {enrollment.exam_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Exam: {format(new Date(enrollment.exam_date), "PPP")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {enrollment.progress_percentage}% complete
                  </span>
                </div>
                <Progress value={enrollment.progress_percentage} className="h-3" />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Completed:</span>
                    <span className="font-medium ml-2">
                      {userProgress.filter(p => p.completed).length} / {content.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={enrollment.progress_percentage === 100 ? "default" : "secondary"} className="ml-2">
                      {enrollment.progress_percentage === 100 ? "Complete" : "In Progress"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Content */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Course Content</h2>

          {content.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No content available</h3>
                <p className="text-muted-foreground">Course materials will be published soon.</p>
              </CardContent>
            </Card>
          ) : (
            content.map((item, index) => {
              const completed = isContentCompleted(item.id)
              return (
                <Card key={item.id} className={`transition-all hover:shadow-lg ${completed ? 'bg-green-50/50 border-green-200' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        completed ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
                      }`}>
                        {completed ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : (
                          getContentTypeIcon(item.content_type)
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                            {item.description && (
                              <p className="text-muted-foreground mb-2">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {item.is_required && (
                              <Badge variant="outline">Required</Badge>
                            )}
                            <Badge variant={completed ? "default" : "secondary"}>
                              {completed ? "Completed" : item.content_type}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          {item.duration_minutes > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {item.duration_minutes} min
                            </span>
                          )}
                          <span>Lesson {index + 1}</span>
                        </div>

                        {/* Content Display */}
                        {item.content_type === 'notes' && item.content_text && (
                          <div className="bg-muted/50 p-4 rounded-lg mb-4">
                            <div className="prose prose-sm max-w-none">
                              <div dangerouslySetInnerHTML={{ __html: item.content_text.replace(/\n/g, '<br>') }} />
                            </div>
                          </div>
                        )}

                        {item.content_type === 'video' && item.content_url && (
                          <div className="mb-4">
                            <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                              <Button asChild>
                                <a href={item.content_url} target="_blank" rel="noopener noreferrer">
                                  <Play className="h-8 w-8 mr-2" />
                                  Watch Video
                                </a>
                              </Button>
                            </div>
                          </div>
                        )}

                        {item.content_type === 'document' && item.content_url && (
                          <div className="mb-4">
                            <Button variant="outline" asChild>
                              <a href={item.content_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Document
                              </a>
                            </Button>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            {completed && userProgress.find(p => p.content_id === item.id)?.completed_at && (
                              <span>
                                Completed on {format(new Date(userProgress.find(p => p.content_id === item.id)!.completed_at!), "PPP")}
                              </span>
                            )}
                          </div>

                          {!completed && (
                            <Button onClick={() => markContentComplete(item.id)}>
                              Mark as Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Exam Information */}
        {enrollment.exam_date && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Exam Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Exam Date:</span>
                  <Badge variant="outline" className="text-base px-3 py-1">
                    {format(new Date(enrollment.exam_date), "PPP")}
                  </Badge>
                </div>

                {enrollment.exam_completed ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Exam completed with score: {enrollment.exam_score}%
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Make sure to complete all required coursework before your exam date.
                      You can take the exam on or after the scheduled date.
                    </AlertDescription>
                  </Alert>
                )}

                {enrollment.progress_percentage === 100 && !enrollment.exam_completed && (
                  <Button className="w-full" size="lg">
                    Take Exam
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}