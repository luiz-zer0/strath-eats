import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/common/Button'
import { adminStats, allOrders, stallsDB } from '../../data/mockData'
import { formatCurrency } from '../../utils/formatters'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { isLoggedIn, logout } = useAuth()
  const [tab, setTab] = useState('overview')

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <p className="text-txs mb-4">Not signed in</p>
          <Button onClick={() => navigate('/admin')}>Sign In</Button>
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
          {['overview', 'orders', 'stalls'].map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`block w-full text-left px-4 py-2.5 rounded-sm transition capitalize ${
                tab === item
                  ? 'bg-gold text-navy font-bold'
                  : 'text-txs hover:bg-navy-3'
              }`}
            >
              {item === 'overview' && 'Overview'}
              {item === 'orders' && 'All Orders'}
              {item === 'stalls' && 'Stalls'}
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
        {tab === 'overview' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-8">Overview</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Orders', value: adminStats.totalOrders },
                { label: 'Total Revenue', value: formatCurrency(adminStats.totalRevenue) },
                { label: 'Active Users', value: adminStats.activeUsers },
                { label: 'Active Stalls', value: adminStats.activeStalls },
              ].map((kpi, i) => (
                <div key={i} className="bg-navy-3 border border-bd2 rounded-sm p-6">
                  <p className="text-txs mb-2">{kpi.label}</p>
                  <p className="text-2xl font-bold text-gold">{kpi.value}</p>
                </div>
              ))}
            </div>

            <p className="text-txs">Charts coming soon...</p>
          </div>
        )}

        {tab === 'orders' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-8">All Orders</h1>

            <div className="bg-navy-3 border border-bd2 rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-navy-4 border-b border-bd">
                  <tr>
                    <th className="text-left px-6 py-3 text-11px font-bold text-txs">Order ID</th>
                    <th className="text-left px-6 py-3 text-11px font-bold text-txs">Student</th>
                    <th className="text-left px-6 py-3 text-11px font-bold text-txs">Stall</th>
                    <th className="text-left px-6 py-3 text-11px font-bold text-txs">Total</th>
                    <th className="text-left px-6 py-3 text-11px font-bold text-txs">Type</th>
                    <th className="text-left px-6 py-3 text-11px font-bold text-txs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.map((order) => (
                    <tr key={order.id} className="border-t border-bd">
                      <td className="px-6 py-3 text-11px font-mono">{order.id}</td>
                      <td className="px-6 py-3 text-11px">{order.stu}</td>
                      <td className="px-6 py-3 text-11px">{order.stall}</td>
                      <td className="px-6 py-3 text-11px font-bold text-gold">{formatCurrency(order.tot)}</td>
                      <td className="px-6 py-3 text-11px">{order.type}</td>
                      <td className="px-6 py-3 text-11px">
                        <span className="bg-gold/20 text-gold px-2 py-1 rounded-sm text-10px">
                          {order.st}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'stalls' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-8">All Stalls</h1>

            <div className="space-y-4">
              {stallsDB.map((stall) => (
                <div key={stall.id} className="bg-navy-3 border border-bd2 rounded-sm p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white text-lg">
                        {stall.emoji} {stall.name}
                      </h3>
                      <p className="text-txs mt-1">{stall.cat}</p>
                      <p className="text-11px text-txtd mt-2">
                        Vendor: {stall.vendor} • Hours: {stall.hrs}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gold">{stall.menu.length} items</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
