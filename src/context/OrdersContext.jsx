import { createContext, useState, useContext } from 'react'

const OrdersContext = createContext()

export const OrdersProvider = ({ children }) => {
  const [orders, setOrders] = useState([])

  const placeOrder = (orderData) => {
    const order = {
      id: 'ORD-' + Math.floor(Math.random() * 9000 + 1000),
      ...orderData,
      st: 'paid',
      createdAt: new Date().toISOString(),
    }
    setOrders(prev => [order, ...prev])
    return order
  }

  const updateOrderStatus = (orderId, status) => {
    setOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, st: status } : o)
    )
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