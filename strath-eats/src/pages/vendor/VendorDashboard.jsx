import { useEffect, useMemo, useState } from 'react'
import { useNavigate,Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { formatCurrency, formatDate } from '../../utils/formatters'
import {
  buildOrderTrend,
  buildOrdersByHour,
  buildTopItems,
  summarizeOrders,
} from '../../utils/analytics'
import { subscribeToStall } from '../../services/stallService'
import { subscribeToVendorOrders, updateOrderStatus } from '../../services/orderservice'
import { db } from '../../services/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import '../../styles/vendor.css'

//  Constants
const COLORS = ['#f0b429', '#f7c948', '#fde68a', '#fb923c', '#a78bfa']

const STATUS_CFG = {
  paid:     { label: 'Payment Confirmed', color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  accepted: { label: 'Confirmed',         color: '#f0b429', bg: 'rgba(240,180,41,0.12)'  },
  preparing:{ label: 'Preparing',         color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  ready:    { label: 'Ready',             color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  collected:{ label: 'Collected',         color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' },
  cancelled:{ label: 'Cancelled',         color: '#f87171', bg: 'rgba(248,113,113,0.10)' },
}

//  Toast hook
function useToastLocal() {
  const [toasts, setToasts] = useState([])
  const add = (msg, type = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }
  return { toasts, add }
}

//  Sidebar
const NAV = [
  { key: 'orders',    label: 'Orders Queue' },
  { key: 'menu',      label: 'My Menu' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'settings',  label: 'Settings' },
]

function Sidebar({ tab, setTab, user, pendingCount, onSignOut, sidebarOpen }) {
  const { toggleTheme, isDark } = useTheme()
  const initials = user
    ? `${(user.firstName || user.name || 'V')[0]}${(user.lastName || '')[0] || ''}`.toUpperCase()
    : 'V'
  const displayName = user
    ? `${user.firstName || user.name || 'Vendor'} ${user.lastName || ''}`.trim()
    : 'Vendor'

  return (
    <div className={`dash-sidebar${sidebarOpen ? ' open' : ''}`} style={{ width: 200 }}>
      <div className="dash-logo-area">
        <Link 
          to="/"
          className="text-lg font-bold text-[var(--text-primary)] hover:opacity-80 transition-opacity select-none cursor-pointer block relative z-50"
          style={{ textDecoration: 'none' }}
        >
          Strath<em className="text-gold not-italic">Eats</em>
        </Link>
        <div className="vendor-role-text">
          Vendor Portal
        </div>
      </div>

      <nav className="dash-nav">
        <div className="dash-nav-header">Manage</div>
        {NAV.map(item => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`dash-nav-item ${tab === item.key ? 'active' : ''}`}
          >
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.key === 'orders' && pendingCount > 0 && (
              <span className="dash-nav-badge">{pendingCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="dash-user-area">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', marginBottom: 6 }}>
          <div className="vendor-user-avatar">
            {initials}
          </div>
          <div>
            <div className="vendor-user-name">{displayName}</div>
            <div className="vendor-user-role-text">Stall vendor</div>
          </div>
        </div>
        <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', width: '100%', textAlign: 'left', color: 'var(--text-dim)', fontFamily: "'Sora', system-ui, sans-serif", fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          {isDark ? '\u2600\uFE0F' : '\uD83C\uDF19'} {isDark ? 'Light mode' : 'Dark mode'}
        </button>
        <button
          onClick={onSignOut}
          className="dash-signout-btn"
        >
           Sign out
        </button>
      </div>
    </div>
  )
}

//  Toggle switch
function Toggle({ on, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className={`toggle ${on ? 'on' : 'off'}`}
    />
  )
}

//  Main
export default function VendorDashboard() {
  const navigate = useNavigate()
  const { isLoggedIn, logout, user, sessionWarning } = useAuth()
  const { toasts, add: addToast } = useToastLocal()

  const [tab, setTab]           = useState('orders')
  const [orders, setOrders]     = useState([])
  const [stall, setStall]       = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [newItem, setNewItem]   = useState({ nm: '', pr: '', cat: '', halfPr: '', fullPr: '', hasPortions: false })
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [savedAt, setSavedAt]   = useState(null)
  const [stallOnline, setStallOnline] = useState(true)
  const [stallId, setStallId] = useState(null)
  const [loadingStall, setLoadingStall] = useState(true)
  const [firestoreError, setFirestoreError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [orderFilter, setOrderFilter] = useState('incoming')

  useEffect(() => {
    if (sessionWarning) {
      addToast(sessionWarning, 'warning')
    }
  }, [sessionWarning])

  const getVendorDraftKey = (id) => `stratheats:vendor-stall:${id}`

  const readVendorDraft = (id) => {
    if (!id || typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem(getVendorDraftKey(id))
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const writeVendorDraft = (id, payload) => {
    if (!id || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(getVendorDraftKey(id), JSON.stringify({ ...payload, id }))
    } catch {
    }
  }

  const hydrateStallState = (source) => {
    if (!source) return
    setStall(source)
    setMenuItems(Array.isArray(source.menu) ? source.menu : [])
    setStallOnline(Boolean(source.online ?? true))
    setStallSettings({
      name: source.name || '',
      cat: source.cat || '',
      openTime: String(source.hrs || '08:00-16:00').split('-')[0] || '08:00',
      closeTime: String(source.hrs || '08:00-16:00').split('-')[1] || '16:00',
      desc: source.desc || 'Home-style Kenyan meals made fresh daily.',
      mpesa: source.mpesa || user?.mpesa || '522522',
    })
  }

  const [stallSettings, setStallSettings] = useState({
    name:       '',
    cat:        '',
    openTime:   '08:00',
    closeTime:  '16:00',
    desc:       'Home-style Kenyan meals made fresh daily.',
    mpesa:      user?.mpesa || '522522',
  })

  useEffect(() => {
    if (!user) return

    let active = true
    const resolvedStallId = user.stallId || user.uid
    setStallId(resolvedStallId)
    setLoadingStall(true)

    const cachedDraft = readVendorDraft(resolvedStallId)
    if (cachedDraft) {
      hydrateStallState(cachedDraft)
    }

    const unsubscribeStall = subscribeToStall(
      resolvedStallId,
      (stallDoc) => {
        if (!active) return
        setLoadingStall(false)
        if (stallDoc) {
          const freshDraft = readVendorDraft(resolvedStallId)
          const mergedDraft = freshDraft
            ? {
                ...stallDoc,
                ...freshDraft,
                menu: Array.isArray(freshDraft.menu) ? freshDraft.menu : (stallDoc.menu || []),
              }
            : stallDoc
          hydrateStallState(mergedDraft)
          if (!freshDraft) {
            writeVendorDraft(resolvedStallId, stallDoc)
          }
        } else {
          if (readVendorDraft(resolvedStallId)) {
            setFirestoreError('Stall not found in Firestore — showing local cache. Menu items may be outdated.')
          } else {
            setFirestoreError('Stall not found. Please contact support.')
          }
        }
      },
      (err) => {
        if (!active) return
        setLoadingStall(false)
        console.error('Stall listener error', err)
        const msg = err?.message || String(err)
        setFirestoreError(msg)
        addToast(`Stall sync failed: ${msg}`, 'error')
        if (cachedDraft) {
          hydrateStallState(cachedDraft)
        }
      }
    )

    const unsubscribeOrders = subscribeToVendorOrders(
      resolvedStallId,
      (liveOrders) => {
        if (!active) return
        setOrders(liveOrders || [])
      },
      (err) => {
        if (!active) return
        console.error('Vendor orders listener error', err)
        setFirestoreError(err?.message || String(err))
      }
    )

    return () => {
      active = false
      unsubscribeStall?.()
      unsubscribeOrders?.()
    }
  }, [user])

  const persistStall = async (patch) => {
    if (!stallId) return
    const localPayload = { ...patch, updatedAt: new Date().toISOString() }
    writeVendorDraft(stallId, localPayload)

    try {
      await setDoc(doc(db, 'stalls', stallId), { ...patch, updatedAt: serverTimestamp() }, { merge: true })
    } catch (error) {
      console.error('Failed to persist stall to Firestore', error)
      setFirestoreError(error?.message || String(error))
      addToast('Saved locally, but cloud sync failed', 'error')
    }
  }

  //  Computed
  const pendingCount = orders.filter(o => o.st === 'paid').length

  const categoryOptions = useMemo(() => {
    const from = menuItems.map(i => String(i.cat || '').trim()).filter(Boolean)
    const defs = ['Main dish', 'Side dish', 'Vegetable', 'Protein', 'Beverage', 'Snack']
    return Array.from(new Set([...defs, ...from]))
  }, [menuItems])

  const weeklyRevenue = useMemo(() => {
    return buildOrderTrend(orders).map(({ day, revenue, orders }) => ({ name: day, revenue, orders }))
  }, [orders])

  const ordersByHour = useMemo(() => buildOrdersByHour(orders), [orders])

  const topItems = useMemo(() => buildTopItems(orders), [orders])

  const analyticsSummary = useMemo(() => summarizeOrders(orders), [orders])

  if (!isLoggedIn) {
    navigate('/vendor')
    return null
  }

  if (loadingStall) {
    return (
      <div style={{ minHeight:'100vh', background:'#0a0f1e', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontFamily:'Sora, system-ui, sans-serif' }}>
        {firestoreError ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, color: '#f87171', marginBottom: 8 }}>Firestore error</div>
            <div style={{ color: '#94a3b8' }}>{firestoreError}</div>
            <div style={{ marginTop: 12, color: '#64748b', fontSize: 12 }}>Check Firestore rules and ensure your account has read access to your stall and orders.</div>
          </div>
        ) : (
          'Loading your stall...'
        )}
      </div>
    )
  }

  //  Handlers

  const handleConfirm  = async id => { setOrders(p => p.map(o => o.id===id ? {...o, st:'accepted', rm:true} : o)); await updateOrderStatus(id, 'accepted'); addToast('Order confirmed','success') }
  const handleReject   = async id => { setOrders(p => p.map(o => o.id===id ? {...o, st:'cancelled'} : o)); await updateOrderStatus(id, 'cancelled'); addToast('Order cancelled','error') }
  const handlePreparing= async id => { setOrders(p => p.map(o => o.id===id ? {...o, st:'preparing'} : o)); await updateOrderStatus(id, 'preparing'); addToast('Marked as preparing','info') }
  const handleReady    = async id => { setOrders(p => p.map(o => o.id===id ? {...o, st:'ready', rm:false} : o)); await updateOrderStatus(id, 'ready'); addToast('Marked as ready','success') }
  const handleCollected= async id => { setOrders(p => p.map(o => o.id===id ? {...o, st:'collected'} : o)); await updateOrderStatus(id, 'collected'); addToast('Order collected','info') }

  const handleAddItem = e => {
    e.preventDefault()
    const nm = newItem.nm.trim()
    const cat = newItem.cat.trim()
    const pr = Number(newItem.pr)
    if (!nm || !cat || (!newItem.hasPortions && (!Number.isFinite(pr) || pr <= 0))) {
      addToast('Please fill in all required fields','error'); return
    }
    if (newItem.hasPortions && (!Number(newItem.halfPr) || !Number(newItem.fullPr))) {
      addToast('Please enter both half and full prices','error'); return
    }
    const item = {
      id: Math.max(...menuItems.map(i=>i.id),0)+1,
      nm, cat, av: true,
      pr: newItem.hasPortions ? Number(newItem.fullPr) : pr,
      portions: newItem.hasPortions ? { half: Number(newItem.halfPr), full: Number(newItem.fullPr) } : null,
    }
    const nextMenu = [...menuItems, item]
    setMenuItems(nextMenu)
    persistStall({
      menu: nextMenu,
    })
    setNewItem({ nm:'', pr:'', cat:'', halfPr:'', fullPr:'', hasPortions: false })
    addToast(`${item.nm} added to menu `,'success')
  }

  const handleSaveSettings = () => {
    const nextStall = {
      ...(stall || {}),
      id: stallId,
      menu: menuItems,
      name: stallSettings.name,
      cat: stallSettings.cat,
      hrs: `${stallSettings.openTime}-${stallSettings.closeTime}`,
      desc: stallSettings.desc,
      mpesa: stallSettings.mpesa,
      online: stallOnline,
    }

    setStall(nextStall)
    persistStall(nextStall)
    setSavedAt(new Date().toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'}))
    addToast('Settings saved ','success')
  }

  //  Render tabs
  const renderOrders = () => {
    const FILTERS = [
      { key: 'incoming',  label: 'Incoming',  statuses: ['paid'] },
      { key: 'ongoing',   label: 'Ongoing',   statuses: ['accepted', 'preparing', 'ready'] },
      { key: 'completed', label: 'Completed', statuses: ['collected', 'cancelled'] },
    ]
    const filteredOrders = orders.filter(o => {
      const f = FILTERS.find(f => f.key === orderFilter)
      return f ? f.statuses.includes(o.st) : true
    })

    return (
    <div>
      <div className="vendor-orders-header">
        <h1 className="vendor-orders-title">Orders Queue</h1>
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <span className="vendor-stall-status-label">Stall status:</span>
          <Toggle on={stallOnline} onToggle={() => {
            const nextOnline = !stallOnline
            setStallOnline(nextOnline)
            persistStall({
              menu: menuItems,
              name: stallSettings.name,
              cat: stallSettings.cat,
              hrs: `${stallSettings.openTime}-${stallSettings.closeTime}`,
              desc: stallSettings.desc,
              mpesa: stallSettings.mpesa,
              online: nextOnline,
            })
            addToast(nextOnline ? 'Stall is now Open ' : 'Stall set to Closed', 'info')
          }} />
          <span className={`vendor-stall-status-indicator ${stallOnline ? 'open' : 'closed'}`}>
            {stallOnline ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>

      <div style={{ display:'flex', gap: 8, marginBottom: 16 }}>
        {FILTERS.map(f => {
          const count = orders.filter(o => f.statuses.includes(o.st)).length
          const active = orderFilter === f.key
          return (
            <button
              key={f.key}
              onClick={() => setOrderFilter(f.key)}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                background: active ? '#f0b429' : 'rgba(255,255,255,0.06)',
                color: active ? '#0a0f1e' : '#94a3b8',
              }}
            >
              {f.label}{count > 0 ? ` (${count})` : ''}
            </button>
          )
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="card vendor-orders-empty">
          <div style={{ fontSize: 36, marginBottom: 10 }}></div>
          {firestoreError ? (
            <div style={{ color: '#f87171', fontSize: 14, marginBottom: 8 }}>Error: {firestoreError}</div>
          ) : null}
          <div className="vendor-orders-empty-text">No {orderFilter} orders</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
          {filteredOrders.map(order => {
            const st = STATUS_CFG[order.st] || STATUS_CFG.paid
            const isCompleted = orderFilter === 'completed'
            return (
              <div key={order.id} className="card" style={{ borderLeft: `3px solid ${st.color}` }}>
                <div className="vendor-order-header">
                  <div>
                    <div className="vendor-order-customer">{order.user}</div>
                    <div className="vendor-order-id">{order.id}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{formatDate(order.createdAt)}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                    <div className="vendor-order-amount">KES {order.tot}</div>
                    <span className="vendor-order-status" style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                </div>

                <div className="vendor-order-items-box">
                  {order.items.map((item,i) => (
                    <div key={i} className="vendor-order-item" style={{ paddingBottom: i < order.items.length - 1 ? 4 : 0 }}>
                  • {item?.qty || 1}x {item?.nm || (typeof item === 'string' ? item : 'Unknown Item')}
                  {item?.pr ? <span className="vendor-order-item-price"> — KES {item.pr * (item.qty || 1)}</span> : null}
                </div>
                  ))}
                </div>

                <div className="vendor-order-meta">
                  <span>{order.mode === 'Dine-in' ? '' : ''} {order.mode}</span>
                  <span>Pickup {order.pu}</span>
                </div>

                {!isCompleted && (
                <div className="vendor-actions">
                  {order.st === 'paid' && <>
                    <button onClick={() => handleConfirm(order.id)} className="btn-sm btn-confirm"> Confirm</button>
                    <button onClick={() => handleReject(order.id)} className="btn-sm btn-reject"> Cancel</button>
                  </>}
                  {order.st === 'accepted' && order.rm && (
                    <button onClick={() => handlePreparing(order.id)} className="vendor-action-btn prepare"> Prepare</button>
                  )}
                  {order.st === 'preparing' && (
                    <button onClick={() => handleReady(order.id)} className="btn-sm btn-ready"> Mark Ready</button>
                  )}
                  {order.st === 'ready' && (
                    <button onClick={() => handleCollected(order.id)} className="vendor-action-btn collected"> Mark Collected</button>
                  )}
                </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )}

  const renderMenu = () => (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 20, letterSpacing:'-0.02em' }}>My Menu</h1>
      <div className="vendor-menu-grid">
        {/* Items list */}
        <div className="vendor-menu-list">
          {menuItems.map(item => (
            <div key={item.id} className="vendor-menu-item" style={{ borderLeft: `3px solid ${item.av ? '#4ade80' : '#f87171'}` }}>
              <div className="vendor-menu-item-info">
                <div className="vendor-menu-item-name">{item.nm}</div>
                <div className="vendor-menu-item-cat">{item.cat}</div>
                {item.portions ? (
                  <div className="vendor-menu-item-portion">
                    Half KES {item.portions.half} - Full KES {item.portions.full}
                  </div>
                ) : (
                  <div className="vendor-menu-item-price">KES {item.pr}</div>
                )}
              </div>
              <div className="vendor-menu-item-actions">
                <div style={{ display:'flex', alignItems:'center', gap: 7 }}>
                  <span className="vendor-menu-toggle-label" style={{ color: item.av ? '#4ade80' : '#f87171' }}>
                    {item.av ? 'Available' : 'Out'}
                  </span>
                  <Toggle on={item.av} onToggle={() => {
                    const nextMenu = menuItems.map(i => i.id===item.id ? {...i, av:!i.av} : i)
                    setMenuItems(nextMenu)
                    persistStall({
                      menu: nextMenu,
                      name: stallSettings.name,
                      cat: stallSettings.cat,
                      hrs: `${stallSettings.openTime}-${stallSettings.closeTime}`,
                      desc: stallSettings.desc,
                      mpesa: stallSettings.mpesa,
                      online: stallOnline,
                    })
                  }} />
                </div>
                <button
                  onClick={() => {
                    const nextMenu = menuItems.filter(i=>i.id!==item.id)
                    setMenuItems(nextMenu)
                    persistStall({
                      menu: nextMenu,
                      name: stallSettings.name,
                      cat: stallSettings.cat,
                      hrs: `${stallSettings.openTime}-${stallSettings.closeTime}`,
                      desc: stallSettings.desc,
                      mpesa: stallSettings.mpesa,
                      online: stallOnline,
                    })
                    addToast('Item removed','info')
                  }}
                  className="vendor-menu-delete-btn"
                >×</button>
              </div>
            </div>
          ))}
        </div>

        {/* Add item form */}
        <div className="vendor-add-form">
          <div className="vendor-add-form-title">Add New Item</div>
          <form onSubmit={handleAddItem} className="vendor-add-form-fields">
            <div>
              <label className="form-label">Dish name</label>
              <input className="form-input" placeholder="e.g. Pilau" value={newItem.nm} onChange={e=>setNewItem({...newItem,nm:e.target.value})} />
            </div>

            {/* Portion toggle */}
            <div className="vendor-portion-toggle">
              <div>
                <div className="vendor-portion-label">Has portions?</div>
                <div className="vendor-portion-hint">Half & full sizing</div>
              </div>
              <Toggle on={newItem.hasPortions} onToggle={()=>setNewItem({...newItem, hasPortions:!newItem.hasPortions})} />
            </div>

            {!newItem.hasPortions ? (
              <div>
                <label className="form-label">Price (KES)</label>
                <input className="form-input" type="number" placeholder="e.g. 120" value={newItem.pr} onChange={e=>setNewItem({...newItem,pr:e.target.value})} />
              </div>
            ) : (
              <div className="vendor-portion-grid">
                <div>
                  <label className="form-label">Half (KES)</label>
                  <input className="form-input" type="number" placeholder="60" value={newItem.halfPr} onChange={e=>setNewItem({...newItem,halfPr:e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Full (KES)</label>
                  <input className="form-input" type="number" placeholder="120" value={newItem.fullPr} onChange={e=>setNewItem({...newItem,fullPr:e.target.value})} />
                </div>
              </div>
            )}

            <div>
              <label className="form-label">Category</label>
              <select className="form-select" value={newItem.cat} onChange={e=>setNewItem({...newItem,cat:e.target.value})}>
                <option value="" disabled>Select category</option>
                {categoryOptions.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <button type="submit" className="vendor-submit-btn">+ Add to menu</button>
          </form>
        </div>
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 20, letterSpacing:'-0.02em' }}>Analytics</h1>
      {/* KPI row */}
      <div className="vendor-kpi-grid">
        {[
          {
    label: "Today's Revenue",
    value: formatCurrency(analyticsSummary?.todayRevenue || 0),
    color: '#f0b429'
  },
  {
    label: 'Total Orders',
    value: String(analyticsSummary?.totalOrders || 0),
    color: '#60a5fa'
  },
  {
    label: 'Avg Order Value',
    value: formatCurrency(analyticsSummary?.averageOrderValue || 0),
    color: '#4ade80'
  }
        ].map((k,i)=>(
          <div key={i} className="vendor-kpi-card">
            <div>
              <div className="vendor-kpi-label">{k.label}</div>
              <div className="vendor-kpi-value" style={{ color: k.color }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="vendor-analytics-grid">
        <div className="vendor-chart-card">
          <div className="vendor-chart-title">Weekly Revenue (KES)</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fontSize:11 }} />
              <YAxis stroke="#475569" tick={{ fontSize:11 }} />
              <Tooltip contentStyle={{ background:'#141d35', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, fontSize:11 }} />
              <Bar dataKey="revenue" fill="#f0b429" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="vendor-chart-card">
          <div className="vendor-chart-title">Orders by Hour</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={ordersByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="hour" stroke="#475569" tick={{ fontSize:11 }} />
              <YAxis stroke="#475569" tick={{ fontSize:11 }} />
              <Tooltip contentStyle={{ background:'#141d35', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, fontSize:11 }} />
              <Line type="monotone" dataKey="orders" stroke="#f0b429" strokeWidth={2} dot={{ fill:'#f0b429' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="vendor-chart-card">
          <div className="vendor-chart-title">Top Items</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={topItems} cx="50%" cy="50%" outerRadius={90} dataKey="sales"
                label={({ name, sales }) => `${name} (${sales})`} labelLine={false}
              >
                {topItems.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background:'#141d35', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, fontSize:11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="vendor-chart-card">
          <div className="vendor-chart-title">Top Items Ranked</div>
          {topItems.map((item,i)=>(
            <div key={i} className="vendor-top-item">
              <div className="vendor-top-item-header">
                <span className="vendor-top-item-name">{item.name}</span>
                <span className="vendor-top-item-sales">{item.sales} orders</span>
              </div>
              <div className="vendor-top-item-bar-bg">
                <div className="vendor-top-item-bar" style={{ width:`${(item.sales/(topItems[0]?.sales||1))*100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4, letterSpacing:'-0.02em' }}>Stall Settings</h1>
      {savedAt && <div className="vendor-saved-at"> Last saved today at {savedAt}</div>}
      {!savedAt && <div className="vendor-unsaved-hint">Configure how your stall appears to students</div>}

      <div className="vendor-settings-grid">
        {/* Form */}
        <div className="vendor-settings-form">

          {/* Online toggle */}
          <div className="vendor-settings-card vendor-settings-status-row">
            <div>
              <div className="vendor-settings-status-label">Stall Status</div>
              <div className="vendor-settings-status-hint">Students can only order when your stall is open</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
              <span style={{ fontSize:11, fontWeight:700, color: stallOnline ? '#4ade80' : '#f87171' }}>
                {stallOnline ? ' Open' : ' Closed'}
              </span>
              <Toggle on={stallOnline} onToggle={() => {
                const nextOnline = !stallOnline
                setStallOnline(nextOnline)
                persistStall({
                  menu: menuItems,
                  name: stallSettings.name,
                  cat: stallSettings.cat,
                  hrs: `${stallSettings.openTime}-${stallSettings.closeTime}`,
                  desc: stallSettings.desc,
                  mpesa: stallSettings.mpesa,
                  online: nextOnline,
                })
              }} />
            </div>
          </div>

          {/* Basic info */}
          <div className="vendor-settings-card">
            <div className="vendor-settings-card-title">Basic Info</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label className="form-label">Stall Name</label>
                <input className="form-input" value={stallSettings.name} onChange={e=>setStallSettings({...stallSettings,name:e.target.value})} />
              </div>
              <div>
                <label className="form-label">Category / Cuisine type</label>
                <input className="form-input" placeholder="e.g. Local meals & stews" value={stallSettings.cat} onChange={e=>setStallSettings({...stallSettings,cat:e.target.value})} />
              </div>
              <div>
                <label className="form-label">Short description (shown to students)</label>
                <textarea
                  className="form-input"
                  style={{ resize:'none', height:72 }}
                  placeholder="e.g. Home-style Kenyan meals made fresh daily."
                  value={stallSettings.desc}
                  onChange={e=>setStallSettings({...stallSettings,desc:e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Emoji picker */}

          {/* Hours */}
          <div className="vendor-settings-card">
            <div className="vendor-settings-card-title">Opening Hours</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label className="form-label">Opens at</label>
                <input type="time" className="form-input" value={stallSettings.openTime} onChange={e=>setStallSettings({...stallSettings,openTime:e.target.value})} />
              </div>
              <div>
                <label className="form-label">Closes at</label>
                <input type="time" className="form-input" value={stallSettings.closeTime} onChange={e=>setStallSettings({...stallSettings,closeTime:e.target.value})} />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="vendor-settings-card">
            <div className="vendor-settings-section-title">Payment</div>
            <div className="vendor-settings-section-desc">Student payments are sent to this M-Pesa number</div>
            <div>
              <label className="form-label">M-Pesa Till / Paybill</label>
              <input className="form-input" placeholder="e.g. 522522" value={stallSettings.mpesa} onChange={e=>setStallSettings({...stallSettings,mpesa:e.target.value})} />
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSaveSettings}
            className="vendor-settings-save-btn"
          >
            Save changes
          </button>

          {/* Danger zone */}
          <div className="vendor-settings-card vendor-danger-zone">
            <div className="vendor-danger-title">Danger Zone</div>
            <div className="vendor-danger-desc">These actions are irreversible. Proceed with caution.</div>
            <button
              onClick={()=>addToast('Contact admin to permanently deactivate your stall','info')}
              className="vendor-danger-btn"
            >
              Deactivate stall
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div className="vendor-preview-section">
          <div className="vendor-preview-header">
            Live preview
          </div>
          <div className="vendor-preview-card">
            <div className="vendor-preview-name">{stallSettings.name || 'Stall name'}</div>
            <div className="vendor-preview-cat">{stallSettings.cat || 'Category'}</div>
            <div className="vendor-preview-desc">{stallSettings.desc || 'No description yet.'}</div>
            <div className="vendor-preview-footer">
              <div className="vendor-preview-hours">
                <span style={{ width:7, height:7, borderRadius:'50%', background: stallOnline ? '#4ade80' : '#f87171', display:'inline-block', boxShadow: stallOnline ? '0 0 6px #4ade80' : 'none' }}></span>
                {stallSettings.openTime}-{stallSettings.closeTime}
              </div>
              <span className="vendor-preview-items">{menuItems.filter(i=>i.av).length} items</span>
            </div>
          </div>
          <div className="vendor-preview-hint">
            This is how your stall<br/>appears to students
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="dash-root">
      <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>
      <Sidebar tab={tab} setTab={setTab} user={user} pendingCount={pendingCount} onSignOut={()=>{ logout(); navigate('/') }} sidebarOpen={sidebarOpen} />
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="dash-main" onClick={() => sidebarOpen && setSidebarOpen(false)}>
        {tab==='orders'    && renderOrders()}
        {tab==='menu'      && renderMenu()}
        {tab==='analytics' && renderAnalytics()}
        {tab==='settings'  && renderSettings()}
      </div>

      <div className="toast-container">
        {toasts.map(t=>(
          <div key={t.id} className="toast-item" style={{ borderLeft:`3px solid ${t.type==='success'?'#4ade80':t.type==='error'?'#f87171':'#f0b429'}` }}>
            {t.msg}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  )
}
