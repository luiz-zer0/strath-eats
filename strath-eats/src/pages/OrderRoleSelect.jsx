import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/common/Button'

export default function OrderRoleSelect() {
  const [selectedRole, setSelectedRole] = useState(null)
  const navigate = useNavigate()

  const roles = [
    { id: 'student', name: 'Student', desc: 'Order your campus meals' },
    { id: 'staff', name: 'Staff/Lecturer', desc: 'Order as part of campus staff' },
  ]

  const handleContinue = () => {
    if (selectedRole) {
      navigate('/auth', { state: { role: selectedRole } })
    }
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-bd px-7 py-4 flex items-center justify-between relative z-50">
        <Link 
          to="/"
          className="text-lg font-bold text-[var(--text-primary)] hover:opacity-80 transition-opacity select-none cursor-pointer block"
          style={{ textDecoration: 'none' }}
        >
          Strath<em className="text-gold not-italic">Eats</em>
        </Link>
        <button
          onClick={() => navigate('/')}
          className="text-[var(--text-muted)] hover:text-gold transition"
        >
          Go Back
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-7 py-16">
        <div className="max-w-md w-full">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3 text-center">
            How are you here today?
          </h1>
          <p className="text-[var(--text-muted)] text-center mb-12 leading-relaxed">
            Select your role to sign in or create an account
          </p>

          <div className="space-y-3 mb-8">
            {roles.map((role) => (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-5 border-2 rounded-lg cursor-pointer transition ${
                  selectedRole === role.id
                    ? 'border-gold bg-gold/10'
                    : 'border-bd2 bg-navy-3 hover:bg-navy-4'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{role.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[var(--text-primary)]">{role.name}</h3>
                    <p className="text-11px text-[var(--text-muted)]">{role.desc}</p>
                  </div>
                  {selectedRole === role.id && (
                    <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button
            className="w-full"
            onClick={handleContinue}
            disabled={!selectedRole}
          >
            Continue
          </Button>

          <p className="text-11px text-[var(--text-muted)] text-center mt-6">
            Opening a stall? <button onClick={() => navigate('/vendor')} className="text-gold hover:text-gold-2">Go here</button>
          </p>
        </div>
      </div>
    </div>
  )
}
