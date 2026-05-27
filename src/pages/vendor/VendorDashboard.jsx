import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/common/Toast'
import { Button } from '../../components/common/Button'
import { stallsDB, mockVendorOrders } from '../../data/mockData'
import { formatCurrency } from '../../utils/formatters'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'

const chartData = [
  { name: 'Mon', revenue: 1200 },
  { name: 'Tue', revenue: 1400 },
  { name: 'Wed', revenue: 1100 },
  { name: 'Thu', revenue: 1800 },
  { name: 'Fri', revenue: 2200 },
]

const ordersByHour = [
  { hour: '10', orders: 4 },
  { hour: '12', orders: 12 },
  { hour: '13', orders: 8 },
  { hour: '14', orders: 5 },
]

const topItems = [
  { name: 'Pilau', sales: 45 },
  { name: 'Chicken stew', sales: 38 },
  { name: 'Sukuma Wiki', sales: 22 },
]

const COLORS = ['#f0b429', '#f7c948', '#fef3c7']

export default function VendorDashboard() {
  const navigate = useNavigate()
  const { isLoggedIn, logout, user } = useAuth()
  const { addToast } = useToast()

  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState(mockVendorOrders)
  const [stall, setStall] = useState(stallsDB[0])
  const [menuItems, setMenuItems] = useState(stall.menu)
  const [newItem, setNewItem] = useState({ nm: '', pr: '', cat: '' })
  const [stallSettings, setStallSettings] = useState({
    name: stall.name,
    cat: stall.cat,
    emoji: stall.emoji,
    hrs: stall.hrs,
  })

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

  const handleConfirmOrder = (orderId) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, st: 'accepted', rm: true } : o
      )
    )
    addToast('Order confirmed', 'success')
  }

  const handleRejectOrder = (orderId) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId))
    addToast('Order rejected', 'error')
  }

  const handleMarkReady = (orderId) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, st: 'ready', rm: false } : o
      )
    )
    addToast('Order marked as ready', 'success')
  }

  const handleAddMenuItem = (e) => {
    e.preventDefault()
    if (!newItem.nm || !newItem.pr || !newItem.cat) {
      addToast('Please fill in all fields', 'error')
      return
    }
    const item = {
      id: Math.max(...menuItems.map((i) => i.id), 0) + 1,
      nm: newItem.nm,
      pr: parseInt(newItem.pr),
      cat: newItem.cat,
      av: true,
    }
    setMenuItems((prev) => [...prev, item])
    setNewItem({ nm: '', pr: '', cat: '' })
    addToast(`${item.nm} added to menu`, 'success')
  }

  const handleToggleAvailability = (itemId) => {
    setMenuItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, av: !i.av } : i
      )
    )
  }

  const handleDeleteItem = (itemId) => {
    setMenuItems((prev) => prev.filter((i) => i.id !== itemId))
    addToast('Item removed from menu', 'success')
  }

  const handleSaveSettings = () => {
    setStall((prev) => ({ ...prev, ...stallSettings }))
    addToast('Stall settings updated', 'success')
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
            { key: 'orders', label: 'Orders Queue' },
            { key: 'menu', label: 'My Menu' },
            { key: 'analytics', label: 'Analytics' },
            { key: 'settings', label: 'Settings' },
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
      <div className="flex-1 p-8">
        {tab === 'orders' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6">Orders Queue</h1>

            {orders.length === 0 ? (
              <div className="text-center py-12 bg-navy-3 border border-bd2 rounded-sm">
                <p className="text-txs">No pending orders</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-navy-3 border border-bd2 rounded-sm p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-white text-lg">
                          {order.user}
                        </h3>
                        <p className="text-11px text-txs">{order.id}</p>
                      </div>
                      <span className="bg-gold/20 text-gold px-3 py-1 rounded-sm text-10px font-bold">
                        {order.st === 'paid' ? 'Payment Confirmed' : 'Ready'}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-11px text-txs mb-2">Items</p>
                      <ul className="text-11px text-txt space-y-1">
                        {order.items.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-6 text-11px text-txtd mb-4">
                      <span>{order.mode}</span>
                      <span>Pickup: {order.pu}</span>
                      <span className="font-bold text-gold">
                        {formatCurrency(order.tot)}
                      </span>
                    </div>

                    {order.st === 'paid' && !order.rm && (
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleConfirmOrder(order.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRejectOrder(order.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}

                    {order.rm && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleMarkReady(order.id)}
                      >
                        Mark Ready
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'menu' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6">My Menu</h1>

            <div className="grid grid-cols-3 gap-8">
              {/* Menu Items List */}
              <div className="col-span-2">
                <div className="space-y-3">
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-navy-3 border border-bd2 rounded-sm p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <h4 className="font-bold text-white">{item.nm}</h4>
                        <p className="text-11px text-txs">{item.cat}</p>
                        <p className="text-13px font-bold text-gold mt-1">
                          {formatCurrency(item.pr)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleAvailability(item.id)}
                          className={`px-3 py-1 rounded-sm text-10px font-bold transition ${
                            item.av
                              ? 'bg-green-600/20 text-green-400'
                              : 'bg-red-600/20 text-red-400'
                          }`}
                        >
                          {item.av ? '✓ Available' : '✕ Out'}
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="px-3 py-1 rounded-sm text-10px font-bold bg-red-600/20 text-red-400 hover:bg-red-600/30"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Item Form */}
              <div className="bg-navy-3 border border-bd2 rounded-sm p-6 h-fit">
                <h3 className="font-bold text-white mb-4">Add New Item</h3>
                <form onSubmit={handleAddMenuItem} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Dish name"
                    value={newItem.nm}
                    onChange={(e) =>
                      setNewItem({ ...newItem, nm: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-sm bg-navy-4 border border-bd2 text-white text-11px placeholder-txs focus:outline-none focus:border-gold"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={newItem.pr}
                    onChange={(e) =>
                      setNewItem({ ...newItem, pr: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-sm bg-navy-4 border border-bd2 text-white text-11px placeholder-txs focus:outline-none focus:border-gold"
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={newItem.cat}
                    onChange={(e) =>
                      setNewItem({ ...newItem, cat: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-sm bg-navy-4 border border-bd2 text-white text-11px placeholder-txs focus:outline-none focus:border-gold"
                  />
                  <Button type="submit" className="w-full">
                    Add Item
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

        {tab === 'analytics' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6">Analytics</h1>

            <div className="grid grid-cols-2 gap-8">
              {/* Daily Revenue Chart */}
              <div className="bg-navy-3 border border-bd2 rounded-sm p-6">
                <h3 className="font-bold text-white mb-4">Weekly Revenue</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
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

              {/* Orders by Hour Chart */}
              <div className="bg-navy-3 border border-bd2 rounded-sm p-6">
                <h3 className="font-bold text-white mb-4">Orders by Hour</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ordersByHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="hour" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#141d35',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                      }}
                    />
                    <Line type="monotone" dataKey="orders" stroke="#f0b429" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top Items */}
              <div className="bg-navy-3 border border-bd2 rounded-sm p-6">
                <h3 className="font-bold text-white mb-4">Top Items</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topItems}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, sales }) => `${name}: ${sales}`}
                      outerRadius={100}
                      fill="#f0b429"
                      dataKey="sales"
                    >
                      {topItems.map((entry, index) => (
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

              {/* KPIs */}
              <div className="space-y-3">
                {[
                  { label: 'Today Revenue', value: formatCurrency(3850) },
                  { label: 'Total Orders', value: '24' },
                  { label: 'Avg Order Value', value: formatCurrency(160) },
                ].map((kpi, i) => (
                  <div
                    key={i}
                    className="bg-navy-3 border border-bd2 rounded-sm p-4"
                  >
                    <p className="text-11px text-txs mb-1">{kpi.label}</p>
                    <p className="text-2xl font-bold text-gold">{kpi.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6">Stall Settings</h1>

            <div className="max-w-md bg-navy-3 border border-bd2 rounded-sm p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSaveSettings()
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-11px font-bold text-txs mb-2">
                    Stall Name
                  </label>
                  <input
                    type="text"
                    value={stallSettings.name}
                    onChange={(e) =>
                      setStallSettings({
                        ...stallSettings,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-sm bg-navy-4 border border-bd2 text-white text-11px focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-11px font-bold text-txs mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={stallSettings.cat}
                    onChange={(e) =>
                      setStallSettings({
                        ...stallSettings,
                        cat: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-sm bg-navy-4 border border-bd2 text-white text-11px focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-11px font-bold text-txs mb-2">
                    Emoji
                  </label>
                  <input
                    type="text"
                    value={stallSettings.emoji}
                    onChange={(e) =>
                      setStallSettings({
                        ...stallSettings,
                        emoji: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-sm bg-navy-4 border border-bd2 text-white text-11px focus:outline-none focus:border-gold"
                    maxLength="2"
                  />
                </div>

                <div>
                  <label className="block text-11px font-bold text-txs mb-2">
                    Hours (e.g. 08:00–16:00)
                  </label>
                  <input
                    type="text"
                    value={stallSettings.hrs}
                    onChange={(e) =>
                      setStallSettings({
                        ...stallSettings,
                        hrs: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-sm bg-navy-4 border border-bd2 text-white text-11px focus:outline-none focus:border-gold"
                  />
                </div>

                <Button type="submit" className="w-full">
                  Save Changes
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
