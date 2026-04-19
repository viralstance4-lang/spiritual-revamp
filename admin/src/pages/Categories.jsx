import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, X, Loader2, AlertTriangle,
  CheckCircle, EyeOff, Globe, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const EMPTY = {
  name: '', description: '', emoji: '✨', color: '#D4AF37',
  imageUrl: '', status: 'published', order: 0,
};

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  return status === 'published'
    ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/15 text-green-400 border border-green-500/20">
        <Globe className="w-3 h-3" /> Published
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
        <EyeOff className="w-3 h-3" /> Draft
      </span>
    );
}

// ─── Category Modal ────────────────────────────────────────────────────────────
function CategoryModal({ category, onClose, onSaved }) {
  const [form, setForm] = useState(category ? {
    name:        category.name,
    description: category.description || '',
    emoji:       category.emoji || '✨',
    color:       category.color || '#D4AF37',
    imageUrl:    category.imageUrl || '',
    status:      category.status,
    order:       category.order ?? 0,
  } : EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (category) {
        await api.put(`/categories/${category._id}`, form);
        toast.success('Category updated');
      } else {
        await api.post('/categories', form);
        toast.success('Category created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const inp = 'w-full bg-dark-400 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold-500/50 transition-colors';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-dark-50 border border-white/10 rounded-2xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">{category ? 'Edit Category' : 'New Category'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name + Emoji */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Emoji</label>
              <input value={form.emoji} onChange={set('emoji')} className={`${inp} text-center text-xl`} placeholder="✨" maxLength={4} />
            </div>
            <div className="col-span-3">
              <label className="block text-xs text-white/50 mb-1.5">Name <span className="text-red-400">*</span></label>
              <input value={form.name} onChange={set('name')} className={inp} placeholder="Money & Abundance" required />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2}
              className={`${inp} resize-none`} placeholder="Short description shown on frontend" />
          </div>

          {/* Color + Order + Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Accent Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={set('color')}
                  className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                <input value={form.color} onChange={set('color')} className={`${inp} flex-1 font-mono text-xs`} placeholder="#D4AF37" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Sort Order</label>
              <input type="number" min={0} value={form.order} onChange={set('order')} className={inp} />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Status</label>
              <select value={form.status} onChange={set('status')} className={inp}>
                <option value="published" className="bg-dark-50">Published</option>
                <option value="draft"     className="bg-dark-50">Draft</option>
              </select>
            </div>
          </div>

          {/* Image URL (optional) */}
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Image URL (optional)</label>
            <input value={form.imageUrl} onChange={set('imageUrl')} className={inp} placeholder="https://... (banner/thumbnail)" />
            {form.imageUrl && (
              <img src={form.imageUrl} alt="preview" className="mt-2 h-20 w-full object-cover rounded-xl border border-white/10" />
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {category ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteModal({ category, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-dark-50 border border-white/10 rounded-2xl p-6 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Delete Category</h3>
            <p className="text-xs text-white/40">This cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-white/60 mb-5">Delete <span className="text-white font-medium">"{category.name}"</span>?</p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all">
            Cancel
          </button>
          <button
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              await onConfirm(category._id);
              setDeleting(false);
            }}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null); // null | 'create' | categoryObj
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories/admin');
      setCategories(res.data.categories || []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      setCategories(prev => prev.filter(c => c._id !== id));
      toast.success('Category deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleToggleStatus = async (cat) => {
    const newStatus = cat.status === 'published' ? 'draft' : 'published';
    try {
      const res = await api.put(`/categories/${cat._id}`, { status: newStatus });
      setCategories(prev => prev.map(c => c._id === cat._id ? res.data.category : c));
      toast.success(`Category ${newStatus === 'published' ? 'published' : 'set to draft'}`);
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Categories</h1>
          <p className="text-sm text-white/40 mt-0.5">{categories.length} categories · Published show on frontend</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetch} className="btn-outline py-2 px-3 text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setModal('create')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {['Category', 'Slug', 'Description', 'Order', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 rounded skeleton w-24" /></td>
                  ))}
                </tr>
              ))
            ) : categories.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-white/30">No categories yet. Create one above.</td></tr>
            ) : categories.map(cat => (
              <tr key={cat._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.emoji}</span>
                    <div>
                      <p className="font-medium text-white">{cat.name}</p>
                      {cat.color && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                          <span className="text-[10px] text-white/30 font-mono">{cat.color}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-white/40">{cat.slug}</td>
                <td className="px-4 py-3 max-w-[200px]">
                  <p className="text-xs text-white/50 truncate">{cat.description || '—'}</p>
                </td>
                <td className="px-4 py-3 text-white/50 text-sm">{cat.order}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggleStatus(cat)} className="hover:opacity-80 transition-opacity">
                    <StatusBadge status={cat.status} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setModal(cat)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-gold-400 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(cat)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <CategoryModal
            key={modal === 'create' ? 'create' : modal._id}
            category={modal === 'create' ? null : modal}
            onClose={() => setModal(null)}
            onSaved={() => { setModal(null); fetch(); }}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            category={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
