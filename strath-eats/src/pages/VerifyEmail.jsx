import { useState } from 'react'
import { reload } from 'firebase/auth'
import { useLocation, useNavigate } from 'react-router-dom'
import { resendVerification } from '../services/authservice'
import { auth } from '../services/firebase'
import '../styles/auth.css'

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
    <div className="verify-page">
      <div className="verify-card">
        <h1 className="verify-heading">Verify Your Email</h1>
        <p className="verify-desc">
          We sent a verification link after signup. Verify your Strathmore email before signing in.
        </p>

        <form onSubmit={handleResend} className="verify-form">
          <label className="verify-label">Strathmore Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@strathmore.edu"
            className="input-dark verify-input"
          />

          {error && <p className="verify-error">{error}</p>}
          {message && <p className="verify-success">{message}</p>}

          <button type="submit" disabled={loading} className="verify-btn">
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </form>

        <button
          onClick={handleCheckStatus}
          disabled={checking}
          className="verify-btn-ghost"
        >
          {checking ? 'Checking...' : 'I clicked the link, check status'}
        </button>

        <button
          onClick={() => navigate('/auth')}
          className="verify-btn-ghost"
        >
          Back To Sign In
        </button>
      </div>
    </div>
  )
}
