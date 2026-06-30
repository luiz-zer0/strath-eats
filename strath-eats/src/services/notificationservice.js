const STATUS_MESSAGES = {
  accepted:  (stallName) => `Your order from ${stallName} has been accepted!`,
  preparing: (stallName) => `${stallName} is preparing your order!`,
  ready:     (stallName) => `Your order from ${stallName} is ready for pickup!`,
  cancelled: (stallName) => `Your order from ${stallName} has been cancelled`,
  collected: (stallName) => `Thank you for using StrathEats! Enjoy your meal.`,
}

export function requestNotificationPermission() {
  if (!('Notification' in window)) return Promise.resolve('denied')
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Promise.resolve(Notification.permission)
  }
  return Notification.requestPermission()
}

export function sendBrowserNotification(title, options = {}) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, { icon: '/favicon.ico', ...options })
  } catch {
    // silently fail
  }
}

export function getStatusNotificationData(order, newStatus) {
  const fn = STATUS_MESSAGES[newStatus]
  if (!fn) return null
  return {
    title: 'StrathEats',
    body: fn(order.stallName || 'Cafeteria'),
  }
}
