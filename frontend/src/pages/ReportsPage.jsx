import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { TrendingUp, DollarSign, Receipt, Percent } from 'lucide-react'
import api from '../utils/api'
import { fmt, getCategoryColor } from '../utils/helpers'

const PERIODS = [
  { label: 'Last 7 Days', value: 'week' },
  { label: 'Last 30 Days', value: 'month' },
  { label: 'Last Year', value: 'year' },
]

export default function ReportsPage() {
  const [stats, setStats] = useState(null)
  const [report, setReport] = useState(null)
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get(`/dashboard/report?period=${period}`)
    ]).then(([s, r]) => {
      setStats(s.data)
      setReport(r.data)
    }).finally(() => setLoading(false))
  }, [period])

  if (loading || !stats || !report) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>

  const paid = stats.paidInvoices
  const total = stats.totalInvoices
  const collectionRate = total ? Math.round((paid / total) * 100) : 0

  const kpis = [
    { label: 'Total Revenue', value: fmt(stats.totalRevenue), icon: DollarSign, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Total Invoices', value: total, icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avg Invoice Value', value: total ? fmt(stats.totalRevenue / total) : '₹0', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Collection Rate', value: `${collectionRate}%`, icon: Percent, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${period === p.value ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {p.label}
            </button>
          ))}
        </div>
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

      {/* Revenue trend */}
      <div className="card">
        <div className="card-header"><span className="card-title">Revenue Trend</span></div>
        <div className="p-4 h-64">
          {report.dailyRevenue?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.dailyRevenue} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                <Tooltip formatter={v => [fmt(v), 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} dot={{ fill: '#4f46e5', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-400">No revenue data for this period</div>
          )}
        </div>
      </div>

      {/* Two column: Top products + Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top products */}
        <div className="card">
          <div className="card-header"><span className="card-title">Top Selling Items</span></div>
          <div className="p-4 h-64">
            {report.topProducts?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.topProducts} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 8 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip formatter={v => [fmt(v), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">No sales data yet</div>
            )}
          </div>
        </div>

        {/* Category revenue */}
        <div className="card">
          <div className="card-header"><span className="card-title">Revenue by Category</span></div>
          <div className="card-body space-y-3 max-h-64 overflow-y-auto">
            {stats.topCategories.length ? stats.topCategories.map((cat, i) => {
              const max = stats.topCategories[0]?.revenue || 1
              const pct = Math.round((cat.revenue / max) * 100)
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(cat.category)}`}>{cat.category}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-800">{fmt(cat.revenue)}</span>
                      <span className="text-xs text-gray-400 ml-2">{cat.units} units</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            }) : <p className="text-sm text-gray-400 text-center py-8">No category data yet</p>}
          </div>
        </div>
      </div>

      {/* Top products table */}
      {report.topProducts?.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title">Product Performance</span></div>
          <div className="table-container">
            <table>
              <thead><tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
              <tbody>
                {report.topProducts.map((p, i) => (
                  <tr key={p.name}>
                    <td className="text-gray-400 font-mono text-xs">{String(i + 1).padStart(2, '0')}</td>
                    <td className="font-medium text-gray-800">{p.name}</td>
                    <td><span className="badge badge-blue">{p.qty} sold</span></td>
                    <td className="font-bold text-brand-600">{fmt(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
