import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { subscribeToStalls } from '../../services/stallService'
import { subscribeToAllOrders } from '../../services/orderservice'
import { subscribeToUsers } from '../../services/authservice'
import { formatCurrency } from '../../utils/formatters'
import { toAdminOrderRow } from '../../utils/analytics'
import '../../styles/admin.css'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'

const PIE_COLORS = ['#f0b429', '#1a2540']

const TT = {
  contentStyle: {
    background: '#141d35', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, fontSize: 11, color: '#e2e8f0',
  },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
}

function useToast() {
  const [toasts, setToasts] = useState([])
  const add = (msg, type = 'info') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }
  return { toasts, add }
}

const NAV = [
  { key: 'overview', label: 'Overview' },
  { key: 'orders',   label: 'All Orders' },
  { key: 'stalls',   label: 'Stalls' },
  { key: 'users',    label: 'Users & Students' },
]

function Sidebar({ tab, setTab, user, onSignOut, sidebarOpen }) {
  const { toggleTheme, isDark } = useTheme()
  const initials = user
    ? `${(user.firstName || user.name || 'A')[0]}${(user.lastName || '')[0] || ''}`.toUpperCase()
    : 'AD'

  return (
    <div className={`dash-sidebar${sidebarOpen ? ' open' : ''}`}>
      <div className="dash-logo-area">
        <div 
            onClick={() => navigate('/')}
            className="text-xl font-bold text-[var(--text-primary)] tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
          >
            Strath<em className="text-gold not-italic">Eats</em>
          </div>
        <div className="admin-role-badge">
          <span className="admin-role-dot"></span>
          <span className="admin-role-text">Admin Portal</span>
        </div>
      </div>

      <nav className="dash-nav">
        <div className="dash-nav-header">Platform</div>
        {NAV.map(item => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`dash-nav-item admin-nav-item ${tab === item.key ? 'active' : ''}`}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="dash-user-area">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', marginBottom: 6 }}>
          <div className="admin-user-avatar">{initials}</div>
          <div>
            <div className="admin-user-name">
              {user ? `${user.firstName || user.name || 'Admin'} ${user.lastName || ''}`.trim() : 'Admin'}
            </div>
            <div className="admin-user-role">Platform administrator</div>
          </div>
        </div>
        <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', width: '100%', textAlign: 'left', color: 'var(--text-dim)', fontFamily: "'Sora', system-ui, sans-serif", fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          {isDark ? '\u2600\uFE0F' : '\uD83C\uDF19'} {isDark ? 'Light mode' : 'Dark mode'}
        </button>
        <button onClick={onSignOut} className="dash-signout-btn">
           Sign out
        </button>
      </div>
    </div>
  )
}

function exportCSV(data, filename) {
  if (!data.length) return
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(r => Object.values(r).map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function AdminDashboard() {
  const navigate  = useNavigate()
  const { isLoggedIn, logout, user, sessionWarning } = useAuth()
  const { toasts, add: addToast } = useToast()

    const [tab, setTab]           = useState('overview')
    const [stalls, setStalls] = useState([])

    const [adminStats, setAdminStats] = useState({ totalOrders: 0, totalRevenue: 0, activeUsers: 0 });
    const [allOrders, setAllOrders] = useState([]);
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
      const unsubStalls = subscribeToStalls((docs) => {
        setStalls(docs)
      })
      const unsubOrders = subscribeToAllOrders((docs) => {
        const rows = (docs || []).map(toAdminOrderRow)
        setAllOrders(rows)
        const collected = rows.filter(o => o.st === 'collected')
        const revenue = collected.reduce((sum, o) => sum + (o.tot || 0), 0)
        const userIds = new Set(rows.map(o => o.stu).filter(Boolean))
        setAdminStats({ totalOrders: rows.length, totalRevenue: revenue, activeUsers: userIds.size })
      })
      const unsubUsers = subscribeToUsers((docs) => {
        setAllUsers(docs.filter(u => u.role === 'student' || u.role === 'vendor'))
      })
      return () => { unsubStalls?.(); unsubOrders?.(); unsubUsers?.() }
    }, [])

  useEffect(() => {
    if (sessionWarning) addToast('Your session is about to expire due to inactivity', 'warning')
  }, [sessionWarning])

  const [period, setPeriod]     = useState('week')
  const [search, setSearch]     = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userStatusFilter, setUserStatusFilter] = useState('all')

  const filteredUsers = useMemo(() => allUsers.filter(u => {
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase()
    const email = (u.email || '').toLowerCase()
    const searchLower = userSearch.toLowerCase()
    
    const matchSearch = !userSearch || fullName.includes(searchLower) || email.includes(searchLower)
    
    const isSuspended = u.status === 'suspended'
    const matchStatus = userStatusFilter === 'all' || 
                        (userStatusFilter === 'active' && !isSuspended) || 
                        (userStatusFilter === 'suspended' && isSuspended)
                        
    return matchSearch && matchStatus
  }), [allUsers, userSearch, userStatusFilter])


  const [statusFilter, setStatusFilter] = useState('all')
  const [stallStatuses, setStallStatuses] = useState(
    Object.fromEntries(stalls.map(s => [s.id, 'active']))
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!isLoggedIn) { navigate('/admin'); return null }

  const periodFilteredOrders = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1) // If Sunday, go back 6 days to Monday
    weekStart.setDate(diff)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const range = period === 'today' ? todayStart : period === 'week' ? weekStart : monthStart
    return allOrders.filter(o => {
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : o.createdAt ? new Date(o.createdAt) : null
      return d && d >= range
    })
  }, [allOrders, period])

  const activeStallsCount = stalls.filter(s => s.online !== false).length
  const periodOrders = periodFilteredOrders.length
  const periodRevenue = periodFilteredOrders.reduce((s, o) => s + (o.tot || 0), 0)
  const periodUsers = new Set(periodFilteredOrders.map(o => o.userId).filter(Boolean)).size

  const kpis = [
    { label: 'Total Orders',   value: periodOrders,                                         raw: periodOrders,  trend: '+12%', color: '#60a5fa',  border: '#2563eb' },
    { label: 'Total Revenue',  value: formatCurrency(periodRevenue),                         raw: null,          trend: '+8%',  color: '#f0b429',  border: '#f0b429' },
    { label: 'Active Users',   value: allUsers.length,                                           raw: allUsers.length,   trend: '-',  color: '#4ade80',  border: '#16a34a' },
    { label: 'Active Stalls',  value: activeStallsCount,                                     raw: activeStallsCount, trend: '-', color: '#a78bfa',  border: '#7c3aed' },
  ]

  const filteredOrders = useMemo(() => allOrders.filter(o => {
    const matchSearch = !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.stu.toLowerCase().includes(search.toLowerCase()) ||
      o.stall.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.st === statusFilter
    return matchSearch && matchStatus
  }), [search, statusFilter, allOrders])

  const uniqueStatuses = ['all', ...Array.from(new Set(allOrders.map(o => o.st)))]

  const dailyOrders = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const groups = {}
    allOrders.forEach(o => {
      if (!o.createdAt) return
      const date = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt)
      const day = days[date.getDay()]
      if (!groups[day]) groups[day] = { day, orders: 0, revenue: 0 }
      groups[day].orders++
      groups[day].revenue += o.tot || 0
    })
    return days.filter(d => d !== 'Sun').map(d => groups[d] || { day: d, orders: 0, revenue: 0 })
  }, [allOrders])

  const orderTypeData = useMemo(() => {
    const total = allOrders.length || 1
    const dineIn = allOrders.filter(o => o.mode === 'Dine-in').length
    const takeaway = total - dineIn
    return [
      { name: 'Dine-in', value: Math.round((dineIn / total) * 100) },
      { name: 'Takeaway', value: Math.round((takeaway / total) * 100) },
    ]
  }, [allOrders])

  const revenueByStall = useMemo(() => {
    const map = {}
    const collected = allOrders.filter(o => o.st === 'collected')
    collected.forEach(o => {
      const name = o.stallName || o.stall || 'Unknown'
      if (!map[name]) map[name] = { name, revenue: 0, fill: '#f0b429' }
      map[name].revenue += o.tot || 0
    })
    const colors = ['#f0b429', '#f7c948', '#fde68a', '#fbbf24', '#d97706']
    return Object.values(map).map((item, i) => ({ ...item, fill: colors[i % colors.length] }))
  }, [allOrders])

  const renderOverview = () => (
    <div>
      <div className="admin-orders-header">
        <h1 className="admin-orders-title">Overview</h1>
        <div className="period-toggle">
          {['today', 'week', 'month'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`period-btn ${period === p ? 'active' : ''}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="admin-kpi-grid">
        {kpis.map((k, i) => (
          <div key={i} className="card admin-kpi-card" style={{ borderTop: `3px solid ${k.border}` }}>
            <div className="admin-kpi-header">
              <div className="admin-kpi-label">{k.label}</div>
              <span className="admin-kpi-trend">{k.trend}</span>
            </div>
            <div className="admin-kpi-value" style={{ color: k.color }}>{k.value}</div>
            <div className="admin-kpi-period">This {period}</div>
          </div>
        ))}
      </div>

      <div className="admin-chart-grid">
        <div className="card">
          <div className="admin-chart-title">Orders & Revenue Trend</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailyOrders}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="l" stroke="#475569" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="r" orientation="right" stroke="#475569" tick={{ fontSize: 10 }} />
              <Tooltip {...TT} />
              <Line yAxisId="l" type="monotone" dataKey="orders"  stroke="#f0b429" strokeWidth={2} dot={{ fill: '#f0b429', r: 3 }} name="Orders" />
              <Line yAxisId="r" type="monotone" dataKey="revenue" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa', r: 3 }} name="Revenue (KES)" />
            </LineChart>
          </ResponsiveContainer>
          <div className="admin-chart-legend">
            {[{ color: '#f0b429', label: 'Orders' }, { color: '#60a5fa', label: 'Revenue' }].map(l => (
              <div key={l.label} className="admin-chart-legend-item">
                <div className="admin-chart-legend-dot" style={{ background: l.color }}></div>
                {l.label}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="admin-chart-title">Order Type Split</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie data={orderTypeData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" startAngle={90} endAngle={-270}>
                  {orderTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={TT.contentStyle} formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {orderTypeData.map((d, i) => (
                <div key={d.name} style={{ marginBottom: 16 }}>
                  <div className="order-type-row">
                    <div className="order-type-label">
                      <div className="order-type-dot" style={{ background: PIE_COLORS[i] }}></div>
                      {d.name}
                    </div>
                    <span className="order-type-pct" style={{ color: PIE_COLORS[i] }}>{d.value}%</span>
                  </div>
                  <div className="order-type-bar-bg">
                    <div className="order-type-bar-fill" style={{ background: PIE_COLORS[i], width: `${d.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="admin-chart-title">Revenue by Stall (KES)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueByStall} layout="vertical" margin={{ left: 10, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" stroke="#475569" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fontSize: 11 }} width={90} />
            <Tooltip {...TT} formatter={v => `KES ${v.toLocaleString()}`} />
            <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
              {revenueByStall.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
              <LabelList dataKey="revenue" position="right" style={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} formatter={v => `KES ${v.toLocaleString()}`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const renderOrders = () => (
    <div>
      <div className="admin-orders-header">
        <h1 className="admin-orders-title">All Orders</h1>
        <button
          onClick={() => exportCSV(filteredOrders, 'stratheats-orders.csv')}
          className="admin-export-btn"
        >
           Export CSV
        </button>
      </div>

      <div className="admin-search-bar">
        <div className="admin-search-wrap">
          <input
            placeholder="Search by order ID, student or stall..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="admin-search-input"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="admin-status-select"
        >
          {uniqueStatuses.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>
          ))}
        </select>
      </div>

      <div className="admin-summary">
        Showing <strong>{filteredOrders.length}</strong> of {allOrders.length} orders
        {search && <> - filtered by "<span className="admin-summary-highlight">{search}</span>"</>}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {['Order ID', 'Student', 'Stall', 'Items', 'Total', 'Type', 'Status'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr className="admin-table-empty"><td colSpan={7}>No orders match your search</td></tr>
              ) : filteredOrders.map((order, i) => {
                const isPickedUp = order.st === 'Picked up'
                return (
                  <tr key={order.id}>
                    <td className="admin-order-id">{order.id}</td>
                    <td className="admin-order-student">{order.stu}</td>
                    <td className="admin-order-stall">{order.stall}</td>
                    <td className="admin-order-items">{order.itms}</td>
                    <td className="admin-order-total">{formatCurrency(order.tot)}</td>
                    <td className="admin-order-type">{order.type}</td>
                    <td>
                      <span className="admin-status-badge" style={{
                        background: isPickedUp ? 'rgba(74,222,128,0.12)' : 'rgba(96,165,250,0.12)',
                        color: isPickedUp ? '#4ade80' : '#60a5fa',
                      }}>
                        {order.st}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderStalls = () => (
    <div>
      <div className="admin-stalls-header">
        <h1 className="admin-stalls-title">All Stalls</h1>
        <span className="admin-stalls-count">{stalls.length} registered stalls</span>
      </div>

      <div className="admin-stalls-list">
        {stalls.map(stall => {
          const status = stallStatuses[stall.id] || 'active'
          const isActive = status === 'active'
          return (
            <div key={stall.id} className="card" style={{ borderLeft: `3px solid ${isActive ? '#4ade80' : '#f87171'}` }}>
              <div className="admin-stall-main">
                <div className="admin-stall-info">
                  <div>
                    <div className="admin-stall-name">{stall.name}</div>
                    <div className="admin-stall-cat">{stall.cat}</div>
                    <div className="admin-stall-status">
                      <span className={`admin-stall-dot ${isActive ? 'active' : 'inactive'}`}></span>
                      <span className={`admin-stall-status-text ${isActive ? 'active' : 'inactive'}`}>
                        {isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="admin-stall-actions">
                  <div className="admin-stall-metrics">
                    <div className="admin-stall-metric-value">{stall.menu.length}</div>
                    <div className="admin-stall-metric-label">Menu items</div>
                  </div>
                  <button
                    onClick={() => {
                      setStallStatuses(p => ({ ...p, [stall.id]: isActive ? 'suspended' : 'active' }))
                      addToast(`${stall.name} ${isActive ? 'suspended' : 'reactivated'}`, isActive ? 'error' : 'success')
                    }}
                    className={`admin-stall-toggle-btn ${isActive ? 'suspend' : 'reactivate'}`}
                  >
                    {isActive ? 'Suspend' : 'Reactivate'}
                  </button>
                </div>
              </div>

              <div className="admin-stall-details">
                {[
                  { label: 'Vendor', value: stall.vendor },
                  { label: 'Hours',  value: stall.hrs     },
                  { label: 'Available items', value: `${stall.menu.filter(m => m.av).length} / ${stall.menu.length}` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="admin-stall-detail-label">{label}</div>
                    <div className="admin-stall-detail-value">{value}</div>
                  </div>
                ))}
              </div>

              <div>
                <div className="admin-menu-preview-label">Menu preview</div>
                <div className="admin-menu-preview">
                  {stall.menu.slice(0, 5).map(item => (
                    <span key={item.id} className={`admin-menu-chip ${item.av ? 'avail' : 'out'}`}>
                      {item.nm} - KES {item.pr}{!item.av ? ' (out)' : ''}
                    </span>
                  ))}
                  {stall.menu.length > 5 && (
                    <span className="admin-menu-more">+{stall.menu.length - 5} more</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderUsers = () => (
    <div>
      <div className="admin-orders-header">
        <h1 className="admin-orders-title">Platform Users</h1>
        <span className="admin-stalls-count">{filteredUsers.length} registered users</span>
      </div>

      {/* ✨ ADDED: The Search and Filter Bar */}
      <div className="admin-search-bar">
        <div className="admin-search-wrap">
          <input
            placeholder="Search by student name or email..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            className="admin-search-input"
          />
        </div>
        <select
          value={userStatusFilter}
          onChange={e => setUserStatusFilter(e.target.value)}
          className="admin-status-select"
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="suspended">Suspended only</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {/* ✨ CHANGED: Now mapping over filteredUsers instead of allUsers */}
              {filteredUsers.length === 0 ? (
                <tr className="admin-table-empty"><td colSpan={5}>No users match your search</td></tr>
              ) : filteredUsers.map((u) => {
                const isSuspended = u.status === 'suspended'
                return (
                  <tr key={u.id}>
                    <td className="admin-order-student">{u.firstName} {u.lastName}</td>
                    <td style={{ color: '#94a3b8', fontSize: '13px' }}>{u.email}</td>
                    <td>
                      <span className="admin-status-badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#e2e8f0' }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className="admin-status-badge" style={{
                        background: isSuspended ? 'rgba(248,113,113,0.12)' : 'rgba(74,222,128,0.12)',
                        color: isSuspended ? '#f87171' : '#4ade80',
                      }}>
                        {isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className={`admin-stall-toggle-btn ${!isSuspended ? 'suspend' : 'reactivate'}`}
                        onClick={async () => {
                          try {
                            const { doc, updateDoc } = await import('firebase/firestore')
                            const { db } = await import('../../services/firebase')
                            await updateDoc(doc(db, 'users', u.id), { status: isSuspended ? 'active' : 'suspended' })
                            addToast(`User ${isSuspended ? 'reactivated' : 'suspended'} successfully`, isSuspended ? 'success' : 'error')
                          } catch (err) {
                            addToast('Failed to update user', 'error')
                            console.error(err)
                          }
                        }}
                      >
                        {isSuspended ? 'Reactivate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  return (
    <div className="dash-root">
      <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>
      <Sidebar tab={tab} setTab={setTab} user={user} onSignOut={() => { logout(); navigate('/') }} sidebarOpen={sidebarOpen} />
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="dash-main" onClick={() => sidebarOpen && setSidebarOpen(false)}>
        {tab === 'overview' && renderOverview()}
        {tab === 'orders'   && renderOrders()}
        {tab === 'stalls'   && renderStalls()}
        {tab === 'users'    && renderUsers()}
      </div>

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast-item" style={{ borderLeft: `3px solid ${t.type === 'success' ? '#4ade80' : t.type === 'error' ? '#f87171' : '#f0b429'}` }}>
            {t.msg}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  )
}
