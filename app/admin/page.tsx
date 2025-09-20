"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Navigation from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, AlertCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Question {
  id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  category: string
  difficulty: string
  is_active: boolean
  created_at: string
}

export default function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "a",
    category: "",
    difficulty: "medium",
    is_active: true,
  })

  useEffect(() => {
    const checkAdminAccess = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // For now, allow all authenticated users to access admin
      // In production, you'd check for admin role
      loadQuestions()
    }

    checkAdminAccess()
  }, [supabase, router])

  const loadQuestions = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.from("test_questions").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading questions:", error)
      return
    }

    setQuestions(data || [])
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({
      question: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "a",
      category: "",
      difficulty: "medium",
      is_active: true,
    })
    setEditingQuestion(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingQuestion) {
        // Update existing question
        const { error } = await supabase
          .from("test_questions")
          .update({
            question: formData.question,
            option_a: formData.option_a,
            option_b: formData.option_b,
            option_c: formData.option_c,
            option_d: formData.option_d,
            correct_answer: formData.correct_answer,
            category: formData.category,
            difficulty: formData.difficulty,
            is_active: formData.is_active,
          })
          .eq("id", editingQuestion.id)

        if (error) throw error
      } else {
        // Create new question
        const { error } = await supabase.from("test_questions").insert({
          question: formData.question,
          option_a: formData.option_a,
          option_b: formData.option_b,
          option_c: formData.option_c,
          option_d: formData.option_d,
          correct_answer: formData.correct_answer,
          category: formData.category,
          difficulty: formData.difficulty,
          is_active: formData.is_active,
        })

        if (error) throw error
      }

      resetForm()
      setIsDialogOpen(false)
      loadQuestions()
    } catch (error) {
      console.error("Error saving question:", error)
      alert("Error saving question. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
    setFormData({
      question: question.question,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer: question.correct_answer,
      category: question.category,
      difficulty: question.difficulty,
      is_active: question.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return

    try {
      const { error } = await supabase.from("test_questions").delete().eq("id", id)

      if (error) throw error

      loadQuestions()
    } catch (error) {
      console.error("Error deleting question:", error)
      alert("Error deleting question. Please try again.")
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("test_questions").update({ is_active: !currentStatus }).eq("id", id)

      if (error) throw error

      loadQuestions()
    } catch (error) {
      console.error("Error updating question status:", error)
      alert("Error updating question status. Please try again.")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 lg:py-32 bg-gradient-to-br from-background via-background to-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl lg:text-6xl font-bold text-balance mb-6">Admin Dashboard</h1>
              <p className="text-xl text-muted-foreground text-pretty mb-8 leading-relaxed">
                Manage security aptitude test questions and monitor certification activities.
              </p>
            </div>
          </div>
        </section>

        {/* Dashboard Content */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Question Management</h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      resetForm()
                      setIsDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingQuestion ? "Edit Question" : "Add New Question"}</DialogTitle>
                    <DialogDescription>Create or modify a security aptitude test question.</DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="question">Question *</Label>
                      <Textarea
                        id="question"
                        value={formData.question}
                        onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
                        placeholder="Enter the question text"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="option_a">Option A *</Label>
                        <Input
                          id="option_a"
                          value={formData.option_a}
                          onChange={(e) => setFormData((prev) => ({ ...prev, option_a: e.target.value }))}
                          placeholder="Enter option A"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="option_b">Option B *</Label>
                        <Input
                          id="option_b"
                          value={formData.option_b}
                          onChange={(e) => setFormData((prev) => ({ ...prev, option_b: e.target.value }))}
                          placeholder="Enter option B"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="option_c">Option C *</Label>
                        <Input
                          id="option_c"
                          value={formData.option_c}
                          onChange={(e) => setFormData((prev) => ({ ...prev, option_c: e.target.value }))}
                          placeholder="Enter option C"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="option_d">Option D *</Label>
                        <Input
                          id="option_d"
                          value={formData.option_d}
                          onChange={(e) => setFormData((prev) => ({ ...prev, option_d: e.target.value }))}
                          placeholder="Enter option D"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="correct_answer">Correct Answer *</Label>
                        <Select
                          value={formData.correct_answer}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, correct_answer: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="a">A</SelectItem>
                            <SelectItem value="b">B</SelectItem>
                            <SelectItem value="c">C</SelectItem>
                            <SelectItem value="d">D</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Input
                          id="category"
                          value={formData.category}
                          onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                          placeholder="e.g., Network Security"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="difficulty">Difficulty *</Label>
                        <Select
                          value={formData.difficulty}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, difficulty: value }))}
                        >
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

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked: boolean) => setFormData((prev) => ({ ...prev, is_active: checked }))}
                      />
                      <Label htmlFor="is_active">Active (visible in tests)</Label>
                    </div>

                    <div className="flex justify-end gap-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : editingQuestion ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Questions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Test Questions ({questions.length})</CardTitle>
                <CardDescription>Manage all security aptitude test questions</CardDescription>
              </CardHeader>
              <CardContent>
                {questions.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No questions found. Add your first question to get started.</AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Question</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions.map((question) => (
                        <TableRow key={question.id}>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={question.question}>
                              {question.question}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{question.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                question.difficulty === "easy"
                                  ? "default"
                                  : question.difficulty === "medium"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {question.difficulty}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={question.is_active}
                              onCheckedChange={() => toggleActive(question.id, question.is_active)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(question)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(question.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
