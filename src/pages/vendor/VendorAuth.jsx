import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/common/Toast'
import { Button } from '../../components/common/Button'

export default function VendorAuth() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { addToast } = useToast()

  const [isSignUp, setIsSignUp] = useState(false)
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
      addToast('Please enter your stall name', 'error')
      return
    }

    login({ email: formData.email, stallName: formData.stallName }, 'vendor')
    addToast('Welcome to vendor dashboard!', 'success')
    navigate('/vendor/dashboard')
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
          <h1 className="text-3xl font-bold text-white mb-2 text-center">
            {isSignUp ? 'Open Your Stall' : 'Vendor Sign In'}
          </h1>
          <p className="text-txs text-center mb-8">
            {isSignUp
              ? 'Get your stall live on StrathEats'
              : 'Manage your stall and orders'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-11px font-bold text-txs mb-2">
                  Stall Name
                </label>
                <input
                  type="text"
                  name="stallName"
                  value={formData.stallName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-sm bg-navy-3 border border-bd2 text-white placeholder-txs focus:outline-none focus:border-gold"
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
                className="w-full px-4 py-2.5 rounded-sm bg-navy-3 border border-bd2 text-white placeholder-txs focus:outline-none focus:border-gold"
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
                className="w-full px-4 py-2.5 rounded-sm bg-navy-3 border border-bd2 text-white placeholder-txs focus:outline-none focus:border-gold"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full">
              {isSignUp ? 'Open Stall' : 'Sign In'}
            </Button>
          </form>

          <p className="text-11px text-txtd text-center mt-6">
            {isSignUp
              ? 'Already a vendor? '
              : "Don't have a stall yet? "}
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
