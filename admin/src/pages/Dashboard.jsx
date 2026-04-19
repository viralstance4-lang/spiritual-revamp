import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, ShoppingCart, Users, Package, Star, ArrowUpRight, Wifi, WifiOff } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../services/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#22c55e','#3b82f6','#ec4899','#f97316','#a855f7','#14b8a6','#f59e0b','#ef4444'];

const STATUS_COLORS = {
  placed:     'bg-yellow-500/20 text-yellow-400',
  confirmed:  'bg-blue-500/20 text-blue-400',
  processing: 'bg-purple-500/20 text-purple-400',
  shipped:    'bg-indigo-500/20 text-indigo-400',
  delivered:  'bg-green-500/20 text-green-400',
  cancelled:  'bg-red-500/20 text-red-400',
};

function StatCard({ label, value, sub, icon: Icon, color = 'gold', trend, badge }) {
  const colors = {
    gold:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    green:  'text-green-400 bg-green-500/10 border-green-500/20',
    blue:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    pink:   'text-pink-400 bg-pink-500/10 border-pink-500/20',
  };
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2">
          {badge > 0 && (
            <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full leading-none">
              {badge}
            </span>
          )}
          {trend && (
            <span className="flex items-center gap-0.5 text-xs text-green-400 font-medium">
              <ArrowUpRight className="w-3 h-3" />{trend}
            </span>
          )}
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-sm text-white/50">{label}</p>
      {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-50 border border-white/10 rounded-xl p-3 text-xs">
      <p className="text-white/60 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.dataKey === 'revenue' ? `₹${p.value.toLocaleString('en-IN')}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats]               = useState(null);
  const [monthlyData, setMonthlyData]   = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts]   = useState([]);
  const [categoryPie, setCategoryPie]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [connected, setConnected]       = useState(false);
  const socketRef = useRef(null);

  const fetchStats = () => {
    api.get('/orders/admin/stats')
      .then(res => {
        const d = res.data;
        setStats(d.stats);
        setRecentOrders(d.recentOrders || []);

        // Monthly revenue chart
        if (d.monthlyRevenue?.length > 0) {
          setMonthlyData(d.monthlyRevenue.map(m => ({
            month: MONTHS[m._id.month - 1],
            revenue: m.revenue,
            orders: m.orders,
          })));
        }

        // Top products — real data from DB
        if (d.topProducts?.length > 0) {
          setTopProducts(d.topProducts);
        }

        // Category pie — real data
        if (d.categorySales?.length > 0) {
          const total = d.categorySales.reduce((s, c) => s + c.sold, 0);
          setCategoryPie(
            d.categorySales.map((c, i) => ({
              name: c._id || 'Other',
              value: total > 0 ? Math.round((c.sold / total) * 100) : 0,
              color: PIE_COLORS[i % PIE_COLORS.length],
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();

    const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(BACKEND, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => { setConnected(true); socket.emit('join:admin'); });
    socket.on('disconnect', () => setConnected(false));

    socket.on('orders:update', ({ totalOrders, pendingOrders }) => {
      setStats(prev => prev ? { ...prev, totalOrders, pendingOrders } : prev);
      api.get('/orders/admin/stats').then(res => setRecentOrders(res.data.recentOrders || [])).catch(() => {});
    });

    socket.on('reviews:update', ({ pendingReviews }) => {
      setStats(prev => prev ? { ...prev, pendingReviews } : prev);
    });

    return () => socket.disconnect();
  }, []);

  const statCards = [
    {
      label: 'Total Revenue',
      value: stats ? `₹${(stats.totalRevenue / 1000).toFixed(1)}K` : '₹—',
      sub: `Today: ₹${stats?.todayRevenue?.toLocaleString('en-IN') || '0'}`,
      icon: TrendingUp, color: 'gold',
    },
    {
      label: 'Total Orders',
      value: stats?.totalOrders?.toLocaleString('en-IN') ?? '—',
      sub: `Today: ${stats?.todayOrders ?? '0'} new`,
      icon: ShoppingCart, color: 'blue',
    },
    {
      label: 'Customers',
      value: stats?.totalUsers?.toLocaleString('en-IN') ?? '—',
      sub: 'Registered accounts',
      icon: Users, color: 'purple',
    },
    {
      label: 'Active Orders',
      value: stats?.pendingOrders ?? '—',
      sub: 'Placed / processing / shipped',
      icon: Package, color: 'green',
    },
    {
      label: 'Pending Reviews',
      value: stats?.pendingReviews ?? '—',
      sub: 'Awaiting approval',
      icon: Star, color: 'pink',
      badge: stats?.pendingReviews > 0 ? stats.pendingReviews : 0,
    },
  ];

  // Max sold for progress bar width calculation
  const maxSold = topProducts[0]?.sold || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-white/40 mt-0.5">Welcome back! Here's what's happening today.</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
          connected
            ? 'text-green-400 bg-green-500/10 border-green-500/20'
            : 'text-white/30 bg-white/5 border-white/10'
        }`}>
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {connected ? 'Live' : 'Connecting...'}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-5 h-28 animate-pulse bg-white/5" />
            ))
          : statCards.map(card => <StatCard key={card.label} {...card} />)
        }
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue area chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-1 text-sm">Revenue Overview</h3>
          <p className="text-xs text-white/40 mb-4">Last 6 months</p>
          {monthlyData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-white/20 text-sm">
              No revenue data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category pie chart */}
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-1 text-sm">Sales by Category</h3>
          <p className="text-xs text-white/40 mb-4">Units sold distribution</p>
          {categoryPie.length === 0 ? (
            <div className="h-[160px] flex items-center justify-center text-white/20 text-sm">
              No sales data yet
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {categoryPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    formatter={v => `${v}%`}
                    contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {categoryPie.map(c => (
                  <div key={c.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                    <span className="text-xs text-white/50 truncate">{c.name} {c.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top products + Recent orders */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top products — real data */}
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4 text-sm">Top Selling Products</h3>
          {topProducts.length === 0 ? (
            <div className="py-8 text-center text-white/20 text-sm">No sales recorded yet</div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((p, i) => (
                <div key={p._id} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-white/30 w-4 flex-shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {p.images?.[0]?.url ? (
                    <img src={p.images[0].url} alt={p.name}
                      className="w-8 h-8 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold-500 rounded-full"
                          style={{ width: `${(p.sold / maxSold) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/40 flex-shrink-0">{p.sold} sold</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-white flex-shrink-0">
                    ₹{((p.price * p.sold) / 1000).toFixed(0)}K
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders — real data */}
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4 text-sm">Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <div className="py-8 text-center text-white/20 text-sm">No orders yet</div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map(order => (
                <div key={order._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-white">#{order.orderId}</p>
                    <p className="text-xs text-white/40">
                      {order.user?.name || order.guestInfo?.name || 'Guest'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-white">
                      ₹{order.total?.toLocaleString('en-IN')}
                    </p>
                    <span className={`badge text-[10px] mt-0.5 ${STATUS_COLORS[order.orderStatus] || 'bg-white/10 text-white/40'}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
