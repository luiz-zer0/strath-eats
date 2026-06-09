import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useOrders } from '../../context/OrdersContext'
// live stalls come from Firestore subscription
import { subscribeToStalls } from '../../services/stallService'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { downloadReceipt } from '../../utils/receipt'
import { triggerMpesaStkPush } from '../../services/orderservice'
import { db } from '../../services/firebase'
import { collection,addDoc} from 'firebase/firestore'

//  Status config 
const STATUS = {
  pending:   { label: 'Pending Payment', color: '#f87171', bg: 'rgba(248,113,113,0.12)', step: -1 },
  paid:      { label: 'Paid',      color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  step: 0 },
  accepted:  { label: 'Confirmed', color: '#f0b429', bg: 'rgba(240,180,41,0.12)',  step: 1 },
  preparing: { label: 'Preparing', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  step: 2 },
  ready:     { label: 'Ready!',    color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  step: 3 },
  collected: { label: 'Collected', color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', step: 4 },
  cancelled: { label: 'Cancelled', color: '#f87171', bg: 'rgba(248,113,113,0.10)', step: -1 },
}
const STEPS = ['Paid', 'Confirmed', 'Preparing', 'Ready', 'Collected']

//  Tiny toast stack 
import { useState as useS } from 'react'
function useToastLocal() {
  const [toasts, setToasts] = useS([])
  const add = (msg, type = 'info') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500)
  }
  return { toasts, add }
}

