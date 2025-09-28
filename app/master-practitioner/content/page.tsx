"use client"

import { useState, useEffect, useRef } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  Plus,
  Edit,
  X,
  Save,
  Menu,
  FileText,
  Video,
  Users,
  GraduationCap,
  ChevronRight,
  ChevronDown,
  TestTube,
  Layers
} from "lucide-react"
import { useRouter } from "next/navigation"
import { RichTextEditor } from "@/components/rich-text-editor"

interface Module {
  id: string
  title: string
  description: string
  createdAt: string
  levels?: Level[]
}

interface Level {
  id: string
  title: string
  description: string
  orderIndex: number
  isActive: boolean
  estimatedDuration?: number
  learningObjectives?: string
  subTopics?: SubTopic[]
  levelTest?: any
}

interface SubTopic {
  id: string
  title: string
  description: string
  orderIndex: number
  isActive: boolean
  estimatedDuration?: number
  learningObjectives?: string
  readingMaterial?: string
  attachments?: any[]
  externalLinks?: any[]
  contents?: SubTopicContent[]
  subTopicTest?: any
}

interface SubTopicContent {
  id: string
  title: string
  description: string
  contentType: string
  contentUrl: string
  contentText: string
  durationMinutes: number
  isRequired: boolean
  orderIndex: number
  isPublished: boolean
}

interface TestQuestion {
  id: string
  question: string
  category: string
  subjectModel: string
  difficulty: string
  isActive: boolean
}

