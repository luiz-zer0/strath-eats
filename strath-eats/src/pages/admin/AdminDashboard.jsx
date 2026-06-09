import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

import { subscribeToStalls } from '../../services/stallService'
import { formatCurrency } from '../../utils/formatters'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'

// â”€â”€ Static data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const dailyOrders = [
  { day: 'Mon', orders: 24, revenue: 3200 },
  { day: 'Tue', orders: 31, revenue: 4100 },
  { day: 'Wed', orders: 28, revenue: 3800 },
  { day: 'Thu', orders: 38, revenue: 5100 },
  { day: 'Fri', orders: 45, revenue: 6200 },
  { day: 'Sat', orders: 52, revenue: 7100 },
]
const orderTypeData = [
  { name: 'Dine-in',   value: 65 },
  { name: 'Takeaway',  value: 35 },
]
const revenueByStall = [
  { name: 'Mama Grace', revenue: 8200, fill: '#f0b429' },
  { name: 'Deli Corner', revenue: 6400, fill: '#f7c948'  },
  { name: 'Java Spot',   revenue: 5240, fill: '#fde68a'  },
]
const PIE_COLORS = ['#f0b429', '#1a2540']

const PERIOD_MULTIPLIERS = { today: 0.18, week: 1, month: 4.3 }

// â”€â”€ Tooltip style â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TT = {
  contentStyle: {
    background: '#141d35', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, fontSize: 11, color: '#e2e8f0',
  },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
}

// â”€â”€ Toast hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function useToast() {
  const [toasts, setToasts] = useState([])
  const add = (msg, type = 'info') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }
  return { toasts, add }
}

// â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const NAV = [
  { key: 'overview', label: 'Overview' },
  { key: 'orders',   label: 'All Orders' },
  { key: 'stalls',   label: 'Stalls' },
]

function Sidebar({ tab, setTab, user, onSignOut }) {
  const initials = user
    ? `${(user.firstName || user.name || 'A')[0]}${(user.lastName || '')[0] || ''}`.toUpperCase()
    : 'AD'

  return (
    <div className="dash-sidebar" style={{ width: 200 }}>
      <div className="dash-logo-area">
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
          Strath<em style={{ color: '#f0b429', fontStyle: 'normal' }}>Eats</em>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 99, padding: '2px 10px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', display: 'inline-block' }}></span>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin Portal</span>
        </div>
      </div>

      <nav className="dash-nav">
        <div className="dash-nav-header">Platform</div>
        {NAV.map(item => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`dash-nav-item ${tab === item.key ? 'active' : ''}`}
            style={{ color: tab === item.key ? '#a78bfa' : undefined, background: tab === item.key ? 'rgba(167,139,250,0.12)' : undefined }}
            onMouseEnter={e => { if (tab !== item.key) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { if (tab !== item.key) e.currentTarget.style.background = 'transparent' }}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="dash-user-area">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', marginBottom: 6 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(139,92,246,0.3)', border: '1.5px solid rgba(139,92,246,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#a78bfa', flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>
              {user ? `${user.firstName || user.name || 'Admin'} ${user.lastName || ''}`.trim() : 'Admin'}
            </div>
            <div style={{ fontSize: 9, color: '#475569' }}>Platform administrator</div>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="dash-signout-btn"
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.color = '#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}
        >
           Sign out
        </button>
      </div>
    </div>
  )
}

// â”€â”€ Export CSV util â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function exportCSV(data, filename) {
  if (!data.length) return
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(r => Object.values(r).map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// â”€â”€ Card style â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const card = {
  background: '#141d35',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 16,
  padding: 20,
}

