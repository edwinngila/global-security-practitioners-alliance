import { createClient } from "@/lib/supabase/client"

export const roles = {
  admin: 'admin',
  user: 'user',
} as const;

export type Role = typeof roles[keyof typeof roles];

export const hasRole = (userRoles: Role[], requiredRole: Role): boolean => {
  return userRoles.includes(requiredRole);
};

export type UserRole = 'admin' | 'master_practitioner' | 'practitioner'

export interface RoleInfo {
  id: string
  name: UserRole
  display_name: string
  description: string
}

export interface Permission {
  id: string
  name: string
  display_name: string
  resource: string
  action: string
}

/**
 * Get the current user's role
 */
export async function getCurrentUserRole(): Promise<UserRole> {
  // Check stored role first
  const storedRole = localStorage.getItem('userRole')
  if (storedRole) return JSON.parse(storedRole) as UserRole

  try {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'practitioner'

    // Temporary: if email is admin@gmail.com, treat as admin
    if (user.email === 'admin@gmail.com') return 'admin'

    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (!profile?.role_id) return 'practitioner'

    const { data: role } = await supabase
      .from('roles')
      .select('name')
      .eq('id', profile.role_id)
      .single()

    return (role?.name as UserRole) || 'practitioner'
  } catch (error) {
    console.error('Error getting user role:', error)
    return 'practitioner'
  }
}

/**
 * Check if current user has a specific role
 */
export async function hasRoleAsync(requiredRole: UserRole): Promise<boolean> {
  const userRole = await getCurrentUserRole()

  // Role hierarchy: admin > master_practitioner > practitioner
  const roleHierarchy = {
    admin: 3,
    master_practitioner: 2,
    practitioner: 1
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Check if current user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  return hasRoleAsync('admin')
}

/**
 * Check if current user has master practitioner role or higher
 */
export async function isMasterPractitioner(): Promise<boolean> {
  return hasRoleAsync('master_practitioner')
}

/**
 * Check if current user has practitioner role or higher
 */
export async function isPractitioner(): Promise<boolean> {
  return hasRoleAsync('practitioner')
}

/**
 * Get all available roles
 */
export async function getAllRoles(): Promise<RoleInfo[]> {
  try {
    const supabase = createClient()

    const { data: roles } = await supabase
      .from('roles')
      .select('*')
      .order('name')

    return roles || []
  } catch (error) {
    console.error('Error getting roles:', error)
    return []
  }
}

/**
 * Update a user's role (admin only)
 */
export async function updateUserRole(userId: string, roleId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // Check if current user is admin
    if (!(await isAdmin())) {
      throw new Error('Unauthorized: Admin access required')
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role_id: roleId })
      .eq('id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating user role:', error)
    return false
  }
}

/**
 * Get role-based navigation items
 */
export function getNavigationItems(userRole: UserRole) {
  const baseItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { href: '/dashboard/profile', label: 'Profile', icon: 'User' },
  ]

  const practitionerItems = [
    { href: '/dashboard/results', label: 'Test Results', icon: 'BarChart3' },
    { href: '/dashboard/certificate', label: 'Certificate', icon: 'Award' },
  ]

  const masterPractitionerItems = [
    { href: '/admin/master-dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { href: '/admin/modules', label: 'Manage Modules', icon: 'BookOpen' },
    { href: '/admin/tests', label: 'Manage Tests', icon: 'FileText' },
    { href: '/admin/certificates', label: 'Certificates', icon: 'Award' },
    { href: '/admin/student-results', label: 'Student Results', icon: 'Users' },
  ]

  const adminItems = [
    { href: '/admin/messages', label: 'Messages', icon: 'Mail' },
    { href: '/admin/users', label: 'User Management', icon: 'Users' },
    { href: '/admin/student-results', label: 'Student Results', icon: 'FileText' },
    { href: '/admin/reports', label: 'Reports', icon: 'BarChart3' },
    { href: '/admin/settings', label: 'Settings', icon: 'Settings' },
  ]

  let items = [...baseItems]

  // Add practitioner items for non-admin users
  if (userRole === 'practitioner' || userRole === 'master_practitioner') {
    items = [...items, ...practitionerItems]
  }

  if (userRole === 'master_practitioner' || userRole === 'admin') {
    items = [...items, ...masterPractitionerItems]
  }

  if (userRole === 'admin') {
    items = [...items, ...adminItems]
  }

  return items
}

/**
 * Check if user can access a specific page
 */
export function canAccessPage(userRole: UserRole, pathname: string): boolean {
  // Public pages
  const publicPages = ['/', '/about', '/contact', '/why-join', '/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password']

  if (publicPages.some(page => pathname.startsWith(page))) {
    return true
  }

  // Role-based page access
  const roleAccess = {
    practitioner: [
      '/dashboard',
      '/dashboard/profile',
      '/dashboard/results',
      '/dashboard/certificate',
      '/dashboard/payment'
    ],
    master_practitioner: [
      '/admin/master-dashboard',
      '/admin/modules',
      '/admin/tests',
      '/admin/certificates',
      '/admin/student-results'
    ],
    admin: [
      '/admin/messages',
      '/admin/users',
      '/admin/student-results',
      '/admin/reports',
      '/admin/settings'
    ]
  }

  // Check if user has required role for the page
  for (const [role, pages] of Object.entries(roleAccess)) {
    if (pages.some(page => pathname.startsWith(page))) {
      return hasRoleAccess(userRole, role as UserRole)
    }
  }

  return false
}

/**
 * Check role hierarchy access
 */
function hasRoleAccess(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    admin: 3,
    master_practitioner: 2,
    practitioner: 1
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}