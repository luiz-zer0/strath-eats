import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/common/Button'

export default function VendorDashboard() {
  const navigate = useNavigate()
  const { isLoggedIn, logout } = useAuth()
  const [tab, setTab] = useState('orders')

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <p className="text-txs mb-4">Not signed in</p>
          <Button onClick={() => navigate('/vendor')}>Sign In</Button>
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
          {['orders', 'menu', 'analytics', 'settings'].map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`block w-full text-left px-4 py-2.5 rounded-sm transition capitalize ${
                tab === item
                  ? 'bg-gold text-navy font-bold'
                  : 'text-txs hover:bg-navy-3'
              }`}
            >
              {item === 'orders' && 'Orders Queue'}
              {item === 'menu' && 'My Menu'}
              {item === 'analytics' && 'Analytics'}
              {item === 'settings' && 'Settings'}
            </button>
          ))}
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
        <h1 className="text-3xl font-bold text-white mb-6 capitalize">
          {tab === 'orders' && 'Orders Queue'}
          {tab === 'menu' && 'My Menu'}
          {tab === 'analytics' && 'Analytics'}
          {tab === 'settings' && 'Stall Settings'}
        </h1>
        <p className="text-txs">Content for {tab} coming soon...</p>
      </div>
    </div>
  )
}
