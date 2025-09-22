"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Settings, Mail, Shield, Menu, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [settings, setSettings] = useState({
    siteName: "GSPA Certification Platform",
    adminEmail: "admin@gspa.com",
    emailNotifications: true,
    maintenanceMode: false,
    registrationEnabled: true,
    testFee: 50,
    membershipFee: 50,
    supportEmail: "support@gspa.com",
    privacyPolicy: "",
    termsOfService: ""
  })
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAdmin = async () => {
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

      // Load settings from database
      const { data: siteSettings } = await supabase
        .from("site_settings")
        .select("*")
        .single()

      if (siteSettings) {
        setSettings({
          siteName: siteSettings.site_name || "GSPA Certification Platform",
          adminEmail: siteSettings.admin_email || "admin@gspa.com",
          emailNotifications: siteSettings.email_notifications ?? true,
          maintenanceMode: siteSettings.maintenance_mode ?? false,
          registrationEnabled: siteSettings.registration_enabled ?? true,
          testFee: siteSettings.test_fee || 50,
          membershipFee: siteSettings.membership_fee || 50,
          supportEmail: siteSettings.support_email || "support@gspa.com",
          privacyPolicy: "",
          termsOfService: ""
        })
      }

      // Load legal documents
      const { data: legalDocs } = await supabase
        .from("legal_documents")
        .select("document_type, content")
        .eq("is_active", true)

      if (legalDocs) {
        const privacyDoc = legalDocs.find(doc => doc.document_type === 'privacy_policy')
        const termsDoc = legalDocs.find(doc => doc.document_type === 'terms_of_service')

        setSettings(prev => ({
          ...prev,
          privacyPolicy: privacyDoc?.content || "",
          termsOfService: termsDoc?.content || ""
        }))
      }

      setIsLoading(false)
    }

    checkAdmin()
  }, [supabase, router])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // Save site settings
      const { error: settingsError } = await supabase
        .from("site_settings")
        .upsert({
          id: 1, // Assuming single row
          site_name: settings.siteName,
          admin_email: settings.adminEmail,
          support_email: settings.supportEmail,
          email_notifications: settings.emailNotifications,
          maintenance_mode: settings.maintenanceMode,
          registration_enabled: settings.registrationEnabled,
          test_fee: settings.testFee,
          membership_fee: settings.membershipFee,
          updated_at: new Date().toISOString()
        })

      if (settingsError) throw settingsError

      // Save legal documents
      if (settings.privacyPolicy) {
        const { error: privacyError } = await supabase
          .from("legal_documents")
          .upsert({
            document_type: 'privacy_policy',
            title: 'Privacy Policy',
            content: settings.privacyPolicy,
            is_active: true,
            updated_at: new Date().toISOString()
          })

        if (privacyError) throw privacyError
      }

      if (settings.termsOfService) {
        const { error: termsError } = await supabase
          .from("legal_documents")
          .upsert({
            document_type: 'terms_of_service',
            title: 'Terms of Service',
            content: settings.termsOfService,
            is_active: true,
            updated_at: new Date().toISOString()
          })

        if (termsError) throw termsError
      }

      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
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
          <h1 className="text-lg font-semibold">Settings</h1>
          <Button onClick={handleSaveSettings} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>

        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">System Settings</h1>
                <p className="text-muted-foreground">
                  Configure platform settings and preferences.
                </p>
              </div>
              <Button onClick={handleSaveSettings} disabled={isSaving} className="hidden md:flex">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            <div className="space-y-6">
              {/* General Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    General Settings
                  </CardTitle>
                  <CardDescription>
                    Basic platform configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="siteName">Site Name</Label>
                      <Input
                        id="siteName"
                        value={settings.siteName}
                        onChange={(e) => handleSettingChange('siteName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">Admin Email</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={settings.adminEmail}
                        onChange={(e) => handleSettingChange('adminEmail', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="testFee">Test Fee ($)</Label>
                      <Input
                        id="testFee"
                        type="number"
                        value={settings.testFee}
                        onChange={(e) => handleSettingChange('testFee', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="membershipFee">Membership Fee ($)</Label>
                      <Input
                        id="membershipFee"
                        type="number"
                        value={settings.membershipFee}
                        onChange={(e) => handleSettingChange('membershipFee', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Settings
                  </CardTitle>
                  <CardDescription>
                    Configure email notifications and support
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emailNotifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    />
                    <Label htmlFor="emailNotifications">Enable email notifications</Label>
                  </div>
                </CardContent>
              </Card>

              {/* System Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    System Settings
                  </CardTitle>
                  <CardDescription>
                    Control system behavior and access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="maintenanceMode"
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                    />
                    <Label htmlFor="maintenanceMode">Maintenance mode</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="registrationEnabled"
                      checked={settings.registrationEnabled}
                      onCheckedChange={(checked) => handleSettingChange('registrationEnabled', checked)}
                    />
                    <Label htmlFor="registrationEnabled">Allow new registrations</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Legal Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Legal Documents</CardTitle>
                  <CardDescription>
                    Manage terms of service and privacy policy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="privacyPolicy">Privacy Policy</Label>
                    <Textarea
                      id="privacyPolicy"
                      placeholder="Enter your privacy policy here..."
                      value={settings.privacyPolicy}
                      onChange={(e) => handleSettingChange('privacyPolicy', e.target.value)}
                      rows={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="termsOfService">Terms of Service</Label>
                    <Textarea
                      id="termsOfService"
                      placeholder="Enter your terms of service here..."
                      value={settings.termsOfService}
                      onChange={(e) => handleSettingChange('termsOfService', e.target.value)}
                      rows={6}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Save Button for Mobile */}
            <div className="md:hidden mt-6">
              <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
