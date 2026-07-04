function openReportWindow(title) {
  const win = window.open('', '_blank')
  if (!win) { alert('Please allow popups to open the report.'); return null }
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>')
  win.document.write(title)
  win.document.write('</title><style>')
  win.document.write(`
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background:#fff; color:#1e293b; padding:40px 48px; }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; padding-bottom:16px; border-bottom:2px solid #f0b429; }
    .brand { font-size:22px; font-weight:700; letter-spacing:-0.5px; }
    .brand em { color:#f0b429; font-style:normal; }
    .report-meta { text-align:right; font-size:12px; color:#64748b; }
    .report-meta div { margin-top:2px; }
    h1 { font-size:20px; font-weight:700; margin-bottom:4px; }
    .subtitle { font-size:13px; color:#64748b; margin-bottom:24px; }
    .kpi-row { display:flex; gap:16px; margin-bottom:28px; }
    .kpi-card { flex:1; padding:16px 20px; border-radius:8px; border:1px solid #e2e8f0; }
    .kpi-label { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; font-weight:600; }
    .kpi-value { font-size:22px; font-weight:700; margin-top:4px; }
    table { width:100%; border-collapse:collapse; font-size:12px; }
    th { background:#f8fafc; color:#475569; text-align:left; padding:10px 12px; font-weight:600; border-bottom:2px solid #e2e8f0; }
    td { padding:9px 12px; border-bottom:1px solid #e2e8f0; vertical-align:top; }
    tr:nth-child(even) td { background:#f8fafc; }
    .total-row td { font-weight:700; border-top:2px solid #1e293b; background:#fff !important; }
    .badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; }
    .badge-paid { background:#dbeafe; color:#1d4ed8; }
    .badge-accepted, .badge-preparing, .badge-ready { background:#fef3c7; color:#b45309; }
    .badge-collected { background:#d1fae5; color:#047857; }
    .badge-cancelled { background:#fee2e2; color:#b91c1c; }
    .footer { margin-top:32px; padding-top:16px; border-top:1px solid #e2e8f0; font-size:11px; color:#94a3b8; text-align:center; }
    @media print { body { padding:24px; } .no-print { display:none; } }
  `)
  win.document.write('</style></head><body>')
  return win
}

function closeReportWindow(win) {
  win.document.write('<div class="footer">StrathEats &mdash; Generated ' + new Date().toLocaleString('en-KE') + '</div>')
  win.document.write('</body></html>')
  win.document.close()
}

function statusBadge(status) {
  const s = (status || '').toLowerCase()
  const cls = s === 'paid' ? 'paid' : (s === 'accepted' || s === 'preparing' || s === 'ready' ? 'accepted' : (s === 'collected' ? 'collected' : (s === 'cancelled' ? 'cancelled' : '')))
  return '<span class="badge badge-' + cls + '">' + (status || '') + '</span>'
}

function formatCurrency(amount) {
  return 'KES ' + Number(amount || 0).toLocaleString('en-KE')
}

function formatDate(val) {
  if (!val) return ''
  if (typeof val.toDate === 'function') return val.toDate().toLocaleDateString('en-KE', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
  const d = new Date(val)
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('en-KE', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}

// ── CSV Export (raw data) ─────────────────────────────────────────

function downloadCSV(filename, headers, rows) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => {
        const val = String(cell ?? '')
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? '"' + val.replace(/"/g, '""') + '"'
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
      return qty > 1 ? name + ' x' + qty : name
    }).join('; ') : ''),
    o.tot ?? o.total ?? 0,
    o.mode || o.type || '',
    o.st || o.status || '',
    o.createdAt?.toDate?.()?.toLocaleDateString('en-KE') || o.createdAt || '',
  ])
  downloadCSV(filename, headers, rows)
}

// ── HTML Report (formatted, printable) ────────────────────────────

