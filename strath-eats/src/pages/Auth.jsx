import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

//  Role config
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

//  Toast hook  
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
        <label className="auth-label" style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 7 }}>
          {label}
        </label>
      )}
      <input
        {...props}
        className="input-dark"
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

//  Main 
export default function Auth() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { login, register } = useAuth()
  const { toasts, add: addToast } = useToast()

  const role   = location.state?.role || 'student'
  const cfg    = ROLE_CFG[role] || ROLE_CFG.student

  const [isSignUp, setIsSignUp] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName:  '',
    id:        '',
    email:     '',
    mpesa:     '',
    password:  '',
    confirm:   '',
  })

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const validate = () => {
    if (!form.email)    { addToast('Email is required', 'error');    return false }
    if (!form.password) { addToast('Password is required', 'error'); return false }
    if (!form.email.toLowerCase().endsWith('@strathmore.edu')) {
      addToast('Only @strathmore.edu accounts can use StrathEats', 'error')
      return false
    }
    if (isSignUp) {
      if (!form.firstName) { addToast('First name is required', 'error'); return false }
      if (!form.lastName)  { addToast('Last name is required', 'error');  return false }
      if (form.password !== form.confirm) { addToast('Passwords do not match', 'error'); return false }
      if (form.password.length < 6)       { addToast('Password must be at least 6 characters', 'error'); return false }
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const userData = {
      firstName: form.firstName || form.email.split('@')[0],
      lastName:  form.lastName  || '',
      email:     form.email,
      password:  form.password,
      mpesa:     form.mpesa     || '',
      studentId: role === 'student' ? form.id : '',
      staffId:   role === 'staff'   ? form.id : '',
      id:        form.id || '',
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

  return (
    <div className="auth-page">

      {/* Top bar */}
      <div className="auth-topbar">
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
          Strath<em style={{ color: '#f0b429', fontStyle: 'normal' }}>Eats</em>
        </div>
        <button onClick={() => navigate('/order')} className="back-btn">Back</button>
      </div>

      {/* Body */}
      <div className="auth-body">
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Role pill */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`, borderRadius: 99, padding: '6px 16px', fontSize: 12, fontWeight: 700, color: cfg.color }}>
              <span>{cfg.label}</span>
            </div>
          </div>

          {/* Heading */}
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', textAlign: 'center', letterSpacing: '-0.03em', marginBottom: 6 }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
            {isSignUp
              ? `Sign up as a ${cfg.label.toLowerCase()} to start ordering`
              : `Sign in to your StrathEats account`}
          </p>

          {/* Tab toggle */}
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

          {/* Form card */}
          <div className="auth-card">
            <form onSubmit={handleSubmit}>

              {isSignUp && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Input label="First name"  value={form.firstName} onChange={set('firstName')} />
                    <Input label="Last name"   value={form.lastName}  onChange={set('lastName')}  />
                  </div>
                  <Input label={cfg.idLabel} value={form.id} onChange={set('id')} />
                </>
              )}

              <Input label="Strathmore email" type="email" placeholder="Enter email address" value={form.email} onChange={set('email')} />

              {isSignUp && (
                <Input label="M-Pesa number (for payments)" type="tel" placeholder="07XX XXX XXX" value={form.mpesa} onChange={set('mpesa')} />
              )}

              <Input label="Password" type="password" placeholder="Input password" value={form.password} onChange={set('password')} />

              {isSignUp && (
                <Input label="Confirm password" type="password" placeholder="Confirm password" value={form.confirm} onChange={set('confirm')} />
              )}

              <button type="submit" className="auth-submit-btn">
                {isSignUp ? 'Create account' : 'Sign in'}
              </button>
            </form>
          </div>

          {/* Switch mode */}
          <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 16 }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => setIsSignUp(p => !p)} className="link-gold">
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>

          {!isSignUp && (
            <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(240,180,41,0.05)', border: '1px solid rgba(240,180,41,0.15)', borderRadius: 12, fontSize: 11, color: '#64748b', textAlign: 'center', lineHeight: 1.6 }}>
              Demo: use any email + password to sign in
            </div>
          )}
        </div>
      </div>

      {/* Toasts */}
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
