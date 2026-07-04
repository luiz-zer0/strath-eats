export function downloadCSV(filename, headers, rows) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => {
        const val = String(cell ?? '')
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val
      }).join(',')
    ),
  ].join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadOrdersCSV(orders, filename) {
  const headers = ['Order ID', 'Student', 'Cafeteria', 'Items', 'Total (KES)', 'Mode', 'Status', 'Date']
  const rows = orders.map(o => [
    o.id,
    o.userEmail || o.user || o.userId || '',
    o.stallName || o.stall || '',
    (Array.isArray(o.items) ? o.items.map(i => {
      const name = typeof i === 'string' ? i : (i.nm || i.name || '')
      const qty = i.qty || 1
      return qty > 1 ? `${name} x${qty}` : name
    }).join('; ') : ''),
    o.tot ?? o.total ?? 0,
    o.mode || o.type || '',
    o.st || o.status || '',
    o.createdAt?.toDate?.()?.toLocaleDateString('en-KE') || o.createdAt || '',
  ])
  downloadCSV(filename, headers, rows)
}

export function downloadAnalyticsCSV(summary, topItems, filename) {
  const headers = ['Metric', 'Value']
  const rows = [
    ['Total Orders', summary.totalOrders],
    ['Total Revenue (KES)', summary.totalRevenue],
    ['Average Order Value (KES)', summary.averageOrderValue],
    ['Active Customers', summary.activeCustomers],
    ['Today\'s Orders', summary.todayOrders ?? summary.totalOrders],
    ['Today\'s Revenue (KES)', summary.todayRevenue],
    ['', ''],
    ['Top Items', 'Units Sold'],
    ...topItems.map(item => [item.name, item.sales ?? item.quantity ?? 0]),
  ]
  downloadCSV(filename, headers, rows)
}
