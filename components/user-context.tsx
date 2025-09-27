"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { fetchJson } from '@/lib/api/client'
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
  refresh: () => Promise<void>
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
      refresh: async () => {},
      logout: async () => {},
    }
  }
  return context
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfileState] = useState<UserProfile | null>(null)
  const [role, setRoleState] = useState<UserRole | null>(null)

  useEffect(() => {
    const storedProfile = typeof localStorage !== 'undefined' ? localStorage.getItem('userProfile') : null
    const storedRole = typeof localStorage !== 'undefined' ? localStorage.getItem('userRole') : null
    if (storedProfile) setProfileState(JSON.parse(storedProfile))
    if (storedRole) setRoleState(JSON.parse(storedRole))

    // fetch latest profile using refresh
    ;(async () => {
      try {
        await refresh()
      } catch {
        // ignore
      }
    })()
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

  const refresh = async () => {
    try {
      const data = await fetchJson('/api/auth/user')
      if (data?.profile) {
        setProfileState(data.profile)
        localStorage.setItem('userProfile', JSON.stringify(data.profile))
      }
      if (data?.profile?.role?.name) {
        setRoleState(data.profile.role.name)
        localStorage.setItem('userRole', JSON.stringify(data.profile.role.name))
      }
    } catch (err) {
      // unauthenticated or error - clear local
      setProfileState(null)
      setRoleState(null)
      localStorage.removeItem('userProfile')
      localStorage.removeItem('userRole')
    }
  }

  const logout = async () => {
    setProfile(null)
    setRole(null)
    localStorage.removeItem('userProfile')
    localStorage.removeItem('userRole')
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch {}
  }

  return (
    <UserContext.Provider value={{ profile, role, setProfile, setRole, refresh, logout }}>
      {children}
    </UserContext.Provider>
  )
}