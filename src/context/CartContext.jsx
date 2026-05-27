import { createContext, useState, useContext } from 'react'

const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [selectedStall, setSelectedStall] = useState(null)
  const [orderMode, setOrderMode] = useState('Dine-in') // 'Dine-in' or 'Takeaway'
  const [pickupTime, setPickupTime] = useState('')

  const addToCart = (item) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: (i.qty || 1) + 1 } : i
        )
      }
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const removeFromCart = (itemId) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId))
  }

  const clearCart = () => {
    setCartItems([])
  }

  const getTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.pr * (item.qty || 1), 0)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        selectedStall,
        orderMode,
        pickupTime,
        addToCart,
        removeFromCart,
        clearCart,
        setSelectedStall,
        setOrderMode,
        setPickupTime,
        getTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
