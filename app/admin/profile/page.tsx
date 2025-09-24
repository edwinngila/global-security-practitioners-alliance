"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Save, Menu, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function AdminProfilePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAdminAndLoadProfile = async () => {
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

      // Load profile data
      setProfile({
        firstName: authUser.user_metadata?.first_name || "",
        lastName: authUser.user_metadata?.last_name || "",
        email: authUser.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })

      setIsLoading(false)
    }

    checkAdminAndLoadProfile()
  }, [supabase, router])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const {
        data: { user },
        error: updateError
      } = await supabase.auth.updateUser({
        email: profile.email,
        data: {
          first_name: profile.firstName,
          last_name: profile.lastName
        }
      })

      if (updateError) throw updateError

      // Update password if provided
      if (profile.newPassword && profile.newPassword === profile.confirmPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: profile.newPassword
        })

        if (passwordError) throw passwordError
      }

      alert('Profile updated successfully!')
      setUserName(`${profile.firstName} ${profile.lastName}`.trim() || 'Admin')
      setUserEmail(profile.email)

      // Clear password fields
      setProfile(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }))

    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error updating profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
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
          <div className="absolute left-0 top-0 h-full">
            <DashboardSidebar
              isAdmin={isAdmin}
              userName={userName}
              userEmail={userEmail}
              isMobileOpen={mobileMenuOpen}
              onMobileClose={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <DashboardSidebar
          isAdmin={isAdmin}
          userName={userName}
          userEmail={userEmail}
        />
      </div>

      <main className="flex-1 overflow-y-auto md:ml-64">
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
          <h1 className="text-lg font-semibold">Profile</h1>
          <Button onClick={handleSaveProfile} disabled={isSaving} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        <div className="p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Admin Profile</h1>
                <p className="text-muted-foreground">
                  Manage your account information and security settings.
                </p>
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving} className="hidden md:flex">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            <div className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profile.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Password Change */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your password for better security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={profile.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        placeholder="Enter new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={profile.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  {profile.newPassword && profile.confirmPassword && profile.newPassword !== profile.confirmPassword && (
                    <p className="text-sm text-red-600">Passwords do not match</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Save Button for Mobile */}
            <div className="md:hidden mt-6">
              <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full">
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
