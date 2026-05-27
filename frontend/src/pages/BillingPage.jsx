import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, FileDown, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { fmt, getCategoryColor } from '../utils/helpers'
import { generateInvoicePDF } from '../utils/pdfGenerator'

const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Bank Transfer']
const GST_RATES = [0, 5, 12, 18, 28]

export default function BillingPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [categories, setCategories] = useState([])
  const [selCat, setSelCat] = useState('All')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState([])
  const [form, setForm] = useState({
    customerName: '', customerPhone: '', customerId: '',
    gstPercent: 5, discountPercent: 0, notes: '', paymentMethod: 'Cash'
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/products').then(r => setProducts(r.data))
    api.get('/customers').then(r => setCustomers(r.data))
    api.get('/products/categories').then(r => setCategories(['All', ...r.data]))
  }, [])

  const filteredProducts = products.filter(p =>
    (selCat === 'All' || p.category === selCat) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  )

  const addItem = (product) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id)
      if (existing) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { productId: product.id, productName: product.name, category: product.category, unitPrice: product.price, quantity: 1 }]
    })
  }

  const updateItem = (idx, field, val) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: field === 'quantity' || field === 'unitPrice' ? Number(val) : val } : item))
  }

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const gstAmt = subtotal * (form.gstPercent / 100)
  const discAmt = (subtotal + gstAmt) * (form.discountPercent / 100)
  const total = subtotal + gstAmt - discAmt

  const handleCustomerSelect = (e) => {
    const c = customers.find(c => c.id === Number(e.target.value))
    if (c) setForm(p => ({ ...p, customerId: c.id, customerName: c.name, customerPhone: c.phone }))
    else setForm(p => ({ ...p, customerId: '' }))
  }

  const save = async (markPaid = false) => {
    if (!form.customerName.trim()) { toast.error('Enter customer name'); return }
    if (!items.length) { toast.error('Add at least one item'); return }
    setSaving(true)
    try {
      const payload = {
        customerId: form.customerId || null,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        items: items.map(i => ({ productId: i.productId, productName: i.productName, category: i.category, quantity: i.quantity, unitPrice: i.unitPrice })),
        gstPercent: form.gstPercent,
        discountPercent: form.discountPercent,
        notes: form.notes,
        paymentMethod: form.paymentMethod
      }
      const res = await api.post('/invoices', payload)
      const inv = res.data
      if (markPaid) await api.put(`/invoices/${inv.id}/status`, { status: 'paid' })
      toast.success(`Invoice ${inv.invoiceNumber} created!`)
      navigate('/invoices')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">New Bill</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Product selector — left 2 cols */}
        <div className="xl:col-span-2 space-y-3">
          <div className="card">
            <div className="card-header"><span className="card-title">Menu Items</span></div>
            <div className="p-3 space-y-2">
              <input className="input text-xs" placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
              <div className="flex gap-1.5 flex-wrap">
                {categories.map(c => (
                  <button key={c} onClick={() => setSelCat(c)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${selCat === c ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
              {filteredProducts.map(p => (
                <button key={p.id} onClick={() => addItem(p)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left group">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getCategoryColor(p.category)}`}>{p.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-brand-600">{fmt(p.price)}</p>
                    <p className="text-[10px] text-gray-400">Stock: {p.stock}</p>
                  </div>
                </button>
              ))}
              {!filteredProducts.length && <p className="p-6 text-center text-sm text-gray-400">No items found</p>}
            </div>
          </div>
        </div>

        {/* Bill builder — right 3 cols */}
        <div className="xl:col-span-3 space-y-4">
          {/* Customer & settings */}
          <div className="card">
            <div className="card-header"><span className="card-title">Customer & Settings</span></div>
            <div className="card-body grid grid-cols-2 gap-3">
              <div>
                <label className="label">Select Existing Customer</label>
                <select className="input text-xs" onChange={handleCustomerSelect}>
                  <option value="">— Walk-in / New —</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Customer Name *</label>
                <input className="input" placeholder="Walk-in Guest" value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" placeholder="+91 98765 43210" value={form.customerPhone} onChange={e => setForm(p => ({ ...p, customerPhone: e.target.value }))} />
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select className="input" value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                  {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label">GST %</label>
                <select className="input" value={form.gstPercent} onChange={e => setForm(p => ({ ...p, gstPercent: Number(e.target.value) }))}>
                  {GST_RATES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Discount %</label>
                <input type="number" className="input" min="0" max="100" value={form.discountPercent} onChange={e => setForm(p => ({ ...p, discountPercent: Number(e.target.value) }))} />
              </div>
              <div className="col-span-2">
                <label className="label">Notes</label>
                <input className="input" placeholder="Special instructions, table no…" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Order Items ({items.length})</span>
              <button onClick={() => setItems([])} className="btn btn-sm btn-danger"><X className="w-3 h-3" /> Clear</button>
            </div>
            <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
              {items.length === 0 && (
                <p className="p-6 text-center text-sm text-gray-400">Click items from the menu to add them here</p>
              )}
              {items.map((item, idx) => (
                <div key={idx} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getCategoryColor(item.category)}`}>{item.category}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateItem(idx, 'quantity', Math.max(1, item.quantity - 1))}
                      className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-sm font-bold flex items-center justify-center">−</button>
                    <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateItem(idx, 'quantity', item.quantity + 1)}
                      className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-sm font-bold flex items-center justify-center">+</button>
                  </div>
                  <div className="w-24">
                    <input type="number" className="input text-xs text-right px-2 py-1" value={item.unitPrice}
                      onChange={e => updateItem(idx, 'unitPrice', e.target.value)} />
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm font-semibold text-gray-800">{fmt(item.quantity * item.unitPrice)}</span>
                  </div>
                  <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>

            {/* Totals */}
            {items.length > 0 && (
              <div className="px-4 py-4 bg-gray-50 border-t border-gray-100 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>GST ({form.gstPercent}%)</span><span>{fmt(gstAmt)}</span></div>
                {form.discountPercent > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount ({form.discountPercent}%)</span><span>− {fmt(discAmt)}</span></div>}
                <div className="flex justify-between text-base font-bold text-gray-900 pt-1.5 border-t border-gray-200">
                  <span>Grand Total</span><span className="text-brand-600">{fmt(total)}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-4 py-3 border-t border-gray-100 flex gap-2 justify-end">
              <button onClick={() => save(false)} disabled={saving} className="btn btn-secondary">
                <Save className="w-4 h-4" /> Save as Pending
              </button>
              <button onClick={() => save(true)} disabled={saving} className="btn btn-primary">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save & Mark Paid</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
