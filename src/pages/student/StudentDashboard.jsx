import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/common/Button'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { isLoggedIn, logout } = useAuth()
  const [tab, setTab] = useState('order') // 'order' or 'myorders'

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <p className="text-txs mb-4">Not signed in</p>
          <Button onClick={() => navigate('/order')}>Sign In</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-bd bg-navy-2 p-6">
        <div className="text-lg font-bold text-white mb-8">
          Strath<em className="text-gold not-italic">Eats</em>
        </div>

        <nav className="space-y-2 mb-8">
          <button
            onClick={() => setTab('order')}
            className={`block w-full text-left px-4 py-2.5 rounded-sm transition ${
              tab === 'order'
                ? 'bg-gold text-navy font-bold'
                : 'text-txs hover:bg-navy-3'
            }`}
          >
            Order Food
          </button>
          <button
            onClick={() => setTab('myorders')}
            className={`block w-full text-left px-4 py-2.5 rounded-sm transition ${
              tab === 'myorders'
                ? 'bg-gold text-navy font-bold'
                : 'text-txs hover:bg-navy-3'
            }`}
          >
            My Orders
          </button>
        </nav>

        <Button
          variant="ghost"
          onClick={() => {
            logout()
            navigate('/')
          }}
          className="w-full justify-start"
        >
          Sign Out
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {tab === 'order' ? (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6">Order Food</h1>
            <p className="text-txs">Stalls grid coming soon...</p>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6">My Orders</h1>
            <p className="text-txs">Order history coming soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}
