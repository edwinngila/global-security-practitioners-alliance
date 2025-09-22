"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Download, Menu, Eye, Calendar, User, Settings, Save, Palette } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import CertificateSeal from "@/components/certificate-seal"

interface CertificateUser {
  id: string
  first_name: string
  last_name: string
  email: string
  certificate_issued: boolean
  certificate_url: string | null
  certificate_available_at: string | null
  test_completed: boolean
  test_score: number | null
  created_at: string
}

interface CertificateTemplate {
  id: string
  template_name: string
  organization_name: string
  organization_logo_url: string | null
  certificate_title: string
  certificate_subtitle: string
  main_title: string
  recipient_title: string
  achievement_description: string
  date_label: string
  score_label: string
  certificate_id_label: string
  signature_name: string
  signature_title: string
  signature_organization: string
  background_color: string
  primary_color: string
  accent_color: string
  font_family: string
  watermark_text: string | null
  is_active: boolean
  created_at: string
}

export default function AdminCertificatesPage() {
  const [certifiedUsers, setCertifiedUsers] = useState<CertificateUser[]>([])
  const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("certificates")

  // Certificate template form state
  const [templateForm, setTemplateForm] = useState({
    template_name: "Default Certificate",
    organization_name: "Global Security Practitioners Alliance",
    certificate_title: "Certificate of Excellence",
    certificate_subtitle: "Professional Security Certification",
    main_title: "Certificate of Excellence",
    recipient_title: "This certifies that",
    achievement_description: "has demonstrated exceptional mastery and professional excellence in the field of Cybersecurity and Risk Management, successfully completing the comprehensive Security Aptitude Assessment with distinction. This achievement represents a commitment to the highest standards of professional competency in security protocols, threat analysis, compliance frameworks, and emergency response procedures.",
    date_label: "Date of Achievement",
    score_label: "Excellence Score",
    certificate_id_label: "Certification ID",
    signature_name: "Dr. Alexandra Sterling",
    signature_title: "Director of Professional Certification",
    signature_organization: "Global Security Institute",
    director_signature: "",
    background_color: "#fefefe",
    primary_color: "#1a2332",
    accent_color: "#c9aa68",
    font_family: "Cormorant Garamond, Times New Roman, serif",
    watermark_text: "CERTIFIED"
  })

  const router = useRouter()
  const supabase = createClient()

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

      // Load users with certificates
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("*")
        .eq("certificate_issued", true)
        .order("created_at", { ascending: false })

      if (!usersError && users) {
        setCertifiedUsers(users)
      }

      // Load certificate templates
      const { data: templates, error: templatesError } = await supabase
        .from("certificate_templates")
        .select("*")
        .order("created_at", { ascending: false })

      if (!templatesError && templates) {
        setCertificateTemplates(templates)

        // Load the active template into the form
        const activeTemplate = templates.find(t => t.is_active) || templates[0]
        if (activeTemplate) {
          setTemplateForm({
            template_name: activeTemplate.template_name,
            organization_name: activeTemplate.organization_name,
            certificate_title: activeTemplate.certificate_title,
            certificate_subtitle: activeTemplate.certificate_subtitle,
            main_title: activeTemplate.main_title,
            recipient_title: activeTemplate.recipient_title,
            achievement_description: activeTemplate.achievement_description,
            date_label: activeTemplate.date_label,
            score_label: activeTemplate.score_label,
            certificate_id_label: activeTemplate.certificate_id_label,
            signature_name: activeTemplate.signature_name,
            signature_title: activeTemplate.signature_title,
            signature_organization: activeTemplate.signature_organization,
            director_signature: (activeTemplate as any).director_signature || "",
            background_color: activeTemplate.background_color,
            primary_color: activeTemplate.primary_color,
            accent_color: activeTemplate.accent_color,
            font_family: activeTemplate.font_family,
            watermark_text: activeTemplate.watermark_text || ""
          })
        }
      }

      setIsLoading(false)
    }

    checkAdminAndLoadData()
  }, [supabase, router])

  const handleSaveTemplate = async () => {
    try {
      const activeTemplate = certificateTemplates.find(t => t.is_active)

      if (activeTemplate) {
        const { error } = await supabase
          .from("certificate_templates")
          .update({
            ...templateForm,
            updated_at: new Date().toISOString()
          })
          .eq("id", activeTemplate.id)

        if (error) throw error

        alert("Certificate template updated successfully!")
      } else {
        // Create new template
        const { error } = await supabase
          .from("certificate_templates")
          .insert({
            ...templateForm,
            is_active: true
          })

        if (error) throw error

        alert("Certificate template created successfully!")

        // Reload templates
        const { data: templates } = await supabase
          .from("certificate_templates")
          .select("*")
          .order("created_at", { ascending: false })

        if (templates) {
          setCertificateTemplates(templates)
        }
      }
    } catch (error) {
      console.error("Error saving template:", error)
      alert("Error saving certificate template. Please try again.")
    }
  }

  const handleTemplateChange = (field: string, value: string) => {
    setTemplateForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Auto-save template changes (optional - could be enabled with a toggle)
  // useEffect(() => {
  //   const timeoutId = setTimeout(() => {
  //     handleSaveTemplate()
  //   }, 2000) // Auto-save after 2 seconds of inactivity

  //   return () => clearTimeout(timeoutId)
  // }, [templateForm])

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
          <h1 className="text-lg font-semibold">Certificates</h1>
          <div className="w-8" />
        </div>

        <div className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Certificate Management</h1>
              <p className="text-muted-foreground">
                Manage issued certificates and customize certificate templates.
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="certificates" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Issued Certificates
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Certificate Templates
                </TabsTrigger>
              </TabsList>

              <TabsContent value="certificates" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
                      <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{certifiedUsers.length}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">This Month</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {certifiedUsers.filter(u => {
                          const certDate = new Date(u.certificate_available_at || u.created_at)
                          const now = new Date()
                          return certDate.getMonth() === now.getMonth() &&
                                certDate.getFullYear() === now.getFullYear()
                        }).length}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">High Scorers</CardTitle>
                      <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {certifiedUsers.filter(u => (u.test_score || 0) >= 80).length}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                      <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {certifiedUsers.length > 0
                          ? Math.round(certifiedUsers.reduce((sum, u) => sum + (u.test_score || 0), 0) / certifiedUsers.length)
                          : 0}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Certificates Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Issued Certificates</CardTitle>
                    <CardDescription>
                      All certificates that have been issued to certified users.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {certifiedUsers.length === 0 ? (
                      <div className="text-center py-12">
                        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Certificates Issued</h3>
                        <p className="text-muted-foreground">
                          No users have been issued certificates yet.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[150px]">Name</TableHead>
                              <TableHead className="min-w-[200px]">Email</TableHead>
                              <TableHead className="min-w-[100px]">Score</TableHead>
                              <TableHead className="min-w-[120px]">Issued Date</TableHead>
                              <TableHead className="min-w-[120px]">Certificate ID</TableHead>
                              <TableHead className="min-w-[120px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {certifiedUsers.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                  {user.first_name} {user.last_name}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <Badge variant="default">
                                    {user.test_score}%
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {user.certificate_available_at
                                    ? new Date(user.certificate_available_at).toLocaleDateString()
                                    : new Date(user.created_at).toLocaleDateString()
                                  }
                                </TableCell>
                                <TableCell>
                                  <code className="text-xs bg-muted px-2 py-1 rounded">
                                    GSPA-{user.id.toUpperCase().slice(0, 8)}
                                  </code>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="templates" className="space-y-6">
                {/* Template Editor */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Certificate Template Editor
                    </CardTitle>
                    <CardDescription>
                      Customize the appearance and content of certificates issued to users.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Organization Settings */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Organization Details
                        </h3>

                        <div>
                          <Label htmlFor="template_name">Template Name</Label>
                          <Input
                            id="template_name"
                            value={templateForm.template_name}
                            onChange={(e) => handleTemplateChange('template_name', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="organization_name">Organization Name</Label>
                          <Input
                            id="organization_name"
                            value={templateForm.organization_name}
                            onChange={(e) => handleTemplateChange('organization_name', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="certificate_title">Certificate Title</Label>
                          <Input
                            id="certificate_title"
                            value={templateForm.certificate_title}
                            onChange={(e) => handleTemplateChange('certificate_title', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="certificate_subtitle">Certificate Subtitle</Label>
                          <Input
                            id="certificate_subtitle"
                            value={templateForm.certificate_subtitle}
                            onChange={(e) => handleTemplateChange('certificate_subtitle', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Content Settings */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Certificate Content
                        </h3>

                        <div>
                          <Label htmlFor="main_title">Main Title</Label>
                          <Input
                            id="main_title"
                            value={templateForm.main_title}
                            onChange={(e) => handleTemplateChange('main_title', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="recipient_title">Recipient Title</Label>
                          <Input
                            id="recipient_title"
                            value={templateForm.recipient_title}
                            onChange={(e) => handleTemplateChange('recipient_title', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="achievement_description">Achievement Description</Label>
                          <Textarea
                            id="achievement_description"
                            value={templateForm.achievement_description}
                            onChange={(e) => handleTemplateChange('achievement_description', e.target.value)}
                            rows={4}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Labels */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Labels & Signatures</h3>

                        <div>
                          <Label htmlFor="date_label">Date Label</Label>
                          <Input
                            id="date_label"
                            value={templateForm.date_label}
                            onChange={(e) => handleTemplateChange('date_label', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="score_label">Score Label</Label>
                          <Input
                            id="score_label"
                            value={templateForm.score_label}
                            onChange={(e) => handleTemplateChange('score_label', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="certificate_id_label">Certificate ID Label</Label>
                          <Input
                            id="certificate_id_label"
                            value={templateForm.certificate_id_label}
                            onChange={(e) => handleTemplateChange('certificate_id_label', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Signature */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Signature Details</h3>

                        <div>
                          <Label htmlFor="signature_name">Signature Name</Label>
                          <Input
                            id="signature_name"
                            value={templateForm.signature_name}
                            onChange={(e) => handleTemplateChange('signature_name', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="signature_title">Signature Title</Label>
                          <Input
                            id="signature_title"
                            value={templateForm.signature_title}
                            onChange={(e) => handleTemplateChange('signature_title', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="signature_organization">Signature Organization</Label>
                          <Input
                            id="signature_organization"
                            value={templateForm.signature_organization}
                            onChange={(e) => handleTemplateChange('signature_organization', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="director_signature">Director's Signature (Image URL)</Label>
                          <Input
                            id="director_signature"
                            value={templateForm.director_signature}
                            onChange={(e) => handleTemplateChange('director_signature', e.target.value)}
                            placeholder="https://example.com/director-signature.png"
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Upload the director's signature image and paste the URL here
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Colors */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Colors
                        </h3>

                        <div>
                          <Label htmlFor="background_color">Background Color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="background_color"
                              type="color"
                              value={templateForm.background_color}
                              onChange={(e) => handleTemplateChange('background_color', e.target.value)}
                              className="w-16 h-10"
                            />
                            <Input
                              value={templateForm.background_color}
                              onChange={(e) => handleTemplateChange('background_color', e.target.value)}
                              placeholder="#fefefe"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="primary_color">Primary Color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="primary_color"
                              type="color"
                              value={templateForm.primary_color}
                              onChange={(e) => handleTemplateChange('primary_color', e.target.value)}
                              className="w-16 h-10"
                            />
                            <Input
                              value={templateForm.primary_color}
                              onChange={(e) => handleTemplateChange('primary_color', e.target.value)}
                              placeholder="#1a2332"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="accent_color">Accent Color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="accent_color"
                              type="color"
                              value={templateForm.accent_color}
                              onChange={(e) => handleTemplateChange('accent_color', e.target.value)}
                              className="w-16 h-10"
                            />
                            <Input
                              value={templateForm.accent_color}
                              onChange={(e) => handleTemplateChange('accent_color', e.target.value)}
                              placeholder="#c9aa68"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Typography */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Typography</h3>

                        <div>
                          <Label htmlFor="font_family">Font Family</Label>
                          <Select value={templateForm.font_family} onValueChange={(value) => handleTemplateChange('font_family', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Cormorant Garamond, Times New Roman, serif">Cormorant Garamond</SelectItem>
                              <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                              <SelectItem value="Georgia, serif">Georgia</SelectItem>
                              <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                              <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Watermark */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Watermark</h3>

                        <div>
                          <Label htmlFor="watermark_text">Watermark Text</Label>
                          <Input
                            id="watermark_text"
                            value={templateForm.watermark_text}
                            onChange={(e) => handleTemplateChange('watermark_text', e.target.value)}
                            placeholder="CERTIFIED"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t">
                      <Button onClick={handleSaveTemplate} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Template Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Certificate Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Certificate Preview
                    </CardTitle>
                    <CardDescription>
                      Live preview of how the certificate will appear with your current settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-yellow-50">
                      <div
                        className="bg-white border-4 border-blue-600 rounded-lg p-8 mx-auto max-w-7xl shadow-2xl relative overflow-hidden"
                        style={{
                          fontFamily: templateForm.font_family,
                          background: `linear-gradient(135deg, ${templateForm.background_color} 0%, #f8fafc 50%, #ffffff 100%)`,
                          borderColor: '#1e40af'
                        }}
                      >
                        {/* Logo at the top */}
                        <div className="flex justify-center mb-4">
                          <img
                            src="/Global-Security-Practitioners-Alliance.png"
                            alt="GSPA Logo"
                            className="h-28 w-auto"
                          />
                        </div>

                        {/* Decorative border */}
                        <div className="absolute inset-4 border-2 border-yellow-400 rounded pointer-events-none"></div>

                        {/* Header */}
                        <div className="text-center mb-8 relative z-10">
                          <div className="text-3xl font-bold mb-3 text-blue-800">
                            {templateForm.organization_name}
                          </div>
                          <div className="text-xl mb-4 text-yellow-600 font-semibold">
                            {templateForm.certificate_subtitle}
                          </div>
                          <div className="w-24 h-1 mx-auto bg-gradient-to-r from-blue-600 to-yellow-500 rounded-full"></div>
                        </div>

                        {/* Main Title */}
                        <h1 className="text-5xl font-bold text-center mb-8 italic text-blue-800 relative z-10">
                          {templateForm.main_title}
                        </h1>

                        {/* Recipient */}
                        <div className="text-center mb-8 relative z-10">
                          <p className="text-2xl mb-6 italic text-gray-700 font-semibold text-center">
                            {templateForm.recipient_title}
                          </p>
                          <div className="text-4xl font-bold inline-block px-8 py-3 border-b-4 border-yellow-500 bg-gradient-to-r from-blue-50 to-yellow-50 rounded-lg">
                            John Doe
                          </div>
                        </div>

                        {/* Achievement Description - REMOVED */}

                        {/* Details Section */}
                        <div className="flex justify-between items-center mb-12 px-8 relative z-10">
                          <div className="text-center bg-white/80 p-4 rounded-lg shadow-md">
                            <div className="text-sm font-bold mb-2 text-blue-700 uppercase tracking-wide">
                              {templateForm.date_label}
                            </div>
                            <div className="text-lg font-semibold text-blue-800">
                              {new Date().toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>

                          <div className="text-center bg-yellow-400 p-4 rounded-lg shadow-md">
                            <div className="text-sm font-bold mb-2 text-blue-800 uppercase tracking-wide">
                              {templateForm.score_label}
                            </div>
                            <div className="text-2xl font-bold text-blue-800">
                              95%
                            </div>
                          </div>

                          <div className="text-center bg-white/80 p-4 rounded-lg shadow-md">
                            <div className="text-sm font-bold mb-2 text-blue-700 uppercase tracking-wide">
                              {templateForm.certificate_id_label}
                            </div>
                            <div className="font-mono text-lg font-semibold text-blue-800">
                              GSPA-ABC123
                            </div>
                          </div>
                        </div>

                        {/* Signature and Seal */}
                        <div className="flex justify-between items-end relative z-10 px-8">
                          <div className="text-center">
                            <div className="w-64 h-px bg-gradient-to-r from-transparent via-blue-600 to-transparent mx-auto mb-4"></div>
                            {templateForm.director_signature && (
                              <div className="mb-4">
                                <img
                                  src={templateForm.director_signature}
                                  alt="Director's Signature"
                                  className="h-16 w-auto mx-auto"
                                />
                              </div>
                            )}
                            <div className="text-2xl font-bold italic text-blue-800 mb-2">
                              {templateForm.signature_name}
                            </div>
                            <div className="text-lg text-gray-600 mb-1">
                              {templateForm.signature_title}
                            </div>
                            <div className="text-base text-yellow-600 font-semibold">
                              {templateForm.signature_organization}
                            </div>
                          </div>

                          {/* Certificate Seal */}
                          <div className="flex-shrink-0">
                            <CertificateSeal size={140} />
                          </div>
                        </div>

                        {/* GSPA Certified Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="text-8xl font-black text-blue-800/5 transform -rotate-45 select-none">
                            GSPA CERTIFIED
                          </div>
                        </div>

                        {/* Decorative elements */}
                        <div className="absolute top-8 left-8 w-20 h-20 border-4 border-yellow-400 rounded-full opacity-20"></div>
                        <div className="absolute top-8 right-8 w-20 h-20 border-4 border-blue-600 rounded-full opacity-20"></div>
                        <div className="absolute bottom-8 left-8 w-20 h-20 border-4 border-yellow-400 rounded-full opacity-20"></div>
                        <div className="absolute bottom-8 right-8 w-20 h-20 border-4 border-blue-600 rounded-full opacity-20"></div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                      This is a scaled preview. The actual certificate will be generated in high resolution with professional branding.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