export default function ContentManagementPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [selectedModule, setSelectedModule] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("")
  const [selectedSubTopic, setSelectedSubTopic] = useState("")
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set())
  const [expandedSubTopics, setExpandedSubTopics] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isMasterPractitioner, setIsMasterPractitioner] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [questions, setQuestions] = useState<TestQuestion[]>([])

  // Sheet states
  const [showLevelSheet, setShowLevelSheet] = useState(false)
  const [showSubTopicSheet, setShowSubTopicSheet] = useState(false)
  const [showContentSheet, setShowContentSheet] = useState(false)
  const [showTestSheet, setShowTestSheet] = useState(false)

  // Editing states
  const [editingLevel, setEditingLevel] = useState<Level | null>(null)
  const [editingSubTopic, setEditingSubTopic] = useState<SubTopic | null>(null)
  const [editingContent, setEditingContent] = useState<SubTopicContent | null>(null)

  const router = useRouter()

  useEffect(() => {
    const checkMasterPractitionerAndLoadData = async () => {
      try {
        setIsLoading(true)

        // Check authentication via API
        const authRes = await fetch('/api/auth/user')
        if (authRes.status === 401) {
          router.push('/auth/login')
          return
        }

        if (!authRes.ok) {
          throw new Error('Failed to fetch user data')
        }

        const authData = await authRes.json()
        const profile = authData.profile

        if (!profile) {
          router.push('/register')
          return
        }

        // Check if master practitioner - role info should be included in profile
        if (!profile.roleId || profile.role?.name !== 'master_practitioner') {
          setIsMasterPractitioner(false)
          setIsLoading(false)
          return
        }

        setIsMasterPractitioner(true)
        setUserName(`${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Master Practitioner')
        setUserEmail(profile.email || '')

        // Load modules and questions
        await loadModules()
        await loadQuestions()

      } catch (error) {
        console.error('Error loading data:', error)
        setIsMasterPractitioner(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkMasterPractitionerAndLoadData()
  }, [router])

  const loadModules = async () => {
    try {
      const response = await fetch('/api/modules')
      if (response.ok) {
        const modulesData = await response.json()
        // Load levels for each module
        const modulesWithLevels = await Promise.all(
          modulesData.map(async (module: any) => {
            try {
              const levelsResponse = await fetch(`/api/levels?moduleId=${module.id}`)
              if (levelsResponse.ok) {
                const levelsData = await levelsResponse.json()
                // Load sub-topics for each level
                const levelsWithSubTopics = await Promise.all(
                  levelsData.map(async (level: any) => {
                    try {
                      const subTopicsResponse = await fetch(`/api/sub-topics?levelId=${level.id}`)
                      if (subTopicsResponse.ok) {
                        const subTopicsData = await subTopicsResponse.json()
                        return { ...level, subTopics: subTopicsData }
                      }
                      return level
                    } catch (error) {
                      console.warn('Sub-topics API not available yet')
                      return level
                    }
                  })
                )
                return { ...module, levels: levelsWithSubTopics }
              }
              return module
            } catch (error) {
              console.warn('Levels API not available yet')
              return module
            }
          })
        )
        setModules(modulesWithLevels)
      } else {
        setModules([])
      }
    } catch (error) {
      console.error('Error loading modules:', error)
      setModules([])
    }
  }

  const loadQuestions = async () => {
    try {
      const response = await fetch('/api/tests/questions')
      if (response.ok) {
        const questionsData = await response.json()
        setQuestions(questionsData)
      } else {
        setQuestions([])
      }
    } catch (error) {
      console.error('Error loading questions:', error)
      setQuestions([])
    }
  }

  const handleModuleSelect = (moduleId: string) => {
    setSelectedModule(moduleId)
    setSelectedLevel("")
    setSelectedSubTopic("")
  }

  const handleLevelSelect = (levelId: string) => {
    setSelectedLevel(levelId)
    setSelectedSubTopic("")
  }

  const toggleLevelExpansion = (levelId: string) => {
    const newExpanded = new Set(expandedLevels)
    if (newExpanded.has(levelId)) {
      newExpanded.delete(levelId)
    } else {
      newExpanded.add(levelId)
    }
    setExpandedLevels(newExpanded)
  }

  const toggleSubTopicExpansion = (subTopicId: string) => {
    const newExpanded = new Set(expandedSubTopics)
    if (newExpanded.has(subTopicId)) {
      newExpanded.delete(subTopicId)
    } else {
      newExpanded.add(subTopicId)
    }
    setExpandedSubTopics(newExpanded)
  }

  const handleCreateLevel = () => {
    setEditingLevel(null)
    setShowLevelSheet(true)
  }

  const handleCreateSubTopic = () => {
    setEditingSubTopic(null)
    setShowSubTopicSheet(true)
  }

  const handleCreateContent = () => {
    setEditingContent(null)
    setShowContentSheet(true)
  }

  const handleCreateTest = () => {
    setShowTestSheet(true)
  }

  const handleCreateSubTopicForObjective = async (levelId: string, objectiveTitle: string) => {
    try {
      const response = await fetch('/api/sub-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          levelId,
          title: objectiveTitle,
          description: `Content for: ${objectiveTitle}`,
          orderIndex: 0,
          isActive: true
        })
      })

      if (response.ok) {
        await loadModules()
        // Auto-expand the newly created sub-topic
        const newSubTopic = await response.json()
        setExpandedSubTopics(prev => new Set([...prev, newSubTopic.id]))
      }
    } catch (error) {
      console.error('Error creating sub-topic for objective:', error)
    }
  }

  const handleSaveLevel = async (levelData: any) => {
    try {
      const method = editingLevel ? 'PUT' : 'POST'
      const body = editingLevel
        ? { ...levelData, id: editingLevel.id }
        : { ...levelData, moduleId: selectedModule }

      const response = await fetch('/api/levels', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await loadModules()
        setShowLevelSheet(false)
        setEditingLevel(null)
      }
    } catch (error) {
      console.error('Error saving level:', error)
    }
  }

  const handleSaveSubTopic = async (subTopicData: any) => {
    try {
      const method = editingSubTopic ? 'PUT' : 'POST'
      const url = editingSubTopic
        ? `/api/sub-topics/${editingSubTopic.id}`
        : '/api/sub-topics'
      const body = editingSubTopic
        ? subTopicData
        : { ...subTopicData, levelId: selectedLevel }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await loadModules()
        setShowSubTopicSheet(false)
        setEditingSubTopic(null)
      }
    } catch (error) {
      console.error('Error saving sub-topic:', error)
    }
  }

  const handleSaveContent = async (contentData: any) => {
    try {
      console.log('Saving content with contentText:', contentData.contentText?.substring(0, 200) + '...')

      const method = editingContent ? 'PUT' : 'POST'
      const url = editingContent
        ? `/api/sub-topic-content/${editingContent.id}`
        : '/api/sub-topic-content'
      const body = editingContent
        ? contentData
        : { ...contentData, subTopicId: selectedSubTopic }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        console.log('Content saved successfully')
        await loadModules()
        setShowContentSheet(false)
        setEditingContent(null)
      } else {
        console.error('Failed to save content:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error saving content:', error)
    }
  }

  const handleSaveTest = async (testData: any) => {
    try {
      const response = await fetch('/api/sub-topic-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...testData, subTopicId: selectedSubTopic })
      })

      if (response.ok) {
        await loadModules()
        setShowTestSheet(false)
      }
    } catch (error) {
      console.error('Error saving test:', error)
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
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
            <Button
              onClick={() => router.push('/dashboard')}
              className="mt-4"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const selectedModuleData = modules.find(m => m.id === selectedModule)
  const selectedLevelData = selectedModuleData?.levels?.find(l => l.id === selectedLevel)
  const selectedSubTopicData = selectedLevelData?.subTopics?.find(st => st.id === selectedSubTopic)

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
          <h1 className="text-lg font-semibold">Course Content Management</h1>
          <div className="w-8" />
        </div>

        <div className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Course Content Management</h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Create and manage your course content hierarchy: Modules → Levels → Sub-topics → Content
              </p>
            </div>

            <div className="space-y-6">
              {/* Module Selector */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Module</CardTitle>
                  <CardDescription>
                    Choose a module to manage its content structure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedModule} onValueChange={handleModuleSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a module" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {selectedModule && selectedModuleData && (
                <>
                  {/* Module Structure */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Course Structure: {selectedModuleData.title}</CardTitle>
                        <CardDescription>
                          Build your course hierarchy with levels, sub-topics, and content
                        </CardDescription>
                      </div>
                      <Button onClick={handleCreateLevel}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Level
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedModuleData.levels?.map((level) => (
                          <div key={level.id} className="border rounded-lg">
                            {/* Level Header */}
                            <div
                              className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                              onClick={() => toggleLevelExpansion(level.id)}
                            >
                              <div className="flex items-center gap-3">
                                {expandedLevels.has(level.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <GraduationCap className="h-5 w-5 text-primary" />
                                <div>
                                  <h3 className="font-medium">{level.title}</h3>
                                  <p className="text-sm text-muted-foreground">{level.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={level.isActive ? "default" : "secondary"}>
                                  {level.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingLevel(level)
                                    setShowLevelSheet(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleLevelSelect(level.id)
                                    handleCreateSubTopic()
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Sub-topic
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedLevel(level.id)
                                    handleCreateTest()
                                  }}
                                >
                                  <TestTube className="h-4 w-4 mr-1" />
                                  Level Exam
                                </Button>
                              </div>
                            </div>

                            {/* Level Content */}
                            {expandedLevels.has(level.id) && (
                              <div className="p-4 border-t">
                                {level.learningObjectives ? (
                                  <div className="space-y-3">
                                    <h4 className="font-medium text-sm mb-3">Learning Objectives:</h4>
                                    {level.learningObjectives.split('\n').filter(obj => obj.trim()).map((objective, index) => {
                                      // Find existing sub-topic for this objective
                                      const existingSubTopic = level.subTopics?.find(st =>
                                        st.title.trim() === objective.trim()
                                      )

                                      return (
                                        <div key={index} className="border rounded border-muted">
                                          {/* Objective Header */}
                                          <div
                                            className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => {
                                              if (existingSubTopic) {
                                                toggleSubTopicExpansion(existingSubTopic.id)
                                              } else {
                                                // Create sub-topic for this objective
                                                handleCreateSubTopicForObjective(level.id, objective.trim())
                                              }
                                            }}
                                          >
                                            <div className="flex items-center gap-3">
                                              {existingSubTopic && expandedSubTopics.has(existingSubTopic.id) ? (
                                                <ChevronDown className="h-4 w-4" />
                                              ) : (
                                                <ChevronRight className="h-4 w-4" />
                                              )}
                                              <BookOpen className="h-4 w-4 text-blue-600" />
                                              <div>
                                                <h4 className="font-medium text-sm">{objective.trim()}</h4>
                                                {existingSubTopic && (
                                                  <p className="text-xs text-muted-foreground">
                                                    {existingSubTopic.contents?.length || 0} content items
                                                    {existingSubTopic.subTopicTest && ' • Has test'}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {!existingSubTopic ? (
                                                <Badge variant="outline" className="text-xs">Not created</Badge>
                                              ) : (
                                                <>
                                                  <Badge variant="outline" className="text-xs">
                                                    {existingSubTopic.contents?.length || 0} items
                                                  </Badge>
                                                  {existingSubTopic.subTopicTest && (
                                                    <Badge variant="outline" className="text-xs">
                                                      <TestTube className="h-3 w-3 mr-1" />
                                                      Test
                                                    </Badge>
                                                  )}
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      setEditingSubTopic(existingSubTopic)
                                                      setShowSubTopicSheet(true)
                                                    }}
                                                  >
                                                    <Edit className="h-3 w-3 mr-1" />
                                                    Edit
                                                  </Button>
                                                </>
                                              )}
                                            </div>
                                          </div>

                                          {/* Sub-topic Content */}
                                          {existingSubTopic && expandedSubTopics.has(existingSubTopic.id) && (
                                            <div className="p-3 border-t bg-muted/10">
                                              {existingSubTopic.contents?.length === 0 ? (
                                                <div className="text-center py-4 text-muted-foreground">
                                                  <p className="text-sm">No content created yet</p>
                                                  <div className="flex gap-2 justify-center mt-2">
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => {
                                                        setSelectedLevel(level.id)
                                                        setSelectedSubTopic(existingSubTopic.id)
                                                        handleCreateContent()
                                                      }}
                                                    >
                                                      Add Content
                                                    </Button>
                                                    {!existingSubTopic.subTopicTest && (
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                          setSelectedLevel(level.id)
                                                          setSelectedSubTopic(existingSubTopic.id)
                                                          handleCreateTest()
                                                        }}
                                                      >
                                                        <TestTube className="h-3 w-3 mr-1" />
                                                        Add Test
                                                      </Button>
                                                    )}
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="space-y-2">
                                                  {existingSubTopic.contents?.map((content) => (
                                                    <div key={content.id} className="flex items-center justify-between p-2 bg-background rounded border">
                                                      <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                          <p className="text-sm font-medium">{content.title}</p>
                                                          <p className="text-xs text-muted-foreground">{content.contentType}</p>
                                                        </div>
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                        <Badge variant={content.isPublished ? "default" : "secondary"} className="text-xs">
                                                          {content.isPublished ? "Published" : "Draft"}
                                                        </Badge>
                                                        <Button
                                                          variant="outline"
                                                          size="sm"
                                                          onClick={() => {
                                                            setEditingContent(content)
                                                            setShowContentSheet(true)
                                                          }}
                                                        >
                                                          <Edit className="h-3 w-3 mr-1" />
                                                          Edit
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  ))}
                                                  {!existingSubTopic.subTopicTest && (
                                                    <div className="pt-2 border-t">
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                          setSelectedLevel(level.id)
                                                          setSelectedSubTopic(existingSubTopic.id)
                                                          handleCreateTest()
                                                        }}
                                                      >
                                                        <TestTube className="h-3 w-3 mr-1" />
                                                        Add Sub-topic Test
                                                      </Button>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-muted-foreground">
                                    <p>No learning objectives defined</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mt-2"
                                      onClick={() => {
                                        setEditingLevel(level)
                                        setShowLevelSheet(true)
                                      }}
                                    >
                                      Add Learning Objectives
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}

                        {(!selectedModuleData.levels || selectedModuleData.levels.length === 0) && (
                          <div className="text-center py-8 text-muted-foreground">
                            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No levels created yet</p>
                            <Button onClick={handleCreateLevel} className="mt-2">
                              Create Your First Level
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Level Sheet */}
      <Sheet open={showLevelSheet} onOpenChange={setShowLevelSheet}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-6">
          <SheetHeader className="mb-6">
            <SheetTitle>
              {editingLevel ? 'Edit Level' : 'Create New Level'}
            </SheetTitle>
            <SheetDescription>
              {editingLevel ? 'Update the level details' : 'Add a new level to the selected module'}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6">
            <LevelForm
              level={editingLevel}
              onSave={handleSaveLevel}
              onCancel={() => {
                setShowLevelSheet(false)
                setEditingLevel(null)
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Sub-topic Sheet */}
      <Sheet open={showSubTopicSheet} onOpenChange={setShowSubTopicSheet}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-6">
          <SheetHeader className="mb-6">
            <SheetTitle>
              {editingSubTopic ? 'Edit Sub-topic' : 'Create New Sub-topic'}
            </SheetTitle>
            <SheetDescription>
              {editingSubTopic ? 'Update the sub-topic details' : 'Add a new sub-topic to the selected level'}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6">
            <SubTopicForm
              subTopic={editingSubTopic}
              onSave={handleSaveSubTopic}
              onCancel={() => {
                setShowSubTopicSheet(false)
                setEditingSubTopic(null)
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Content Sheet */}
      <Sheet open={showContentSheet} onOpenChange={setShowContentSheet}>
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto p-6">
          <SheetHeader className="mb-6">
            <SheetTitle>
              {editingContent ? 'Edit Content' : 'Create New Content'}
            </SheetTitle>
            <SheetDescription>
              {editingContent ? 'Update the content details' : 'Add new content to the selected sub-topic'}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6">
            <ContentForm
              content={editingContent}
              onSave={handleSaveContent}
              onCancel={() => {
                setShowContentSheet(false)
                setEditingContent(null)
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Test Sheet */}
      <Sheet open={showTestSheet} onOpenChange={setShowTestSheet}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-6">
          <SheetHeader className="mb-6">
            <SheetTitle>Create Sub-topic Test</SheetTitle>
            <SheetDescription>
              Add a test for the selected sub-topic
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6">
            <TestForm
              onSave={handleSaveTest}
              onCancel={() => setShowTestSheet(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

// Level Form Component
function LevelForm({ level, onSave, onCancel }: {
  level: Level | null
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: level?.title || '',
    description: level?.description || '',
    orderIndex: level?.orderIndex || 0,
    isActive: level?.isActive ?? true,
    estimatedDuration: level?.estimatedDuration || 0,
    learningObjectives: level?.learningObjectives || ''
  })

  // Update form data when level prop changes (for editing)
  useEffect(() => {
    if (level) {
      setFormData({
        title: level.title || '',
        description: level.description || '',
        orderIndex: level.orderIndex || 0,
        isActive: level.isActive ?? true,
        estimatedDuration: level.estimatedDuration || 0,
        learningObjectives: level.learningObjectives || ''
      })
    }
  }, [level])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleAddQuestion = () => {
    if (!newQuestion.question || !newQuestion.optionA || !newQuestion.optionB ||
        !newQuestion.optionC || !newQuestion.optionD || !newQuestion.correctAnswer) {
      alert('Please fill in all question fields')
      return
    }

    const questionToAdd = {
      question: newQuestion.question,
      optionA: newQuestion.optionA,
      optionB: newQuestion.optionB,
      optionC: newQuestion.optionC,
      optionD: newQuestion.optionD,
      correctAnswer: newQuestion.correctAnswer,
      category: newQuestion.category,
      difficulty: newQuestion.difficulty
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, questionToAdd],
      totalQuestions: prev.questions.length + 1
    }))

    // Reset new question form
    setNewQuestion({
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: '',
      category: 'General',
      difficulty: 'medium'
    })
    setShowAddQuestion(false)
  }

  const handleRemoveQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
      totalQuestions: prev.questions.length - 1
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="levelTitle">Title</Label>
        <Input
          id="levelTitle"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="levelDescription">Description</Label>
        <Textarea
          id="levelDescription"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="orderIndex">Order Index</Label>
          <Input
            id="orderIndex"
            type="number"
            value={formData.orderIndex}
            onChange={(e) => setFormData(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
          <Input
            id="estimatedDuration"
            type="number"
            value={formData.estimatedDuration}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="learningObjectives">Learning Objectives (One per line - each becomes a sub-topic)</Label>
        <Textarea
          id="learningObjectives"
          value={formData.learningObjectives}
          onChange={(e) => setFormData(prev => ({ ...prev, learningObjectives: e.target.value }))}
          rows={6}
          placeholder="Enter each learning objective on a new line. Each line will become a sub-topic automatically:

What is Cyber Security?
Core Principles of Cyber Security
Types of Cyber Threats
Cyber Security Best Practices"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          {level ? 'Update' : 'Create'} Level
        </Button>
      </div>
    </form>
  )
}

// Sub-topic Form Component
function SubTopicForm({ subTopic, onSave, onCancel }: {
  subTopic: SubTopic | null
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: subTopic?.title || '',
    description: subTopic?.description || '',
    orderIndex: subTopic?.orderIndex || 0,
    isActive: subTopic?.isActive ?? true,
    estimatedDuration: subTopic?.estimatedDuration || 0,
    learningObjectives: subTopic?.learningObjectives || '',
    readingMaterial: subTopic?.readingMaterial || '',
    attachments: subTopic?.attachments || [],
    externalLinks: subTopic?.externalLinks || []
  })

  // Update form data when subTopic prop changes (for editing)
  useEffect(() => {
    if (subTopic) {
      setFormData({
        title: subTopic.title || '',
        description: subTopic.description || '',
        orderIndex: subTopic.orderIndex || 0,
        isActive: subTopic.isActive ?? true,
        estimatedDuration: subTopic.estimatedDuration || 0,
        learningObjectives: subTopic.learningObjectives || '',
        readingMaterial: subTopic.readingMaterial || '',
        attachments: subTopic.attachments || [],
        externalLinks: subTopic.externalLinks || []
      })
    }
  }, [subTopic])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subTopicTitle">Title</Label>
        <Input
          id="subTopicTitle"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subTopicDescription">Description</Label>
        <Textarea
          id="subTopicDescription"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subTopicOrderIndex">Order Index</Label>
          <Input
            id="subTopicOrderIndex"
            type="number"
            value={formData.orderIndex}
            onChange={(e) => setFormData(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subTopicDuration">Estimated Duration (minutes)</Label>
          <Input
            id="subTopicDuration"
            type="number"
            value={formData.estimatedDuration}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subTopicObjectives">Learning Objectives</Label>
        <Textarea
          id="subTopicObjectives"
          value={formData.learningObjectives}
          onChange={(e) => setFormData(prev => ({ ...prev, learningObjectives: e.target.value }))}
          rows={3}
          placeholder="Enter learning objectives as JSON or plain text"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="readingMaterial">Reading Material / Notes</Label>
        <RichTextEditor
          value={formData.readingMaterial}
          onChange={(value) => setFormData(prev => ({ ...prev, readingMaterial: value }))}
          placeholder="Enter the reading material, notes, or content for this sub-topic. Use the toolbar to format text, add links, images, etc.

Example content:
Cybersecurity is the practice of protecting internet-connected systems, networks, and data from digital attacks and unauthorized access. It involves using a combination of technologies, processes, and policies to safeguard systems and data from threats like malware, ransomware, phishing, and hacking. The goal is to maintain the confidentiality, integrity, and availability of information and systems, ensuring a safe online environment."
        />
      </div>

      {/* File Attachments */}
      <div className="space-y-2">
        <Label>File Attachments</Label>
        <div className="space-y-2">
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
            className="w-full p-2 border rounded-md"
            onChange={(e) => {
              // Handle file uploads here
              console.log('Files selected:', e.target.files)
            }}
          />
          <p className="text-xs text-muted-foreground">
            Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, JPEG, PNG
          </p>
        </div>
      </div>

      {/* External Links */}
      <div className="space-y-2">
        <Label>External Links</Label>
        <div className="space-y-2">
          {formData.externalLinks.map((link: any, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Link title"
                value={link.title || ''}
                onChange={(e) => {
                  const newLinks = [...formData.externalLinks]
                  newLinks[index] = { ...newLinks[index], title: e.target.value }
                  setFormData(prev => ({ ...prev, externalLinks: newLinks }))
                }}
              />
              <Input
                placeholder="https://example.com"
                value={link.url || ''}
                onChange={(e) => {
                  const newLinks = [...formData.externalLinks]
                  newLinks[index] = { ...newLinks[index], url: e.target.value }
                  setFormData(prev => ({ ...prev, externalLinks: newLinks }))
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newLinks = formData.externalLinks.filter((_, i) => i !== index)
                  setFormData(prev => ({ ...prev, externalLinks: newLinks }))
                }}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                externalLinks: [...prev.externalLinks, { title: '', url: '' }]
              }))
            }}
          >
            Add Link
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="subTopicIsActive"
          checked={formData.isActive}
          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
        />
        <Label htmlFor="subTopicIsActive">Active</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          {subTopic ? 'Update' : 'Create'} Sub-topic
        </Button>
      </div>
    </form>
  )
}

// Content Form Component
function ContentForm({ content, onSave, onCancel }: {
  content: SubTopicContent | null
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: content?.title || '',
    description: content?.description || '',
    contentType: content?.contentType || 'TEXT',
    contentUrl: content?.contentUrl || '',
    contentText: content?.contentText || '',
    durationMinutes: content?.durationMinutes || 0,
    isRequired: content?.isRequired ?? true,
    orderIndex: content?.orderIndex || 0,
    isPublished: content?.isPublished ?? false,
    selectedQuestionId: content?.contentUrl || '' // Store selected question ID in contentUrl for QUIZ type
  })

  // Ref to store the latest content text value
  const contentTextRef = useRef(content?.contentText || '')

  // Update form data when content prop changes (for editing)
  useEffect(() => {
    if (content) {
      const newFormData = {
        title: content.title || '',
        description: content.description || '',
        contentType: content.contentType || 'TEXT',
        contentUrl: content.contentUrl || '',
        contentText: content.contentText || '',
        durationMinutes: content.durationMinutes || 0,
        isRequired: content.isRequired ?? true,
        orderIndex: content.orderIndex || 0,
        isPublished: content.isPublished ?? false,
        selectedQuestionId: content.contentUrl || '' // For QUIZ type, contentUrl stores the question ID
      }
      setFormData(newFormData)
      contentTextRef.current = content.contentText || ''
    }
  }, [content])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Use the latest content text from the ref
    const finalFormData = {
      ...formData,
      contentText: contentTextRef.current
    }
    console.log('Submitting form with contentText:', finalFormData.contentText?.substring(0, 200) + '...')
    onSave(finalFormData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contentTitle">Title</Label>
          <Input
            id="contentTitle"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contentType">Content Type</Label>
          <Select
            value={formData.contentType}
            onValueChange={(value) => setFormData(prev => ({ ...prev, contentType: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VIDEO">Video</SelectItem>
              <SelectItem value="DOCUMENT">Document</SelectItem>
              <SelectItem value="QUIZ">Quiz</SelectItem>
              <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
              <SelectItem value="LIVE_SESSION">Live Session</SelectItem>
              <SelectItem value="NOTES">Notes</SelectItem>
              <SelectItem value="STUDY_GUIDE">Study Guide</SelectItem>
              <SelectItem value="TEXT">Text</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contentDescription">Description</Label>
        <Textarea
          id="contentDescription"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {formData.contentType === 'QUIZ' ? (
          <div className="space-y-2">
            <Label htmlFor="selectedQuestion">Select Question</Label>
            <Select
              value={formData.selectedQuestionId}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                selectedQuestionId: value,
                contentUrl: value // Store question ID in contentUrl
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a question for this quiz" />
              </SelectTrigger>
              <SelectContent>
                {questions.map((question) => (
                  <SelectItem key={question.id} value={question.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{question.question.substring(0, 60)}...</span>
                      <span className="text-xs text-muted-foreground">
                        {question.category} • {question.subjectModel} • {question.difficulty}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="contentUrl">Content URL</Label>
            <Input
              id="contentUrl"
              value={formData.contentUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, contentUrl: e.target.value }))}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="durationMinutes">Duration (minutes)</Label>
          <Input
            id="durationMinutes"
            type="number"
            value={formData.durationMinutes}
            onChange={(e) => setFormData(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contentText">Content Text</Label>
        <RichTextEditor
          value={formData.contentText}
          onChange={(value) => {
            setFormData(prev => ({ ...prev, contentText: value }))
            contentTextRef.current = value
          }}
          placeholder="Enter the detailed content for this item. Use the toolbar to format text, add links, images, etc.

You can include:
• Formatted text with headings and paragraphs
• Bullet points and numbered lists
• Links to external resources
• Images and media
• Code snippets or examples"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contentOrderIndex">Order Index</Label>
          <Input
            id="contentOrderIndex"
            type="number"
            value={formData.orderIndex}
            onChange={(e) => setFormData(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))}
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isRequired"
            checked={formData.isRequired}
            onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
          />
          <Label htmlFor="isRequired">Required</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isPublished"
            checked={formData.isPublished}
            onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
          />
          <Label htmlFor="isPublished">Published</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          {content ? 'Update' : 'Create'} Content
        </Button>
      </div>
    </form>
  )
}

// Test Form Component
function TestForm({ onSave, onCancel }: {
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    totalQuestions: 5,
    passingScore: 70,
    timeLimit: 600,
    isActive: true,
    questions: [] as any[] // Array to store questions added directly
  })
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: '',
    category: 'General',
    difficulty: 'medium'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="testTitle">Test Title</Label>
        <Input
          id="testTitle"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="testDescription">Description</Label>
        <Textarea
          id="testDescription"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="totalQuestions">Total Questions</Label>
          <Input
            id="totalQuestions"
            type="number"
            value={formData.totalQuestions}
            onChange={(e) => setFormData(prev => ({ ...prev, totalQuestions: parseInt(e.target.value) || 5 }))}
            min="1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="passingScore">Passing Score (%)</Label>
          <Input
            id="passingScore"
            type="number"
            value={formData.passingScore}
            onChange={(e) => setFormData(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 70 }))}
            min="0"
            max="100"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
          <Input
            id="timeLimit"
            type="number"
            value={Math.floor(formData.timeLimit / 60)}
            onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) * 60 || 600 }))}
            min="1"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="testIsActive"
          checked={formData.isActive}
          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
        />
        <Label htmlFor="testIsActive">Active</Label>
      </div>

      {/* Question Management Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Questions ({formData.questions.length})</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddQuestion(!showAddQuestion)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>

        {/* Add Question Form */}
        {showAddQuestion && (
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question *</Label>
                <Textarea
                  id="question"
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Enter the question text"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="optionA">Option A *</Label>
                  <Input
                    id="optionA"
                    value={newQuestion.optionA}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, optionA: e.target.value }))}
                    placeholder="First option"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="optionB">Option B *</Label>
                  <Input
                    id="optionB"
                    value={newQuestion.optionB}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, optionB: e.target.value }))}
                    placeholder="Second option"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="optionC">Option C *</Label>
                  <Input
                    id="optionC"
                    value={newQuestion.optionC}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, optionC: e.target.value }))}
                    placeholder="Third option"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="optionD">Option D *</Label>
                  <Input
                    id="optionD"
                    value={newQuestion.optionD}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, optionD: e.target.value }))}
                    placeholder="Fourth option"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="correctAnswer">Correct Answer *</Label>
                  <Select
                    value={newQuestion.correctAnswer}
                    onValueChange={(value) => setNewQuestion(prev => ({ ...prev, correctAnswer: value }))}
                  >
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
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., General, Security"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={newQuestion.difficulty}
                    onValueChange={(value) => setNewQuestion(prev => ({ ...prev, difficulty: value }))}
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

              <div className="flex gap-2">
                <Button type="button" onClick={handleAddQuestion}>
                  Add Question
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddQuestion(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Questions List */}
        {formData.questions.length > 0 && (
          <div className="space-y-2">
            {formData.questions.map((question, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium mb-2">{question.question}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <span>A: {question.optionA}</span>
                      <span>B: {question.optionB}</span>
                      <span>C: {question.optionC}</span>
                      <span>D: {question.optionD}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Correct: {question.correctAnswer}</span>
                      <span>Category: {question.category}</span>
                      <span>Difficulty: {question.difficulty}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveQuestion(index)}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Create Test
        </Button>
      </div>
    </form>
  )
}