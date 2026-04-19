import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, X, Tag, Loader2,
  CheckCircle, XCircle, Calendar, Users, Percent, DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = {
  date: (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
  inr:  (n) => `₹${Number(n).toLocaleString('en-IN')}`,
};

function isExpired(expiresAt) {
  return expiresAt && new Date() > new Date(expiresAt);
}

const EMPTY_FORM = {
  code: '', description: '', discountType: 'percentage', discountValue: '',
  minOrderValue: '', maxDiscountAmount: '', isActive: true,
  usageLimit: '', expiresAt: '',
};

// ─── Coupon Modal (Create / Edit) ──────────────────────────────────────────────
function CouponModal({ coupon, onClose, onSaved }) {
  const [form, setForm] = useState(coupon ? {
    code:              coupon.code,
    description:       coupon.description || '',
    discountType:      coupon.discountType,
    discountValue:     String(coupon.discountValue),
    minOrderValue:     String(coupon.minOrderValue || ''),
    maxDiscountAmount: String(coupon.maxDiscountAmount || ''),
    isActive:          coupon.isActive,
    usageLimit:        String(coupon.usageLimit || ''),
    expiresAt:         coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [k]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim())       { toast.error('Coupon code is required'); return; }
    if (!form.discountValue)     { toast.error('Discount value is required'); return; }
    if (Number(form.discountValue) <= 0) { toast.error('Discount value must be > 0'); return; }
    if (form.discountType === 'percentage' && Number(form.discountValue) > 100) {
      toast.error('Percentage cannot exceed 100'); return;
    }

    setSaving(true);
    const payload = {
      code:              form.code.toUpperCase().trim(),
      description:       form.description,
      discountType:      form.discountType,
      discountValue:     Number(form.discountValue),
      minOrderValue:     Number(form.minOrderValue)     || 0,
      maxDiscountAmount: Number(form.maxDiscountAmount) || 0,
      isActive:          form.isActive,
      usageLimit:        Number(form.usageLimit)        || 0,
      expiresAt:         form.expiresAt || null,
    };

    try {
      if (coupon) {
        await api.put(`/coupons/${coupon._id}`, payload);
        toast.success('Coupon updated');
      } else {
        await api.post('/coupons', payload);
        toast.success('Coupon created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const inp = 'w-full bg-dark-400 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold-500/50 transition-colors';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-dark-50 border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">{coupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Code + Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">
                Code <span className="text-red-400">*</span>
              </label>
              <input value={form.code} onChange={set('code')} placeholder="WELCOME10"
                className={`${inp} uppercase font-mono tracking-widest`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Description</label>
              <input value={form.description} onChange={set('description')}
                placeholder="10% off your first order" className={inp} />
            </div>
          </div>

          {/* Discount Type + Value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">
                Discount Type <span className="text-red-400">*</span>
              </label>
              <select value={form.discountType} onChange={set('discountType')} className={inp}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">
                Discount Value <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/40">
                  {form.discountType === 'percentage' ? '%' : '₹'}
                </span>
                <input type="number" min="0" value={form.discountValue} onChange={set('discountValue')}
                  placeholder={form.discountType === 'percentage' ? '10' : '100'} className={`${inp} pl-7`} />
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Min Order Value (₹)</label>
              <input type="number" min="0" value={form.minOrderValue} onChange={set('minOrderValue')}
                placeholder="0 = no minimum" className={inp} />
            </div>
            {form.discountType === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">Max Discount Cap (₹)</label>
                <input type="number" min="0" value={form.maxDiscountAmount} onChange={set('maxDiscountAmount')}
                  placeholder="0 = no cap" className={inp} />
              </div>
            )}
          </div>

          {/* Usage + Expiry */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Usage Limit</label>
              <input type="number" min="0" value={form.usageLimit} onChange={set('usageLimit')}
                placeholder="0 = unlimited" className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Expiry Date</label>
              <input type="date" value={form.expiresAt} onChange={set('expiresAt')}
                min={new Date().toISOString().slice(0, 10)} className={inp} />
            </div>
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={set('isActive')}
              className="accent-yellow-500 w-4 h-4" />
            <span className="text-sm text-white/60">Active (visible to customers)</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-white/10">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/60
                         hover:text-white hover:bg-white/5 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold
                         text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                : coupon ? 'Update Coupon' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Coupon Row ────────────────────────────────────────────────────────────────
function CouponRow({ coupon, onEdit, onDelete, onToggle }) {
  const expired   = isExpired(coupon.expiresAt);
  const maxedOut  = coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;
  const effective = coupon.isActive && !expired && !maxedOut;

  const statusLabel = !coupon.isActive ? 'Inactive'
    : expired     ? 'Expired'
    : maxedOut    ? 'Limit reached'
    : 'Active';

  const statusClass = effective
    ? 'bg-green-500/15 text-green-400 border-green-500/20'
    : 'bg-red-500/15 text-red-400 border-red-500/20';

  return (
    <tr className="border-b border-white/5 hover:bg-white/3 transition-colors">
      {/* Code */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" />
          <span className="font-mono text-sm font-semibold text-white">{coupon.code}</span>
        </div>
        {coupon.description && (
          <p className="text-xs text-white/30 mt-0.5 ml-5.5">{coupon.description}</p>
        )}
      </td>

      {/* Discount */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {coupon.discountType === 'percentage'
            ? <Percent className="w-3.5 h-3.5 text-blue-400" />
            : <DollarSign className="w-3.5 h-3.5 text-green-400" />}
          <span className="text-sm font-semibold text-white">
            {coupon.discountType === 'percentage'
              ? `${coupon.discountValue}%`
              : fmt.inr(coupon.discountValue)}
          </span>
        </div>
        {coupon.minOrderValue > 0 && (
          <p className="text-xs text-white/30 mt-0.5">Min: {fmt.inr(coupon.minOrderValue)}</p>
        )}
        {coupon.discountType === 'percentage' && coupon.maxDiscountAmount > 0 && (
          <p className="text-xs text-white/30">Cap: {fmt.inr(coupon.maxDiscountAmount)}</p>
        )}
      </td>

      {/* Usage */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-white/30" />
          <span className="text-sm text-white/60">
            {coupon.usedCount}
            {coupon.usageLimit > 0 ? ` / ${coupon.usageLimit}` : ' / ∞'}
          </span>
        </div>
        {coupon.usageLimit > 0 && (
          <div className="mt-1 h-1 w-20 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-500 rounded-full"
              style={{ width: `${Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100)}%` }}
            />
          </div>
        )}
      </td>

      {/* Expiry */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-white/30" />
          <span className={`text-sm ${expired ? 'text-red-400' : 'text-white/60'}`}>
            {fmt.date(coupon.expiresAt)}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${statusClass}`}>
          {effective ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {statusLabel}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button onClick={() => onToggle(coupon)} title={coupon.isActive ? 'Deactivate' : 'Activate'}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
              ${coupon.isActive
                ? 'hover:bg-red-500/10 text-white/40 hover:text-red-400'
                : 'hover:bg-green-500/10 text-white/40 hover:text-green-400'}`}>
            {coupon.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </button>
          <button onClick={() => onEdit(coupon)} title="Edit"
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-white/40 hover:text-gold-400 flex items-center justify-center transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(coupon)} title="Delete"
            className="w-8 h-8 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 flex items-center justify-center transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Coupons() {
  const [coupons,     setCoupons]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(null); // null | {type, coupon?}
  const [deleting,    setDeleting]    = useState(null); // coupon to delete

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data.coupons || []);
    } catch { toast.error('Failed to load coupons'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const handleToggle = async (coupon) => {
    try {
      await api.put(`/coupons/${coupon._id}`, { isActive: !coupon.isActive });
      setCoupons(prev => prev.map(c => c._id === coupon._id ? { ...c, isActive: !c.isActive } : c));
      toast.success(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'}`);
    } catch { toast.error('Failed to update coupon'); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/coupons/${deleting._id}`);
      setCoupons(prev => prev.filter(c => c._id !== deleting._id));
      toast.success('Coupon deleted');
      setDeleting(null);
    } catch { toast.error('Failed to delete coupon'); }
  };

  const onSaved = () => { setModal(null); fetchCoupons(); };

  // Stats
  const activeCount  = coupons.filter(c => c.isActive && !isExpired(c.expiresAt)).length;
  const totalUsed    = coupons.reduce((s, c) => s + c.usedCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Coupons</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {coupons.length} total · {activeCount} active · {totalUsed} total uses
          </p>
        </div>
        <button onClick={() => setModal({ type: 'add' })}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold-500 hover:bg-gold-400
                     text-black font-semibold text-sm rounded-xl transition-all">
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Code', 'Discount', 'Usage', 'Expiry', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded skeleton w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Tag className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-white/30">No coupons yet. Create your first one!</p>
                  </td>
                </tr>
              ) : coupons.map(coupon => (
                <CouponRow
                  key={coupon._id}
                  coupon={coupon}
                  onEdit={c => setModal({ type: 'edit', coupon: c })}
                  onDelete={setDeleting}
                  onToggle={handleToggle}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal?.type === 'add'  && <CouponModal onClose={() => setModal(null)} onSaved={onSaved} />}
        {modal?.type === 'edit' && <CouponModal coupon={modal.coupon} onClose={() => setModal(null)} onSaved={onSaved} />}

        {deleting && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDeleting(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dark-50 border border-white/10 rounded-2xl p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Delete Coupon</h3>
                  <p className="text-xs text-white/40">This cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-white/60 mb-5">
                Delete coupon <span className="font-mono font-semibold text-white">{deleting.code}</span>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleting(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
