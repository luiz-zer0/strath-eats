import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ── Role config ──────────────────────────────────────────────────
const ROLE_CFG = {
  student: {
    label: 'Student',
    emoji: '🎓',
    idLabel: 'Student ID',
    idPlaceholder: 'e.g. 191603',
    color: '#3b82f6',
  },
  staff: {
    label: 'Staff / Lecturer',
    emoji: '👩‍🏫',
    idLabel: 'Staff ID',
    idPlaceholder: 'e.g. STF-042',
    color: '#4ade80',
  },
  other: {
    label: 'Guest',
    emoji: '👤',
    idLabel: 'Visitor ID',
    idPlaceholder: 'Optional',
    color: '#a78bfa',
  },
}

// ── Toast hook ───────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([])
  const add = (msg, type = 'info') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }
  return { toasts, add }
}

// ── Shared input style ───────────────────────────────────────────
const inp = {
  width: '100%',
  padding: '11px 14px',
  background: '#0f1729',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  fontSize: 13,
  color: '#e2e8f0',
  fontFamily: 'Sora, system-ui, sans-serif',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

function Input({ label, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 7 }}>
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          ...inp,
          borderColor: focused ? '#f0b429' : 'rgba(255,255,255,0.1)',
          boxShadow: focused ? '0 0 0 3px rgba(240,180,41,0.1)' : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
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
    <div style={{ minHeight: '100vh', background: '#080d1a', fontFamily: 'Sora, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{ padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
          Strath<em style={{ color: '#f0b429', fontStyle: 'normal' }}>Eats</em>
        </div>
        <button
          onClick={() => navigate('/order')}
          style={{ fontSize: 12, fontWeight: 600, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Sora, system-ui, sans-serif', transition: 'color 0.13s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#f0b429'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          ← Back
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Role pill */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`, borderRadius: 99, padding: '6px 16px', fontSize: 12, fontWeight: 700, color: cfg.color }}>
              <span>{cfg.emoji}</span>
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
          <div style={{ display: 'flex', background: '#141d35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 4, gap: 4, marginBottom: 24 }}>
            {['Sign in', 'Create account'].map((label, i) => {
              const active = isSignUp === (i === 1)
              return (
                <button
                  key={label}
                  onClick={() => setIsSignUp(i === 1)}
                  style={{
                    flex: 1, padding: '9px', borderRadius: 9, border: 'none', cursor: 'pointer',
                    background: active ? '#f0b429' : 'transparent',
                    color: active ? '#0a0f1e' : '#64748b',
                    fontSize: 12, fontWeight: 700,
                    fontFamily: 'Sora, system-ui, sans-serif',
                    transition: 'all 0.13s',
                  }}
                >{label}</button>
              )
            })}
          </div>

          {/* Form card */}
          <div style={{ background: '#141d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 24 }}>
            <form onSubmit={handleSubmit}>

              {isSignUp && (
                <>
                  {/* Name row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Input label="First name" placeholder="Louis" value={form.firstName} onChange={set('firstName')} />
                    <Input label="Last name"  placeholder="Ngatia" value={form.lastName}  onChange={set('lastName')}  />
                  </div>

                  {/* ID */}
                  <Input
                    label={cfg.idLabel}
                    placeholder={cfg.idPlaceholder}
                    value={form.id}
                    onChange={set('id')}
                  />
                </>
              )}

              {/* Email */}
              <Input
                label="Strathmore email"
                type="email"
                placeholder={role === 'other' ? 'your@email.com' : 'l.ngatia@strathmore.edu'}
                value={form.email}
                onChange={set('email')}
              />

              {isSignUp && (
                /* M-Pesa */
                <Input
                  label="M-Pesa number (for payments)"
                  type="tel"
                  placeholder="07XX XXX XXX"
                  value={form.mpesa}
                  onChange={set('mpesa')}
                />
              )}

              {/* Password */}
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
              />

              {isSignUp && (
                <Input
                  label="Confirm password"
                  type="password"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={set('confirm')}
                />
              )}

              {/* Submit */}
              <button
                type="submit"
                style={{ width: '100%', padding: '13px', borderRadius: 12, background: '#f0b429', color: '#0a0f1e', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'Sora, system-ui, sans-serif', transition: 'all 0.15s', marginTop: 4 }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f7c948'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(240,180,41,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f0b429'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {isSignUp ? 'Create account →' : 'Sign in →'}
              </button>
            </form>
          </div>

          {/* Switch mode */}
          <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 16 }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => setIsSignUp(p => !p)}
              style={{ color: '#f0b429', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'Sora, system-ui, sans-serif' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f7c948'}
              onMouseLeave={e => e.currentTarget.style.color = '#f0b429'}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>

          {/* Quick demo hint */}
          {!isSignUp && (
            <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(240,180,41,0.05)', border: '1px solid rgba(240,180,41,0.15)', borderRadius: 12, fontSize: 11, color: '#64748b', textAlign: 'center', lineHeight: 1.6 }}>
              Demo: use any email + password to sign in
            </div>
          )}
        </div>
      </div>

      {/* Toasts */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: '#141d35', border: '1px solid rgba(255,255,255,0.12)', borderLeft: `3px solid ${t.type === 'success' ? '#4ade80' : t.type === 'error' ? '#f87171' : '#f0b429'}`, borderRadius: 10, padding: '11px 16px', fontSize: 12, color: '#e2e8f0', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', maxWidth: 320, animation: 'slideIn 0.2s ease' }}>
            {t.msg}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  )
}