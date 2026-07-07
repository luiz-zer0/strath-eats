import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/common/Toast'
import { Button } from '../../components/common/Button'
import { sendPasswordReset } from '../../services/authservice'

export default function VendorAuth() {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const { addToast } = useToast()

  const [isSignUp, setIsSignUp] = useState(false)
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSending, setResetSending] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    stallName: '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      addToast('Please fill in all fields', 'error')
      return
    }

    if (isSignUp && !formData.stallName) {
      addToast('Please enter your cafeteria name', 'error')
      return
    }

    if (isSignUp) {
      register(
        {
          firstName: formData.stallName,
          lastName: 'Vendor',
          email: formData.email,
          password: formData.password,
          stallName: formData.stallName,
        },
        'vendor'
      )
        .then(() => {
          addToast('Verification email sent. Please verify before signing in.', 'success')
          navigate('/verify-email', { state: { email: formData.email, role: 'vendor' } })
        })
        .catch((err) => {
          addToast(
            err?.code === 'auth/email-already-in-use' ? 'An account with this email already exists'
            : err?.code === 'auth/weak-password' ? 'Password must be at least 6 characters'
            : err?.code === 'auth/invalid-email' ? 'Invalid email address'
            : err?.code === 'auth/network-request-failed' ? 'Network error. Check your connection'
            : err?.message || 'Could not open cafeteria',
          'error')
        })
      return
    }

    login(formData.email, formData.password, 'vendor')
      .then(() => {
        addToast('Welcome to vendor dashboard!', 'success')
        navigate('/vendor/dashboard')
      })
      .catch((err) => {
        if (err?.code === 'auth/email-not-verified') {
          addToast('Please verify your email before signing in', 'error')
          navigate('/verify-email', { state: { email: formData.email, role: 'vendor' } })
          return
        }
        addToast(
          err?.code === 'auth/user-not-found' ? 'No account found with this email'
          : err?.code === 'auth/wrong-password' ? 'Incorrect password'
          : err?.code === 'auth/invalid-credential' ? 'Invalid email or password'
          : err?.code === 'auth/too-many-requests' ? 'Too many attempts. Please try again later'
          : err?.code === 'auth/invalid-email' ? 'Invalid email address'
          : err?.code === 'auth/network-request-failed' ? 'Network error. Check your connection'
          : err?.message || 'Unable to sign in',
        'error')
      })
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      <div className="border-b border-bd px-7 py-4">
        <button
          onClick={() => navigate('/')}
          className="text-txs hover:text-gold transition"
        >
          ← Back
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-7 py-16">
        <div className="max-w-sm w-full">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2 text-center">
            {isSignUp ? 'Open Your Cafeteria' : 'Vendor Sign In'}
          </h1>
          <p className="text-txs text-center mb-8">
            {isSignUp
              ? 'Get your cafeteria live on StrathEats'
              : 'Manage your cafeteria and orders'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-11px font-bold text-txs mb-2">
                  Cafeteria Name
                </label>
                <input
                  type="text"
                  name="stallName"
                  value={formData.stallName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-sm bg-navy-3 border border-bd2 text-[var(--text-primary)] placeholder-txs focus:outline-none focus:border-gold"
                  placeholder="Mama Grace Kitchen"
                />
              </div>
            )}

            <div>
              <label className="block text-11px font-bold text-txs mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-sm bg-navy-3 border border-bd2 text-[var(--text-primary)] placeholder-txs focus:outline-none focus:border-gold"
                placeholder="vendor@email.com"
              />
            </div>

            <div>
              <label className="block text-11px font-bold text-txs mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-sm bg-navy-3 border border-bd2 text-[var(--text-primary)] placeholder-txs focus:outline-none focus:border-gold"
                placeholder="••••••••"
              />
            </div>

            {!isSignUp && (
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => { setShowResetForm(true); setResetEmail(formData.email) }}
                  className="text-txs hover:text-gold transition font-bold cursor-pointer"
                  style={{ background: 'none', border: 'none', fontSize: 12 }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full">
              {isSignUp ? 'Open Cafeteria' : 'Sign In'}
            </Button>
          </form>

          {showResetForm && (
            <div className="bg-navy-3 border border-bd2 rounded-sm p-4" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>Reset password</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>Enter your vendor email and we'll send a reset link.</div>
              <input
                type="email"
                placeholder="Enter vendor email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-sm bg-navy-3 border border-bd2 text-[var(--text-primary)] placeholder-txs focus:outline-none focus:border-gold"
                style={{ fontFamily: 'inherit', fontSize: 12 }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  disabled={resetSending}
                  onClick={async () => {
                    if (!resetEmail) { addToast('Enter your email', 'error'); return }
                    setResetSending(true)
                    try {
                      await sendPasswordReset(resetEmail)
                      addToast('Reset link sent! Check your email.', 'success')
                      setShowResetForm(false)
                    } catch (err) {
                      addToast(err?.message || 'Failed to send reset email', 'error')
                    } finally { setResetSending(false) }
                  }}
                  className="flex-1 px-4 py-2.5 rounded-sm bg-gold text-navy font-bold cursor-pointer"
                  style={{ border: 'none', fontFamily: 'inherit', fontSize: 12 }}
                >
                  {resetSending ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetForm(false)}
                  className="text-txs hover:text-gold transition"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, padding: '0 8px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <p className="text-11px text-txtd text-center mt-6">
            {isSignUp
              ? 'Already opened a cafeteria? '
              : "Need to open a cafeteria first? "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-gold hover:text-gold-2"
            >
              {isSignUp ? 'Sign In' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
