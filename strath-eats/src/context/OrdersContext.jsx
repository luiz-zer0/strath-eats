import { createContext, useEffect, useState, useContext, useRef } from 'react'
import { useAuth } from './AuthContext'
import {
  placeOrder as createFirestoreOrder,
  updateOrderStatus as updateFirestoreOrderStatus,
  subscribeToUserOrders,
} from '../services/orderservice'
import { db } from '../services/firebase'
import { requestNotificationPermission, sendBrowserNotification, getStatusNotificationData } from '../services/notificationservice'

const OrdersContext = createContext()

export const OrdersProvider = ({ children }) => {
  const { user, isLoggedIn, role } = useAuth() 
  
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState(null)
  const prevOrdersRef = useRef([])
  const toastsRef = useRef(null)

  useEffect(() => {
    // ✨ FIX 2: If no user is logged in, OR if the user is a vendor, stop immediately!
    if (!isLoggedIn || !user?.uid || role === 'vendor') {
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
  }, [isLoggedIn, user?.uid, role]) // ✨ FIX 3: Added 'role' to the dependency array

  useEffect(() => {
    if (orders.length === 0) return
    requestNotificationPermission()
    const prev = prevOrdersRef.current
    const prevMap = new Map(prev.map(o => [o.id, o.st]))
    for (const order of orders) {
      const prevSt = prevMap.get(order.id)
      if (prevSt && prevSt !== order.st) {
        const data = getStatusNotificationData(order, order.st)
        if (data) {
          sendBrowserNotification(data.title, { body: data.body })
        }
      }
    }
    prevOrdersRef.current = orders
  }, [orders])

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