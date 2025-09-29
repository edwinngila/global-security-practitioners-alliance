"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Menu, Calculator, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Module {
  id: string
  title: string
  description: string
  category: string
  difficultyLevel: string
  isActive: boolean
}

interface ModuleQuestion {
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
  marks: number
  createdAt: string
}

export default function MasterPractitionerTestsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isMasterPractitioner, setIsMasterPractitioner] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Modules states
  const [modules, setModules] = useState<Module[]>([])
  const [selectedModuleId, setSelectedModuleId] = useState("")
  const [moduleQuestions, setModuleQuestions] = useState<ModuleQuestion[]>([])

  // All questions states
  const [allQuestions, setAllQuestions] = useState<any[]>([])

  // Exam creation states
  const [createExamDialogOpen, setCreateExamDialogOpen] = useState(false)
  const [examName, setExamName] = useState("")
  const [examDescription, setExamDescription] = useState("")
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [passingScore, setPassingScore] = useState(70)
  const [timeLimit, setTimeLimit] = useState(60) // minutes

  // Question creation states
  const [addQuestionDialogOpen, setAddQuestionDialogOpen] = useState(false)
  const [editQuestionDialogOpen, setEditQuestionDialogOpen] = useState(false)
  const [deleteQuestionDialogOpen, setDeleteQuestionDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [deletingQuestion, setDeletingQuestion] = useState<any>(null)
  const [questionText, setQuestionText] = useState("")
  const [questionMarks, setQuestionMarks] = useState(1)
  const [optionA, setOptionA] = useState("")
  const [optionB, setOptionB] = useState("")
  const [optionC, setOptionC] = useState("")
  const [optionD, setOptionD] = useState("")
  const [correctAnswer, setCorrectAnswer] = useState("")
  const [questionDifficulty, setQuestionDifficulty] = useState("medium")

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

        // Load modules
        const modulesRes = await fetch('/api/modules')
        if (modulesRes.ok) {
          const modulesData = await modulesRes.json()
          setModules(modulesData)
        }

        // Load all questions
        const questionsRes = await fetch('/api/tests/questions')
        if (questionsRes.ok) {
          const questionsData = await questionsRes.json()
          setAllQuestions(questionsData)
        }

        setIsLoading(false)
      } catch (err) {
        router.push('/auth/login')
      }
    }

    checkMasterPractitionerAndLoadData()
  }, [router])

  const handleModuleSelectionChange = async (moduleId: string) => {
    setSelectedModuleId(moduleId)
    if (moduleId) {
      try {
        const res = await fetch(`/api/modules/${moduleId}/questions`)
        if (res.ok) {
          const questions = await res.json()
          setModuleQuestions(questions)
        }
      } catch (error) {
        console.error("Error loading module questions:", error)
      }
    } else {
      setModuleQuestions([])
    }
  }

  const handleAddQuestion = async () => {
    if (!selectedModuleId || !questionText.trim() || !optionA.trim() || !optionB.trim() ||
        !optionC.trim() || !optionD.trim() || !correctAnswer) {
      alert("Please fill in all required fields and select a module.")
      return
    }

    if (!['A', 'B', 'C', 'D'].includes(correctAnswer.toUpperCase())) {
      alert("Correct answer must be A, B, C, or D.")
      return
    }

    try {
      const res = await fetch(`/api/modules/${selectedModuleId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          optionA: optionA,
          optionB: optionB,
          optionC: optionC,
          optionD: optionD,
          correctAnswer: correctAnswer.toUpperCase(),
          category: 'General',
          difficulty: questionDifficulty,
          marks: questionMarks
        })
      })

      if (!res.ok) throw new Error('Failed to add question')

      const newQuestion = await res.json()
      setModuleQuestions([...moduleQuestions, newQuestion])

      // Refresh all questions list
      const allQuestionsRes = await fetch('/api/tests/questions')
      if (allQuestionsRes.ok) {
        const allQuestionsData = await allQuestionsRes.json()
        setAllQuestions(allQuestionsData)
      }

      setAddQuestionDialogOpen(false)
      resetQuestionForm()
    } catch (error) {
      console.error("Error adding question:", error)
      alert("Error adding question. Please try again.")
    }
  }

  const resetQuestionForm = () => {
    setQuestionText("")
    setQuestionMarks(1)
    setOptionA("")
    setOptionB("")
    setOptionC("")
    setOptionD("")
    setCorrectAnswer("")
    setQuestionDifficulty("medium")
    setEditingQuestion(null)
  }

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question)
    setQuestionText(question.question)
    setQuestionMarks(question.marks || 1)
    setOptionA(question.options?.A || "")
    setOptionB(question.options?.B || "")
    setOptionC(question.options?.C || "")
    setOptionD(question.options?.D || "")
    setCorrectAnswer(question.correctAnswer || "")
    setQuestionDifficulty(question.difficulty || "medium")
    setEditQuestionDialogOpen(true)
  }

  const handleUpdateQuestion = async () => {
    if (!editingQuestion || !questionText.trim() || !optionA.trim() || !optionB.trim() ||
        !optionC.trim() || !optionD.trim() || !correctAnswer) {
      alert("Please fill in all required fields.")
      return
    }

    if (!['A', 'B', 'C', 'D'].includes(correctAnswer.toUpperCase())) {
      alert("Correct answer must be A, B, C, or D.")
      return
    }

    try {
      const moduleId = editingQuestion.moduleId || selectedModuleId
      const res = await fetch(`/api/modules/${moduleId}/questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: editingQuestion.id,
          question: questionText,
          optionA: optionA,
          optionB: optionB,
          optionC: optionC,
          optionD: optionD,
          correctAnswer: correctAnswer.toUpperCase(),
          category: 'General',
          difficulty: questionDifficulty,
          marks: questionMarks
        })
      })

      if (!res.ok) throw new Error('Failed to update question')

      // Refresh all questions list
      const allQuestionsRes = await fetch('/api/tests/questions')
      if (allQuestionsRes.ok) {
        const allQuestionsData = await allQuestionsRes.json()
        setAllQuestions(allQuestionsData)
      }

      // Refresh module questions if the edited question belongs to current module
      if (selectedModuleId && editingQuestion.moduleId === selectedModuleId) {
        const moduleQuestionsRes = await fetch(`/api/modules/${selectedModuleId}/questions`)
        if (moduleQuestionsRes.ok) {
          const moduleQuestionsData = await moduleQuestionsRes.json()
          setModuleQuestions(moduleQuestionsData)
        }
      }

      setEditQuestionDialogOpen(false)
      resetQuestionForm()
      alert("Question updated successfully!")
    } catch (error) {
      console.error("Error updating question:", error)
      alert("Error updating question. Please try again.")
    }
  }

  const handleDeleteQuestion = (question: any) => {
    setDeletingQuestion(question)
    setDeleteQuestionDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingQuestion) return

    try {
      const moduleId = deletingQuestion.moduleId || selectedModuleId
      const res = await fetch(`/api/modules/${moduleId}/questions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: deletingQuestion.id
        })
      })

      if (!res.ok) throw new Error('Failed to delete question')

      // Refresh all questions list
      const allQuestionsRes = await fetch('/api/tests/questions')
      if (allQuestionsRes.ok) {
        const allQuestionsData = await allQuestionsRes.json()
        setAllQuestions(allQuestionsData)
      }

      // Refresh module questions if the deleted question belonged to current module
      if (selectedModuleId && deletingQuestion.moduleId === selectedModuleId) {
        const moduleQuestionsRes = await fetch(`/api/modules/${selectedModuleId}/questions`)
        if (moduleQuestionsRes.ok) {
          const moduleQuestionsData = await moduleQuestionsRes.json()
          setModuleQuestions(moduleQuestionsData)
        }
      }

      setDeleteQuestionDialogOpen(false)
      setDeletingQuestion(null)
      alert("Question deleted successfully!")
    } catch (error) {
      console.error("Error deleting question:", error)
      alert("Error deleting question. Please try again.")
    }
  }

  const handleCreateExam = async () => {
    if (!examName.trim() || selectedQuestions.length === 0) {
      alert("Please provide exam name and select at least one question.")
      return
    }

    try {
      // Convert selected question IDs to question objects
      const selectedQuestionObjects = selectedQuestions.map(questionId =>
        moduleQuestions.find(q => q.id === questionId)
      ).filter(Boolean)

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

      alert("Exam created successfully!")
      setCreateExamDialogOpen(false)
      resetExamForm()
    } catch (error) {
      console.error("Error creating exam:", error)
      alert("Error creating exam. Please try again.")
    }
  }

  const resetExamForm = () => {
    setExamName("")
    setExamDescription("")
    setSelectedQuestions([])
    setPassingScore(70)
    setTimeLimit(60)
  }

  const calculateTotalMarks = () => {
    return selectedQuestions.reduce((total, questionId) => {
      const question = moduleQuestions.find(q => q.id === questionId)
      return total + (question?.marks || 0)
    }, 0)
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
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Model-Based Test Creation</h1>
                <p className="text-muted-foreground">
                  Create exams based on existing test models. Add questions with assigned marks and track total scores.
                </p>
              </div>
              <Dialog open={createExamDialogOpen} onOpenChange={setCreateExamDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Exam
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Exam from Test Model</DialogTitle>
                    <DialogDescription>
                      Create a new exam configuration using questions from a selected test model.
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
                    <div>
                      <Label htmlFor="model-select">Select Test Model</Label>
                      <Select value={selectedModuleId} onValueChange={handleModuleSelectionChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a module" />
                        </SelectTrigger>
                        <SelectContent>
                          {modules.map((module) => (
                            <SelectItem key={module.id} value={module.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {module.title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {module.category} • {module.difficultyLevel}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedModuleId && (
                      <>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <Label>Select Questions ({selectedQuestions.length} selected)</Label>
                            <div className="flex items-center gap-2 text-sm">
                              <Calculator className="h-4 w-4" />
                              <span className="font-medium">Total Marks: {calculateTotalMarks()}</span>
                            </div>
                          </div>
                          <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-2">
                            {moduleQuestions.map((question) => (
                              <div key={question.id} className="flex items-start space-x-2 p-2 border rounded">
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
                                <div className="flex-1">
                                  <Label htmlFor={`question-${question.id}`} className="text-sm leading-relaxed cursor-pointer">
                                    <div className="font-medium">{question.question}</div>
                                    <div className="text-muted-foreground flex items-center gap-2 mt-1">
                                      <span>{question.category} • {question.difficulty}</span>
                                      <span className="font-medium text-primary">{question.marks} marks</span>
                                    </div>
                                  </Label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
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
            </div>

            {/* Model Selection and Question Management */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Test Model</CardTitle>
                  <CardDescription>
                    Choose a test model to view and manage its questions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="module-select">Module</Label>
                      <Select value={selectedModuleId} onValueChange={handleModuleSelectionChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a module" />
                        </SelectTrigger>
                        <SelectContent>
                          {modules.map((module) => (
                            <SelectItem key={module.id} value={module.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {module.title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {module.category} • {module.difficultyLevel}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedModuleId && (
                      <div className="flex items-end">
                        <Dialog open={addQuestionDialogOpen} onOpenChange={setAddQuestionDialogOpen}>
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Question
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Add Question to {modules.find(m => m.id === selectedModuleId)?.title}</DialogTitle>
                              <DialogDescription>
                                Create a new question with assigned marks for this test model.
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
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="question-marks">Marks</Label>
                                  <Input
                                    id="question-marks"
                                    type="number"
                                    value={questionMarks}
                                    onChange={(e) => setQuestionMarks(Number(e.target.value))}
                                    min="1"
                                    placeholder="1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="question-difficulty">Difficulty</Label>
                                  <Select value={questionDifficulty} onValueChange={setQuestionDifficulty}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="easy">Easy</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="hard">Hard</SelectItem>
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
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Questions Display */}
              {selectedModuleId && (
                <Card>
                  <CardHeader>
                    <CardTitle>Questions for {modules.find(m => m.id === selectedModuleId)?.title}</CardTitle>
                    <CardDescription>
                      All questions in this module with their assigned marks.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {moduleQuestions.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No questions added yet. Click "Add Question" to get started.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2 font-medium">#</th>
                              <th className="text-left p-2 font-medium">Question</th>
                              <th className="text-left p-2 font-medium">Options</th>
                              <th className="text-left p-2 font-medium">Correct</th>
                              <th className="text-left p-2 font-medium">Marks</th>
                              <th className="text-left p-2 font-medium">Difficulty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {moduleQuestions.map((question, index) => (
                              <tr key={question.id} className="border-b hover:bg-muted/50">
                                <td className="p-2 text-sm">{index + 1}</td>
                                <td className="p-2 text-sm max-w-xs truncate" title={question.question}>
                                  {question.question}
                                </td>
                                <td className="p-2 text-xs">
                                  <div className="space-y-1">
                                    <div>A: {question.options.A}</div>
                                    <div>B: {question.options.B}</div>
                                    <div>C: {question.options.C}</div>
                                    <div>D: {question.options.D}</div>
                                  </div>
                                </td>
                                <td className="p-2 text-sm font-medium text-green-600">
                                  {question.correctAnswer}
                                </td>
                                <td className="p-2 text-sm font-medium text-primary">
                                  {question.marks}
                                </td>
                                <td className="p-2 text-sm capitalize">
                                  {question.difficulty}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* All Questions Table */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>All Questions Database</CardTitle>
                  <CardDescription>
                    Complete overview of all questions in the system across all modules.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {allQuestions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No questions found in the database.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-medium">#</th>
                            <th className="text-left p-2 font-medium">Module</th>
                            <th className="text-left p-2 font-medium">Question</th>
                            <th className="text-left p-2 font-medium">Options</th>
                            <th className="text-left p-2 font-medium">Correct</th>
                            <th className="text-left p-2 font-medium">Marks</th>
                            <th className="text-left p-2 font-medium">Difficulty</th>
                            <th className="text-left p-2 font-medium">Created</th>
                            <th className="text-left p-2 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allQuestions.map((question, index) => {
                            const moduleName = question.module?.title || 'No Module'
                            const options = question.options || []
                            const correctAnswer = options.find((opt: any) => opt.isCorrect)?.optionLetter || 'N/A'

                            return (
                              <tr key={question.id} className="border-b hover:bg-muted/50">
                                <td className="p-2 text-sm">{index + 1}</td>
                                <td className="p-2 text-sm font-medium">{moduleName}</td>
                                <td className="p-2 text-sm max-w-xs truncate" title={question.question}>
                                  {question.question}
                                </td>
                                <td className="p-2 text-xs">
                                  <div className="space-y-1">
                                    {options.map((option: any) => (
                                      <div key={option.id}>
                                        {option.optionLetter}) {option.optionText}
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-2 text-sm font-medium text-green-600">
                                  {correctAnswer}
                                </td>
                                <td className="p-2 text-sm font-medium text-primary">
                                  {question.marks || 1}
                                </td>
                                <td className="p-2 text-sm capitalize">
                                  {question.difficulty || 'medium'}
                                </td>
                                <td className="p-2 text-sm text-muted-foreground">
                                  {new Date(question.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-2">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditQuestion(question)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteQuestion(question)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Question Confirmation Dialog */}
      <Dialog open={deleteQuestionDialogOpen} onOpenChange={setDeleteQuestionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingQuestion && (
            <div className="py-4">
              <p className="text-sm font-medium mb-2">Question:</p>
              <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                {deletingQuestion.question}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteQuestionDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Question
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}