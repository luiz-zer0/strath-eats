import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/common/Toast'
import { Button } from '../components/common/Button'

export default function Auth() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const { addToast } = useToast()

  const role = location.state?.role || 'student'
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
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

    if (isSignUp && !formData.name) {
      addToast('Please enter your name', 'error')
      return
    }

    login({ name: formData.name || 'User', email: formData.email }, role)
    addToast(`Welcome ${formData.name || 'back'}!`, 'success')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      <div className="border-b border-bd px-7 py-4">
        <button
          onClick={() => navigate('/order')}
          className="text-txs hover:text-gold transition"
        >
          ← Back
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-7 py-16">
        <div className="max-w-sm w-full">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h1>
          <p className="text-txs text-center mb-8">
            {isSignUp
              ? 'Get started ordering food today'
              : 'Welcome back to StrathEats'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-11px font-bold text-txs mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-sm bg-navy-3 border border-bd2 text-white placeholder-txs focus:outline-none focus:border-gold"
                  placeholder="Louis Mwangi"
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
                className="w-full px-4 py-2.5 rounded-sm bg-navy-3 border border-bd2 text-white placeholder-txs focus:outline-none focus:border-gold"
                placeholder="louis@strathmore.edu"
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
                className="w-full px-4 py-2.5 rounded-sm bg-navy-3 border border-bd2 text-white placeholder-txs focus:outline-none focus:border-gold"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <p className="text-11px text-txtd text-center mt-6">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-gold hover:text-gold-2"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
