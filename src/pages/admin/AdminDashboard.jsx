import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/common/Button'
import { adminStats, allOrders, stallsDB } from '../../data/mockData'
import { formatCurrency } from '../../utils/formatters'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts'

const dailyOrders = [
  { day: 'Mon', orders: 24, revenue: 3200 },
  { day: 'Tue', orders: 31, revenue: 4100 },
  { day: 'Wed', orders: 28, revenue: 3800 },
  { day: 'Thu', orders: 38, revenue: 5100 },
  { day: 'Fri', orders: 45, revenue: 6200 },
  { day: 'Sat', orders: 52, revenue: 7100 },
]

const orderTypeData = [
  { name: 'Dine-in', value: 65 },
  { name: 'Takeaway', value: 35 },
]

const revenueByStall = [
  { name: 'Mama Grace Kitchen', revenue: 8200 },
  { name: 'Deli Corner', revenue: 6400 },
  { name: 'Java Spot', revenue: 5240 },
]

const COLORS = ['#f0b429', '#f7c948']

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
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'orders', label: 'All Orders' },
            { key: 'stalls', label: 'Stalls' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`block w-full text-left px-4 py-2.5 rounded-sm transition ${
                tab === item.key
                  ? 'bg-gold text-navy font-bold'
                  : 'text-txs hover:bg-navy-3'
              }`}
            >
              {item.label}
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
      <div className="flex-1 p-8 overflow-y-auto">
        {tab === 'overview' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-8">Overview</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { icon: '📋', label: 'Total Orders', value: adminStats.totalOrders },
                { icon: '💰', label: 'Total Revenue', value: formatCurrency(adminStats.totalRevenue) },
                { icon: '👥', label: 'Active Users', value: adminStats.activeUsers },
                { icon: '🍽️', label: 'Active Stalls', value: adminStats.activeStalls },
              ].map((kpi, i) => (
                <div key={i} className="bg-navy-3 border border-bd2 rounded-sm p-6">
                  <div className="text-2xl mb-3">{kpi.icon}</div>
                  <p className="text-txs mb-2">{kpi.label}</p>
                  <p className="text-2xl font-bold text-gold">{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Daily Orders & Revenue */}
              <div className="bg-navy-3 border border-bd2 rounded-sm p-6">
                <h3 className="font-bold text-white mb-4">Orders & Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyOrders}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
                    <YAxis yAxisId="left" stroke="rgba(255,255,255,0.5)" />
                    <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#141d35',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#f0b429" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#f7c948" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Order Type Distribution */}
              <div className="bg-navy-3 border border-bd2 rounded-sm p-6">
                <h3 className="font-bold text-white mb-4">Order Type Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={100}
                      fill="#f0b429"
                      dataKey="value"
                    >
                      {orderTypeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#141d35',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue by Stall */}
              <div className="bg-navy-3 border border-bd2 rounded-sm p-6 col-span-2">
                <h3 className="font-bold text-white mb-4">Revenue by Stall</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByStall}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#141d35',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="revenue" fill="#f0b429" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6">All Orders</h1>

            <div className="bg-navy-3 border border-bd2 rounded-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-navy-4 border-b border-bd">
                    <tr>
                      <th className="text-left px-6 py-3 text-11px font-bold text-txs">Order ID</th>
                      <th className="text-left px-6 py-3 text-11px font-bold text-txs">Student</th>
                      <th className="text-left px-6 py-3 text-11px font-bold text-txs">Stall</th>
                      <th className="text-left px-6 py-3 text-11px font-bold text-txs">Items</th>
                      <th className="text-left px-6 py-3 text-11px font-bold text-txs">Total</th>
                      <th className="text-left px-6 py-3 text-11px font-bold text-txs">Type</th>
                      <th className="text-left px-6 py-3 text-11px font-bold text-txs">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allOrders.map((order) => (
                      <tr key={order.id} className="border-t border-bd hover:bg-navy-4 transition">
                        <td className="px-6 py-3 text-11px font-mono text-gold">{order.id}</td>
                        <td className="px-6 py-3 text-11px text-txt">{order.stu}</td>
                        <td className="px-6 py-3 text-11px text-txt">{order.stall}</td>
                        <td className="px-6 py-3 text-11px text-txt text-txs">
                          {order.itms}
                        </td>
                        <td className="px-6 py-3 text-11px font-bold text-gold">
                          {formatCurrency(order.tot)}
                        </td>
                        <td className="px-6 py-3 text-11px text-txt">{order.type}</td>
                        <td className="px-6 py-3 text-11px">
                          <span
                            className={`px-3 py-1 rounded-sm text-10px font-bold inline-block ${
                              order.st === 'Picked up'
                                ? 'bg-green-600/20 text-green-400'
                                : 'bg-blue-600/20 text-blue-400'
                            }`}
                          >
                            {order.st}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'stalls' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6">All Stalls</h1>

            <div className="space-y-4">
              {stallsDB.map((stall) => (
                <div
                  key={stall.id}
                  className="bg-navy-3 border border-bd2 rounded-sm p-6 hover:border-gold/50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white text-lg mb-2">
                        {stall.emoji} {stall.name}
                      </h3>
                      <p className="text-txs mb-3">{stall.cat}</p>
                      <div className="text-11px text-txtd space-y-1">
                        <p>Vendor: {stall.vendor}</p>
                        <p>Hours: {stall.hrs}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="bg-gold/20 text-gold px-4 py-2 rounded-sm">
                        <p className="text-13px font-bold">{stall.menu.length}</p>
                        <p className="text-10px">Menu Items</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items Preview */}
                  <div className="mt-4 pt-4 border-t border-bd2">
                    <p className="text-11px text-txs mb-2">Menu Items</p>
                    <div className="flex flex-wrap gap-2">
                      {stall.menu.slice(0, 5).map((item) => (
                        <span
                          key={item.id}
                          className="text-10px bg-navy-4 text-txs px-2 py-1 rounded-sm"
                        >
                          {item.nm} ({formatCurrency(item.pr)})
                        </span>
                      ))}
                      {stall.menu.length > 5 && (
                        <span className="text-10px text-txtd px-2 py-1">
                          +{stall.menu.length - 5} more
                        </span>
                      )}
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
