import { createContext, useState, useContext } from 'react'

const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [selectedStall, setSelectedStall] = useState(null)
  const [orderMode, setOrderMode] = useState('')
  const [pickupTime, setPickupTime] = useState('')

  // item shape: { id, nm, pr, cat, portion: 'half'|'full'|null, cartKey }
  // cartKey = id + '-' + portion so half and full can coexist
  const addToCart = (item, portion = null) => {
    const cartKey = portion ? `${item.id}-${portion}` : `${item.id}`
    const price = portion && item.portions ? item.portions[portion] : item.pr
    const label = portion ? `${item.nm} (${portion === 'half' ? 'Half' : 'Full'})` : item.nm

    setCartItems(prev => {
      const existing = prev.find(i => i.cartKey === cartKey)
      if (existing) {
        return prev.map(i =>
          i.cartKey === cartKey ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [...prev, { ...item, pr: price, nm: label, cartKey, qty: 1, portion }]
    })
  }

  const removeFromCart = (cartKey) => {
    setCartItems(prev => prev.filter(i => i.cartKey !== cartKey))
  }

  const decreaseQty = (cartKey) => {
    setCartItems(prev =>
      prev
        .map(i => i.cartKey === cartKey ? { ...i, qty: i.qty - 1 } : i)
        .filter(i => i.qty > 0)
    )
  }

  const clearCart = () => {
    setCartItems([])
    setSelectedStall(null)
    setOrderMode('Dine-in')
    setPickupTime('12:30')
  }

  const getTotal = () =>
    cartItems.reduce((sum, item) => sum + item.pr * item.qty, 0)

  const getItemCount = () =>
    cartItems.reduce((sum, item) => sum + item.qty, 0)

  return (
    <CartContext.Provider value={{
      cartItems, selectedStall, orderMode, pickupTime,
      addToCart, removeFromCart, decreaseQty, clearCart,
      setSelectedStall, setOrderMode, setPickupTime,
      getTotal, getItemCount,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}