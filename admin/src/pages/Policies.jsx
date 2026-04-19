import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Save, Loader2, AlertTriangle, FileText, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

// ─── Simple HTML rich-text editor using contentEditable ───────────────────────
function RichEditor({ value, onChange }) {
  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-dark-400 border border-white/10 rounded-t-xl">
        {[
          { cmd: 'bold',        label: 'B',  style: 'font-bold' },
          { cmd: 'italic',      label: 'I',  style: 'italic' },
          { cmd: 'underline',   label: 'U',  style: 'underline' },
        ].map(({ cmd, label, style }) => (
          <button key={cmd} type="button"
            onMouseDown={e => { e.preventDefault(); document.execCommand(cmd); }}
            className={`w-8 h-8 rounded-lg text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors ${style}`}>
            {label}
          </button>
        ))}
        <div className="w-px h-6 bg-white/10 mx-1 self-center" />
        {[
          { cmd: 'insertUnorderedList', label: '• List' },
          { cmd: 'insertOrderedList',   label: '1. List' },
        ].map(({ cmd, label }) => (
          <button key={cmd} type="button"
            onMouseDown={e => { e.preventDefault(); document.execCommand(cmd); }}
            className="px-2 h-8 rounded-lg text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors">
            {label}
          </button>
        ))}
        <div className="w-px h-6 bg-white/10 mx-1 self-center" />
        {['h2', 'h3', 'p'].map(tag => (
          <button key={tag} type="button"
            onMouseDown={e => { e.preventDefault(); document.execCommand('formatBlock', false, tag); }}
            className="px-2 h-8 rounded-lg text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors uppercase">
            {tag}
          </button>
        ))}
      </div>

      {/* Editable area */}
      <div
        contentEditable
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={e => onChange(e.currentTarget.innerHTML)}
        className="policy-content min-h-[300px] p-4 bg-dark-400 border border-white/10 border-t-0 rounded-b-xl
                   outline-none focus:border-gold-500/40 cursor-text"
      />
    </div>
  );
}

// ─── Policy Modal ──────────────────────────────────────────────────────────────
function PolicyModal({ policy, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:    policy?.title    || '',
    content:  policy?.content  || '',
    isActive: policy?.isActive ?? true,
    order:    policy?.order    ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      if (policy) {
        await api.put(`/policies/${policy._id}`, form);
        toast.success('Policy updated');
      } else {
        await api.post('/policies', form);
        toast.success('Policy created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
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
        className="bg-dark-50 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-dark-50 z-10">
          <h2 className="text-lg font-semibold text-white">{policy ? 'Edit Policy' : 'Add Policy'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title + meta */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-white/60 mb-1.5">Title <span className="text-red-400">*</span></label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Privacy Policy, Terms & Conditions, Refund Policy…"
                className="w-full bg-dark-400 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Display Order</label>
              <input
                type="number" min={0}
                value={form.order}
                onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                className="w-full bg-dark-400 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Content editor */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">Content</label>
            <RichEditor value={form.content} onChange={v => setForm(f => ({ ...f, content: v }))} />
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              className={`relative w-10 h-6 rounded-full transition-colors ${form.isActive ? 'bg-gold-500' : 'bg-white/20'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-white/70">Show in footer</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />{policy ? 'Update' : 'Create'}</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ policy, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const handle = async () => {
    setDeleting(true);
    try {
      await api.delete(`/policies/${policy._id}`);
      toast.success('Policy deleted');
      onDeleted();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-dark-50 border border-white/10 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Delete Policy</h3>
            <p className="text-sm text-white/40">This cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-white/60 mb-5">Delete <span className="text-white font-medium">"{policy.title}"</span>?</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
          <button onClick={handle} disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal, setModal]       = useState(null);

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await api.get('/policies/admin/all');
      setPolicies(res.data.policies || []);
    } catch { toast.error('Failed to load policies'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  const close   = () => setModal(null);
  const onSaved = () => { close(); fetchPolicies(); };
  const onDeleted = () => { close(); fetchPolicies(); };

  const toggleActive = async (p) => {
    try {
      await api.put(`/policies/${p._id}`, { isActive: !p.isActive });
      fetchPolicies();
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Policies</h1>
          <p className="text-sm text-white/40 mt-0.5">Manage footer policies — Privacy, Terms, Refund, etc.</p>
        </div>
        <button onClick={() => setModal({ type: 'add' })}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm rounded-xl transition-all">
          <Plus className="w-4 h-4" /> Add Policy
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-gold-500" /></div>
      ) : policies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 glass rounded-2xl">
          <FileText className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-white/40 font-medium">No policies yet</p>
          <p className="text-sm text-white/20 mt-1">Click "Add Policy" to create your first one</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider hidden md:table-cell">Slug</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">Visible</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">Order</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {policies.map(p => (
                  <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-gold-400" />
                        </div>
                        <p className="text-sm font-medium text-white">{p.title}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-xs text-white/40 font-mono">/policy/{p.slug}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button onClick={() => toggleActive(p)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          p.isActive ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25' : 'bg-white/10 text-white/30 hover:bg-white/15'
                        }`}>
                        {p.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {p.isActive ? 'Visible' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-white/40">{p.order}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setModal({ type: 'edit', policy: p })}
                          className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setModal({ type: 'delete', policy: p })}
                          className="w-8 h-8 rounded-lg hover:bg-red-500/15 flex items-center justify-center text-white/40 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {modal?.type === 'add'    && <PolicyModal onClose={close} onSaved={onSaved} />}
        {modal?.type === 'edit'   && <PolicyModal policy={modal.policy} onClose={close} onSaved={onSaved} />}
        {modal?.type === 'delete' && <DeleteConfirm policy={modal.policy} onClose={close} onDeleted={onDeleted} />}
      </AnimatePresence>
    </div>
  );
}
