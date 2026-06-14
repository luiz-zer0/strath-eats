import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { signInWithGoogle, sendPasswordReset } from '../services/authservice'
import { useTheme } from '../context/ThemeContext'
import '../styles/auth.css'

const ROLE_CFG = {
  student: {
    label: 'Student',
    idLabel: 'Student ID',
    idPlaceholder: 'e.g. 191603',
    color: '#3b82f6',
  },
  staff: {
    label: 'Staff / Lecturer',
    idLabel: 'Staff ID',
    idPlaceholder: 'e.g. STF-042',
    color: '#4ade80',
  },
  other: {
    label: 'Guest',
    idLabel: 'Visitor ID',
    idPlaceholder: 'Optional',
    color: '#a78bfa',
  },
}

function useToast() {
  const [toasts, setToasts] = useState([])
  const add = (msg, type = 'info') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }
  return { toasts, add }
}

function Input({ label, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label className="auth-label">{label}</label>
      )}
      <input
        {...props}
        className={`input-dark ${focused ? 'input-dark-border' : ''}`}
        style={{
          borderColor: focused ? '#f0b429' : 'rgba(255,255,255,0.1)',
          boxShadow: focused ? '0 0 0 3px rgba(240,180,41,0.1)' : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

export default function Auth() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const { toasts, add: addToast } = useToast()

  const role = location.state?.role || 'student'
  const cfg = ROLE_CFG[role] || ROLE_CFG.student

  const [isSignUp, setIsSignUp] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    id: '',
    email: '',
    mpesa: '',
    password: '',
    confirm: '',
  })
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSending, setResetSending] = useState(false)
  const { toggleTheme, isDark } = useTheme()

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const validate = () => {
    if (!form.email) { addToast('Email is required', 'error'); return false }
    if (!form.password) { addToast('Password is required', 'error'); return false }
    if (!form.email.toLowerCase().endsWith('@strathmore.edu')) {
      addToast('Only @strathmore.edu accounts can use StrathEats', 'error')
      return false
    }
    if (isSignUp) {
      if (!form.firstName) { addToast('First name is required', 'error'); return false }
      if (!form.lastName) { addToast('Last name is required', 'error'); return false }
      if (form.password !== form.confirm) { addToast('Passwords do not match', 'error'); return false }
      if (form.password.length < 6) { addToast('Password must be at least 6 characters', 'error'); return false }
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const userData = {
      firstName: form.firstName || form.email.split('@')[0],
      lastName: form.lastName || '',
      email: form.email,
      password: form.password,
      mpesa: form.mpesa || '',
      studentId: role === 'student' ? form.id : '',
      staffId: role === 'staff' ? form.id : '',
      id: form.id || '',
    }

    try {
      if (isSignUp) {
        await register(userData, role)
        addToast(`Verification email sent to ${form.email}. Please verify before signing in.`, 'success')
        setIsSignUp(false)
        setForm(p => ({ ...p, password: '', confirm: '' }))
        navigate('/verify-email', { state: { email: form.email, role } })
      } else {
        await login(form.email, form.password, role)
        addToast('Welcome back!', 'success')
        navigate('/dashboard')
      }
    } catch (err) {
      const msg = err?.code === 'auth/user-not-found' ? 'No account found with this email'
        : err?.code === 'auth/wrong-password' ? 'Incorrect password'
        : err?.code === 'auth/email-already-in-use' ? 'An account with this email already exists'
        : err?.code === 'auth/email-not-verified' ? 'Please verify your email before signing in'
        : err?.code === 'auth/invalid-email-domain' ? 'Only @strathmore.edu accounts can use StrathEats'
        : err?.code === 'auth/invalid-email' ? 'Invalid email address'
        : err?.message || 'Something went wrong'
      addToast(msg, 'error')

      if (err?.code === 'auth/email-not-verified') {
        navigate('/verify-email', { state: { email: form.email, role } })
      }
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      const profile = await signInWithGoogle(role)
      await login(profile, profile.role || role)
      addToast('Welcome back!', 'success')
      navigate('/dashboard')
    } catch (err) {
      const msg = err?.code === 'auth/invalid-email-domain' ? 'Only @strathmore.edu accounts can use StrathEats'
        : err?.code === 'auth/email-not-verified' ? 'Please use a Strathmore email with a verified Google account'
        : err?.code === 'auth/popup-closed-by-user' ? 'Google sign-in cancelled'
        : err?.code === 'auth/cancelled-popup-request' ? 'Google sign-in cancelled'
        : err?.message || 'Google sign-in failed'
      addToast(msg, 'error')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-topbar">
        <div className="auth-brand">
          Strath<em>Eats</em>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-dim)' }}>{isDark ? '\u2600\uFE0F' : '\uD83C\uDF19'}</button>
          <button onClick={() => navigate('/')} className="back-btn">Back</button>
        </div>
      </div>

      <div className="auth-body">
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div
              className="auth-role-pill"
              style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`, color: cfg.color }}
            >
              <span>{cfg.label}</span>
            </div>
          </div>

          <h1 className="auth-heading">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="auth-subtext">
            {isSignUp
              ? `Sign up as a ${cfg.label.toLowerCase()} to start ordering`
              : `Sign in to your StrathEats account`}
          </p>

          <div className="auth-tab-bar">
            {['Sign in', 'Create account'].map((label, i) => {
              const active = isSignUp === (i === 1)
              return (
                <button
                  key={label}
                  onClick={() => setIsSignUp(i === 1)}
                  className={`auth-tab-btn ${active ? 'active' : ''}`}
                >{label}</button>
              )
            })}
          </div>

          <div className="auth-card">
            <form onSubmit={handleSubmit}>
              {isSignUp && (
                <>
                  <div className="auth-name-row">
                    <Input label="First name" value={form.firstName} onChange={set('firstName')} />
                    <Input label="Last name" value={form.lastName} onChange={set('lastName')} />
                  </div>
                  <Input label={cfg.idLabel} value={form.id} onChange={set('id')} />
                </>
              )}

              <Input label="Strathmore email" type="email" placeholder="Enter email address" value={form.email} onChange={set('email')} />

              {isSignUp && (
                <Input label="M-Pesa number (for payments)" type="tel" placeholder="07XX XXX XXX" value={form.mpesa} onChange={set('mpesa')} />
              )}

              <Input label="Password" type="password" placeholder="Input password" value={form.password} onChange={set('password')} />

              {!isSignUp && (
                <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 12 }}>
                  <button type="button" onClick={() => { setShowResetForm(true); setResetEmail(form.email) }} className="link-gold" style={{ fontSize: 11 }}>Forgot password?</button>
                </div>
              )}

              {isSignUp && (
                <Input label="Confirm password" type="password" placeholder="Confirm password" value={form.confirm} onChange={set('confirm')} />
              )}

              <button type="submit" className="auth-submit-btn">
                {isSignUp ? 'Create account' : 'Sign in'}
              </button>
            </form>

            {showResetForm && (
              <div className="auth-card" style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>Reset password</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>Enter your email and we'll send a reset link.</div>
                <input className="input-dark" type="email" placeholder="Enter email address" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button type="button" className="auth-submit-btn" style={{ flex: 1, marginTop: 0 }} disabled={resetSending} onClick={async () => {
                    if (!resetEmail) { addToast('Enter your email', 'error'); return }
                    setResetSending(true)
                    try {
                      await sendPasswordReset(resetEmail)
                      addToast('Reset link sent! Check your email.', 'success')
                      setShowResetForm(false)
                    } catch (err) {
                      addToast(err?.message || 'Failed to send reset email', 'error')
                    } finally { setResetSending(false) }
                  }}>{resetSending ? 'Sending...' : 'Send Reset Link'}</button>
                  <button type="button" className="link-gold" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: '0 8px' }} onClick={() => setShowResetForm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {!isSignUp && (
            <>
              <div className="auth-divider">
                <span className="auth-divider-text">or continue with</span>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="auth-google-btn"
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.78.87 7.35 2.56 10.56l7.98-5.97z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                {googleLoading ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </>
          )}

          <p className="auth-switch-text">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => setIsSignUp(p => !p)} className="link-gold">
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>

          {!isSignUp && (
            <div className="auth-demo-note">
              Demo: use any email + password to sign in
            </div>
          )}
        </div>
      </div>

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast-item" style={{ borderLeft: `3px solid ${t.type === 'success' ? '#4ade80' : t.type === 'error' ? '#f87171' : '#f0b429'}` }}>
            {t.msg}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  )
}
