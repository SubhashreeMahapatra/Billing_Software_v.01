import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Edit2, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { fmt } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'

const EMPTY = { name: '', phone: '', email: '', address: '', gstin: '' }

export default function CustomersPage() {
  const { isAdmin } = useAuth()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/customers').then(r => setCustomers(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address, gstin: c.gstin }); setModal(true) }

  const save = async () => {
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return }
    setSaving(true)
    try {
      if (editing) await api.put(`/customers/${editing.id}`, form)
      else await api.post('/customers', form)
      toast.success(editing ? 'Customer updated' : 'Customer added')
      setModal(false)
      load()
    } finally { setSaving(false) }
  }

  const remove = async (c) => {
    if (!confirm(`Delete customer "${c.name}"?`)) return
    await api.delete(`/customers/${c.id}`)
    toast.success('Customer deleted')
    load()
  }

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  const initials = (name) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Customers</h1>
        <button onClick={openAdd} className="btn btn-primary"><Plus className="w-4 h-4" /> Add Customer</button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input className="input pl-8 text-xs w-64" placeholder="Search by name, phone or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} customer{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Email</th>
                <th>GSTIN</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center py-12 text-gray-400"><span className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin inline-block" /></td></tr>}
              {!loading && !filtered.length && (
                <tr><td colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Users className="w-8 h-8" />
                    <p className="text-sm">No customers yet</p>
                    <button onClick={openAdd} className="btn btn-primary btn-sm mt-1"><Plus className="w-3 h-3" /> Add Customer</button>
                  </div>
                </td></tr>
              )}
              {!loading && filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {initials(c.name)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{c.name}</div>
                        {c.address && <div className="text-xs text-gray-400 truncate max-w-40">{c.address}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="text-sm">{c.phone}</td>
                  <td className="text-sm text-brand-600">{c.email || <span className="text-gray-300">—</span>}</td>
                  <td><code className="text-xs text-gray-500">{c.gstin || '—'}</code></td>
                  <td><span className="font-medium text-gray-700">{c.totalOrders}</span></td>
                  <td><span className="font-semibold text-gray-800">{fmt(c.totalSpent)}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="btn btn-sm btn-secondary"><Edit2 className="w-3.5 h-3.5" /></button>
                      {isAdmin && <button onClick={() => remove(c)} className="btn btn-sm btn-danger"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal modal-sm">
            <div className="card-header px-6 py-5 border-b">
              <span className="text-base font-semibold">{editing ? 'Edit Customer' : 'Add Customer'}</span>
              <button onClick={() => setModal(false)} className="btn btn-sm btn-secondary p-1.5"><span className="text-lg leading-none">×</span></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Full Name *</label>
                  <input className="input" placeholder="Customer name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Phone *</label>
                  <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input" placeholder="email@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="label">Address</label>
                  <input className="input" placeholder="Full address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="label">GSTIN</label>
                  <input className="input" placeholder="22AAAAA0000A1Z5" value={form.gstin} onChange={e => setForm(p => ({ ...p, gstin: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2 rounded-b-2xl">
              <button onClick={() => setModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={save} disabled={saving} className="btn btn-primary">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editing ? 'Update' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
