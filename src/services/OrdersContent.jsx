import { createContext, useState, useContext, useEffect } from 'react'
import { useAuth } from './AuthContext'
import {
  placeOrder as fbPlaceOrder,
  updateOrderStatus as fbUpdateStatus,
  subscribeToUserOrders,
} from '../services/orderService'

const OrdersContext = createContext()

export const OrdersProvider = ({ children }) => {
  const { user, isLoggedIn } = useAuth()
  const [orders, setOrders]  = useState([])

  // ── Live-sync orders for logged-in user ──────────────────────
  useEffect(() => {
    if (!isLoggedIn || !user?.uid) {
      setOrders([])
      return
    }
    const unsub = subscribeToUserOrders(user.uid, (liveOrders) => {
      setOrders(liveOrders)
    })
    return unsub
  }, [isLoggedIn, user?.uid])

  // ── Place order → writes to Firestore ───────────────────────
  const placeOrder = async (orderData) => {
    const order = await fbPlaceOrder({
      ...orderData,
      userId: user.uid,
      userEmail: user.email,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    })
    return order
  }

  // ── Update status → writes to Firestore ─────────────────────
  const updateOrderStatus = async (orderId, status) => {
    await fbUpdateStatus(orderId, status)
  }

  return (
    <OrdersContext.Provider value={{ orders, placeOrder, updateOrderStatus }}>
      {children}
    </OrdersContext.Provider>
  )
}

export const useOrders = () => {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider')
  return ctx
}