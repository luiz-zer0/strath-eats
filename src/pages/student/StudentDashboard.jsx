import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useOrders } from '../../context/OrdersContext'
import { useToast } from '../../components/common/Toast'
import { Button } from '../../components/common/Button'
import { stallsDB } from '../../data/mockData'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { downloadReceipt } from '../../utils/receipt'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { isLoggedIn, logout, user } = useAuth()
  const { cartItems, selectedStall, orderMode, pickupTime, addToCart, removeFromCart, clearCart, setSelectedStall, setOrderMode, setPickupTime, getTotal } = useCart()
  const { orders, placeOrder, updateOrderStatus } = useOrders()
  const { addToast } = useToast()

  const [tab, setTab] = useState('order')
  const [selectedStallObj, setSelectedStallObj] = useState(null)

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <p className="text-txs mb-4">Not signed in</p>
          <Button onClick={() => navigate('/order')}>Sign In</Button>
        </div>
      </div>
    )
  }

  const handleSelectStall = (stall) => {
    setSelectedStall(stall.id)
    setSelectedStallObj(stall)
  }

  const handleAddItem = (item) => {
    addToCart(item)
    addToast(`${item.nm} added to cart`, 'success')
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      addToast('Your cart is empty', 'error')
      return
    }

    if (!pickupTime) {
      addToast('Please select a pickup time', 'error')
      return
    }

    // Simulate M-Pesa payment
    addToast('🚀 STK Push sent to your phone...', 'info')

    setTimeout(() => {
      const order = placeOrder({
        stallId: selectedStallObj.id,
        stallName: selectedStallObj.name,
        items: cartItems.map((i) => i.nm),
        tot: getTotal(),
        mode: orderMode,
        pu: pickupTime,
        userId: user.email,
      })

      addToast('✓ Payment confirmed! Your order is confirmed.', 'success')

      // Simulate status progression
      setTimeout(() => {
        updateOrderStatus(order.id, 'accepted')
        addToast('✓ Vendor accepted your order', 'info')
      }, 4000)

      setTimeout(() => {
        updateOrderStatus(order.id, 'ready')
        addToast('✓ Your order is ready for pickup!', 'success')
      }, 8000)

      clearCart()
      setSelectedStall(null)
      setSelectedStallObj(null)
      setTab('myorders')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-navy flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-bd bg-navy-2 p-6">
        <div className="text-lg font-bold text-white mb-8">
          Strath<em className="text-gold not-italic">Eats</em>
        </div>

        <nav className="space-y-2 mb-8">
          <button
            onClick={() => setTab('order')}
            className={`block w-full text-left px-4 py-2.5 rounded-sm transition ${
              tab === 'order'
                ? 'bg-gold text-navy font-bold'
                : 'text-txs hover:bg-navy-3'
            }`}
          >
            Order Food
          </button>
          <button
            onClick={() => setTab('myorders')}
            className={`block w-full text-left px-4 py-2.5 rounded-sm transition ${
              tab === 'myorders'
                ? 'bg-gold text-navy font-bold'
                : 'text-txs hover:bg-navy-3'
            }`}
          >
            My Orders ({orders.length})
          </button>
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
        {tab === 'order' ? (
          <div className="flex gap-8">
            {/* Stalls Grid */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-6">Order Food</h1>

              {!selectedStallObj ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stallsDB.map((stall) => (
                    <div
                      key={stall.id}
                      onClick={() => handleSelectStall(stall)}
                      className="bg-navy-3 border border-bd2 rounded-sm p-6 cursor-pointer hover:bg-navy-4 hover:border-gold transition"
                    >
                      <div className="text-4xl mb-3">{stall.emoji}</div>
                      <h3 className="font-bold text-white text-lg mb-1">{stall.name}</h3>
                      <p className="text-11px text-txs mb-3">{stall.cat}</p>
                      <p className="text-10px text-txtd">Hours: {stall.hrs}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setSelectedStallObj(null)}
                    className="text-gold hover:text-gold-2 mb-6 flex items-center gap-1"
                  >
                    ← Back to stalls
                  </button>
                  <h2 className="text-2xl font-bold text-white mb-6">
                    {selectedStallObj.emoji} {selectedStallObj.name}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedStallObj.menu.map((item) => (
                      <div
                        key={item.id}
                        className="bg-navy-3 border border-bd2 rounded-sm p-4 flex justify-between items-start"
                      >
                        <div className="flex-1">
                          <h4 className="font-bold text-white">{item.nm}</h4>
                          <p className="text-11px text-txs">{item.cat}</p>
                          <p className="text-14px font-bold text-gold mt-2">
                            {formatCurrency(item.pr)}
                          </p>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAddItem(item)}
                          disabled={!item.av}
                        >
                          {item.av ? '+' : 'Out'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Sidebar */}
            {selectedStallObj && (
              <div className="w-80 bg-navy-3 border border-bd2 rounded-sm p-6 h-fit sticky top-8">
                <h3 className="font-bold text-white text-lg mb-4">Your Cart</h3>

                {cartItems.length === 0 ? (
                  <p className="text-txs text-center py-8">No items in cart</p>
                ) : (
                  <>
                    <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center text-sm bg-navy-4 p-3 rounded-sm"
                        >
                          <div>
                            <p className="text-white font-medium">{item.nm}</p>
                            <p className="text-11px text-txs">
                              {item.qty} x {formatCurrency(item.pr)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gold hover:text-gold-2"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-bd2 pt-4 mb-6">
                      <p className="text-14px font-bold text-white flex justify-between">
                        Total
                        <span className="text-gold">{formatCurrency(getTotal())}</span>
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-11px font-bold text-txs mb-2">
                          Order Type
                        </label>
                        <div className="space-y-2">
                          {['Dine-in', 'Takeaway'].map((mode) => (
                            <label key={mode} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="orderMode"
                                value={mode}
                                checked={orderMode === mode}
                                onChange={(e) => setOrderMode(e.target.value)}
                                className="w-4 h-4"
                              />
                              <span className="text-11px text-txt">{mode}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-11px font-bold text-txs mb-2">
                          Pickup Time
                        </label>
                        <input
                          type="time"
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-sm bg-navy-4 border border-bd2 text-white text-sm focus:outline-none focus:border-gold"
                        />
                      </div>

                      <Button
                        className="w-full"
                        onClick={handleCheckout}
                      >
                        Pay via M-Pesa
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6">My Orders</h1>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-txs">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const stall = stallsDB.find((s) => s.id === order.stallId)
                  return (
                    <div
                      key={order.id}
                      className="bg-navy-3 border border-bd2 rounded-sm p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-white text-lg">{order.stallName}</h3>
                          <p className="text-11px text-txs">{order.id}</p>
                          <p className="text-11px text-txtd mt-1">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-16px font-bold text-gold">
                            {formatCurrency(order.tot)}
                          </p>
                          <span className="inline-block bg-gold/20 text-gold px-3 py-1 rounded-sm text-10px font-bold mt-2">
                            {order.st === 'accepted'
                              ? 'Confirmed'
                              : order.st === 'ready'
                              ? 'Ready'
                              : 'Paid'}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-11px text-txs mb-2">Items</p>
                        <ul className="text-11px text-txt space-y-1">
                          {order.items.map((item, i) => (
                            <li key={i}>• {item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex gap-2 text-11px">
                        <span className="text-txtd">{order.mode} •</span>
                        <span className="text-txtd">Pickup: {order.pu}</span>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => downloadReceipt(order, stall)}
                        className="mt-4"
                      >
                        Download Receipt
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