export function openOrdersReport(orders, title) {
  const total = orders.reduce((sum, o) => sum + Number(o.tot ?? o.total ?? 0), 0)
  const count = orders.length

  const win = openReportWindow(title + ' | StrathEats')
  if (!win) return

  win.document.write('<div class="header"><div class="brand">Strath<em>Eats</em></div><div class="report-meta"><div>' + title + '</div><div>' + new Date().toLocaleDateString('en-KE', { year:'numeric', month:'long', day:'numeric' }) + '</div></div></div>')
  win.document.write('<h1>' + title + '</h1>')
  win.document.write('<div class="subtitle">' + count + ' order' + (count !== 1 ? 's' : '') + ' &middot; Total: ' + formatCurrency(total) + '</div>')

  win.document.write('<div class="kpi-row">')
  win.document.write('<div class="kpi-card"><div class="kpi-label">Total Orders</div><div class="kpi-value">' + count + '</div></div>')
  win.document.write('<div class="kpi-card"><div class="kpi-label">Total Revenue</div><div class="kpi-value">' + formatCurrency(total) + '</div></div>')
  win.document.write('<div class="kpi-card"><div class="kpi-label">Avg Order Value</div><div class="kpi-value">' + (count ? formatCurrency(Math.round(total / count)) : 'KES 0') + '</div></div>')
  win.document.write('</div>')

  win.document.write('<table><thead><tr><th>Order ID</th><th>Student</th><th>Cafeteria</th><th>Items</th><th>Total</th><th>Mode</th><th>Status</th><th>Date</th></tr></thead><tbody>')
  orders.forEach(o => {
    const items = Array.isArray(o.items) ? o.items.map(i => {
      const name = typeof i === 'string' ? i : (i.nm || i.name || '')
      const qty = i.qty || 1
      return qty > 1 ? name + ' x' + qty : name
    }).join('<br>') : ''
    win.document.write('<tr><td style="font-family:monospace;font-size:11px">' + (o.id || '') + '</td><td>' + (o.userEmail || o.user || o.userId || '') + '</td><td>' + (o.stallName || o.stall || '') + '</td><td>' + items + '</td><td>' + formatCurrency(o.tot ?? o.total ?? 0) + '</td><td>' + (o.mode || o.type || '') + '</td><td>' + statusBadge(o.st || o.status) + '</td><td>' + formatDate(o.createdAt) + '</td></tr>')
  })
  win.document.write('<tr class="total-row"><td colspan="4"><strong>Total</strong></td><td><strong>' + formatCurrency(total) + '</strong></td><td colspan="3"></td></tr>')
  win.document.write('</tbody></table>')

  closeReportWindow(win)
}

export function openAnalyticsReport(summary, topItems, title) {
  const win = openReportWindow(title + ' | StrathEats')
  if (!win) return

  win.document.write('<div class="header"><div class="brand">Strath<em>Eats</em></div><div class="report-meta"><div>' + title + '</div><div>' + new Date().toLocaleDateString('en-KE', { year:'numeric', month:'long', day:'numeric' }) + '</div></div></div>')
  win.document.write('<h1>' + title + '</h1>')

  win.document.write('<div class="kpi-row">')
  win.document.write('<div class="kpi-card"><div class="kpi-label">Total Orders</div><div class="kpi-value">' + (summary.totalOrders || 0) + '</div></div>')
  win.document.write('<div class="kpi-card"><div class="kpi-label">Total Revenue</div><div class="kpi-value">' + formatCurrency(summary.totalRevenue || 0) + '</div></div>')
  win.document.write('<div class="kpi-card"><div class="kpi-label">Avg Order Value</div><div class="kpi-value">' + formatCurrency(summary.averageOrderValue || 0) + '</div></div>')
  win.document.write('<div class="kpi-card"><div class="kpi-label">Active Customers</div><div class="kpi-value">' + (summary.activeCustomers || 0) + '</div></div>')
  win.document.write('</div>')

  if (topItems && topItems.length) {
    win.document.write('<h2 style="font-size:16px;margin:24px 0 12px">Top Items</h2>')
    win.document.write('<table><thead><tr><th>#</th><th>Item</th><th>Units Sold</th></tr></thead><tbody>')
    topItems.forEach((item, i) => {
      win.document.write('<tr><td>' + (i + 1) + '</td><td>' + (item.name || '') + '</td><td>' + (item.sales ?? item.quantity ?? 0) + '</td></tr>')
    })
    win.document.write('</tbody></table>')
  }

  closeReportWindow(win)
}
