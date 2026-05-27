import { createContext, useState, useContext } from 'react'

const OrdersContext = createContext()

export const OrdersProvider = ({ children }) => {
  const [orders, setOrders] = useState([])

  const placeOrder = (orderData) => {
    const newOrder = {
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      ...orderData,
      st: 'paid',
      createdAt: new Date(),
    }
    setOrders((prev) => [newOrder, ...prev])
    return newOrder
  }

  const updateOrderStatus = (orderId, status) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, st: status } : o))
    )
  }

  const getOrderById = (orderId) => {
    return orders.find((o) => o.id === orderId)
  }

  return (
    <OrdersContext.Provider
      value={{
        orders,
        placeOrder,
        updateOrderStatus,
        getOrderById,
      }}
    >
      {children}
    </OrdersContext.Provider>
  )
}

export const useOrders = () => {
  const context = useContext(OrdersContext)
  if (!context) {
    throw new Error('useOrders must be used within OrdersProvider')
  }
  return context
}
