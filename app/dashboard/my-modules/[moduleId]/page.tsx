"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Clock, BookOpen, FileText, Video, CheckCircle, Play, ExternalLink, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { useSession } from "next-auth/react"

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

interface Level {
  id: string
  title: string
  description: string
  order_index: number
  is_active: boolean
  estimated_duration: number
  level_test_id?: string
  contents_count?: number
  completed_contents?: number
}

interface UserProgress {
  content_id: string
  completed: boolean
  completed_at: string | null
}

export default function ModuleDetailPage() {
   const { moduleId } = useParams()
   const router = useRouter()
   const { data: session } = useSession()
   const [module, setModule] = useState<Module | null>(null)
   const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
   const [levels, setLevels] = useState<Level[]>([])
   const [userProgress, setUserProgress] = useState<UserProgress[]>([])
   const [isLoading, setIsLoading] = useState(true)

   const supabase = createClient()

  useEffect(() => {
    if (moduleId && session?.user?.id) {
      fetchModuleData()
    }
  }, [moduleId, session])

  const fetchModuleData = async () => {
    try {
      // Get module details from API
      const moduleRes = await fetch(`/api/modules/${moduleId}`)
      if (!moduleRes.ok) {
        if (moduleRes.status === 404) {
          router.push('/dashboard/models')
          return
        }
        throw new Error('Failed to fetch module')
      }
      const moduleData = await moduleRes.json()
      setModule({
        ...moduleData,
        instructor_name: moduleData.instructorName,
        duration_hours: moduleData.estimatedDuration
      })

      // Get enrollment details from API
      const enrollmentRes = await fetch(`/api/user-enrollments?userId=${session?.user?.id}`)
      if (!enrollmentRes.ok) throw new Error('Failed to fetch enrollments')
      const enrollmentsData = await enrollmentRes.json()
      const enrollmentData = enrollmentsData.find((e: any) => e.moduleId === moduleId && e.paymentStatus === 'COMPLETED')

      if (!enrollmentData) {
        router.push('/dashboard/models')
        return
      }
      setEnrollment(enrollmentData)

      // Get module levels from API
      const levelsRes = await fetch(`/api/levels?moduleId=${moduleId}`)
      if (levelsRes.ok) {
        const levelsData = await levelsRes.json()

        // Process levels with progress information
        const levelsWithProgress = levelsData.map((level: any) => {
          // Get subtopic count for this level (each subtopic is a lesson)
          const subtopicCount = level.subTopics?.length || 0

          return {
            ...level,
            contents_count: subtopicCount,
            completed_contents: 0 // TODO: Implement proper progress tracking
          }
        })
        setLevels(levelsWithProgress)
      }

      // Get user progress for all content
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('content_id, completed, completed_at')
        .eq('user_id', session?.user?.id)
        .eq('enrollment_id', enrollmentData.id)

      if (!progressError && progressData) {
        setUserProgress(progressData)
      }

    } catch (error) {
      console.error('Error fetching module data:', error)
      router.push('/dashboard/models')
    } finally {
      setIsLoading(false)
    }
  }

  const markContentComplete = async (contentId: string) => {
    if (!enrollment || !session?.user?.id) return

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
          .eq('user_id', session.user.id)
          .eq('content_id', contentId)

        if (error) throw error
      } else {
        // Create new progress record
        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: session.user.id,
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
    if (!enrollment || !levels.length) return

    // Calculate total content across all levels
    const totalContent = levels.reduce((sum, level) => sum + (level.contents_count || 0), 0)
    const completedContent = levels.reduce((sum, level) => sum + (level.completed_contents || 0), 0)
    const newProgress = totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0

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
          <Button variant="outline" onClick={() => router.push('/dashboard/models')} className="mb-4">
            ← Back to Models
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
                    <span className="text-muted-foreground">Levels:</span>
                    <span className="font-medium ml-2">
                      {levels.length}
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

        {/* Course Levels */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Course Levels</h2>

          {levels.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Content Coming Soon</h3>
                <p className="text-muted-foreground">This module is being prepared. Please check back later for the course content.</p>
              </CardContent>
            </Card>
          ) : (
            levels.map((level, index) => {
              const contentsCount = level.contents_count ?? 0
              const completedContents = level.completed_contents ?? 0
              const progress = contentsCount > 0 ? Math.round((completedContents / contentsCount) * 100) : 0
              const isCompleted = progress === 100
              const isAccessible = index === 0 || levels[index - 1].completed_contents === levels[index - 1].contents_count

              return (
                <Card key={level.id} className={`transition-all hover:shadow-lg ${isCompleted ? 'bg-green-50/50 border-green-200' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : (
                          <BookOpen className="h-6 w-6" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">{level.title}</h3>
                            {level.description && (
                              <p className="text-muted-foreground mb-2">{level.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={isCompleted ? "default" : "secondary"}>
                              {isCompleted ? "Completed" : "In Progress"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          {level.estimated_duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {level.estimated_duration} min
                            </span>
                          )}
                          <span>Level {index + 1}</span>
                          <span>{level.contents_count} lessons</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{level.completed_contents} / {level.contents_count} completed</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            {isCompleted && (
                              <span>Level completed</span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {!isAccessible && !isCompleted && (
                              <Badge variant="outline" className="text-orange-600">
                                Complete previous level first
                              </Badge>
                            )}
                            <Button
                              asChild
                              disabled={!isAccessible && !isCompleted}
                              variant={isCompleted ? "outline" : "default"}
                            >
                              <Link href={`/dashboard/my-modules/${moduleId}/levels/${level.id}`}>
                                {isCompleted ? 'Review Level' : 'Start Level'}
                              </Link>
                            </Button>
                          </div>
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