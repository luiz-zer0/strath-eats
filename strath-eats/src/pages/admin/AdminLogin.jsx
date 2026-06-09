import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/common/Toast'
import { Button } from '../../components/common/Button'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@stratheats.com'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { addToast } = useToast()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

    if (formData.email === ADMIN_EMAIL && formData.password === ADMIN_PASSWORD) {
      login({ email: formData.email }, 'admin')
      addToast('Welcome to admin portal', 'success')
      navigate('/admin/dashboard')
    } else {
      addToast('Invalid admin credentials', 'error')
    }
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
                className="w-full px-4 py-2.5 rounded-sm bg-navy-3 border border-bd2 text-white placeholder-txs focus:outline-none focus:border-gold"
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
                className="w-full px-4 py-2.5 rounded-sm bg-navy-3 border border-bd2 text-white placeholder-txs focus:outline-none focus:border-gold"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          <p className="text-11px text-txtd text-center mt-6">
            Demo: {ADMIN_EMAIL} / {ADMIN_PASSWORD}
          </p>
        </div>
      </div>
    </div>
  )
}
