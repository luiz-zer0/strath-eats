import { createContext, useEffect, useState, useContext } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import { signIn, signUp, logOut, getUserProfile } from '../services/authservice'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null) // 'student', 'staff', 'vendor', 'admin'
  const [pendingVerification, setPendingVerification] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (!firebaseUser.emailVerified) {
          setPendingVerification(true)
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email })
          setRole(null)
          setIsLoggedIn(false)
          setLoading(false)
          return
        }

        setPendingVerification(false)

        try {
          const profile = await getUserProfile(firebaseUser.uid)
          if (profile) {
            setUser(profile)
            setRole(profile.role || null)
            setIsLoggedIn(true)
          } else {
            setUser(null)
            setRole(null)
            setIsLoggedIn(false)
          }
        } catch (error) {
          console.error('Failed to restore Firebase session:', error)
          setUser(null)
          setRole(null)
          setIsLoggedIn(false)
        }
      } else {
        setUser(null)
        setRole(null)
        setPendingVerification(false)
        setIsLoggedIn(false)
      }

      setLoading(false)
    })

    return unsub
  }, [])

  const login = async (userDataOrEmail, passwordOrRole, userRole) => {
    // Path 1: Standard Email/Password login (This path already works perfectly)
    if (typeof userDataOrEmail === 'string') {
      const profile = await signIn(userDataOrEmail, passwordOrRole, userRole)
      setUser(profile)
      setRole(profile.role || null)
      setIsLoggedIn(true)
      return profile
    }

    // Path 2: The Object Bypass (Where the data was getting lost!)
    const userData = userDataOrEmail || {}
    
    // ✨ THE FIX: Force the context to fetch the custom Strathmore fields from Firestore
    if (userData.uid) {
      const fullProfile = await getUserProfile(userData.uid)
      if (fullProfile) {
        setUser(fullProfile)
        setRole(fullProfile.role || null)
        setIsLoggedIn(true)
        return fullProfile
      }
    }

    // Absolute Fallback
    setUser(userData)
    setRole(passwordOrRole || userData.role || null)
    setIsLoggedIn(true)
    return userData
  }

  const register = async (userData, userRole) => {
    const profile = await signUp({ ...userData, role: userRole })
    setUser({ uid: profile.uid, email: profile.email })
    setRole(userRole)
    setPendingVerification(true)
    setIsLoggedIn(false)
    return profile
  }

  const logout = async () => {
    await logOut()
    setUser(null)
    setRole(null)
    setPendingVerification(false)
    setIsLoggedIn(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}></div>
          <div style={{ fontSize: 13, color: '#64748b', fontFamily: 'Sora, system-ui, sans-serif' }}>Loading StrathEats...</div>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, role, pendingVerification, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
