/**
 * Client-side session management utilities
 * Handles cookies, localStorage, and session cleanup
 */

import { signOut } from 'next-auth/react';
export interface SessionData {
  userId?: string
  email?: string
  role?: string
  profileComplete?: boolean
  membershipPaid?: boolean
  lastActivity?: number
}

export class SessionManager {
  private static readonly SESSION_KEY = 'gspa_session'
  private static readonly USER_DATA_KEY = 'gspa_user_data'
  private static readonly LAST_ACTIVITY_KEY = 'gspa_last_activity'

  // Cookie names used by NextAuth
  private static readonly NEXTAUTH_COOKIES = [
    'next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token',
    '__Secure-next-auth.session-token',
    '__Secure-next-auth.callback-url',
    '__Secure-next-auth.csrf-token',
    '__Host-next-auth.csrf-token'
  ]

  // Custom cookies
  private static readonly CUSTOM_COOKIES = [
    'auth_token',
    'user_session',
    'session_id'
  ]

  /**
   * Store session data in localStorage
   */
  static setSessionData(data: SessionData): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return // Skip on server-side
    }

    try {
      const sessionData = {
        ...data,
        lastActivity: Date.now()
      }
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData))
      localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString())
    } catch (error) {
      console.warn('Failed to store session data:', error)
    }
  }

  /**
   * Get session data from localStorage
   */
  static getSessionData(): SessionData | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null // Return null on server-side
    }

    try {
      const data = localStorage.getItem(this.SESSION_KEY)
      if (!data) return null

      const sessionData = JSON.parse(data)
      return sessionData
    } catch (error) {
      console.warn('Failed to retrieve session data:', error)
      return null
    }
  }

  /**
   * Store user data separately
   */
  static setUserData(userData: any): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return // Skip on server-side
    }

    try {
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData))
    } catch (error) {
      console.warn('Failed to store user data:', error)
    }
  }

  /**
   * Get user data
   */
  static getUserData(): any {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null // Return null on server-side
    }

    try {
      const data = localStorage.getItem(this.USER_DATA_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.warn('Failed to retrieve user data:', error)
      return null
    }
  }

  /**
   * Update last activity timestamp
   */
  static updateActivity(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return // Skip on server-side
    }

    try {
      localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString())
    } catch (error) {
      console.warn('Failed to update activity:', error)
    }
  }

  /**
   * Get last activity timestamp
   */
  static getLastActivity(): number | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null // Return null on server-side
    }

    try {
      const timestamp = localStorage.getItem(this.LAST_ACTIVITY_KEY)
      return timestamp ? parseInt(timestamp) : null
    } catch (error) {
      return null
    }
  }

  /**
   * Check if session is expired based on activity
   */
  static isSessionExpired(maxAge: number = 30 * 24 * 60 * 60 * 1000): boolean {
    const lastActivity = this.getLastActivity()
    if (!lastActivity) return true

    return Date.now() - lastActivity > maxAge
  }

  /**
   * Clear all cookies (both NextAuth and custom)
   */
  static clearAllCookies(): void {
    if (typeof window === 'undefined' || !window.document) {
      return // Skip on server-side
    }

    const allCookies = [...this.NEXTAUTH_COOKIES, ...this.CUSTOM_COOKIES]

    allCookies.forEach(cookieName => {
      this.clearCookie(cookieName)
      this.clearCookie(cookieName, '.localhost')
      this.clearCookie(cookieName, 'localhost')
    })
  }

  /**
   * Clear a specific cookie
   */
  private static clearCookie(name: string, domain?: string): void {
    if (typeof window === 'undefined' || !window.document) {
      return // Skip on server-side
    }

    const cookieOptions = [
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`,
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure`,
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; samesite=lax`,
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; samesite=strict`
    ]

    if (domain) {
      cookieOptions.forEach(option => {
        document.cookie = `${option}; domain=${domain}`
      })
    } else {
      cookieOptions.forEach(option => {
        document.cookie = option
      })
    }
  }

  /**
   * Clear all localStorage data
   */
  static clearLocalStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return // Skip on server-side
    }

    try {
      // For a complete logout, it's safest to clear everything.
      // This prevents any stale data from being used on the next login.
      localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  }

  /**
   * Clear all sessionStorage data
   */
  static clearSessionStorage(): void {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return // Skip on server-side
    }

    try {
      // Clear all sessionStorage
      sessionStorage.clear()
    } catch (error) {
      console.warn('Failed to clear sessionStorage:', error)
    }
  }

  /**
   * Complete logout - clears all client-side data
   */
  static async logout(): Promise<void> {
    console.log('Starting complete logout process...');
    // Clear cookies, localStorage, and sessionStorage
    this.clearAllCookies();
    this.clearLocalStorage();
    console.log('✓ LocalStorage cleared');
    this.clearSessionStorage();
    console.log('✓ SessionStorage cleared');
    // Use next-auth's signOut function. It handles cookie removal and redirects.
    await signOut({ redirect: true, callbackUrl: '/auth/login' });
    // Force reload to clear any cached state
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    console.log('✓ Complete logout finished');
  }

  /**
   * Initialize session tracking
   */
  static initializeSessionTracking(): void {
    // Only run on client-side
    if (typeof window === 'undefined' || !window.document) {
      return
    }

    // Update activity on user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

    const updateActivity = () => {
      this.updateActivity()
    }

    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true })
    })

    // Check for session expiry periodically
    setInterval(() => {
      if (this.isSessionExpired()) {
        console.log('Session expired, logging out...')
        this.logout().then(() => {
          window.location.href = '/auth/login'
        })
      }
    }, 60000) // Check every minute
  }

  /**
   * Get current session status
   */
  static getSessionStatus(): {
    isAuthenticated: boolean
    sessionData: SessionData | null
    userData: any
    lastActivity: number | null
    isExpired: boolean
  } {
    const sessionData = this.getSessionData()
    const userData = this.getUserData()
    const lastActivity = this.getLastActivity()
    const isExpired = this.isSessionExpired()

    return {
      isAuthenticated: !!sessionData && !isExpired,
      sessionData,
      userData,
      lastActivity,
      isExpired
    }
  }
}