"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UserRole } from '@/lib/rbac'

interface UserProfile {
  id: string
  role_id: string
  membership_fee_paid?: boolean
  test_completed?: boolean
  certificate_issued?: boolean
  created_at?: string
  updated_at?: string
}

interface UserContextType {
  profile: UserProfile | null
  role: UserRole | null
  setProfile: (profile: UserProfile | null) => void
  setRole: (role: UserRole | null) => void
  logout: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    // Return default values if not within provider (e.g., during SSR or misconfiguration)
    return {
      profile: null,
      role: null,
      setProfile: () => {},
      setRole: () => {},
      logout: async () => {},
    }
  }
  return context
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfileState] = useState<UserProfile | null>(null)
  const [role, setRoleState] = useState<UserRole | null>(null)

  useEffect(() => {
    const storedProfile = localStorage.getItem('userProfile')
    const storedRole = localStorage.getItem('userRole')
    if (storedProfile) setProfileState(JSON.parse(storedProfile))
    if (storedRole) setRoleState(JSON.parse(storedRole))
  }, [])

  const setProfile = (p: UserProfile | null) => {
    setProfileState(p)
    if (p) localStorage.setItem('userProfile', JSON.stringify(p))
    else localStorage.removeItem('userProfile')
  }

  const setRole = (r: UserRole | null) => {
    setRoleState(r)
    if (r) localStorage.setItem('userRole', JSON.stringify(r))
    else localStorage.removeItem('userRole')
  }

  const logout = async () => {
    setProfile(null)
    setRole(null)
    localStorage.removeItem('userProfile')
    localStorage.removeItem('userRole')
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  return (
    <UserContext.Provider value={{ profile, role, setProfile, setRole, logout }}>
      {children}
    </UserContext.Provider>
  )
}