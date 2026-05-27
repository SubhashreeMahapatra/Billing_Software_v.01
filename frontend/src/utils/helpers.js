export const fmt = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export const statusBadge = (status) => {
  const map = {
    paid: 'badge-green',
    pending: 'badge-yellow',
    cancelled: 'badge-red',
  }
  return map[status] || 'badge-gray'
}

export const categoryColors = {
  Starters: 'bg-orange-100 text-orange-800',
  'Main Course': 'bg-red-100 text-red-800',
  'Rice & Biryani': 'bg-yellow-100 text-yellow-800',
  Breads: 'bg-amber-100 text-amber-800',
  Desserts: 'bg-pink-100 text-pink-800',
  Beverages: 'bg-blue-100 text-blue-800',
  Combos: 'bg-purple-100 text-purple-800',
}

export const getCategoryColor = (cat) =>
  categoryColors[cat] || 'bg-gray-100 text-gray-700'

export function debounce(fn, delay = 300) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay) }
}
