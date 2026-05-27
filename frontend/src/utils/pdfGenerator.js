import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function generateInvoicePDF(invoice, businessSettings = {}) {
  const biz = {
    name: businessSettings.name || 'BillFlow Restaurant',
    address: businessSettings.address || '123 Food Street, Your City',
    phone: businessSettings.phone || '+91 98765 43210',
    email: businessSettings.email || 'billing@restaurant.com',
    gstin: businessSettings.gstin || '',
    ...businessSettings,
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 15

  // Header background
  doc.setFillColor(79, 70, 229)
  doc.rect(0, 0, W, 42, 'F')

  // Business name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text(biz.name, margin, 16)

  // Tax Invoice label
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(199, 210, 254)
  doc.text('TAX INVOICE', margin, 24)

  // Biz details right side
  doc.setFontSize(8)
  doc.setTextColor(224, 231, 255)
  doc.text(biz.address, W - margin, 10, { align: 'right' })
  doc.text(`Phone: ${biz.phone}`, W - margin, 16, { align: 'right' })
  doc.text(`Email: ${biz.email}`, W - margin, 22, { align: 'right' })
  if (biz.gstin) doc.text(`GSTIN: ${biz.gstin}`, W - margin, 28, { align: 'right' })

  // Invoice info bar
  doc.setFillColor(238, 242, 255)
  doc.rect(0, 42, W, 28, 'F')

  doc.setFontSize(9)
  doc.setTextColor(55, 65, 81)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE #', margin, 52)
  doc.text('DATE', 75, 52)
  doc.text('STATUS', 130, 52)
  doc.text('PAYMENT', 170, 52)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(79, 70, 229)
  doc.text(invoice.invoiceNumber, margin, 60)
  doc.setTextColor(55, 65, 81)
  doc.text(new Date(invoice.invoiceDate).toLocaleDateString('en-IN'), 75, 60)
  const statusColor = invoice.status === 'paid' ? [21, 128, 61] : invoice.status === 'cancelled' ? [185, 28, 28] : [161, 98, 7]
  doc.setTextColor(...statusColor)
  doc.text(invoice.status.toUpperCase(), 130, 60)
  doc.setTextColor(55, 65, 81)
  doc.text(invoice.paymentMethod || 'Cash', 170, 60)

  // Bill To
  let y = 80
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(margin, y - 5, 85, 28, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('BILL TO', margin + 3, y + 1)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(17, 24, 39)
  doc.text(invoice.customerName || 'Walk-in Guest', margin + 3, y + 9)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(75, 85, 99)
  if (invoice.customerPhone) doc.text(invoice.customerPhone, margin + 3, y + 16)

  y = 115
  // Items table
  const tableRows = invoice.items.map(item => [
    item.productName,
    item.category || '',
    item.quantity.toString(),
    `₹${Number(item.unitPrice).toFixed(2)}`,
    `₹${Number(item.total).toFixed(2)}`
  ])

  autoTable(doc, {
    startY: y,
    head: [['Item', 'Category', 'Qty', 'Unit Price', 'Amount']],
    body: tableRows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3, textColor: [31, 41, 55] },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 35 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 28 },
    },
  })

  // Totals
  const afterTable = doc.lastAutoTable.finalY + 5
  const totX = W - margin - 75

  const drawTotalRow = (label, value, bold = false, color = [55, 65, 81]) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(bold ? 11 : 9)
    doc.setTextColor(...color)
    doc.text(label, totX, afterTable + drawTotalRow._y)
    doc.text(value, W - margin, afterTable + drawTotalRow._y, { align: 'right' })
    drawTotalRow._y += (bold ? 9 : 7)
  }
  drawTotalRow._y = 5

  drawTotalRow('Subtotal', `₹${Number(invoice.subtotal).toFixed(2)}`)
  drawTotalRow(`GST (${invoice.gstPercent}%)`, `₹${Number(invoice.gstAmount).toFixed(2)}`)
  if (invoice.discountPercent > 0)
    drawTotalRow(`Discount (${invoice.discountPercent}%)`, `-₹${Number(invoice.discountAmount).toFixed(2)}`)

  // Divider
  const divY = afterTable + drawTotalRow._y
  doc.setDrawColor(229, 231, 235)
  doc.line(totX, divY, W - margin, divY)
  drawTotalRow._y += 3

  drawTotalRow('TOTAL', `₹${Number(invoice.total).toFixed(2)}`, true, [79, 70, 229])

  // Notes
  if (invoice.notes) {
    const noteY = afterTable + drawTotalRow._y + 5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    doc.text('NOTES', margin, noteY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(75, 85, 99)
    doc.text(invoice.notes, margin, noteY + 6)
  }

  // Footer
  const footY = 285
  doc.setFillColor(243, 244, 246)
  doc.rect(0, footY, W, 12, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('Thank you for dining with us! Please visit again.', W / 2, footY + 7, { align: 'center' })

  doc.save(`${invoice.invoiceNumber}.pdf`)
}
