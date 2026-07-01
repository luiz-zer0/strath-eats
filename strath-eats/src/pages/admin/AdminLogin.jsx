import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../components/common/Toast'
import { Button } from '../../components/common/Button'
import { sendPasswordReset } from '../../services/authservice'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { addToast } = useToast()
  const { toggleTheme, isDark } = useTheme()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSending, setResetSending] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // ✨ FIX 1: Make sure to add 'async' here!
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      addToast('Please fill in all fields', 'error')
      return
    }

    // ✨ FIX 2: Replace the hardcoded check with the real Firebase login
    try {
      // This sends your real email and password to authservice.js, tagged as an 'admin'
      await login(formData.email, formData.password, 'admin')
      addToast('Welcome to admin portal', 'success')
      navigate('/admin/dashboard')
    } catch (error) {
      console.error('Admin login failed:', error)
      // This will now show the actual error from Firebase if you type the wrong password!
      addToast(error.message || 'Invalid admin credentials', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      <div className="border-b border-bd px-7 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="text-txs hover:text-gold transition"
        >
          ← Back
        </button>
        <button
          onClick={toggleTheme}
          className="text-txs hover:text-gold transition"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
        >
          {isDark ? '\u2600\uFE0F' : '\uD83C\uDF19'}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-7 py-16">
        <div className="max-w-sm w-full">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2 text-center">
            Admin Portal
          </h1>
          <p className="text-txs text-center mb-8 text-txs">
            Enter your admin credentials to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="admin@stratheats.com"
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

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          {showResetForm && (
            <div className="bg-navy-3 border border-bd2 rounded-sm p-4" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>Reset password</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>Enter your admin email and we'll send a reset link.</div>
              <input
                type="email"
                placeholder="Enter admin email"
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

        </div>
      </div>
    </div>
  )
}
