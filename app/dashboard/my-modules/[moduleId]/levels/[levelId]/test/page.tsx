"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, CheckCircle, AlertCircle, ArrowLeft, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface LevelTest {
  id: string
  title: string
  description: string
  questions: any[]
  total_questions: number
  passing_score: number
  time_limit: number
}

interface TestQuestion {
  id: string
  question: string
  options: Array<{
    id: string
    option_text: string
    is_correct: boolean
  }>
}

interface TestAttempt {
  answers: Record<string, string>
  score: number
  passed: boolean
  completed_at: string
}

export default function LevelTestPage() {
  const { moduleId, levelId } = useParams()
  const router = useRouter()
  const [levelTest, setLevelTest] = useState<LevelTest | null>(null)
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [testStarted, setTestStarted] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [results, setResults] = useState<TestAttempt | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchLevelTest()
  }, [])

  useEffect(() => {
    if (testStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitTest()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [testStarted, timeLeft])

  const fetchLevelTest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get level test
      const { data: testData, error: testError } = await supabase
        .from('level_tests')
        .select('*')
        .eq('level_id', levelId)
        .single()

      if (testError) {
        console.error('Level test not found:', testError)
        router.push(`/dashboard/my-modules/${moduleId}/levels/${levelId}`)
        return
      }

      setLevelTest(testData)
      setTimeLeft(testData.time_limit * 60) // Convert minutes to seconds

      // Parse questions from JSON
      if (testData.questions && Array.isArray(testData.questions)) {
        // If questions are stored as question IDs, fetch the full questions
        if (typeof testData.questions[0] === 'string') {
          const { data: questionsData, error: questionsError } = await supabase
            .from('test_questions')
            .select(`
              id,
              question,
              options:test_question_options(
                id,
                option_text,
                is_correct
              )
            `)
            .in('id', testData.questions)

          if (questionsError) throw questionsError

          interface SupabaseQuestionOption {
            id: string
            option_text: string
            is_correct: boolean
          }

          interface SupabaseQuestion {
            id: string
            question: string
            options: SupabaseQuestionOption[]
          }

          const formattedQuestions: TestQuestion[] = (questionsData as SupabaseQuestion[] | undefined)?.map((q: SupabaseQuestion) => ({
            id: q.id,
            question: q.question,
            options: q.options || []
          })) || []

          setQuestions(formattedQuestions)
        } else {
          // Questions are stored as full objects
          setQuestions(testData.questions)
        }
      }

    } catch (error) {
      console.error('Error fetching level test:', error)
      router.push(`/dashboard/my-modules/${moduleId}/levels/${levelId}`)
    } finally {
      setIsLoading(false)
    }
  }

  const startTest = () => {
    setTestStarted(true)
  }

  const handleAnswerChange = (questionId: string, answerId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }))
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleSubmitTest = async () => {
    if (!levelTest) return

    try {
      let correctAnswers = 0
      const totalQuestions = questions.length

      // Calculate score
      questions.forEach(question => {
        const userAnswer = answers[question.id]
        const correctOption = question.options.find(opt => opt.is_correct)
        if (userAnswer === correctOption?.id) {
          correctAnswers++
        }
      })

      const score = Math.round((correctAnswers / totalQuestions) * 100)
      const passed = score >= levelTest.passing_score

      const testResults = {
        answers,
        score,
        passed,
        completed_at: new Date().toISOString()
      }

      setResults(testResults)
      setTestCompleted(true)
      setTestStarted(false)

      // Here you could save the test attempt to the database
      // For now, we'll just store it in local state

    } catch (error) {
      console.error('Error submitting test:', error)
      alert('Error submitting test. Please try again.')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!levelTest) {
    return (
      <div className="flex items-center justify-center py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Test not found.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (testCompleted && results) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                results.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {results.passed ? (
                  <CheckCircle className="h-8 w-8" />
                ) : (
                  <AlertCircle className="h-8 w-8" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {results.passed ? 'Test Passed!' : 'Test Failed'}
              </CardTitle>
              <CardDescription>
                You scored {results.score}% ({Math.round((results.score / 100) * questions.length)}/{questions.length} correct)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-muted-foreground">
                  Passing score: {levelTest.passing_score}%
                </p>
              </div>

              {results.passed ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Congratulations! You've successfully completed this level.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need to score at least {levelTest.passing_score}% to pass. You can retake the test after reviewing the material.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/my-modules/${moduleId}/levels/${levelId}`)}
                  className="flex-1"
                >
                  Review Level Content
                </Button>
                <Button
                  onClick={() => router.push(`/dashboard/my-modules/${moduleId}`)}
                  className="flex-1"
                >
                  Back to Module
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!testStarted) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {levelTest.title}
              </CardTitle>
              <CardDescription>{levelTest.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Questions:</strong> {levelTest.total_questions}
                </div>
                <div>
                  <strong>Time Limit:</strong> {levelTest.time_limit} minutes
                </div>
                <div>
                  <strong>Passing Score:</strong> {levelTest.passing_score}%
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Once you start the test, the timer will begin. Make sure you have enough time to complete it.
                </AlertDescription>
              </Alert>

              <Button onClick={startTest} className="w-full" size="lg">
                Start Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Test Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Exit Test
            </Button>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-mono">{formatTime(timeLeft)}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {questions.length}
              </span>
            </div>
          </div>

          <Progress value={(currentQuestion + 1) / questions.length * 100} className="h-2" />
        </div>

        {/* Question */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">{currentQ.question}</h2>

                <RadioGroup
                  value={answers[currentQ.id] || ""}
                  onValueChange={(value) => handleAnswerChange(currentQ.id, value)}
                >
                  {currentQ.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        {option.option_text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </Button>

                <div className="flex gap-2">
                  {currentQuestion === questions.length - 1 ? (
                    <Button onClick={handleSubmitTest} className="px-8">
                      Submit Test
                    </Button>
                  ) : (
                    <Button onClick={handleNext}>
                      Next
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}