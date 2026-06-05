import { createContext, useState, useContext, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import { signUp, signIn, logOut, getUserProfile } from '../services/authService'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user,       setUser]       = useState(null)
  const [role,       setRole]       = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading,    setLoading]    = useState(true) // wait for Firebase to restore session

  // ── Restore session on page refresh ──────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid)
          if (profile) {
            setUser(profile)
            setRole(profile.role)
            setIsLoggedIn(true)
          }
        } catch (err) {
          console.error('Failed to restore session:', err)
        }
      } else {
        setUser(null)
        setRole(null)
        setIsLoggedIn(false)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // ── Login (sign in existing user) ────────────────────────────
  const login = async (email, password, userRole) => {
    const profile = await signIn(email, password)
    setUser(profile)
    setRole(userRole || profile.role)
    setIsLoggedIn(true)
    return profile
  }

  // ── Register (create new user) ───────────────────────────────
  const register = async (userData, userRole) => {
    const profile = await signUp({ ...userData, role: userRole })
    setUser(profile)
    setRole(userRole)
    setIsLoggedIn(true)
    return profile
  }

  // ── Logout ───────────────────────────────────────────────────
  const logout = async () => {
    await logOut()
    setUser(null)
    setRole(null)
    setIsLoggedIn(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🍽️</div>
          <div style={{ fontSize: 13, color: '#64748b', fontFamily: 'Sora, system-ui, sans-serif' }}>Loading StrathEats...</div>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, role, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}