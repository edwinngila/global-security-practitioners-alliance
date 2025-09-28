"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Plus, Edit, Trash2, Menu, Eye, Users, Calendar, Clock, Award } from "lucide-react"
import { useRouter } from "next/navigation"

interface TestQuestion {
  id: string
  question: string
  category: string
  difficulty: string
  is_active: boolean
  created_at: string
}

interface ExamConfiguration {
  id: string
  name: string
  description: string | null
  questions: string[]
  total_questions: number
  passing_score: number
  time_limit: number
  is_active: boolean
  created_at: string
}

interface UserExam {
  id: string
  user_id: string
  exam_configuration_id: string
  assigned_at: string
  available_from: string | null
  available_until: string | null
  is_completed: boolean
  completed_at: string | null
  score: number | null
  passed: boolean | null
  user_name?: string
  user_email?: string
}

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface TestModel {
  id: string
  type: string
  name: string
  description: string | null
  moduleName?: string
  levelName?: string
  subTopicName?: string
  totalQuestions: number
  passingScore: number
  timeLimit: number
  isActive: boolean
}

interface ModelQuestion {
  id: string
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correctAnswer: string
  category: string
  difficulty: string
}

export default function MasterPractitionerTestsPage() {
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [examConfigurations, setExamConfigurations] = useState<ExamConfiguration[]>([])
  const [userExams, setUserExams] = useState<UserExam[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMasterPractitioner, setIsMasterPractitioner] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("questions")

  // Dialog states
  const [createExamDialogOpen, setCreateExamDialogOpen] = useState(false)
  const [assignExamDialogOpen, setAssignExamDialogOpen] = useState(false)
  const [addQuestionDialogOpen, setAddQuestionDialogOpen] = useState(false)
  const [createSubTopicTestDialogOpen, setCreateSubTopicTestDialogOpen] = useState(false)

  // Test models states
  const [testModels, setTestModels] = useState<TestModel[]>([])
  const [selectedModelType, setSelectedModelType] = useState("")
  const [selectedModelId, setSelectedModelId] = useState("")
  const [modelQuestions, setModelQuestions] = useState<ModelQuestion[]>([])
  const [addModelQuestionDialogOpen, setAddModelQuestionDialogOpen] = useState(false)

  // Sub-topic test creation states
  const [subTopics, setSubTopics] = useState<any[]>([])
  const [selectedSubTopicId, setSelectedSubTopicId] = useState("")
  const [subTopicTestTitle, setSubTopicTestTitle] = useState("")
  const [subTopicTestDescription, setSubTopicTestDescription] = useState("")
  const [selectedQuestionsForTest, setSelectedQuestionsForTest] = useState<string[]>([])
  const [subTopicTestPassingScore, setSubTopicTestPassingScore] = useState(70)
  const [subTopicTestTimeLimit, setSubTopicTestTimeLimit] = useState(10) // minutes

  // Sub-topic test model filter
  const [subTopicTestModelFilter, setSubTopicTestModelFilter] = useState("all")
  const [subTopicTestModelQuestions, setSubTopicTestModelQuestions] = useState<ModelQuestion[]>([])

  // Form states
  const [examName, setExamName] = useState("")
  const [examDescription, setExamDescription] = useState("")
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [passingScore, setPassingScore] = useState(70)
  const [timeLimit, setTimeLimit] = useState(60) // minutes
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedExamId, setSelectedExamId] = useState("")
  const [availableFrom, setAvailableFrom] = useState("")
  const [availableUntil, setAvailableUntil] = useState("")

  // Exam creation model filter
  const [examModelFilter, setExamModelFilter] = useState("all")
  const [examModelQuestions, setExamModelQuestions] = useState<ModelQuestion[]>([])
  const [examSubjectFilter, setExamSubjectFilter] = useState("all")

  // Add question form states
  const [questionText, setQuestionText] = useState("")
  const [optionA, setOptionA] = useState("")
  const [optionB, setOptionB] = useState("")
  const [optionC, setOptionC] = useState("")
  const [optionD, setOptionD] = useState("")
  const [correctAnswer, setCorrectAnswer] = useState("")
  const [questionCategory, setQuestionCategory] = useState("")
  const [questionDifficulty, setQuestionDifficulty] = useState("easy")
  const [selectedModelForQuestion, setSelectedModelForQuestion] = useState("")
  const [questionModelType, setQuestionModelType] = useState("general")
  const [questionModelId, setQuestionModelId] = useState("")

  // Predefined subject models for question categorization
  const predefinedSubjectModels = [
    { id: "cybersecurity", name: "Cybersecurity", description: "Questions related to cybersecurity principles and practices" },
    { id: "networking", name: "Networking", description: "Network security and infrastructure questions" },
    { id: "ethical-hacking", name: "Ethical Hacking", description: "Penetration testing and ethical hacking concepts" },
    { id: "cryptography", name: "Cryptography", description: "Encryption, hashing, and cryptographic protocols" },
    { id: "compliance", name: "Compliance & Regulations", description: "Legal and regulatory compliance questions" },
    { id: "incident-response", name: "Incident Response", description: "Security incident handling and response" },
    { id: "risk-management", name: "Risk Management", description: "Risk assessment and management practices" },
    { id: "cloud-security", name: "Cloud Security", description: "Cloud computing security and best practices" },
    { id: "iot-security", name: "IoT Security", description: "Internet of Things security concerns" },
    { id: "physical-security", name: "Physical Security", description: "Physical access control and security measures" }
  ]

  // Add model question form states
  const [modelQuestionText, setModelQuestionText] = useState("")
  const [modelOptionA, setModelOptionA] = useState("")
  const [modelOptionB, setModelOptionB] = useState("")
  const [modelOptionC, setModelOptionC] = useState("")
  const [modelOptionD, setModelOptionD] = useState("")
  const [modelCorrectAnswer, setModelCorrectAnswer] = useState("")
  const [modelQuestionCategory, setModelQuestionCategory] = useState("")
  const [modelQuestionDifficulty, setModelQuestionDifficulty] = useState("medium")

  const router = useRouter()

  useEffect(() => {
    const checkMasterPractitionerAndLoadData = async () => {
      try {
        const userRes = await fetch('/api/auth/user')
        if (!userRes.ok) {
          router.push('/auth/login')
          return
        }
        const data = await userRes.json()
        const roleName = data?.profile?.role?.name
        if (roleName !== 'master_practitioner') {
          router.push('/dashboard')
          return
        }
        setIsMasterPractitioner(true)
        setUserName(`${data?.profile?.firstName || ''} ${data?.profile?.lastName || ''}`.trim() || 'Master Practitioner')
        setUserEmail(data?.email || '')
      } catch (err) {
        router.push('/auth/login')
        return
      }

      // Load test questions
      const questionsRes = await fetch('/api/tests/questions')
      if (questionsRes.ok) {
        const questionsData = await questionsRes.json()
        // Transform Prisma format to expected format
        const formattedQuestions = questionsData.map((q: any) => ({
          id: q.id,
          question: q.question,
          category: q.category,
          difficulty: q.difficulty,
          is_active: q.isActive,
          created_at: q.createdAt,
          option_a: q.options.find((o: any) => o.optionLetter === 'A')?.optionText || '',
          option_b: q.options.find((o: any) => o.optionLetter === 'B')?.optionText || '',
          option_c: q.options.find((o: any) => o.optionLetter === 'C')?.optionText || '',
          option_d: q.options.find((o: any) => o.optionLetter === 'D')?.optionText || '',
          correct_answer: q.options.find((o: any) => o.isCorrect)?.optionLetter || 'A'
        }))
        setQuestions(formattedQuestions)
      }

      // Load exam configurations
      const examRes = await fetch('/api/exam-configurations')
      if (examRes.ok) {
        const examData = await examRes.json()
        setExamConfigurations(examData)
      }

      // Load user exams
      const userExamRes = await fetch('/api/user-exams')
      if (userExamRes.ok) {
        const userExamData = await userExamRes.json()
        setUserExams(userExamData)
      }

      // Load users for assignment
      const usersRes = await fetch('/api/users')
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        // Transform to expected format
        const formattedUsers = usersData.map((u: any) => ({
          id: u.id,
          first_name: u.firstName,
          last_name: u.lastName,
          email: u.email
        }))
        setUsers(formattedUsers)
      }

      // Load test models
      const testModelsRes = await fetch('/api/test-models')
      if (testModelsRes.ok) {
        const testModelsData = await testModelsRes.json()
        setTestModels(testModelsData)
      }

      // Load sub-topics for test creation
      const subTopicsRes = await fetch('/api/sub-topics')
      if (subTopicsRes.ok) {
        const subTopicsData = await subTopicsRes.json()
        setSubTopics(subTopicsData)
      }

      setIsLoading(false)
    }

    checkMasterPractitionerAndLoadData()
  }, [router])

  const handleCreateExam = async () => {
    if (!examName.trim() || selectedQuestions.length === 0) {
      alert("Please provide exam name and select at least one question.")
      return
    }

    try {
      // Convert selected question IDs to question objects
      const selectedQuestionObjects = []
      const allAvailableQuestions = examModelFilter && examModelFilter !== "all" ? examModelQuestions : questions.filter(q => q.is_active)

      for (const questionId of selectedQuestions) {
        const question = allAvailableQuestions.find(q => q.id === questionId)
        if (question) {
          // Handle different question formats
          if (examModelFilter && examModelFilter !== "all") {
            // Model questions already have the correct format
            selectedQuestionObjects.push(question)
          } else {
            // General questions need to be converted to model format
            selectedQuestionObjects.push({
              id: question.id,
              question: question.question,
              options: {
                A: (question as any).option_a,
                B: (question as any).option_b,
                C: (question as any).option_c,
                D: (question as any).option_d
              },
              correctAnswer: (question as any).correct_answer,
              category: question.category,
              difficulty: question.difficulty
            })
          }
        }
      }

      const res = await fetch('/api/exam-configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: examName,
          description: examDescription,
          questions: selectedQuestionObjects,
          totalQuestions: selectedQuestionObjects.length,
          passingScore: passingScore,
          timeLimit: timeLimit * 60 // Convert minutes to seconds
        })
      })

      if (!res.ok) throw new Error('Failed to create exam configuration')

      const data = await res.json()
      setExamConfigurations([data, ...examConfigurations])
      setCreateExamDialogOpen(false)
      setExamName("")
      setExamDescription("")
      setSelectedQuestions([])
      setPassingScore(70)
      setTimeLimit(60)
      setExamSubjectFilter("all")
      setExamModelFilter("all")
      setExamModelQuestions([])
    } catch (error) {
      console.error("Error creating exam:", error)
      alert("Error creating exam. Please try again.")
    }
  }

  const handleAssignExam = async () => {
    if (!selectedUserId || !selectedExamId) {
      alert("Please select both a user and an exam.")
      return
    }

    try {
      const res = await fetch('/api/user-exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          examConfigurationId: selectedExamId,
          availableFrom: availableFrom || null,
          availableUntil: availableUntil || null
        })
      })

      if (!res.ok) throw new Error('Failed to assign exam')

      // Reload user exams
      const userExamRes = await fetch('/api/user-exams')
      if (userExamRes.ok) {
        const userExamData = await userExamRes.json()
        setUserExams(userExamData)
      }

      setAssignExamDialogOpen(false)
      setSelectedUserId("")
      setSelectedExamId("")
      setAvailableFrom("")
      setAvailableUntil("")
    } catch (error) {
      console.error("Error assigning exam:", error)
      alert("Error assigning exam. Please try again.")
    }
  }

  const handleAddQuestion = async () => {
    if (!questionText.trim() || !optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim() || !correctAnswer || !selectedModelForQuestion) {
      alert("Please fill in all required fields, including selecting a subject area.")
      return
    }

    if (!['A', 'B', 'C', 'D'].includes(correctAnswer.toUpperCase())) {
      alert("Correct answer must be A, B, C, or D.")
      return
    }

    try {
      // Get the selected subject model name for the category
      const selectedSubjectModel = predefinedSubjectModels.find(model => model.id === selectedModelForQuestion)
      const categoryName = selectedSubjectModel ? selectedSubjectModel.name : selectedModelForQuestion

      // Add to general pool with subject model association
      const res = await fetch('/api/tests/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          category: categoryName,
          difficulty: questionDifficulty,
          subjectModel: selectedModelForQuestion, // Add subject model identifier
          modelType: questionModelType || null,
          modelId: questionModelId || null,
          options: [
            { optionLetter: 'A', optionText: optionA, isCorrect: correctAnswer.toUpperCase() === 'A' },
            { optionLetter: 'B', optionText: optionB, isCorrect: correctAnswer.toUpperCase() === 'B' },
            { optionLetter: 'C', optionText: optionC, isCorrect: correctAnswer.toUpperCase() === 'C' },
            { optionLetter: 'D', optionText: optionD, isCorrect: correctAnswer.toUpperCase() === 'D' }
          ]
        })
      })

      if (!res.ok) throw new Error('Failed to add question')

      const data = await res.json()
      // Transform back to expected format
      const formattedQuestion = {
        id: data.id,
        question: data.question,
        category: data.category,
        difficulty: data.difficulty,
        is_active: data.isActive,
        created_at: data.createdAt,
        option_a: data.options.find((o: any) => o.optionLetter === 'A')?.optionText || '',
        option_b: data.options.find((o: any) => o.optionLetter === 'B')?.optionText || '',
        option_c: data.options.find((o: any) => o.optionLetter === 'C')?.optionText || '',
        option_d: data.options.find((o: any) => o.optionLetter === 'D')?.optionText || '',
        correct_answer: data.options.find((o: any) => o.isCorrect)?.optionLetter || 'A'
      }
      setQuestions([formattedQuestion, ...questions])

      // Reload model questions if a model was selected and is currently viewed
      if (questionModelId && selectedModelId === questionModelId) {
        const questionsRes = await fetch(`/api/test-models/${selectedModelId}/questions`)
        if (questionsRes.ok) {
          const questionsData = await questionsRes.json()
          setModelQuestions(questionsData)
        }
      }

      setAddQuestionDialogOpen(false)
      setQuestionText("")
      setOptionA("")
      setOptionB("")
      setOptionC("")
      setOptionD("")
      setCorrectAnswer("")
      setQuestionCategory("")
      setQuestionDifficulty("easy")
      setSelectedModelForQuestion("")
      setQuestionModelType("general")
      setQuestionModelId("")
    } catch (error) {
      console.error("Error adding question:", error)
      alert("Error adding question. Please try again.")
    }
  }

  const handleModelSelectionChange = async (modelId: string) => {
    setSelectedModelId(modelId)
    if (modelId) {
      try {
        const res = await fetch(`/api/test-models/${modelId}/questions`)
        if (res.ok) {
          const questions = await res.json()
          setModelQuestions(questions)
        }
      } catch (error) {
        console.error("Error loading model questions:", error)
      }
    } else {
      setModelQuestions([])
    }
  }

  const handleExamModelFilterChange = async (modelId: string) => {
    setExamModelFilter(modelId)
    if (modelId && modelId !== "all") {
      try {
        const res = await fetch(`/api/test-models/${modelId}/questions`)
        if (res.ok) {
          const questions = await res.json()
          setExamModelQuestions(questions)
        }
      } catch (error) {
        console.error("Error loading exam model questions:", error)
      }
    } else {
      setExamModelQuestions([])
    }
  }

  const handleSubTopicTestModelFilterChange = async (modelId: string) => {
    setSubTopicTestModelFilter(modelId)
    if (modelId && modelId !== "all") {
      try {
        const res = await fetch(`/api/test-models/${modelId}/questions`)
        if (res.ok) {
          const questions = await res.json()
          setSubTopicTestModelQuestions(questions)
        }
      } catch (error) {
        console.error("Error loading sub-topic test model questions:", error)
      }
    } else {
      setSubTopicTestModelQuestions([])
    }
  }

  const handleAddModelQuestion = async () => {
    if (!selectedModelId || !modelQuestionText.trim() || !modelOptionA.trim() || !modelOptionB.trim() || !modelOptionC.trim() || !modelOptionD.trim() || !modelCorrectAnswer) {
      alert("Please select a model and fill in all fields.")
      return
    }

    if (!['A', 'B', 'C', 'D'].includes(modelCorrectAnswer.toUpperCase())) {
      alert("Correct answer must be A, B, C, or D.")
      return
    }

    try {
      const res = await fetch(`/api/test-models/${selectedModelId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: modelQuestionText,
          optionA: modelOptionA,
          optionB: modelOptionB,
          optionC: modelOptionC,
          optionD: modelOptionD,
          correctAnswer: modelCorrectAnswer.toUpperCase(),
          category: modelQuestionCategory || 'General',
          difficulty: modelQuestionDifficulty
        })
      })

      if (!res.ok) throw new Error('Failed to add question')

      const newQuestion = await res.json()
      setModelQuestions([...modelQuestions, newQuestion])
      setAddModelQuestionDialogOpen(false)
      setModelQuestionText("")
      setModelOptionA("")
      setModelOptionB("")
      setModelOptionC("")
      setModelOptionD("")
      setModelCorrectAnswer("")
      setModelQuestionCategory("")
      setModelQuestionDifficulty("medium")
    } catch (error) {
      console.error("Error adding model question:", error)
      alert("Error adding question. Please try again.")
    }
  }

  const handleCreateSubTopicTest = async () => {
    if (!selectedSubTopicId || !subTopicTestTitle.trim() || selectedQuestionsForTest.length === 0) {
      alert("Please select a sub-topic, provide a title, and select at least one question.")
      return
    }

    try {
      // Convert selected question IDs to question objects
      const selectedQuestionObjects = []
      const allAvailableQuestions = subTopicTestModelFilter ? subTopicTestModelQuestions : questions.filter(q => q.is_active)

      for (const questionId of selectedQuestionsForTest) {
        const question = allAvailableQuestions.find(q => q.id === questionId)
        if (question) {
          // Handle different question formats
          if (subTopicTestModelFilter) {
            // Model questions already have the correct format
            selectedQuestionObjects.push(question)
          } else {
            // General questions need to be converted to model format
            selectedQuestionObjects.push({
              id: question.id,
              question: question.question,
              options: {
                A: (question as any).option_a,
                B: (question as any).option_b,
                C: (question as any).option_c,
                D: (question as any).option_d
              },
              correctAnswer: (question as any).correct_answer,
              category: question.category,
              difficulty: question.difficulty
            })
          }
        }
      }

      const res = await fetch('/api/sub-topic-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subTopicId: selectedSubTopicId,
          title: subTopicTestTitle,
          description: subTopicTestDescription,
          questions: selectedQuestionObjects,
          totalQuestions: selectedQuestionObjects.length,
          passingScore: subTopicTestPassingScore,
          timeLimit: subTopicTestTimeLimit * 60 // Convert to seconds
        })
      })

      if (!res.ok) throw new Error('Failed to create sub-topic test')

      // Reload test models
      const testModelsRes = await fetch('/api/test-models')
      if (testModelsRes.ok) {
        const testModelsData = await testModelsRes.json()
        setTestModels(testModelsData)
      }

      setCreateSubTopicTestDialogOpen(false)
      setSelectedSubTopicId("")
      setSubTopicTestTitle("")
      setSubTopicTestDescription("")
      setSelectedQuestionsForTest([])
      setSubTopicTestPassingScore(70)
      setSubTopicTestTimeLimit(10)
      setSubTopicTestModelFilter("all")
      setSubTopicTestModelQuestions([])
    } catch (error) {
      console.error("Error creating sub-topic test:", error)
      alert("Error creating test. Please try again.")
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

  if (!isMasterPractitioner) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center">
          <Alert variant="destructive">
            <AlertDescription>Access denied. Master practitioner privileges required.</AlertDescription>
          </Alert>
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
          userRole="master_practitioner"
          userName={userName}
          userEmail={userEmail}
          isMobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <DashboardSidebar
          userRole="master_practitioner"
          userName={userName}
          userEmail={userEmail}
        />
      </div>

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
          <h1 className="text-lg font-semibold">Test Management</h1>
          <div className="w-8" />
        </div>

        <div className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Test Management</h1>
                <p className="text-muted-foreground">
                  Manage test questions, create exams, and assign tests to users.
                </p>
              </div>
              <div className="flex gap-2">
                <Dialog open={createSubTopicTestDialogOpen} onOpenChange={setCreateSubTopicTestDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Sub-Topic Test
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Sub-Topic Test</DialogTitle>
                      <DialogDescription>
                        Create a new test for a sub-topic by selecting questions from the pool.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="sub-topic-select">Select Sub-Topic</Label>
                        <Select value={selectedSubTopicId} onValueChange={setSelectedSubTopicId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a sub-topic" />
                          </SelectTrigger>
                          <SelectContent>
                            {subTopics.map((subTopic) => (
                              <SelectItem key={subTopic.id} value={subTopic.id}>
                                {subTopic.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="test-title">Test Title</Label>
                        <Input
                          id="test-title"
                          value={subTopicTestTitle}
                          onChange={(e) => setSubTopicTestTitle(e.target.value)}
                          placeholder="Enter test title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="test-description">Description</Label>
                        <Textarea
                          id="test-description"
                          value={subTopicTestDescription}
                          onChange={(e) => setSubTopicTestDescription(e.target.value)}
                          placeholder="Enter test description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="passing-score">Passing Score (%)</Label>
                          <Input
                            id="passing-score"
                            type="number"
                            value={subTopicTestPassingScore}
                            onChange={(e) => setSubTopicTestPassingScore(Number(e.target.value))}
                            min="0"
                            max="100"
                          />
                        </div>
                        <div>
                          <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                          <Input
                            id="time-limit"
                            type="number"
                            value={subTopicTestTimeLimit}
                            onChange={(e) => setSubTopicTestTimeLimit(Number(e.target.value))}
                            min="1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="sub-topic-test-model-filter">Filter Questions by Model (Optional)</Label>
                        <Select value={subTopicTestModelFilter} onValueChange={handleSubTopicTestModelFilterChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a model to filter questions or leave empty for all" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Questions</SelectItem>
                            {testModels.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.type.charAt(0).toUpperCase() + model.type.slice(1)}: {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Select Questions ({selectedQuestionsForTest.length} selected)</Label>
                        <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-2">
                          {(subTopicTestModelFilter && subTopicTestModelFilter !== "all" ? subTopicTestModelQuestions : questions.filter(q => q.is_active)).map((question) => (
                            <div key={question.id} className="flex items-start space-x-2">
                              <Checkbox
                                id={`test-question-${question.id}`}
                                checked={selectedQuestionsForTest.includes(question.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedQuestionsForTest([...selectedQuestionsForTest, question.id])
                                  } else {
                                    setSelectedQuestionsForTest(selectedQuestionsForTest.filter(id => id !== question.id))
                                  }
                                }}
                              />
                              <Label htmlFor={`test-question-${question.id}`} className="text-sm leading-relaxed">
                                <div className="font-medium">{question.question}</div>
                                <div className="text-muted-foreground">
                                  {question.category} • {question.difficulty}
                                </div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setCreateSubTopicTestDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateSubTopicTest}>
                          Create Test
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={createExamDialogOpen} onOpenChange={setCreateExamDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Exam
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Exam Configuration</DialogTitle>
                      <DialogDescription>
                        Create a new exam configuration with selected questions.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="exam-name">Exam Name</Label>
                        <Input
                          id="exam-name"
                          value={examName}
                          onChange={(e) => setExamName(e.target.value)}
                          placeholder="Enter exam name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="exam-description">Description</Label>
                        <Textarea
                          id="exam-description"
                          value={examDescription}
                          onChange={(e) => setExamDescription(e.target.value)}
                          placeholder="Enter exam description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="passing-score">Passing Score (%)</Label>
                          <Input
                            id="passing-score"
                            type="number"
                            value={passingScore}
                            onChange={(e) => setPassingScore(Number(e.target.value))}
                            min="0"
                            max="100"
                          />
                        </div>
                        <div>
                          <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                          <Input
                            id="time-limit"
                            type="number"
                            value={timeLimit}
                            onChange={(e) => setTimeLimit(Number(e.target.value))}
                            min="1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="exam-subject-filter">Filter by Subject Area</Label>
                          <Select value={examSubjectFilter} onValueChange={setExamSubjectFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject area" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Subject Areas</SelectItem>
                              {predefinedSubjectModels.map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="exam-model-filter">Filter by Test Model (Optional)</Label>
                          <Select value={examModelFilter} onValueChange={handleExamModelFilterChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a model to filter questions" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Questions</SelectItem>
                              {testModels.map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.type.charAt(0).toUpperCase() + model.type.slice(1)}: {model.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Select Questions ({selectedQuestions.length} selected)</Label>
                        <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-2">
                          {(() => {
                            // Filter questions based on current filters
                            let filteredQuestions: TestQuestion[] = questions.filter(q => q.is_active)

                            // Apply subject area filter
                            if (examSubjectFilter && examSubjectFilter !== "all") {
                              const subjectModel = predefinedSubjectModels.find(model => model.id === examSubjectFilter)
                              if (subjectModel) {
                                filteredQuestions = filteredQuestions.filter(q => q.category === subjectModel.name)
                              }
                            }

                            // Apply model filter (if selected) - use model questions instead
                            if (examModelFilter && examModelFilter !== "all") {
                              // Convert ModelQuestion[] to TestQuestion[] format for display
                              return examModelQuestions.map((question) => (
                                <div key={question.id} className="flex items-start space-x-2">
                                  <Checkbox
                                    id={`question-${question.id}`}
                                    checked={selectedQuestions.includes(question.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedQuestions([...selectedQuestions, question.id])
                                      } else {
                                        setSelectedQuestions(selectedQuestions.filter(id => id !== question.id))
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`question-${question.id}`} className="text-sm leading-relaxed">
                                    <div className="font-medium">{question.question}</div>
                                    <div className="text-muted-foreground">
                                      {question.category} • {question.difficulty}
                                    </div>
                                  </Label>
                                </div>
                              ))
                            }

                            return filteredQuestions.map((question) => (
                              <div key={question.id} className="flex items-start space-x-2">
                                <Checkbox
                                  id={`question-${question.id}`}
                                  checked={selectedQuestions.includes(question.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedQuestions([...selectedQuestions, question.id])
                                    } else {
                                      setSelectedQuestions(selectedQuestions.filter(id => id !== question.id))
                                    }
                                  }}
                                />
                                <Label htmlFor={`question-${question.id}`} className="text-sm leading-relaxed">
                                  <div className="font-medium">{question.question}</div>
                                  <div className="text-muted-foreground">
                                    {question.category} • {question.difficulty}
                                  </div>
                                </Label>
                              </div>
                            ))
                          })()}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setCreateExamDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateExam}>
                          Create Exam
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={assignExamDialogOpen} onOpenChange={setAssignExamDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Users className="h-4 w-4 mr-2" />
                      Assign Exam
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Exam to User</DialogTitle>
                      <DialogDescription>
                        Assign an exam configuration to a specific user with optional time restrictions.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="select-user">Select User</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.first_name} {user.last_name} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="select-exam">Select Exam</Label>
                        <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an exam" />
                          </SelectTrigger>
                          <SelectContent>
                            {examConfigurations.filter(exam => exam.is_active).map((exam) => (
                              <SelectItem key={exam.id} value={exam.id}>
                                {exam.name} ({exam.total_questions} questions)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="available-from">Available From</Label>
                          <Input
                            id="available-from"
                            type="datetime-local"
                            value={availableFrom}
                            onChange={(e) => setAvailableFrom(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="available-until">Available Until</Label>
                          <Input
                            id="available-until"
                            type="datetime-local"
                            value={availableUntil}
                            onChange={(e) => setAvailableUntil(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setAssignExamDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAssignExam}>
                          Assign Exam
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'questions', label: 'Questions', icon: FileText },
                    { id: 'exams', label: 'Exam Configurations', icon: FileText },
                    { id: 'assignments', label: 'User Assignments', icon: Users },
                    { id: 'models', label: 'Test Models', icon: FileText },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="h-4 w-4 inline mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Questions Tab */}
            {activeTab === 'questions' && (
              <>
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
                      <CardTitle className="text-sm font-medium">Subject Areas</CardTitle>
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
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Test Questions</CardTitle>
                        <CardDescription>
                          All test questions in the system. You can add, edit, or deactivate questions.
                        </CardDescription>
                      </div>
                      <Dialog open={addQuestionDialogOpen} onOpenChange={setAddQuestionDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Question
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Add New Question</DialogTitle>
                            <DialogDescription>
                              Create a new test question with multiple choice options.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="question-text">Question</Label>
                              <Textarea
                                id="question-text"
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                placeholder="Enter the question text"
                                rows={3}
                              />
                            </div>
                            <div>
                              <Label htmlFor="question-subject-model">Subject Area *</Label>
                              <Select value={selectedModelForQuestion} onValueChange={setSelectedModelForQuestion}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a subject area for this question" />
                                </SelectTrigger>
                                <SelectContent>
                                  {predefinedSubjectModels.map((model) => (
                                    <SelectItem key={model.id} value={model.id}>
                                      <div>
                                        <div className="font-medium">{model.name}</div>
                                        <div className="text-xs text-muted-foreground">{model.description}</div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="question-model-type">Associate with Test Model (Optional)</Label>
                                <Select value={questionModelType} onValueChange={(value) => {
                                  setQuestionModelType(value)
                                  setQuestionModelId("")
                                }}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select model type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="general">General Pool</SelectItem>
                                    <SelectItem value="subtopic">Sub-Topic Test</SelectItem>
                                    <SelectItem value="level">Level Test</SelectItem>
                                    <SelectItem value="module">Module Test</SelectItem>
                                    <SelectItem value="exam">Exam Configuration</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="question-model-id">Select Specific Model (Optional)</Label>
                                <Select value={questionModelId} onValueChange={setQuestionModelId} disabled={!questionModelType}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a specific model" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {testModels
                                      .filter(model => model.type === questionModelType)
                                      .map((model) => (
                                        <SelectItem key={model.id} value={model.id}>
                                          {model.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="option-a">Option A</Label>
                                <Input
                                  id="option-a"
                                  value={optionA}
                                  onChange={(e) => setOptionA(e.target.value)}
                                  placeholder="Enter option A"
                                />
                              </div>
                              <div>
                                <Label htmlFor="option-b">Option B</Label>
                                <Input
                                  id="option-b"
                                  value={optionB}
                                  onChange={(e) => setOptionB(e.target.value)}
                                  placeholder="Enter option B"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="option-c">Option C</Label>
                                <Input
                                  id="option-c"
                                  value={optionC}
                                  onChange={(e) => setOptionC(e.target.value)}
                                  placeholder="Enter option C"
                                />
                              </div>
                              <div>
                                <Label htmlFor="option-d">Option D</Label>
                                <Input
                                  id="option-d"
                                  value={optionD}
                                  onChange={(e) => setOptionD(e.target.value)}
                                  placeholder="Enter option D"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="correct-answer">Correct Answer</Label>
                                <Select value={correctAnswer} onValueChange={setCorrectAnswer}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select correct answer" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="A">A</SelectItem>
                                    <SelectItem value="B">B</SelectItem>
                                    <SelectItem value="C">C</SelectItem>
                                    <SelectItem value="D">D</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="question-category">Category</Label>
                                <Input
                                  id="question-category"
                                  value={questionCategory}
                                  onChange={(e) => setQuestionCategory(e.target.value)}
                                  placeholder="e.g., Security, Networking"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="question-difficulty">Difficulty</Label>
                              <Select value={questionDifficulty} onValueChange={setQuestionDifficulty}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="easy">Easy</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setAddQuestionDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleAddQuestion}>
                                Add Question
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[300px]">Question</TableHead>
                            <TableHead className="min-w-[150px]">Subject Area</TableHead>
                            <TableHead className="min-w-[100px]">Difficulty</TableHead>
                            <TableHead className="min-w-[100px]">Status</TableHead>
                            <TableHead className="min-w-[120px]">Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {questions.map((question) => {
                            // Find the subject model for display
                            const subjectModel = predefinedSubjectModels.find(model =>
                              model.name === question.category || model.id === question.category
                            )
                            const displayName = subjectModel ? subjectModel.name : question.category

                            return (
                              <TableRow key={question.id}>
                                <TableCell className="font-medium">
                                  <div className="max-w-xs truncate" title={question.question}>
                                    {question.question}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{displayName}</Badge>
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
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Exams Tab */}
            {activeTab === 'exams' && (
              <Card>
                <CardHeader>
                  <CardTitle>Exam Configurations</CardTitle>
                  <CardDescription>
                    Manage exam configurations with specific question sets and settings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">Exam Name</TableHead>
                          <TableHead className="min-w-[300px]">Description</TableHead>
                          <TableHead className="min-w-[100px]">Questions</TableHead>
                          <TableHead className="min-w-[100px]">Passing Score</TableHead>
                          <TableHead className="min-w-[120px]">Time Limit</TableHead>
                          <TableHead className="min-w-[100px]">Status</TableHead>
                          <TableHead className="min-w-[120px]">Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {examConfigurations.map((exam) => (
                          <TableRow key={exam.id}>
                            <TableCell className="font-medium">{exam.name}</TableCell>
                            <TableCell>{exam.description || 'No description'}</TableCell>
                            <TableCell>{exam.total_questions}</TableCell>
                            <TableCell>{exam.passing_score}%</TableCell>
                            <TableCell>{Math.floor(exam.time_limit / 60)} min</TableCell>
                            <TableCell>
                              <Badge variant={exam.is_active ? "default" : "secondary"}>
                                {exam.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(exam.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
              <Card>
                <CardHeader>
                  <CardTitle>User Exam Assignments</CardTitle>
                  <CardDescription>
                    View and manage exam assignments for users.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">User</TableHead>
                          <TableHead className="min-w-[200px]">Email</TableHead>
                          <TableHead className="min-w-[200px]">Exam</TableHead>
                          <TableHead className="min-w-[120px]">Assigned</TableHead>
                          <TableHead className="min-w-[120px]">Available From</TableHead>
                          <TableHead className="min-w-[120px]">Available Until</TableHead>
                          <TableHead className="min-w-[100px]">Status</TableHead>
                          <TableHead className="min-w-[100px]">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userExams.map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell className="font-medium">{assignment.user_name}</TableCell>
                            <TableCell>{assignment.user_email}</TableCell>
                            <TableCell>
                              {examConfigurations.find(e => e.id === assignment.exam_configuration_id)?.name || 'Unknown Exam'}
                            </TableCell>
                            <TableCell>
                              {new Date(assignment.assigned_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {assignment.available_from
                                ? new Date(assignment.available_from).toLocaleString()
                                : 'Anytime'
                              }
                            </TableCell>
                            <TableCell>
                              {assignment.available_until
                                ? new Date(assignment.available_until).toLocaleString()
                                : 'No limit'
                              }
                            </TableCell>
                            <TableCell>
                              <Badge variant={assignment.is_completed ? "default" : "secondary"}>
                                {assignment.is_completed ? "Completed" : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {assignment.score !== null ? `${assignment.score}%` : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Test Models Tab */}
            {activeTab === 'models' && (
              <div className="space-y-6">
                {/* Model Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Select Test Model</CardTitle>
                    <CardDescription>
                      Choose a test model to manage its questions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="model-type">Model Type</Label>
                        <Select value={selectedModelType} onValueChange={(value) => {
                          setSelectedModelType(value)
                          setSelectedModelId("")
                          setModelQuestions([])
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select model type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="subtopic">Sub-Topic Tests</SelectItem>
                            <SelectItem value="level">Level Tests</SelectItem>
                            <SelectItem value="module">Module Tests</SelectItem>
                            <SelectItem value="exam">Exam Configurations</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="model-select">Select Model</Label>
                        <Select value={selectedModelId} onValueChange={handleModelSelectionChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                          <SelectContent>
                            {testModels
                              .filter(model => model.type === selectedModelType)
                              .map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.name} ({model.totalQuestions} questions)
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Questions Management */}
                {selectedModelId && (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Questions for {testModels.find(m => m.id === selectedModelId)?.name}</CardTitle>
                          <CardDescription>
                            Manage questions for this test model. The test will auto-grade based on correct answers.
                          </CardDescription>
                        </div>
                        <Dialog open={addModelQuestionDialogOpen} onOpenChange={setAddModelQuestionDialogOpen}>
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Question
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Add Question to {testModels.find(m => m.id === selectedModelId)?.name}</DialogTitle>
                              <DialogDescription>
                                Create a new question with multiple choice options.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="model-question-text">Question</Label>
                                <Textarea
                                  id="model-question-text"
                                  value={modelQuestionText}
                                  onChange={(e) => setModelQuestionText(e.target.value)}
                                  placeholder="Enter the question text"
                                  rows={3}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="model-option-a">Option A</Label>
                                  <Input
                                    id="model-option-a"
                                    value={modelOptionA}
                                    onChange={(e) => setModelOptionA(e.target.value)}
                                    placeholder="Enter option A"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="model-option-b">Option B</Label>
                                  <Input
                                    id="model-option-b"
                                    value={modelOptionB}
                                    onChange={(e) => setModelOptionB(e.target.value)}
                                    placeholder="Enter option B"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="model-option-c">Option C</Label>
                                  <Input
                                    id="model-option-c"
                                    value={modelOptionC}
                                    onChange={(e) => setModelOptionC(e.target.value)}
                                    placeholder="Enter option C"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="model-option-d">Option D</Label>
                                  <Input
                                    id="model-option-d"
                                    value={modelOptionD}
                                    onChange={(e) => setModelOptionD(e.target.value)}
                                    placeholder="Enter option D"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="model-correct-answer">Correct Answer</Label>
                                  <Select value={modelCorrectAnswer} onValueChange={setModelCorrectAnswer}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select correct answer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="A">A</SelectItem>
                                      <SelectItem value="B">B</SelectItem>
                                      <SelectItem value="C">C</SelectItem>
                                      <SelectItem value="D">D</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="model-question-category">Category</Label>
                                  <Input
                                    id="model-question-category"
                                    value={modelQuestionCategory}
                                    onChange={(e) => setModelQuestionCategory(e.target.value)}
                                    placeholder="e.g., Security, Networking"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="model-question-difficulty">Difficulty</Label>
                                <Select value={modelQuestionDifficulty} onValueChange={setModelQuestionDifficulty}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select difficulty" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setAddModelQuestionDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleAddModelQuestion}>
                                  Add Question
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {modelQuestions.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            No questions added yet. Click "Add Question" to get started.
                          </p>
                        ) : (
                          modelQuestions.map((question, index) => (
                            <Card key={question.id} className="p-4">
                              <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium">Question {index + 1}</h4>
                                  <div className="flex gap-2">
                                    <Badge variant="outline">{question.category}</Badge>
                                    <Badge
                                      variant={
                                        question.difficulty === 'easy' ? 'default' :
                                        question.difficulty === 'medium' ? 'secondary' : 'destructive'
                                      }
                                    >
                                      {question.difficulty}
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-sm">{question.question}</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>A) {question.options.A}</div>
                                  <div>B) {question.options.B}</div>
                                  <div>C) {question.options.C}</div>
                                  <div>D) {question.options.D}</div>
                                </div>
                                <div className="text-sm text-green-600 font-medium">
                                  Correct Answer: {question.correctAnswer}
                                </div>
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}