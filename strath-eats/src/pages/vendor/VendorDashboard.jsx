import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency } from '../../utils/formatters'
import {
  buildOrderTrend,
  buildOrdersByHour,
  buildTopItems,
  summarizeOrders,
} from '../../utils/analytics'
import { getStall } from '../../services/stallService'
import { subscribeToVendorOrders, updateOrderStatus } from '../../services/orderservice'
import { db } from '../../services/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

//  Constants 
const COLORS = ['#f0b429', '#f7c948', '#fde68a', '#fb923c', '#a78bfa']

const STATUS_CFG = {
  paid:     { label: 'Payment Confirmed', color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  accepted: { label: 'Confirmed',         color: '#f0b429', bg: 'rgba(240,180,41,0.12)'  },
  ready:    { label: 'Ready',             color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
}

//  Toast hook
function useToastLocal() {
  const [toasts, setToasts] = useState([])
  const add = (msg, type = 'info') => {
    // Combine the timestamp with a random number to guarantee uniqueness
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

function Sidebar({ tab, setTab, user, pendingCount, onSignOut }) {
  const initials = user
    ? `${(user.firstName || user.name || 'V')[0]}${(user.lastName || '')[0] || ''}`.toUpperCase()
    : 'V'
  const displayName = user
    ? `${user.firstName || user.name || 'Vendor'} ${user.lastName || ''}`.trim()
    : 'Vendor'

  return (
    <div style={{ width: 200, background: '#0f1729', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
          Strath<em style={{ color: '#f0b429', fontStyle: 'normal' }}>Eats</em>
        </div>
        <div style={{ fontSize: 9, color: '#475569', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Vendor Portal
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '10px 8px', flex: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 10px 6px' }}>
          Manage
        </div>
        {NAV.map(item => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              width: '100%', padding: '9px 10px', borderRadius: 10,
              border: 'none', cursor: 'pointer', marginBottom: 2,
              background: tab === item.key ? 'rgba(240,180,41,0.1)' : 'transparent',
              color: tab === item.key ? '#f0b429' : '#94a3b8',
              fontFamily: 'Sora, system-ui, sans-serif',
              fontSize: 12, fontWeight: tab === item.key ? 700 : 500,
              transition: 'all 0.13s', textAlign: 'left',
            }}
            onMouseEnter={e => { if (tab !== item.key) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { if (tab !== item.key) e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.key === 'orders' && pendingCount > 0 && (
              <span style={{ background: '#dc2626', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99 }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User + sign out */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', marginBottom: 6 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#f0b429', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0a0f1e', flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{displayName}</div>
            <div style={{ fontSize: 9, color: '#475569' }}>Stall vendor</div>
          </div>
        </div>
        <button
          onClick={onSignOut}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: '#64748b', fontFamily: 'Sora, system-ui, sans-serif', fontSize: 11, fontWeight: 500, transition: 'all 0.13s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.color = '#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}
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
      style={{
        width: 40, height: 22, borderRadius: 99, cursor: 'pointer',
        background: on ? '#f0b429' : 'rgba(255,255,255,0.1)',
        position: 'relative', transition: 'all 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff', transition: 'all 0.2s',
      }} />
    </div>
  )
}

//  Main 
export default function VendorDashboard() {
  const navigate = useNavigate()
  const { isLoggedIn, logout, user } = useAuth()
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
      // Ignore storage quota / privacy mode failures and rely on Firestore.
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

    getStall(resolvedStallId)
      .then((stallDoc) => {
        if (!active) return
        if (stallDoc) {
          const mergedDraft = cachedDraft
            ? {
                ...stallDoc,
                ...cachedDraft,
                menu: Array.isArray(cachedDraft.menu) ? cachedDraft.menu : (stallDoc.menu || []),
              }
            : stallDoc

          hydrateStallState(mergedDraft)

          if (!cachedDraft) {
            writeVendorDraft(resolvedStallId, stallDoc)
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingStall(false)
      })

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

  // â”€â”€ Computed (hooks must run before any conditional returns) â”€â”€
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
  const handleReject   = async id => { setOrders(p => p.map(o => o.id===id ? {...o, st:'rejected'} : o)); await updateOrderStatus(id, 'rejected'); addToast('Order rejected','error') }
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

  //  Styles 
  const cardStyle = {
    background: '#141d35',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
  }
  const inputStyle = {
    width: '100%', padding: '10px 13px',
    background: '#0f1729', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, fontSize: 12, color: '#e2e8f0',
    fontFamily: 'Sora, system-ui, sans-serif', outline: 'none',
  }
  const labelStyle = {
    display: 'block', fontSize: 10, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    color: '#64748b', marginBottom: 6,
  }

  //  Render tabs 
  const renderOrders = () => (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Orders Queue</h1>
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>Stall status:</span>
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
          <span style={{ fontSize: 11, fontWeight: 700, color: stallOnline ? '#4ade80' : '#f87171' }}>
            {stallOnline ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{ ...cardStyle, textAlign:'center', padding: '48px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}></div>
          <div style={{ color: '#64748b', fontSize: 13 }}>All caught up - no pending orders</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
          {orders.map(order => {
            const st = STATUS_CFG[order.st] || STATUS_CFG.paid
            return (
              <div key={order.id} style={{ ...cardStyle, borderLeft: `3px solid ${st.color}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{order.user}</div>
                    <div style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace', marginTop: 2 }}>{order.id}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#f0b429' }}>KES {order.tot}</div>
                    <span style={{ background: st.bg, color: st.color, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
                      {st.label}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                  {order.items.map((item,i) => (
                    <div key={i} style={{ fontSize: 12, color: '#94a3b8', paddingBottom: i < order.items.length - 1 ? 4 : 0 }}>
                  • {item?.qty || 1}x {item?.nm || (typeof item === 'string' ? item : 'Unknown Item')} 
                  {item?.pr ? <span style={{ color: '#64748b', fontSize: 11 }}> — KES {item.pr * (item.qty || 1)}</span> : null}
                </div>
                  ))}
                </div>

                <div style={{ display:'flex', gap: 16, fontSize: 11, color: '#64748b', marginBottom: 14 }}>
                  <span>{order.mode === 'Dine-in' ? '' : ''} {order.mode}</span>
                  <span>Pickup {order.pu}</span>
                </div>

                <div style={{ display:'flex', gap: 8 }}>
                  {order.st === 'paid' && <>
                    <button onClick={() => handleConfirm(order.id)} style={{ padding:'7px 16px', borderRadius: 8, border:'none', cursor:'pointer', background:'rgba(74,222,128,0.15)', color:'#4ade80', fontFamily:'Sora,system-ui,sans-serif', fontSize:11, fontWeight:700, transition:'all 0.13s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(74,222,128,0.25)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(74,222,128,0.15)'}
                    > Confirm</button>
                    <button onClick={() => handleReject(order.id)} style={{ padding:'7px 16px', borderRadius: 8, border:'none', cursor:'pointer', background:'rgba(248,113,113,0.15)', color:'#f87171', fontFamily:'Sora,system-ui,sans-serif', fontSize:11, fontWeight:700, transition:'all 0.13s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(248,113,113,0.25)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(248,113,113,0.15)'}
                    > Reject</button>
                  </>}
                  {order.st === 'accepted' && order.rm && (
                    <button onClick={() => handleReady(order.id)} style={{ padding:'7px 16px', borderRadius: 8, border:'none', cursor:'pointer', background:'rgba(240,180,41,0.15)', color:'#f0b429', fontFamily:'Sora,system-ui,sans-serif', fontSize:11, fontWeight:700, transition:'all 0.13s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(240,180,41,0.25)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(240,180,41,0.15)'}
                    > Mark Ready</button>
                  )}
                  {order.st === 'ready' && (
                    <button onClick={() => handleCollected(order.id)} style={{ padding:'7px 16px', borderRadius: 8, border:'none', cursor:'pointer', background:'rgba(148,163,184,0.1)', color:'#94a3b8', fontFamily:'Sora,system-ui,sans-serif', fontSize:11, fontWeight:700 }}>
                       Mark Collected
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderMenu = () => (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 20, letterSpacing:'-0.02em' }}>My Menu</h1>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap: 20, alignItems:'start' }}>
        {/* Items list */}
        <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
          {menuItems.map(item => (
            <div key={item.id} style={{ ...cardStyle, display:'flex', alignItems:'center', gap: 14, borderLeft: `3px solid ${item.av ? '#4ade80' : '#f87171'}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>{item.nm}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item.cat}</div>
                {item.portions ? (
                  <div style={{ fontSize: 11, color: '#f0b429', marginTop: 4 }}>
                    Half KES {item.portions.half} - Full KES {item.portions.full}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f0b429', marginTop: 4 }}>KES {item.pr}</div>
                )}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 7 }}>
                  <span style={{ fontSize: 10, color: item.av ? '#4ade80' : '#f87171', fontWeight: 600 }}>
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
                  style={{ width:28, height:28, borderRadius:'50%', border:'none', cursor:'pointer', background:'rgba(248,113,113,0.12)', color:'#f87171', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.13s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(248,113,113,0.25)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(248,113,113,0.12)'}
                ></button>
              </div>
            </div>
          ))}
        </div>

        {/* Add item form */}
        <div style={{ ...cardStyle, position:'sticky', top:24 }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 16 }}>Add New Item</div>
          <form onSubmit={handleAddItem} style={{ display:'flex', flexDirection:'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>Dish name</label>
              <input style={inputStyle} placeholder="e.g. Pilau" value={newItem.nm} onChange={e=>setNewItem({...newItem,nm:e.target.value})} />
            </div>

            {/* Portion toggle */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderTop:'1px solid rgba(255,255,255,0.06)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:'#e2e8f0' }}>Has portions?</div>
                <div style={{ fontSize:10, color:'#64748b' }}>Half & full sizing</div>
              </div>
              <Toggle on={newItem.hasPortions} onToggle={()=>setNewItem({...newItem, hasPortions:!newItem.hasPortions})} />
            </div>

            {!newItem.hasPortions ? (
              <div>
                <label style={labelStyle}>Price (KES)</label>
                <input style={inputStyle} type="number" placeholder="e.g. 120" value={newItem.pr} onChange={e=>setNewItem({...newItem,pr:e.target.value})} />
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
                <div>
                  <label style={labelStyle}>Half (KES)</label>
                  <input style={inputStyle} type="number" placeholder="60" value={newItem.halfPr} onChange={e=>setNewItem({...newItem,halfPr:e.target.value})} />
                </div>
                <div>
                  <label style={labelStyle}>Full (KES)</label>
                  <input style={inputStyle} type="number" placeholder="120" value={newItem.fullPr} onChange={e=>setNewItem({...newItem,fullPr:e.target.value})} />
                </div>
              </div>
            )}

            <div>
              <label style={labelStyle}>Category</label>
              <select style={{ ...inputStyle, cursor:'pointer' }} value={newItem.cat} onChange={e=>setNewItem({...newItem,cat:e.target.value})}>
                <option value="" disabled>Select category</option>
                {categoryOptions.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <button type="submit" style={{ width:'100%', padding:'11px', borderRadius:10, background:'#f0b429', color:'#0a0f1e', border:'none', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'Sora,system-ui,sans-serif', transition:'all 0.13s' }}
              onMouseEnter={e=>e.currentTarget.style.background='#f7c948'}
              onMouseLeave={e=>e.currentTarget.style.background='#f0b429'}
            >+ Add to menu</button>
          </form>
        </div>
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 20, letterSpacing:'-0.02em' }}>Analytics</h1>
      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
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
          <div key={i} style={{ ...cardStyle, display:'flex', alignItems:'center', gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:700, marginBottom:4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight:700, color: k.color }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ fontWeight:700, color:'#fff', fontSize:13, marginBottom:14 }}>Weekly Revenue (KES)</div>
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

        <div style={cardStyle}>
          <div style={{ fontWeight:700, color:'#fff', fontSize:13, marginBottom:14 }}>Orders by Hour</div>
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

        <div style={cardStyle}>
          <div style={{ fontWeight:700, color:'#fff', fontSize:13, marginBottom:14 }}>Top Items</div>
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

        <div style={cardStyle}>
          <div style={{ fontWeight:700, color:'#fff', fontSize:13, marginBottom:14 }}>Top Items Ranked</div>
          {topItems.map((item,i)=>(
            <div key={i} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
                <span style={{ color:'#e2e8f0', fontWeight:600 }}>{item.name}</span>
                <span style={{ color:'#64748b' }}>{item.sales} orders</span>
              </div>
              <div style={{ height:6, borderRadius:99, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:99, background:'#f0b429', width:`${(item.sales/(topItems[0]?.sales||1))*100}%`, transition:'width 0.4s' }} />
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
      {savedAt && <div style={{ fontSize:11, color:'#4ade80', marginBottom: 16 }}> Last saved today at {savedAt}</div>}
      {!savedAt && <div style={{ fontSize:11, color:'#475569', marginBottom: 16 }}>Configure how your stall appears to students</div>}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap: 20, alignItems:'start' }}>
        {/* Form */}
        <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>

          {/* Online toggle */}
          <div style={{ ...cardStyle, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontWeight:700, color:'#fff', fontSize:13 }}>Stall Status</div>
              <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>Students can only order when your stall is open</div>
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
          <div style={cardStyle}>
            <div style={{ fontWeight:700, color:'#fff', fontSize:13, marginBottom:16 }}>Basic Info</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={labelStyle}>Stall Name</label>
                <input style={inputStyle} value={stallSettings.name} onChange={e=>setStallSettings({...stallSettings,name:e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Category / Cuisine type</label>
                <input style={inputStyle} placeholder="e.g. Local meals & stews" value={stallSettings.cat} onChange={e=>setStallSettings({...stallSettings,cat:e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Short description (shown to students)</label>
                <textarea
                  style={{ ...inputStyle, resize:'none', height:72 }}
                  placeholder="e.g. Home-style Kenyan meals made fresh daily."
                  value={stallSettings.desc}
                  onChange={e=>setStallSettings({...stallSettings,desc:e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Emoji picker */}

          {/* Hours */}
          <div style={cardStyle}>
            <div style={{ fontWeight:700, color:'#fff', fontSize:13, marginBottom:16 }}>Opening Hours</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={labelStyle}>Opens at</label>
                <input type="time" style={inputStyle} value={stallSettings.openTime} onChange={e=>setStallSettings({...stallSettings,openTime:e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Closes at</label>
                <input type="time" style={inputStyle} value={stallSettings.closeTime} onChange={e=>setStallSettings({...stallSettings,closeTime:e.target.value})} />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div style={cardStyle}>
            <div style={{ fontWeight:700, color:'#fff', fontSize:13, marginBottom:4 }}>Payment</div>
            <div style={{ fontSize:11, color:'#64748b', marginBottom:12 }}>Student payments are sent to this M-Pesa number</div>
            <div>
              <label style={labelStyle}>M-Pesa Till / Paybill</label>
              <input style={inputStyle} placeholder="e.g. 522522" value={stallSettings.mpesa} onChange={e=>setStallSettings({...stallSettings,mpesa:e.target.value})} />
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSaveSettings}
            style={{ padding:'13px', borderRadius:12, background:'#f0b429', color:'#0a0f1e', border:'none', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'Sora,system-ui,sans-serif', transition:'all 0.15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.background='#f7c948'; e.currentTarget.style.boxShadow='0 6px 20px rgba(240,180,41,0.3)' }}
            onMouseLeave={e=>{ e.currentTarget.style.background='#f0b429'; e.currentTarget.style.boxShadow='none' }}
          >
            Save changes
          </button>

          {/* Danger zone */}
          <div style={{ ...cardStyle, border:'1px solid rgba(248,113,113,0.2)', marginTop:8 }}>
            <div style={{ fontWeight:700, color:'#f87171', fontSize:13, marginBottom:4 }}>Danger Zone</div>
            <div style={{ fontSize:11, color:'#64748b', marginBottom:14 }}>These actions are irreversible. Proceed with caution.</div>
            <button
              onClick={()=>addToast('Contact admin to permanently deactivate your stall','info')}
              style={{ padding:'9px 18px', borderRadius:9, border:'1px solid rgba(248,113,113,0.3)', background:'rgba(248,113,113,0.07)', color:'#f87171', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Sora,system-ui,sans-serif', transition:'all 0.13s' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(248,113,113,0.15)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(248,113,113,0.07)'}
            >
              Deactivate stall
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div style={{ position:'sticky', top:24 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
            Live preview
          </div>
          <div style={{ ...cardStyle, cursor:'default' }}>
            <div style={{ fontWeight:700, color:'#fff', fontSize:15, marginBottom:4 }}>{stallSettings.name || 'Stall name'}</div>
            <div style={{ fontSize:11, color:'#64748b', marginBottom:8 }}>{stallSettings.cat || 'Category'}</div>
            <div style={{ fontSize:11, color:'#94a3b8', marginBottom:12, lineHeight:1.55 }}>{stallSettings.desc || 'No description yet.'}</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#94a3b8' }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background: stallOnline ? '#4ade80' : '#f87171', display:'inline-block', boxShadow: stallOnline ? '0 0 6px #4ade80' : 'none' }}></span>
                {stallSettings.openTime}-{stallSettings.closeTime}
              </div>
              <span style={{ fontSize:10, color:'#64748b' }}>{menuItems.filter(i=>i.av).length} items</span>
            </div>
          </div>
          <div style={{ fontSize:10, color:'#475569', marginTop:10, textAlign:'center', lineHeight:1.6 }}>
            This is how your stall<br/>appears to students
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#0a0f1e', display:'flex', fontFamily:'Sora, system-ui, sans-serif' }}>
      <Sidebar tab={tab} setTab={setTab} user={user} pendingCount={pendingCount} onSignOut={()=>{ logout(); navigate('/') }} />

      <div style={{ flex:1, padding:'28px', overflowY:'auto', minHeight:'100vh' }}>
        {tab==='orders'    && renderOrders()}
        {tab==='menu'      && renderMenu()}
        {tab==='analytics' && renderAnalytics()}
        {tab==='settings'  && renderSettings()}
      </div>

      {/* Toasts */}
      <div style={{ position:'fixed', bottom:24, right:24, display:'flex', flexDirection:'column', gap:8, zIndex:9999 }}>
        {toasts.map(t=>(
          <div key={t.id} style={{ background:'#141d35', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'11px 16px', fontSize:12, color:'#e2e8f0', boxShadow:'0 8px 32px rgba(0,0,0,0.5)', maxWidth:320, borderLeft:`3px solid ${t.type==='success'?'#4ade80':t.type==='error'?'#f87171':'#f0b429'}`, animation:'slideIn 0.2s ease' }}>
            {t.msg}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  )
}

