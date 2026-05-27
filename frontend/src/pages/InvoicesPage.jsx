import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileDown, Check, X, Search, Plus, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { fmt, fmtDate, statusBadge } from '../utils/helpers'
import { generateInvoicePDF } from '../utils/pdfGenerator'
import { useAuth } from '../context/AuthContext'

const TABS = ['all', 'pending', 'paid', 'cancelled']

export default function InvoicesPage() {
  const { isAdmin } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [total, setTotal] = useState(0)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const load = async (status = tab) => {
    setLoading(true)
    try {
      const params = status !== 'all' ? { status } : {}
      const r = await api.get('/invoices', { params })
      setInvoices(r.data.invoices || [])
      setTotal(r.data.total || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(tab) }, [tab])

  const markPaid = async (id) => {
    await api.put(`/invoices/${id}/status`, { status: 'paid' })
    toast.success('Marked as paid')
    load()
  }

  const cancel = async (id) => {
    if (!confirm('Cancel this invoice?')) return
    await api.put(`/invoices/${id}/status`, { status: 'cancelled' })
    toast.success('Invoice cancelled')
    load()
  }

  const downloadPDF = (inv) => {
    generateInvoicePDF(inv)
    toast.success(`PDF downloaded: ${inv.invoiceNumber}`)
  }

  const filtered = invoices.filter(inv =>
    !search ||
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Invoices</h1>
        <Link to="/billing" className="btn btn-primary"><Plus className="w-4 h-4" /> New Bill</Link>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${tab === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input className="input pl-8 text-xs" placeholder="Search invoice or customer…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} invoice{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">
                  <div className="inline-flex items-center gap-2"><span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /> Loading…</div>
                </td></tr>
              )}
              {!loading && !filtered.length && (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400 text-sm">No invoices found</td></tr>
              )}
              {!loading && filtered.map(inv => (
                <>
                  <tr key={inv.id} className="cursor-pointer" onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}>
                    <td><ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded === inv.id ? 'rotate-180' : ''}`} /></td>
                    <td><span className="font-semibold text-brand-600">{inv.invoiceNumber}</span></td>
                    <td>
                      <div className="font-medium text-gray-800">{inv.customerName}</div>
                      {inv.customerPhone && <div className="text-xs text-gray-400">{inv.customerPhone}</div>}
                    </td>
                    <td className="text-xs text-gray-500">{fmtDate(inv.invoiceDate)}</td>
                    <td className="text-xs text-gray-500">{inv.items?.length || 0} item{inv.items?.length !== 1 ? 's' : ''}</td>
                    <td><span className="font-bold text-gray-800">{fmt(inv.total)}</span></td>
                    <td><span className="badge badge-gray">{inv.paymentMethod}</span></td>
                    <td><span className={`badge ${statusBadge(inv.status)}`}>{inv.status}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button onClick={() => downloadPDF(inv)} className="btn btn-sm btn-secondary" title="Download PDF">
                          <FileDown className="w-3.5 h-3.5" />
                        </button>
                        {inv.status === 'pending' && (
                          <>
                            <button onClick={() => markPaid(inv.id)} className="btn btn-sm btn-success" title="Mark Paid">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            {isAdmin && (
                              <button onClick={() => cancel(inv.id)} className="btn btn-sm btn-danger" title="Cancel">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded === inv.id && (
                    <tr key={`${inv.id}-exp`} className="bg-blue-50/40">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="md:col-span-2">
                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Items Ordered</p>
                            <div className="space-y-1">
                              {inv.items?.map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-1 border-b border-blue-100 last:border-0">
                                  <span className="text-gray-700">{item.productName} × {item.quantity}</span>
                                  <span className="font-medium">{fmt(item.total)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1.5 text-xs">
                            <p className="font-semibold text-gray-500 uppercase tracking-wide mb-2">Summary</p>
                            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{fmt(inv.subtotal)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">GST ({inv.gstPercent}%)</span><span>{fmt(inv.gstAmount)}</span></div>
                            {inv.discountPercent > 0 && <div className="flex justify-between text-green-600"><span>Discount ({inv.discountPercent}%)</span><span>−{fmt(inv.discountAmount)}</span></div>}
                            <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-200"><span>Total</span><span className="text-brand-600">{fmt(inv.total)}</span></div>
                            {inv.notes && <p className="text-gray-400 pt-1 italic">"{inv.notes}"</p>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