// â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AdminDashboard() {
  const navigate  = useNavigate()
  const { isLoggedIn, logout, user } = useAuth()
  const { toasts, add: addToast } = useToast()

    const [tab, setTab]           = useState('overview')
    const [stalls, setStalls] = useState([])

    const [adminStats, setAdminStats] = useState({ totalOrders: 0, totalRevenue: 0, activeUsers: 0 });
    const [allOrders, setAllOrders] = useState([]);

    useEffect(() => {
      const unsub = subscribeToStalls((docs) => {
        setStalls(docs)
      })
      return () => unsub?.()
    }, [])
  const [period, setPeriod]     = useState('week')
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stallStatuses, setStallStatuses] = useState(
    Object.fromEntries(stalls.map(s => [s.id, 'active']))
  )

  if (!isLoggedIn) { navigate('/admin'); return null }

  // â”€â”€ Scaled KPIs â”€â”€
  const m = PERIOD_MULTIPLIERS[period]
  const activeStallsCount = stalls.filter(s => s.online !== false).length
  const kpis = [
    { label: 'Total Orders',   value: Math.round(adminStats.totalOrders * m),                  raw: Math.round(adminStats.totalOrders * m),   trend: '+12%', color: '#60a5fa',  border: '#2563eb' },
    { label: 'Total Revenue',  value: formatCurrency(Math.round(adminStats.totalRevenue * m)), raw: null,                                       trend: '+8%',  color: '#f0b429',  border: '#f0b429' },
    { label: 'Active Users',   value: adminStats.activeUsers,                                  raw: adminStats.activeUsers,                    trend: '+5%',  color: '#4ade80',  border: '#16a34a' },
    { label: 'Active Stalls',  value: activeStallsCount,                                      raw: activeStallsCount,                         trend: '-',    color: '#a78bfa',  border: '#7c3aed' },
  ]

  // â”€â”€ Filtered orders â”€â”€
  const filteredOrders = useMemo(() => allOrders.filter(o => {
    const matchSearch = !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.stu.toLowerCase().includes(search.toLowerCase()) ||
      o.stall.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.st === statusFilter
    return matchSearch && matchStatus
  }), [search, statusFilter])

  const uniqueStatuses = ['all', ...Array.from(new Set(allOrders.map(o => o.st)))]

  // â”€â”€ Render overview â”€â”€
  const renderOverview = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Overview</h1>
        {/* Period toggle */}
        <div style={{ display: 'flex', background: '#141d35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 4, gap: 4 }}>
          {['today', 'week', 'month'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: period === p ? '#f0b429' : 'transparent',
              color: period === p ? '#0a0f1e' : '#64748b',
              fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
              fontFamily: 'Sora, system-ui, sans-serif', transition: 'all 0.13s',
            }}>{p}</button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ ...card, borderTop: `3px solid ${k.border}`, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k.label}</div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.1)', borderRadius: 99, padding: '2px 7px' }}>{k.trend}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: k.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 9, color: '#475569', marginTop: 6, textTransform: 'capitalize' }}>This {period}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={card}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 13, marginBottom: 14 }}>Orders & Revenue Trend</div>
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
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
            {[{ color: '#f0b429', label: 'Orders' }, { color: '#60a5fa', label: 'Revenue' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#64748b' }}>
                <div style={{ width: 20, height: 2, borderRadius: 99, background: l.color }}></div>
                {l.label}
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 13, marginBottom: 14 }}>Order Type Split</div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i] }}></div>
                      {d.name}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: PIE_COLORS[i] }}>{d.value}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: PIE_COLORS[i], width: `${d.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue by stall - full width */}
      <div style={card}>
        <div style={{ fontWeight: 700, color: '#fff', fontSize: 13, marginBottom: 14 }}>Revenue by Stall (KES)</div>
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

  // â”€â”€ Render orders â”€â”€
  const renderOrders = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>All Orders</h1>
        <button
          onClick={() => exportCSV(filteredOrders, 'stratheats-orders.csv')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Sora, system-ui, sans-serif', transition: 'all 0.13s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#f0b429'; e.currentTarget.style.color = '#f0b429' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#94a3b8' }}
        >
           Export CSV
        </button>
      </div>

      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#475569' }}></span>
          <input
            placeholder="Search by order ID, student or stall..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 34px', background: '#141d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12, color: '#e2e8f0', fontFamily: 'Sora, system-ui, sans-serif', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = '#f0b429'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '10px 14px', background: '#141d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12, color: '#e2e8f0', fontFamily: 'Sora, system-ui, sans-serif', outline: 'none', cursor: 'pointer' }}
        >
          {uniqueStatuses.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>
          ))}
        </select>
      </div>

      {/* Summary bar */}
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
        Showing <strong style={{ color: '#e2e8f0' }}>{filteredOrders.length}</strong> of {allOrders.length} orders
        {search && <> - filtered by "<span style={{ color: '#f0b429' }}>{search}</span>"</>}
      </div>

      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f1729', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Order ID', 'Student', 'Stall', 'Items', 'Total', 'Type', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#475569', fontSize: 13 }}>No orders match your search</td></tr>
              ) : filteredOrders.map((order, i) => {
                const isPickedUp = order.st === 'Picked up'
                return (
                  <tr key={order.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.13s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 11, fontFamily: 'monospace', color: '#f0b429', whiteSpace: 'nowrap' }}>{order.id}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#e2e8f0', whiteSpace: 'nowrap' }}>{order.stu}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{order.stall}</td>
                    <td style={{ padding: '12px 16px', fontSize: 11, color: '#64748b', maxWidth: 200 }}>{order.itms}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#f0b429', whiteSpace: 'nowrap' }}>{formatCurrency(order.tot)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {order.type === 'Dine-in' ? '' : ''} {order.type}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, whiteSpace: 'nowrap',
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

  // â”€â”€ Render stalls â”€â”€
  const renderStalls = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>All Stalls</h1>
        <span style={{ fontSize: 11, color: '#64748b' }}>{stalls.length} registered stalls</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {stalls.map(stall => {
          const status = stallStatuses[stall.id] || 'active'
          const isActive = status === 'active'
          return (
            <div key={stall.id} style={{ ...card, borderLeft: `3px solid ${isActive ? '#4ade80' : '#f87171'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 3 }}>{stall.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{stall.cat}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: isActive ? '#4ade80' : '#f87171', display: 'inline-block', boxShadow: isActive ? '0 0 6px #4ade80' : 'none' }}></span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? '#4ade80' : '#f87171' }}>
                        {isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ textAlign: 'right', padding: '10px 16px', background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.2)', borderRadius: 10 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#f0b429' }}>{stall.menu.length}</div>
                    <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Menu items</div>
                  </div>
                  <button
                    onClick={() => {
                      setStallStatuses(p => ({ ...p, [stall.id]: isActive ? 'suspended' : 'active' }))
                      addToast(`${stall.name} ${isActive ? 'suspended' : 'reactivated'}`, isActive ? 'error' : 'success')
                    }}
                    style={{
                      padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                      fontFamily: 'Sora, system-ui, sans-serif', transition: 'all 0.13s',
                      background: isActive ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)',
                      color: isActive ? '#f87171' : '#4ade80',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    {isActive ? 'Suspend' : 'Reactivate'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14, padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { label: 'Vendor', value: stall.vendor },
                  { label: 'Hours',  value: stall.hrs     },
                  { label: 'Available items', value: `${stall.menu.filter(m => m.av).length} / ${stall.menu.length}` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>{value}</div>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Menu preview</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {stall.menu.slice(0, 5).map(item => (
                    <span key={item.id} style={{
                      fontSize: 10, padding: '4px 10px', borderRadius: 99,
                      background: item.av ? 'rgba(255,255,255,0.05)' : 'rgba(248,113,113,0.06)',
                      border: `1px solid ${item.av ? 'rgba(255,255,255,0.08)' : 'rgba(248,113,113,0.15)'}`,
                      color: item.av ? '#94a3b8' : '#f87171',
                    }}>
                      {item.nm} - KES {item.pr}{!item.av ? ' (out)' : ''}
                    </span>
                  ))}
                  {stall.menu.length > 5 && (
                    <span style={{ fontSize: 10, color: '#475569', padding: '4px 0' }}>+{stall.menu.length - 5} more</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', fontFamily: 'Sora, system-ui, sans-serif' }}>
      <Sidebar tab={tab} setTab={setTab} user={user} onSignOut={() => { logout(); navigate('/') }} />

      <div className="dash-main">
        {tab === 'overview' && renderOverview()}
        {tab === 'orders'   && renderOrders()}
        {tab === 'stalls'   && renderStalls()}
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
