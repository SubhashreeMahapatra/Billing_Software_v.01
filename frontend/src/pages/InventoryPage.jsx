import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, AlertTriangle, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { fmt, getCategoryColor } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'

const UNITS = ['Plate', 'Piece', 'Bowl', 'Glass', 'Cup', 'Bottle', 'Scoop', 'Kg', 'Litre', 'Pack', 'Set', 'Thali']
const CATEGORIES = ['Starters', 'Main Course', 'Rice & Biryani', 'Breads', 'Desserts', 'Beverages', 'Combos', 'Others']
const EMPTY_FORM = { name: '', sku: '', category: 'Starters', unit: 'Plate', price: '', costPrice: '', stock: '', lowStockAlert: 10, description: '', isActive: true }

export default function InventoryPage() {
  const { isAdmin } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [categories, setCategories] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/products').then(r => setProducts(r.data)).finally(() => setLoading(false))
    api.get('/products/categories').then(r => setCategories(['All', ...r.data]))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true) }
  const openEdit = (p) => {
    setEditing(p)
    setForm({ name: p.name, sku: p.sku, category: p.category, unit: p.unit, price: p.price, costPrice: p.costPrice, stock: p.stock, lowStockAlert: p.lowStockAlert, description: p.description, isActive: p.isActive })
    setModal(true)
  }

  const save = async () => {
    if (!form.name || !form.price) { toast.error('Name and price are required'); return }
    setSaving(true)
    try {
      if (editing) await api.put(`/products/${editing.id}`, form)
      else await api.post('/products', form)
      toast.success(editing ? 'Product updated' : 'Product added')
      setModal(false)
      load()
    } finally { setSaving(false) }
  }

  const remove = async (p) => {
    if (!confirm(`Delete "${p.name}"?`)) return
    await api.delete(`/products/${p.id}`)
    toast.success('Product deleted')
    load()
  }

  const filtered = products.filter(p =>
    (catFilter === 'All' || p.category === catFilter) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  )

  const stockColor = (p) => p.stock === 0 ? 'text-red-600' : p.stock <= p.lowStockAlert ? 'text-yellow-600' : 'text-green-600'
  const stockLabel = (p) => p.stock === 0 ? 'badge-red' : p.stock <= p.lowStockAlert ? 'badge-yellow' : 'badge-green'
  const stockText = (p) => p.stock === 0 ? 'Out of Stock' : p.stock <= p.lowStockAlert ? 'Low Stock' : 'In Stock'

  const lowCount = products.filter(p => p.stock <= p.lowStockAlert).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
          {lowCount > 0 && <p className="text-xs text-yellow-600 flex items-center gap-1 mt-0.5"><AlertTriangle className="w-3 h-3" /> {lowCount} item{lowCount > 1 ? 's' : ''} low on stock</p>}
        </div>
        {isAdmin && <button onClick={openAdd} className="btn btn-primary"><Plus className="w-4 h-4" /> Add Item</button>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input className="input pl-8 text-xs w-56" placeholder="Search by name or SKU…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${catFilter === c ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {c}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} items</span>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Sale Price</th>
                <th>Cost</th>
                <th>Stock</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} className="text-center py-12 text-gray-400"><span className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin inline-block" /></td></tr>}
              {!loading && !filtered.length && <tr><td colSpan={9} className="text-center py-12"><div className="flex flex-col items-center gap-2 text-gray-400"><Package className="w-8 h-8" /><p className="text-sm">No products found</p></div></td></tr>}
              {!loading && filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="font-medium text-gray-800">{p.name}</div>
                    {p.description && <div className="text-xs text-gray-400 truncate max-w-48">{p.description}</div>}
                  </td>
                  <td><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{p.sku}</code></td>
                  <td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(p.category)}`}>{p.category}</span></td>
                  <td className="text-xs text-gray-500">{p.unit}</td>
                  <td className="font-semibold text-brand-600">{fmt(p.price)}</td>
                  <td className="text-gray-500 text-xs">{fmt(p.costPrice)}</td>
                  <td>
                    <div className={`font-bold ${stockColor(p)}`}>{p.stock}</div>
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full rounded-full ${p.stock === 0 ? 'bg-red-500' : p.stock <= p.lowStockAlert ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(100, p.stock / (p.lowStockAlert * 3) * 100)}%` }} />
                    </div>
                  </td>
                  <td><span className={`badge ${stockLabel(p)}`}>{stockText(p)}</span></td>
                  {isAdmin && (
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="btn btn-sm btn-secondary"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => remove(p)} className="btn btn-sm btn-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal modal-md">
            <div className="card-header px-6 py-5 border-b">
              <span className="text-base font-semibold">{editing ? 'Edit Product' : 'Add New Product'}</span>
              <button onClick={() => setModal(false)} className="btn btn-sm btn-secondary p-1.5"><span className="w-4 h-4 flex items-center justify-center text-lg leading-none">×</span></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Product Name *</label>
                <input className="input" placeholder="e.g. Butter Chicken" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">SKU</label>
                <input className="input" placeholder="e.g. MN-001" value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Unit</label>
                <select className="input" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Sale Price (₹) *</label>
                <input type="number" className="input" min="0" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
              </div>
              <div>
                <label className="label">Cost Price (₹)</label>
                <input type="number" className="input" min="0" step="0.01" value={form.costPrice} onChange={e => setForm(p => ({ ...p, costPrice: e.target.value }))} />
              </div>
              <div>
                <label className="label">Stock Qty</label>
                <input type="number" className="input" min="0" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} />
              </div>
              <div>
                <label className="label">Low Stock Alert</label>
                <input type="number" className="input" min="0" value={form.lowStockAlert} onChange={e => setForm(p => ({ ...p, lowStockAlert: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="label">Description</label>
                <input className="input" placeholder="Optional description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              {editing && (
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-brand-600" />
                  <label htmlFor="isActive" className="text-sm text-gray-600">Active (visible in billing)</label>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2 rounded-b-2xl">
              <button onClick={() => setModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={save} disabled={saving} className="btn btn-primary">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editing ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
