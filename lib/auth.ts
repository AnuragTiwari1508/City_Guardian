// Authentication utilities for CityGuardian
export interface User {
  id: string
  email: string
  name: string
  userType: 'citizen' | 'employee' | 'office' | 'environmental'
  createdAt: string
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: User
  token?: string
}

// Store user session in localStorage
export const setSession = (user: User, token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cityguardian_user', JSON.stringify(user))
    localStorage.setItem('cityguardian_token', token)
  }
}

// Get current user session
export const getSession = (): { user: User | null; token: string | null } => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('cityguardian_user')
    const token = localStorage.getItem('cityguardian_token')
    
    if (userStr && token) {
      try {
        const user = JSON.parse(userStr)
        return { user, token }
      } catch {
        return { user: null, token: null }
      }
    }
  }
  return { user: null, token: null }
}

// Clear session (logout)
export const clearSession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cityguardian_user')
    localStorage.removeItem('cityguardian_token')
  }
}

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const { user, token } = getSession()
  return !!(user && token)
}

// Get dashboard route for user type
export const getDashboardRoute = (userType: string): string => {
  switch (userType) {
    case 'environmental':
      return '/environmental'
    case 'office':
      return '/control/dashboard'
    case 'employee':
      return '/employee/dashboard'
    case 'citizen':
      return '/citizen/dashboard'
    default:
      return '/'
  }
}
