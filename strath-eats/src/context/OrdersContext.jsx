import { createContext, useEffect, useState, useContext } from 'react'
import { useAuth } from './AuthContext'
import {
  placeOrder as createFirestoreOrder,
  updateOrderStatus as updateFirestoreOrderStatus,
  subscribeToUserOrders,
} from '../services/orderservice'
import { db } from '../services/firebase'
const OrdersContext = createContext()

export const OrdersProvider = ({ children }) => {
  const { user, isLoggedIn } = useAuth()
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState(null)

  useEffect(() => {
    if (!isLoggedIn || !user?.uid) {
      setOrders([])
      setLoadingOrders(false)
      return undefined
    }

    setLoadingOrders(true)
    setOrdersError(null)

    const unsubscribe = subscribeToUserOrders(
      user.uid,
      (liveOrders) => {
        setOrders(liveOrders || [])
        setLoadingOrders(false)
      },
      (error) => {
        console.error('User orders listener error', error)
        setOrdersError(error?.message || String(error))
        setLoadingOrders(false)
      }
    )

    return () => unsubscribe?.()
  }, [isLoggedIn, user?.uid])

  const placeOrder = async (orderData) => {
  // 1. Safely construct the student's full name from their profile
  const displayName = user?.firstName 
    ? `${user.firstName} ${user.lastName || ''}`.trim() 
    : user?.name || 'Student';

  // 2. Attach it to the order payload
  const order = await createFirestoreOrder({
    ...orderData,
    userId: user?.uid || orderData.userId,
    userEmail: user?.email || orderData.userEmail || '',
    user: displayName,         // <-- The Vendor Dashboard reads this exact field
    userName: displayName,     // <-- Added as a safe fallback
  })
  return order
}

  const updateOrderStatus = async (orderId, status) => {
    await updateFirestoreOrderStatus(orderId, status)
  }

  return (
    <OrdersContext.Provider value={{ orders, loadingOrders, ordersError, placeOrder, updateOrderStatus }}>
      {children}
    </OrdersContext.Provider>
  )
}

export const useOrders = () => {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider')
  return ctx
}
