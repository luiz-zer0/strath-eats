const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const FINAL_REVENUE_STATUSES = new Set(['paid', 'accepted', 'ready', 'collected', 'picked_up'])

export function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function orderTotal(order) {
  return Number(order?.tot ?? order?.total ?? 0) || 0
}

export function orderStatus(order) {
  return String(order?.st ?? order?.status ?? 'paid')
}

export function orderRevenue(order) {
  return FINAL_REVENUE_STATUSES.has(orderStatus(order)) ? orderTotal(order) : 0
}

export function orderItems(order) {
  return Array.isArray(order?.items) ? order.items : []
}

export function itemName(item) {
  if (typeof item === 'string') return item.split('(')[0].trim()
  return String(item?.nm ?? item?.name ?? '').split('(')[0].trim()
}

export function itemQty(item) {
  if (typeof item === 'string') return 1
  return Number(item?.qty ?? item?.quantity ?? 1) || 1
}

export function buildOrderTrend(orders) {
  const byDay = new Map(WEEKDAY_LABELS.map(day => [day, { day, orders: 0, revenue: 0 }]))

  orders.forEach(order => {
    const date = toDate(order.createdAt) || new Date()
    const label = DAY_LABELS[date.getDay()]
    if (!byDay.has(label)) return
    const bucket = byDay.get(label)
    bucket.orders += 1
    bucket.revenue += orderRevenue(order)
  })

  return WEEKDAY_LABELS.map(day => byDay.get(day))
}

export function buildOrdersByHour(orders) {
  const byHour = new Map()

  orders.forEach(order => {
    const pickupHour = String(order?.pu ?? order?.pickupTime ?? '').split(':')[0]
    const createdHour = toDate(order.createdAt)?.getHours()
    const hour = pickupHour || (Number.isFinite(createdHour) ? String(createdHour).padStart(2, '0') : '')
    if (!hour) return
    byHour.set(hour, (byHour.get(hour) || 0) + 1)
  })

  return Array.from(byHour.entries())
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([hour, orders]) => ({ hour: `${hour}:00`, orders }))
}

export function buildTopItems(orders, limit = 5) {
  const byItem = new Map()

  orders.forEach(order => {
    orderItems(order).forEach(item => {
      const name = itemName(item)
      if (!name) return
      byItem.set(name, (byItem.get(name) || 0) + itemQty(item))
    })
  })

  return Array.from(byItem.entries())
    .map(([name, sales]) => ({ name, sales }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limit)
}

export function buildModeSplit(orders) {
  const byMode = new Map()
  orders.forEach(order => {
    const mode = order?.mode || order?.type || 'Unknown'
    byMode.set(mode, (byMode.get(mode) || 0) + 1)
  })

  return Array.from(byMode.entries()).map(([name, value]) => ({ name, value }))
}

export function buildRevenueByStall(orders, stalls = []) {
  const namesById = new Map(stalls.map(stall => [stall.id, stall.name]))
  const byStall = new Map()

  orders.forEach(order => {
    const name = order.stallName || namesById.get(order.stallId) || 'Unknown stall'
    byStall.set(name, (byStall.get(name) || 0) + orderRevenue(order))
  })

  return Array.from(byStall.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
}

export function summarizeOrders(orders) {
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, order) => sum + orderRevenue(order), 0)
  const averageOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0
  const activeCustomers = new Set(orders.map(order => order.userId || order.userEmail).filter(Boolean)).size

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayOrders = orders.filter(o => {
    const d = toDate(o.createdAt)
    return d && d >= todayStart
  })
  const todayRevenue = todayOrders.reduce((sum, order) => sum + orderRevenue(order), 0)

  return { totalOrders, totalRevenue, averageOrderValue, activeCustomers, todayRevenue }
}

export function toAdminOrderRow(order) {
  return {
    id: order.id,
    stu: order.userEmail || order.user || order.userId || 'Unknown',
    stall: order.stallName || order.stall || 'Unknown stall',
    itms: orderItems(order).map(item => {
      const name = itemName(item)
      const qty = itemQty(item)
      return qty > 1 ? `${name} x${qty}` : name
    }).filter(Boolean).join(', '),
    tot: orderTotal(order),
    type: order.mode || order.type || 'Unknown',
    st: orderStatus(order),
  }
}
