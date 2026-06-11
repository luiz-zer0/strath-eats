import { createContext, useEffect, useState, useContext, useRef, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import { signIn, signUp, logOut, getUserProfile } from '../services/authservice'
import { requestNotificationPermission } from '../services/notificationservice'
import '../styles/auth.css'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000
const SESSION_WARNING_MS = 29 * 60 * 1000

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [sessionWarning, setSessionWarning] = useState(false)

  const lastActivity = useRef(Date.now())
  const warningTimer = useRef(null)
  const logoutTimer = useRef(null)

  const resetTimers = useCallback(() => {
    lastActivity.current = Date.now()
    setSessionWarning(false)
    if (warningTimer.current) clearTimeout(warningTimer.current)
    if (logoutTimer.current) clearTimeout(logoutTimer.current)
  }, [])

  const handleActivity = useCallback(() => {
    if (!isLoggedIn || sessionExpired) return
    resetTimers()
    warningTimer.current = setTimeout(() => setSessionWarning(true), SESSION_WARNING_MS)
    logoutTimer.current = setTimeout(() => {
      setSessionExpired(true)
      setSessionWarning(false)
      window.location.href = '/'
    }, SESSION_TIMEOUT_MS)
  }, [isLoggedIn, sessionExpired, resetTimers])

  useEffect(() => {
    if (!isLoggedIn) return
    requestNotificationPermission()
    resetTimers()
    warningTimer.current = setTimeout(() => setSessionWarning(true), SESSION_WARNING_MS)
    logoutTimer.current = setTimeout(() => {
      setSessionExpired(true)
      setSessionWarning(false)
      window.location.href = '/'
    }, SESSION_TIMEOUT_MS)

    const events = ['mousedown', 'keydown', 'touchstart']
    const opts = { passive: true }
    for (const e of events) window.addEventListener(e, handleActivity, opts)

    return () => {
      if (warningTimer.current) clearTimeout(warningTimer.current)
      if (logoutTimer.current) clearTimeout(logoutTimer.current)
      for (const e of events) window.removeEventListener(e, handleActivity, opts)
    }
  }, [isLoggedIn, handleActivity, resetTimers])

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
    if (typeof userDataOrEmail === 'string') {
      const profile = await signIn(userDataOrEmail, passwordOrRole, userRole)
      setUser(profile)
      setRole(profile.role || null)
      setIsLoggedIn(true)
      return profile
    }

    const userData = userDataOrEmail || {}
    
    if (userData.uid) {
      const fullProfile = await getUserProfile(userData.uid)
      if (fullProfile) {
        setUser(fullProfile)
        setRole(fullProfile.role || null)
        setIsLoggedIn(true)
        return fullProfile
      }
    }

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
    setSessionExpired(false)
    setSessionWarning(false)
  }

  const dismissSessionExpired = () => {
    setSessionExpired(false)
    resetTimers()
  }

  if (loading) {
    return (
      <div className="auth-loading-overlay">
        <div className="auth-loading-content">
          <div className="auth-loading-spinner"></div>
          <div className="auth-loading-text">Loading StrathEats...</div>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{
      isLoggedIn: isLoggedIn && !sessionExpired,
      user, role, pendingVerification,
      login, register, logout,
      sessionExpired, sessionWarning,
      dismissSessionExpired,
    }}>
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
