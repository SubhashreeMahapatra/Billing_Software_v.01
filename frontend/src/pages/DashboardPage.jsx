import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { TrendingUp, FileText, CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react'
import api from '../utils/api'
import { fmt, fmtDate, statusBadge, getCategoryColor } from '../utils/helpers'

const PIE_COLORS = ['#4f46e5','#0ea5e9','#f59e0b','#10b981','#ef4444','#8b5cf6']

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setStats(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const kpis = [
    { label: 'Total Revenue', value: fmt(stats.totalRevenue), icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Total Invoices', value: stats.totalInvoices, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Paid', value: stats.paidInvoices, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pending', value: stats.pendingInvoices, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back! Here's what's happening today.</p>
        </div>
        <Link to="/billing" className="btn btn-primary">
          <Plus className="w-4 h-4" /> New Bill
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div className="flex items-center justify-between">
              <p className="kpi-label">{k.label}</p>
              <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon className={`w-4 h-4 ${k.color}`} />
              </div>
            </div>
            <p className="kpi-value">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Category Bar */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Revenue by Category</span>
          </div>
          <div className="p-4 h-56">
            {stats.topCategories.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topCategories} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                  <Tooltip formatter={v => fmt(v)} />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty label="No sales data yet" />}
          </div>
        </div>

        {/* Status Pie */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Invoice Status</span>
          </div>
          <div className="p-4 h-56">
            {stats.totalInvoices ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Paid', value: stats.paidInvoices },
                      { name: 'Pending', value: stats.pendingInvoices },
                      { name: 'Others', value: stats.totalInvoices - stats.paidInvoices - stats.pendingInvoices },
                    ].filter(d => d.value > 0)}
                    cx="50%" cy="50%" outerRadius={65} innerRadius={30} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={true} paddingAngle={3}
                  >
                    {['#10b981', '#f59e0b', '#ef4444'].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <Empty label="No invoices yet" />}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent invoices */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <span className="card-title">Recent Invoices</span>
            <Link to="/invoices" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="table-container">
            {stats.recentInvoices.length ? (
              <table>
                <thead><tr><th>Invoice</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {stats.recentInvoices.map(inv => (
                    <tr key={inv.id}>
                      <td className="font-medium text-brand-600">{inv.invoiceNumber}</td>
                      <td>{inv.customerName}</td>
                      <td className="font-semibold">{fmt(inv.total)}</td>
                      <td><span className={`badge ${statusBadge(inv.status)}`}>{inv.status}</span></td>
                      <td className="text-gray-400 text-xs">{fmtDate(inv.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">No invoices yet. <Link to="/billing" className="text-brand-600">Create one →</Link></div>
            )}
          </div>
        </div>

        {/* Low stock */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-yellow-500" /> Low Stock
            </span>
            <Link to="/inventory" className="text-xs text-brand-600 hover:underline">Manage</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.lowStockItems.length ? stats.lowStockItems.map(item => (
              <div key={item.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800 leading-tight">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.category}</p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${item.stock === 0 ? 'text-red-600' : 'text-yellow-600'}`}>{item.stock}</span>
                  <p className="text-xs text-gray-400">/ {item.lowStockAlert} alert</p>
                </div>
              </div>
            )) : (
              <div className="p-6 text-center text-sm text-gray-400">✓ All stock levels OK</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>
}
function Empty({ label }) {
  return <div className="h-full flex items-center justify-center text-sm text-gray-400">{label}</div>
}
