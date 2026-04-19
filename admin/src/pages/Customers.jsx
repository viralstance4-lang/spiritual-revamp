import { useState, useEffect, useCallback } from 'react';
import { Search, Users, RefreshCw, ShoppingBag, Mail, UserCheck } from 'lucide-react';
import api from '../services/api';

const TYPE_LABELS = {
  registered: { label: 'Registered', color: 'bg-blue-500/20 text-blue-400' },
  guest:       { label: 'Guest Buyer', color: 'bg-amber-500/20 text-amber-400' },
  subscriber:  { label: 'Subscriber', color: 'bg-purple-500/20 text-purple-400' },
};

const TYPE_TABS = [
  { key: 'all',        label: 'All',          Icon: Users },
  { key: 'registered', label: 'Registered',   Icon: UserCheck },
  { key: 'guest',      label: 'Guest Buyers', Icon: ShoppingBag },
  { key: 'subscriber', label: 'Subscribers',  Icon: Mail },
];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (typeFilter !== 'all') params.type = typeFilter;
      const res = await api.get('/admin/customers', { params });
      setCustomers(res.data.customers || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      setCustomers([]);
      setError(err.response?.data?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Customers</h1>
          <p className="text-sm text-white/40 mt-0.5">{total} total records</p>
        </div>
        <button onClick={fetchCustomers} className="btn-outline py-2 px-3 text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {TYPE_TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => { setTypeFilter(key); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              typeFilter === key
                ? 'bg-gold-500/20 text-gold-400 border-gold-500/40'
                : 'text-white/50 border-white/10 hover:text-white/80'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="input pl-9"
          placeholder="Search by name or email..."
        />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Customer', 'Email', 'Phone', 'Type', 'Orders', 'Total Spent', 'Joined'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded skeleton w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Users className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-white/30 text-sm">No customers found</p>
                  </td>
                </tr>
              ) : customers.map(customer => {
                const typeMeta = TYPE_LABELS[customer.type] || TYPE_LABELS.registered;
                return (
                  <tr key={customer._id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400 font-semibold text-sm flex-shrink-0">
                          {(customer.name || customer.email)?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-white font-medium">{customer.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/60 text-sm">{customer.email}</td>
                    <td className="px-4 py-3 text-white/60 text-sm">{customer.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-[10px] ${typeMeta.color}`}>{typeMeta.label}</span>
                    </td>
                    <td className="px-4 py-3 text-white/60 text-sm text-center">
                      {customer.orderCount > 0 ? customer.orderCount : '—'}
                    </td>
                    <td className="px-4 py-3 text-white/60 text-sm">
                      {customer.totalSpent > 0 ? `₹${customer.totalSpent.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/40">
                      {new Date(customer.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <p className="text-xs text-white/40">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-xs rounded-lg border border-white/10 text-white/50 hover:text-white disabled:opacity-30 transition-colors">
                ← Prev
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 text-xs rounded-lg border border-white/10 text-white/50 hover:text-white disabled:opacity-30 transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
