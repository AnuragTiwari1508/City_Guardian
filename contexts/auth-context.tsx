"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, clearSession, type User } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  logout: () => void
  refreshSession: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  logout: () => {},
  refreshSession: () => {}
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshSession = () => {
    const session = getSession()
    setUser(session.user)
    setToken(session.token)
    setLoading(false)
  }

  useEffect(() => {
    refreshSession()
  }, [])

  const logout = () => {
    clearSession()
    setUser(null)
    setToken(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}