//  Portion selector modal 
function PortionModal({ item, onSelect, onClose }) {
  const [selected, setSelected] = useState('full')
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-xs"
        style={{ background: '#141d35', border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-white font-bold text-base mb-1">{item.nm}</div>
        <div className="text-xs mb-5" style={{ color: '#94a3b8' }}>Choose your portion size</div>

        <div className="flex gap-3 mb-5">
          {['half', 'full'].map(p => (
            <button
              key={p}
              onClick={() => setSelected(p)}
              className="flex-1 rounded-xl py-4 transition-all duration-150 text-center"
              style={{
                border: selected === p ? '1.5px solid #f0b429' : '1.5px solid rgba(255,255,255,0.1)',
                background: selected === p ? 'rgba(240,180,41,0.08)' : 'rgba(255,255,255,0.03)',
                cursor: 'pointer',
              }}
            >
              <div className="text-lg mb-1">{p === 'half' ? '' : ''}</div>
              <div className="font-bold text-white text-sm capitalize">{p}</div>
              <div className="font-bold text-sm mt-1" style={{ color: '#f0b429' }}>
                KES {item.portions[p]}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => onSelect(item, selected)}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-150"
          style={{ background: '#f0b429', color: '#0a0f1e', border: 'none', cursor: 'pointer' }}
        >
          Add to cart 
        </button>
        <button
          onClick={onClose}
          className="w-full py-2 mt-2 text-xs font-medium transition-all duration-150"
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

//  Order status tracker 
function OrderTracker({ step }) {
  return (
    <div className="flex items-center gap-0 my-4">
      {STEPS.map((s, i) => {
        const done = i < step
        const active = i === step
        return (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center" style={{ minWidth: 56 }}>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all duration-300"
                style={{
                  background: done || active ? '#f0b429' : 'rgba(255,255,255,0.08)',
                  color: done || active ? '#0a0f1e' : '#475569',
                  boxShadow: active ? '0 0 0 4px rgba(240,180,41,0.2)' : 'none',
                }}
              >
                {done ? '' : i + 1}
              </div>
              <div
                className="text-center leading-tight"
                style={{
                  fontSize: 9,
                  color: active ? '#f0b429' : done ? '#94a3b8' : '#475569',
                  fontWeight: active ? 700 : 500,
                }}
              >
                {s}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-1 mb-4 transition-all duration-500"
                style={{ background: done ? '#f0b429' : 'rgba(255,255,255,0.07)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// User profile card 
function UserProfile({ user, role }) {
  const initials = user
    ? `${(user.firstName || user.name || 'U')[0]}${(user.lastName || '')[0] || ''}`.toUpperCase()
    : 'U'
  const displayName = user
    ? `${user.firstName || user.name || ''} ${user.lastName || ''}`.trim()
    : 'Student'
  const roleLabel = role === 'staff' ? 'Staff / Lecturer' : role === 'other' ? 'Guest' : 'Student'
  const idLabel = user?.studentId || user?.staffId || user?.id || '-'

  return (
    <div
      className="rounded-xl p-4 mt-2"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ background: '#f0b429', color: '#0a0f1e' }}
        >
          {initials}
        </div>
        <div>
          <div className="font-bold text-white text-sm leading-tight">{displayName}</div>
          <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>{roleLabel}</div>
        </div>
      </div>
      <div className="space-y-1.5">
        {[
          { label: 'ID', value: idLabel },
          { label: 'Email', value: user?.email || '-' },
          { label: 'M-Pesa', value: user?.mpesa || '07XX XXX XXX' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center">
            <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{label}</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

//  Sidebar 
function Sidebar({ tab, setTab, orders, user, role, onSignOut, sidebarOpen, onToggleSidebar }) {
  const pendingCount = orders.filter(o => o.st === 'paid' || o.st === 'accepted' || o.st === 'ready').length
  const navItems = [
    { id: 'order',    label: 'Order Food' },
    { id: 'myorders', label: 'My Orders', badge: pendingCount > 0 ? pendingCount : null },
    { id: 'profile',  label: 'My Profile' },
  ]

  return (
    <div className={`dash-sidebar${sidebarOpen ? ' open' : ''}`} style={{ width: 200 }}>
      {/* Logo */}
      <div className="dash-logo-area">
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
          Strath<em style={{ color: '#f0b429', fontStyle: 'normal' }}>Eats</em>
        </div>
        <div style={{ fontSize: 9, color: '#475569', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {role === 'staff' ? 'Staff Portal' : role === 'other' ? 'Guest Portal' : 'Student Portal'}
        </div>
      </div>

      {/* Nav */}
      <nav className="dash-nav">
        <div className="dash-nav-header">Menu</div>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`dash-nav-item ${tab === item.id ? 'active' : ''}`}
            onMouseEnter={e => { if (tab !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { if (tab !== item.id) e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span className="dash-nav-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* User info + sign out */}
      <div className="dash-user-area">
        <button
          onClick={() => setTab('profile')}
          className="dash-user-btn"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{
            width: 30, height: 30, borderRadius: '50%', background: '#f0b429',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#0a0f1e', flexShrink: 0,
          }}>
            {user ? `${(user.firstName || user.name || 'U')[0]}${(user.lastName || '')[0] || ''}`.toUpperCase() : 'U'}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>
              {user ? `${user.firstName || user.name || ''} ${user.lastName || ''}`.trim() : 'Student'}
            </div>
            <div style={{ fontSize: 9, color: '#475569' }}>
              {user?.studentId || user?.staffId || 'View profile'}
            </div>
          </div>
        </button>
        <button
          onClick={onSignOut}
          className="dash-signout-btn"
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.color = '#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}
        >
          <span></span> Sign out
        </button>
      </div>
    </div>
  )
}

//  Menu item card 
function MenuItem({ item, inCart, onAdd, onPortionAdd }) {
  const hasPortions = !!item.portions

  const handleClick = () => {
    if (!item.av) return
    if (hasPortions) onPortionAdd(item)
    else onAdd(item, null)
  }

  const portionInCart = inCart?.portion
  const accentColors = {
    'Main dish': '#3b82f6', 'Side dish': '#f0b429', 'Protein': '#f87171',
    'Vegetable': '#4ade80', 'Beverage': '#06b6d4', 'Snack': '#a78bfa',
  }
  const accent = accentColors[item.cat] || '#94a3b8'

  return (
    <div
      onClick={handleClick}
      style={{
        background: inCart ? 'rgba(240,180,41,0.06)' : '#141d35',
        border: inCart ? '1.5px solid #f0b429' : '1px solid rgba(255,255,255,0.1)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 12,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: item.av ? 'pointer' : 'default',
        opacity: item.av ? 1 : 0.35,
        transition: 'all 0.15s',
        marginBottom: 8,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>{item.nm}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
            background: `${accent}20`, color: accent,
          }}>
            {item.cat}
          </span>
          {hasPortions && (
            <span style={{ fontSize: 9, color: '#64748b' }}>
              Half KES {item.portions.half} - Full KES {item.portions.full}
            </span>
          )}
          {!hasPortions && (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f0b429' }}>
              KES {item.pr}
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: inCart ? '#f0b429' : 'rgba(240,180,41,0.12)',
          color: inCart ? '#0a0f1e' : '#f0b429',
          fontSize: 16, fontWeight: 700, transition: 'all 0.15s',
          border: 'none', cursor: 'pointer',
        }}
      >
        {inCart ? '✓' : '+'}
      </div>
    </div>
  )
}

//  Cart panel 
function CartPanel({ cartItems, orderMode, pickupTime, setOrderMode, setPickupTime, removeFromCart, decreaseQty, addToCart, getTotal, onCheckout }) {
  const isEmpty = cartItems.length === 0
  return (
    <div
      className="cart-panel"
      style={{
        width: 280,
        background: '#0f1729',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 20,
        height: 'fit-content',
        position: 'sticky',
        top: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 12 }}>
         Your Cart
        {!isEmpty && (
          <span style={{
            marginLeft: 8, background: '#f0b429', color: '#0a0f1e',
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
          }}>
            {cartItems.reduce((s, i) => s + i.qty, 0)}
          </span>
        )}
      </div>

      {isEmpty ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#475569', fontSize: 12 }}>
          Add items to get started
        </div>
      ) : (
        <>
          {/* Items */}
          <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {cartItems.map(item => (
              <div
                key={item.cartKey}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 10px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.nm}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>KES {item.pr} each</div>
                </div>
                {/* Qty controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => decreaseQty(item.cartKey)}
                    style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >-</button>
                  <span style={{ fontSize: 11, color: '#fff', fontWeight: 700, minWidth: 14, textAlign: 'center' }}>{item.qty}</span>
                  <button
                    onClick={() => addToCart(item, item.portion)}
                    style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid rgba(240,180,41,0.3)', background: 'rgba(240,180,41,0.1)', color: '#f0b429', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >+</button>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f0b429', minWidth: 44, textAlign: 'right' }}>
                  KES {item.pr * item.qty}
                </div>
              </div>
            ))}
          </div>

          {/* Order type */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Order type</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {['Dine-in', 'Takeaway'].map(m => (
                <button
                  key={m}
                  onClick={() => setOrderMode(m)}
                  style={{
                    padding: '8px 4px', borderRadius: 9, fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.13s',
                    background: orderMode === m ? '#f0b429' : 'rgba(255,255,255,0.04)',
                    color: orderMode === m ? '#0a0f1e' : '#94a3b8',
                    border: orderMode === m ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    fontFamily: 'Sora, system-ui, sans-serif',
                  }}
                >
                  {m === 'Dine-in' ? '' : ''} {m}
                </button>
              ))}
            </div>
          </div>

          {/* Pickup time */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Pickup time</div>
            <input
              type="time"
              value={pickupTime}
              onChange={e => setPickupTime(e.target.value)}
              min="08:00" max="17:00"
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 10,
                background: '#141d35', border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0', fontSize: 12, fontFamily: 'Sora, system-ui, sans-serif',
                outline: 'none',
              }}
            />
            <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>
              Vendor notifies you when ready
            </div>
          </div>

          {/* Total + pay */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#f0b429' }}>KES {getTotal()}</span>
            </div>
            <button
              onClick={onCheckout}
              style={{
                width: '100%', padding: '13px', borderRadius: 12,
                background: '#f0b429', color: '#0a0f1e',
                border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
                fontFamily: 'Sora, system-ui, sans-serif',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f7c948'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(240,180,41,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f0b429'; e.currentTarget.style.boxShadow = 'none' }}
            >
               Pay via M-Pesa
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// Main component 
export default function StudentDashboard() {
  const navigate = useNavigate()
  const { isLoggedIn, logout, user, role } = useAuth()
  const {
    cartItems, selectedStall, orderMode, pickupTime,
    addToCart, removeFromCart, decreaseQty, clearCart,
    setSelectedStall, setOrderMode, setPickupTime, getTotal,
  } = useCart()
  const { orders, placeOrder } = useOrders()
  const { toasts, add: addToast } = useToastLocal()
  const [stalls, setStalls] = useState([])

  useEffect(() => {
    const unsub = subscribeToStalls((docs) => {
      setStalls(docs.filter(s => s.online !== false))
    })
    return () => unsub?.()
  }, [])

  const [tab, setTab] = useState('order')
  const [selectedStallObj, setSelectedStallObj] = useState(null)
  const [portionItem, setPortionItem] = useState(null) // item awaiting portion selection
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!isLoggedIn) {
    navigate('/order')
    return null
  }

  // â”€â”€ Handlers â”€â”€
  const handleSelectStall = (stall) => {
    clearCart()
    setSelectedStall(stall.id)
    setSelectedStallObj(stall)
  }

  const handleAddItem = (item, portion) => {
    addToCart(item, portion)
    const label = portion ? `${item.nm} (${portion === 'half' ? 'Half' : 'Full'})` : item.nm
    addToast(`${label} added to cart`, 'success')
    setPortionItem(null)
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) { addToast('Your cart is empty', 'error'); return }
    if (!pickupTime) { addToast('Please select a pickup time', 'error'); return }

    try {
      addToast('Creating order records...', 'info');

      // 1. Call the official context function to write the document into Firestore
      const newOrder = await placeOrder({
        stallId: selectedStallObj.id,
        stallName: selectedStallObj.name,
        items: cartItems,
        tot: Math.round(getTotal()),
        mode: orderMode,
        pu: pickupTime,
        st: "pending",
        createdAt: new Date().toISOString()
      });

      
      console.log("Firestore order created successfully with tracking ID:", newOrder.id);
      addToast('STK Push sent to ' + (user?.mpesa || 'your phone') + '...', 'info');

      if (!user?.mpesa) {
        addToast('Please set your M-Pesa number in your profile', 'error');
        return;
      }
      await triggerMpesaStkPush({
        phone: user.mpesa,
        amount: getTotal(),
        order_id: newOrder.id,
      });

      // 3. Clear cart and jump to orders tab
      clearCart();
      setTab('myorders');

    } catch (error) {
      console.error('Checkout pipeline encountered a failure:', error);
      addToast('Could not complete payment configuration.', 'error');
    }
  }

  //  Render tabs 
  const renderOrder = () => (
    <div className="student-order-layout" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* Left: stalls / menu */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 20, letterSpacing: '-0.02em' }}>
          Order Food
        </h1>
        {!selectedStallObj ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              {stalls.length} stalls open
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {stalls.map(stall => (
                <div
                  key={stall.id}
                  onClick={() => handleSelectStall(stall)}
                  style={{
                    background: '#141d35', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16, padding: 20, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(240,180,41,0.4)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 4 }}>{stall.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>{stall.cat}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94a3b8' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80' }}></span>
                      {stall.hrs}
                    </div>
                    <span style={{ fontSize: 10, color: '#64748b' }}>{stall.menu.filter(m => m.av).length} items</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => { setSelectedStallObj(null); clearCart() }}
              style={{ background: 'none', border: 'none', color: '#f0b429', cursor: 'pointer', fontSize: 12, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Sora, system-ui, sans-serif' }}
            >
               Back to stalls
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{selectedStallObj.name}</h2>
                <div style={{ fontSize: 11, color: '#64748b' }}>{selectedStallObj.cat} - {selectedStallObj.hrs}</div>
              </div>
            </div>
            <div>
              {selectedStallObj.menu.map(item => {
                const inCart = cartItems.find(c => c.id === item.id)
                return (
                  <MenuItem
                    key={item.id}
                    item={item}
                    inCart={inCart}
                    onAdd={handleAddItem}
                    onPortionAdd={setPortionItem}
                  />
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Right: cart */}
      {selectedStallObj && (
        <CartPanel
          cartItems={cartItems}
          orderMode={orderMode}
          pickupTime={pickupTime}
          setOrderMode={setOrderMode}
          setPickupTime={setPickupTime}
          removeFromCart={removeFromCart}
          decreaseQty={decreaseQty}
          addToCart={addToCart}
          getTotal={getTotal}
          onCheckout={handleCheckout}
        />
      )}
    </div>
  )

  const renderMyOrders = () => (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 20, letterSpacing: '-0.02em' }}>
        My Orders
      </h1>
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}></div>
          <div style={{ fontSize: 14 }}>No orders yet</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Head to Order Food to place your first order</div>
          <button
            onClick={() => setTab('order')}
            style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, background: '#f0b429', color: '#0a0f1e', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Browse stalls 
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {orders.map(order => {
            const status = STATUS[order.st] || STATUS.pending
            const stall = stalls.find(s => s.id === order.stallId)
            return (
              <div
                key={order.id}
                style={{ background: '#141d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20, borderLeft: `3px solid ${status.color}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{order.stallName}</div>
                    <div style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace', marginTop: 2 }}>{order.id}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{formatDate(order.createdAt)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#f0b429' }}>KES {order.tot}</div>
                    <span style={{ display: 'inline-block', background: status.bg, color: status.color, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, marginTop: 4 }}>
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Progress tracker */}
                <OrderTracker step={status.step} />

                {/* Status message */}
                {order.st === 'paid' && (
                  <div style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#fb923c', marginBottom: 12 }}>
                    &#8987; Payment received - waiting for vendor to confirm
                  </div>
                )}
                {order.st === 'accepted' && (
                  <div style={{ background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#f0b429', marginBottom: 12 }}>
                     Order confirmed - collecting at {order.pu}
                  </div>
                )}
                {order.st === 'preparing' && (
                  <div style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#60a5fa', marginBottom: 12 }}>
                    ⌛ Your order is being prepared
                  </div>
                )}
                {order.st === 'ready' && (
                  <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#4ade80', marginBottom: 12 }}>
                     Your order is ready! Head to {order.stallName} to collect
                  </div>
                )}

                {/* Items */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Items</div>
                  {(order.items || []).map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', paddingBottom: 4 }}>
                      <span>&#8226; {item.nm || item} {item.qty > 1 ? `x${item.qty}` : ''}</span>
                      {item.pr && <span style={{ color: '#64748b' }}>KES {item.pr * (item.qty || 1)}</span>}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#475569', marginBottom: 12 }}>
                  <span>{order.mode === 'Dine-in' ? '' : ''} {order.mode}</span>
                  <span>- Pickup {order.pu}</span>
                </div>

                <button
                  onClick={() => downloadReceipt(order, stall)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 9, fontSize: 11, fontWeight: 600,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#94a3b8', cursor: 'pointer', fontFamily: 'Sora, system-ui, sans-serif',
                    transition: 'all 0.13s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#f0b429'; e.currentTarget.style.color = '#f0b429' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#94a3b8' }}
                >
                   Download receipt
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderProfile = () => (
    <div style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 20, letterSpacing: '-0.02em' }}>
        My Profile
      </h1>
      <div style={{ background: '#141d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f0b429', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#0a0f1e', flexShrink: 0 }}>
            {user ? `${(user.firstName || user.name || 'U')[0]}${(user.lastName || '')[0] || ''}`.toUpperCase() : 'U'}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
              {user ? `${user.firstName || user.name || ''} ${user.lastName || ''}`.trim() : 'Student'}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              {role === 'staff' ? 'Staff / Lecturer' : role === 'other' ? 'Guest' : 'Student'} - Strathmore University
            </div>
          </div>
        </div>
        {[
          { label: 'Student / Staff ID', value: user?.studentId || user?.staffId || '-' },
          { label: 'Email address', value: user?.email || '-' },
          { label: 'M-Pesa number', value: user?.mpesa || '-' },
          { label: 'Account role', value: role === 'staff' ? 'Staff / Lecturer' : role === 'other' ? 'Guest' : 'Student' },
          { label: 'Total orders', value: orders.length },
          { label: 'Total spent', value: `KES ${orders.reduce((s, o) => s + (o.tot || 0), 0).toLocaleString()}` },
        ].map(({ label, value, icon }) => (
          <div
            key={label}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="dash-root">
      <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>
      <Sidebar
        tab={tab}
        setTab={setTab}
        orders={orders}
        user={user}
        role={role}
        onSignOut={() => { logout(); navigate('/') }}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="dash-main" onClick={() => sidebarOpen && setSidebarOpen(false)}>
        {tab === 'order' && renderOrder()}
        {tab === 'myorders' && renderMyOrders()}
        {tab === 'profile' && renderProfile()}
      </div>

      {portionItem && (
        <PortionModal
          item={portionItem}
          onSelect={handleAddItem}
          onClose={() => setPortionItem(null)}
        />
      )}

      <div className="toast-container">
        {toasts.map(t => (
          <div
            key={t.id}
            className="toast-item"
            style={{ borderLeft: `3px solid ${t.type === 'success' ? '#4ade80' : t.type === 'error' ? '#f87171' : '#f0b429'}` }}
          >
            {t.msg}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
