import { useState } from 'react'
import { reload } from 'firebase/auth'
import { useLocation, useNavigate } from 'react-router-dom'
import { resendVerification } from '../services/authservice'
import { auth } from '../services/firebase'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefilledEmail = location.state?.email || auth.currentUser?.email || ''
  const roleHint = location.state?.role || null

  const [email, setEmail] = useState(prefilledEmail)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)

  const handleResend = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!email) {
      setError('You need to be signed in or have your email filled in to resend verification.')
      return
    }

    setLoading(true)
    try {
      await resendVerification(roleHint)
      setMessage('Verification email sent. Check inbox and spam, then use the link and sign in again.')
    } catch (err) {
      const msg = err?.code === 'auth/no-current-user' ? 'No signed-in account found. Please sign up or sign in first.'
        : err?.code === 'auth/invalid-email-domain' ? 'Only @strathmore.edu accounts are allowed for student and staff signups.'
        : err?.code === 'auth/already-verified' ? 'Email already verified. You can sign in now.'
        : err?.message || 'Could not resend verification email.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckStatus = async () => {
    setError('')
    setMessage('')

    if (!auth.currentUser) {
      setError('Sign up or sign in first so we can check verification status.')
      return
    }

    setChecking(true)
    try {
      await reload(auth.currentUser)
      if (auth.currentUser.emailVerified) {
        setMessage('Email verified. You can sign in now.')
      } else {
        setMessage('Still not verified. Check the email link again or resend it.')
      }
    } catch (err) {
      setError(err?.message || 'Could not check verification status.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080d1a', color: '#e2e8f0', fontFamily: 'Sora, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 460, background: '#141d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, color: '#fff' }}>Verify Your Email</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
          We sent a verification link after signup. Verify your Strathmore email before signing in.
        </p>

        <form onSubmit={handleResend} style={{ marginTop: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#94a3b8' }}>Strathmore Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@strathmore.edu"
            style={{ width: '100%', marginBottom: 12, padding: '11px 12px', background: '#0f1729', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10 }}
          />

          {error && <p style={{ color: '#f87171', fontSize: 12, marginBottom: 10 }}>{error}</p>}
          {message && <p style={{ color: '#4ade80', fontSize: 12, marginBottom: 10 }}>{message}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px 14px', border: 'none', borderRadius: 10, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', background: '#f0b429', color: '#0a0f1e' }}
          >
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </form>

        <button
          onClick={handleCheckStatus}
          disabled={checking}
          style={{ width: '100%', marginTop: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', color: '#cbd5e1', padding: '10px 12px', borderRadius: 10, cursor: checking ? 'not-allowed' : 'pointer' }}
        >
          {checking ? 'Checking...' : 'I clicked the link, check status'}
        </button>

        <button
          onClick={() => navigate('/auth')}
          style={{ width: '100%', marginTop: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', color: '#cbd5e1', padding: '10px 12px', borderRadius: 10, cursor: 'pointer' }}
        >
          Back To Sign In
        </button>
      </div>
    </div>
  )
}
