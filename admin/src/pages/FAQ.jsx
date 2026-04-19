import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, X, ChevronUp, ChevronDown,
  HelpCircle, Loader2, Eye, EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

// ─── Modal ─────────────────────────────────────────────────────────────────────
function FaqModal({ faq, onClose, onSaved }) {
  const [form, setForm] = useState({
    question: faq?.question || '',
    answer:   faq?.answer   || '',
    order:    faq?.order    ?? 0,
    isActive: faq?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }
    setSaving(true);
    try {
      if (faq) {
        await api.put(`/faqs/${faq._id}`, form);
        toast.success('FAQ updated');
      } else {
        await api.post('/faqs', form);
        toast.success('FAQ created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-dark-50 border border-white/10 rounded-2xl w-full max-w-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">{faq ? 'Edit FAQ' : 'Add FAQ'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">
              Question <span className="text-red-400">*</span>
            </label>
            <input
              value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
              placeholder="e.g. Are the crystals authentic?"
              className="w-full bg-dark-400 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">
              Answer <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.answer}
              onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
              placeholder="Write a clear and helpful answer..."
              rows={4}
              className="w-full bg-dark-400 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold-500/50 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Display Order</label>
              <input
                type="number"
                min={0}
                value={form.order}
                onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                className="w-full bg-dark-400 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500/50 transition-colors"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="accent-yellow-500 w-4 h-4"
                />
                <span className="text-sm text-white/60">Active (visible)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : faq ? 'Update FAQ' : 'Create FAQ'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── FAQ Row ───────────────────────────────────────────────────────────────────
function FaqRow({ faq, onEdit, onDelete, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await api.put(`/faqs/${faq._id}`, { ...faq, isActive: !faq.isActive });
      toast.success(`FAQ ${faq.isActive ? 'hidden' : 'shown'}`);
      onToggle();
    } catch {
      toast.error('Failed to update');
    } finally {
      setToggling(false);
    }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-xl overflow-hidden border ${faq.isActive ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => setExpanded(v => !v)} className="flex-1 flex items-center gap-3 text-left min-w-0">
          {expanded
            ? <ChevronUp className="w-4 h-4 text-gold-400 flex-shrink-0" />
            : <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
          }
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{faq.question}</p>
            {!expanded && (
              <p className="text-xs text-white/30 truncate mt-0.5">{faq.answer}</p>
            )}
          </div>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <span className="text-xs text-white/20 mr-1">#{faq.order}</span>
          <button onClick={handleToggle} disabled={toggling} title={faq.isActive ? 'Hide' : 'Show'}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-white/40 hover:text-blue-400 flex items-center justify-center transition-colors">
            {toggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : faq.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onEdit(faq)} title="Edit"
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-white/40 hover:text-gold-400 flex items-center justify-center transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(faq)} title="Delete"
            className="w-8 h-8 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 flex items-center justify-center transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-white/5">
            <p className="px-10 py-3 text-sm text-white/60 leading-relaxed">{faq.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { type: 'add' } | { type: 'edit', faq } | { type: 'delete', faq }

  const fetchFaqs = useCallback(async () => {
    try {
      const res = await api.get('/faqs/admin');
      setFaqs(res.data.faqs || []);
    } catch {
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFaqs(); }, [fetchFaqs]);

  const confirmDelete = async () => {
    if (modal?.type !== 'delete') return;
    try {
      await api.delete(`/faqs/${modal.faq._id}`);
      toast.success('FAQ deleted');
      setModal(null);
      fetchFaqs();
    } catch {
      toast.error('Failed to delete FAQ');
    }
  };

  const closeModal = () => setModal(null);
  const onSaved = () => { closeModal(); fetchFaqs(); };

  const activeCount = faqs.filter(f => f.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">FAQ Management</h1>
          <p className="text-sm text-white/40 mt-0.5">{faqs.length} total · {activeCount} active</p>
        </div>
        <button onClick={() => setModal({ type: 'add' })}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-sm rounded-xl transition-all">
          <Plus className="w-4 h-4" />
          Add FAQ
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-7 h-7 animate-spin text-yellow-500" />
        </div>
      ) : faqs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <HelpCircle className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/40 font-medium">No FAQs yet</p>
          <p className="text-sm text-white/20 mt-1">Click "Add FAQ" to get started</p>
        </div>
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence>
            {faqs.map(faq => (
              <FaqRow
                key={faq._id}
                faq={faq}
                onEdit={f => setModal({ type: 'edit', faq: f })}
                onDelete={f => setModal({ type: 'delete', faq: f })}
                onToggle={fetchFaqs}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {modal?.type === 'add' && (
          <FaqModal onClose={closeModal} onSaved={onSaved} />
        )}
        {modal?.type === 'edit' && (
          <FaqModal faq={modal.faq} onClose={closeModal} onSaved={onSaved} />
        )}
        {modal?.type === 'delete' && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dark-50 border border-white/10 rounded-2xl p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Delete FAQ</h3>
                  <p className="text-sm text-white/40">This cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-white/60 mb-5 line-clamp-2">"{modal.faq.question}"</p>
              <div className="flex gap-3">
                <button onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button onClick={confirmDelete}
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
