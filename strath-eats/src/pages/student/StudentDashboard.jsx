import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useOrders } from '../../context/OrdersContext'
import { useTheme } from '../../context/ThemeContext'
import { subscribeToStalls } from '../../services/stallService'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { downloadReceipt } from '../../utils/receipt'
import { triggerMpesaStkPush, updateOrderStatus } from '../../services/orderservice'
import { db } from '../../services/firebase'
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore'
import '../../styles/student.css'

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

function useToastLocal() {
  const [toasts, setToasts] = useState([])
  const add = useCallback((msg, type = 'info') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500)
  }, [])
  return { toasts, add }
}

function PortionModal({ item, onSelect, onClose }) {
  const [selected, setSelected] = useState('full')
  return (
    <div className="portion-modal-overlay" onClick={onClose}>
      <div className="portion-modal-box" onClick={e => e.stopPropagation()}>
        <div className="portion-modal-title">{item.nm}</div>
        <div className="portion-modal-hint">Choose your portion size</div>

        <div className="portion-options">
          {['half', 'full'].map(p => (
            <button
              key={p}
              onClick={() => setSelected(p)}
              className={`portion-option${selected === p ? ' selected' : ''}`}
            >
              <div className="text-lg mb-1">{p === 'half' ? '' : ''}</div>
              <div className="portion-option-label">{p}</div>
              <div className="portion-option-price">KES {item.portions[p]}</div>
            </button>
          ))}
        </div>

        <button
          onClick={() => onSelect(item, selected)}
          className="portion-add-btn"
        >
          Add to cart 
        </button>
        <button
          onClick={onClose}
          className="portion-close-btn"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

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
    <div className="user-profile-card">
      <div className="user-profile-top">
        <div className="user-profile-avatar">
          {initials}
        </div>
        <div>
          <div className="user-profile-display-name">{displayName}</div>
          <div className="user-profile-role-label">{roleLabel}</div>
        </div>
      </div>
      <div className="space-y-1.5">
        {[
          { label: 'ID', value: idLabel },
          { label: 'Email', value: user?.email || '-' },
          { label: 'M-Pesa', value: user?.mpesa || '07XX XXX XXX' },
        ].map(({ label, value }) => (
          <div key={label} className="user-profile-detail">
            <span className="user-profile-detail-label">{label}</span>
            <span className="user-profile-detail-value">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Sidebar({ tab, setTab, orders, user, role, onSignOut, sidebarOpen, onToggleSidebar }) {
  const { toggleTheme, isDark } = useTheme()
  const pendingCount = orders.filter(o => o.st === 'paid' || o.st === 'accepted' || o.st === 'ready').length
  const navItems = [
    { id: 'order',    label: 'Order Food' },
    { id: 'myorders', label: 'My Orders', badge: pendingCount > 0 ? pendingCount : null },
    { id: 'profile',  label: 'My Profile' },
  ]

  return (
    <div className={`dash-sidebar${sidebarOpen ? ' open' : ''}`} style={{ width: 200 }}>
      <div className="dash-logo-area">
        <div className="student-sidebar-logo">
          Strath<em>Eats</em>
        </div>
        <div className="student-role-text">
          {role === 'staff' ? 'Staff Portal' : role === 'other' ? 'Guest Portal' : 'Student Portal'}
        </div>
      </div>

      <nav className="dash-nav">
        <div className="dash-nav-header">Menu</div>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`dash-nav-item ${tab === item.id ? 'active' : ''}`}
          >
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span className="dash-nav-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="dash-user-area">
        <button
          onClick={() => setTab('profile')}
          className="dash-user-btn"
        >
          <div className="student-user-avatar">
            {user ? `${(user.firstName || user.name || 'U')[0]}${(user.lastName || '')[0] || ''}`.toUpperCase() : 'U'}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div className="student-user-name">
              {user ? `${user.firstName || user.name || ''} ${user.lastName || ''}`.trim() : 'Student'}
            </div>
            <div className="student-user-id">
              {user?.studentId || user?.staffId || 'View profile'}
            </div>
          </div>
        </button>
        <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', width: '100%', textAlign: 'left', color: 'var(--text-dim)', fontFamily: "'Sora', system-ui, sans-serif", fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          {isDark ? '\u2600\uFE0F' : '\uD83C\uDF19'} {isDark ? 'Light mode' : 'Dark mode'}
        </button>
        <button
          onClick={onSignOut}
          className="dash-signout-btn"
        >
          <span></span> Sign out
        </button>
      </div>
    </div>
  )
}

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
      className={`menu-item-card${inCart ? ' in-cart' : ''}${!item.av ? ' unavail' : ''}`}
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div style={{ flex: 1 }}>
        <div className="menu-item-name">{item.nm}</div>
        <div className="menu-item-tags">
          <span className="menu-item-cat-tag" style={{ background: `${accent}20`, color: accent }}>
            {item.cat}
          </span>
          {hasPortions && (
            <span className="menu-item-portion-price">
              Half KES {item.portions.half} - Full KES {item.portions.full}
            </span>
          )}
          {!hasPortions && (
            <span className="menu-item-price">
              KES {item.pr}
            </span>
          )}
        </div>
      </div>
      <div className={`menu-item-add-btn${inCart ? ' in-cart' : ''}`}>
        {inCart ? '✓' : '+'}
      </div>
    </div>
  )
}

function CartPanel({ cartItems, orderMode, pickupTime, setOrderMode, setPickupTime, removeFromCart, decreaseQty, addToCart, getTotal, onCheckout }) {
  const isEmpty = cartItems.length === 0
  return (
    <div className="cart-panel cart-panel-inner">
      <div className="cart-header">
         Your Cart
        {!isEmpty && (
          <span className="cart-badge">
            {cartItems.reduce((s, i) => s + i.qty, 0)}
          </span>
        )}
      </div>

      {isEmpty ? (
        <div className="cart-empty">
          Add items to get started
        </div>
      ) : (
        <>
          <div className="cart-items-list">
            {cartItems.map(item => (
              <div key={item.cartKey} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">
                    {item.nm}
                  </div>
                  <div className="cart-item-unit">KES {item.pr} each</div>
                </div>
                <div className="cart-qty-controls">
                  <button
                    onClick={() => decreaseQty(item.cartKey)}
                    className="cart-qty-btn sub"
                  >-</button>
                  <span className="cart-qty-value">{item.qty}</span>
                  <button
                    onClick={() => addToCart(item, item.portion)}
                    className="cart-qty-btn add"
                  >+</button>
                </div>
                <div className="cart-item-total">
                  KES {item.pr * item.qty}
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="cart-order-type-label">Order type</div>
            <div className="cart-order-type-grid">
              {['Dine-in', 'Takeaway'].map(m => (
                <button
                  key={m}
                  onClick={() => setOrderMode(m)}
                  className={`cart-order-type-btn${orderMode === m ? ' active' : ''}`}
                >
                  {m === 'Dine-in' ? '' : ''} {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="cart-pickup-label">Pickup time</div>
            <input
              type="time"
              value={pickupTime}
              onChange={e => setPickupTime(e.target.value)}
              min="08:00" max="17:00"
              className="cart-pickup-input"
            />
            <div className="cart-pickup-hint">
              Vendor notifies you when ready
            </div>
          </div>

          <div className="cart-total-section">
            <div className="cart-total-row">
              <span className="cart-total-label">Total</span>
              <span className="cart-total-amount">KES {getTotal()}</span>
            </div>
            <button
              onClick={onCheckout}
              className="cart-checkout-btn"
            >
               Pay via M-Pesa
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { isLoggedIn, logout, user, role, sessionWarning, refreshUser } = useAuth()
  const {
    cartItems, selectedStall, orderMode, pickupTime,
    addToCart, removeFromCart, decreaseQty, clearCart,
    setSelectedStall, setOrderMode, setPickupTime, getTotal,
  } = useCart()
  const { orders, ordersError, placeOrder } = useOrders()
  const { toasts, add: addToast } = useToastLocal()
  const [stalls, setStalls] = useState([])

  useEffect(() => {
    const unsub = subscribeToStalls((docs) => {
      setStalls(docs.filter(s => s.online !== false))
    })
    return () => unsub?.()
  }, [])

  useEffect(() => {
    if (sessionWarning) {
      addToast('Your session will expire in 60s due to inactivity', 'warning')
    }
  }, [sessionWarning, addToast])

  const [tab, setTab] = useState('order')
  const [selectedStallObj, setSelectedStallObj] = useState(null)
  const [portionItem, setPortionItem] = useState(null) // item awaiting portion selection
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editingMpesa, setEditingMpesa] = useState(false)
  const [mpesaInput, setMpesaInput] = useState(user?.mpesa || '')

  const handleSaveMpesa = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), { mpesa: mpesaInput })
      await refreshUser()
      setEditingMpesa(false)
      addToast('M-Pesa number updated', 'success')
    } catch (err) {
      addToast(err?.message || 'Failed to update M-Pesa number', 'error')
    }
  }

  if (!isLoggedIn) {
    navigate('/order')
    return null
  }

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

      clearCart();
      setTab('myorders');

    } catch (error) {
      console.error('Checkout pipeline encountered a failure:', error);
      addToast('Could not complete payment configuration.', 'error');
    }
  }

  const renderOrder = () => (
    <div className="student-order-layout" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 className="page-h1" style={{ marginBottom: 20 }}>
          Order Food
        </h1>
        {!selectedStallObj ? (
          <>
            <div className="stall-count-header">
              {stalls.length} stalls open
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {stalls.map(stall => (
                <div
                  key={stall.id}
                  onClick={() => handleSelectStall(stall)}
                  className="stall-card"
                >
                  <div className="stall-card-name">{stall.name}</div>
                  <div className="stall-card-cat">{stall.cat}</div>
                  <div className="stall-card-footer">
                    <div className="stall-card-hours">
                      <span className="stall-card-dot"></span>
                      {stall.hrs}
                    </div>
                    <span className="stall-card-items">{stall.menu.filter(m => m.av).length} items</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => { setSelectedStallObj(null); clearCart() }}
              className="student-back-btn"
            >
               Back to stalls
            </button>
            <div className="stall-menu-header">
              <div>
                <h2 className="stall-menu-name">{selectedStallObj.name}</h2>
                <div className="stall-menu-info">{selectedStallObj.cat} - {selectedStallObj.hrs}</div>
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
      <h1 className="orders-title">
        My Orders
      </h1>
      {orders.length === 0 ? (
        <div className="orders-empty">
          <div style={{ fontSize: 40, marginBottom: 12 }}></div>
          <div className="orders-empty-text">No orders yet</div>
          <div className="orders-empty-hint">Head to Order Food to place your first order</div>
          <button
            onClick={() => setTab('order')}
            className="orders-empty-btn"
          >
            Browse stalls 
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => {
            const status = STATUS[order.st] || STATUS.pending
            const stall = stalls.find(s => s.id === order.stallId)
            return (
              <div key={order.id} className="order-card" style={{ borderLeft: `3px solid ${status.color}` }}>
                <div className="order-card-header">
                  <div>
                    <div className="order-stall-name">{order.stallName}</div>
                    <div className="order-id">{order.id}</div>
                    <div className="order-date">{formatDate(order.createdAt)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="order-amount">KES {order.tot}</div>
                    <span className="order-status-badge" style={{ background: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </div>
                </div>

                <OrderTracker step={status.step} />

                {order.st === 'paid' && (
                  <div className="order-status-msg paid">
                    &#8987; Payment received - waiting for vendor to confirm
                  </div>
                )}
                {order.st === 'accepted' && (
                  <div className="order-status-msg accepted">
                     Order confirmed - collecting at {order.pu}
                  </div>
                )}
                {order.st === 'preparing' && (
                  <div className="order-status-msg preparing">
                    ⌛ Your order is being prepared
                  </div>
                )}
                {order.st === 'ready' && (
                  <div className="order-status-msg ready">
                     Your order is ready! Head to {order.stallName} to collect
                  </div>
                )}

                <div style={{ marginBottom: 10 }}>
                  <div className="order-items-label">Items</div>
                  {(order.items || []).map((item, i) => (
                    <div key={i} className="order-item">
                      <span>&#8226; {item.nm || item} {item.qty > 1 ? `x${item.qty}` : ''}</span>
                      {item.pr && <span className="order-item-price">KES {item.pr * (item.qty || 1)}</span>}
                    </div>
                  ))}
                </div>

                <div className="order-meta">
                  <span>{order.mode === 'Dine-in' ? '' : ''} {order.mode}</span>
                  <span>- Pickup {order.pu}</span>
                </div>

                <div className="order-card-footer">
                  <button onClick={() => downloadReceipt(order, stall)} className="order-receipt-btn">
                     Download receipt
                  </button>
                  <button onClick={() => window.print()} className="order-receipt-btn">
                    Print Receipt
                  </button>
                  {(order.st === 'pending' || order.st === 'accepted') && (
                    <button
                      onClick={() => {
                        if (window.confirm('Cancel this order?')) {
                          updateOrderStatus(order.id, 'cancelled')
                        }
                      }}
                      className="order-cancel-btn"
                    >
                      Cancel Order
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

  const renderProfile = () => (
    <div className="profile-page">
      <h1 className="profile-title">
        My Profile
      </h1>
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user ? `${(user.firstName || user.name || 'U')[0]}${(user.lastName || '')[0] || ''}`.toUpperCase() : 'U'}
          </div>
          <div>
            <div className="profile-name">
              {user ? `${user.firstName || user.name || ''} ${user.lastName || ''}`.trim() : 'Student'}
            </div>
            <div className="profile-role">
              {role === 'staff' ? 'Staff / Lecturer' : role === 'other' ? 'Guest' : 'Student'} - Strathmore University
            </div>
          </div>
        </div>
        {ordersError && (
          <div style={{ color: '#f87171', fontSize: 12, marginBottom: 12, padding: '8px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: 6 }}>Orders error: {ordersError}</div>
        )}
        {[
          { label: 'Student / Staff ID', value: user?.studentId || user?.staffId || '-' },
          { label: 'Email address', value: user?.email || '-' },
          { label: 'M-Pesa number', key: 'mpesa' },
          { label: 'Account role', value: role === 'staff' ? 'Staff / Lecturer' : role === 'other' ? 'Guest' : 'Student' },
          { label: 'Total orders', value: orders.length },
          { label: 'Total spent', value: `KES ${orders.reduce((s, o) => s + (o.tot || 0), 0).toLocaleString()}` },
        ].map(({ label, value, key }) => (
          <div key={label} className="profile-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="profile-row-label">{label}</span>
            </div>
            {key === 'mpesa' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {editingMpesa ? (
                  <>
                    <input
                      type="tel"
                      value={mpesaInput}
                      onChange={e => setMpesaInput(e.target.value)}
                      className="input-dark"
                      style={{ padding: '4px 8px', fontSize: 13, width: 140 }}
                      placeholder="07XX XXX XXX"
                    />
                    <button onClick={handleSaveMpesa} className="btn-sm btn-confirm" style={{ padding: '4px 10px', fontSize: 12 }}>Save</button>
                    <button onClick={() => setEditingMpesa(false)} className="btn-sm btn-reject" style={{ padding: '4px 10px', fontSize: 12 }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="profile-row-value">{user?.mpesa || '-'}</span>
                    <button onClick={() => { setMpesaInput(user?.mpesa || ''); setEditingMpesa(true) }} className="btn-sm btn-confirm" style={{ padding: '4px 10px', fontSize: 12 }}>Edit</button>
                  </>
                )}
              </div>
            ) : (
              <span className="profile-row-value">{value}</span>
            )}
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
