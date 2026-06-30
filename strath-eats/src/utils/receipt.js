import { formatCurrency, formatDate } from './formatters'

export const generateReceiptHTML = (order, stall) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${order.id}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .receipt { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,.1); }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 5px; }
        .subtitle { font-size: 12px; color: #666; }
        .order-info { margin-bottom: 20px; font-size: 12px; }
        .label { color: #666; margin-bottom: 3px; }
        .value { font-weight: bold; }
        .items { border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 15px 0; margin-bottom: 15px; }
        .item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
        .totals { margin-bottom: 20px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
        .total-row.final { font-size: 16px; font-weight: bold; border-top: 1px solid #ddd; padding-top: 10px; }
        .footer { text-align: center; font-size: 11px; color: #666; padding-top: 15px; border-top: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="logo">StrathEats</div>
          <div class="subtitle">Receipt</div>
        </div>

        <div class="order-info">
          <div class="label">Order ID:</div>
          <div class="value">${order.id}</div>

          <div class="label" style="margin-top: 10px;">Cafeteria:</div>
          <div class="value">${stall?.name || 'N/A'}</div>

          <div class="label" style="margin-top: 10px;">Date & Time:</div>
          <div class="value">${formatDate(order.createdAt)}</div>

          <div class="label" style="margin-top: 10px;">Pickup Time:</div>
          <div class="value">${order.pu || 'N/A'}</div>

          <div class="label" style="margin-top: 10px;">Order Type:</div>
          <div class="value">${order.mode || 'N/A'}</div>

          <div class="label" style="margin-top: 10px;">Status:</div>
          <div class="value">${order.st === 'paid' ? 'Confirmed' : order.st}</div>
        </div>

        <div class="items">
          <strong>Items:</strong>
          ${
            order.items
              ?.map((item) => `<div class="item"><span>${item}</span></div>`)
              .join('') || '<div class="item">No items</div>'
          }
        </div>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(order.tot || 0)}</span>
          </div>
          <div class="total-row final">
            <span>Total:</span>
            <span>${formatCurrency(order.tot || 0)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your order!</p>
          <p>Please collect your order at the specified time</p>
        </div>
      </div>
    </body>
    </html>
  `
  return html
}

export const downloadReceipt = (order, stall) => {
  const html = generateReceiptHTML(order, stall)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `receipt-${order.id}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
