import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Trash2, X, Copy, Check, Play, Image as ImageIcon,
  Film, Search, Filter, Loader2, AlertTriangle, Download,
  HardDrive, ZoomIn,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = {
  size: (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  },
  date: (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
};

// Generate a Cloudinary video thumbnail URL from the video URL
function videoThumb(url) {
  // Replace /video/upload/ with /video/upload/w_400,h_400,c_fill,f_jpg,so_0/
  return url
    .replace('/video/upload/', '/video/upload/w_400,h_400,c_fill,f_jpg,so_0/')
    .replace(/\.(mp4|mov|avi|webm|mkv)($|\?)/, '.jpg$2');
}

// ─── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar({ total, stats, uploading, uploadPct }) {
  const items = [
    { label: 'Total Files', value: total, icon: HardDrive, color: 'text-gold-400' },
    { label: 'Images', value: stats?.images ?? 0, icon: ImageIcon, color: 'text-blue-400' },
    { label: 'Videos', value: stats?.videos ?? 0, icon: Film, color: 'text-purple-400' },
    { label: 'Total Size', value: fmt.size(stats?.totalSize), icon: HardDrive, color: 'text-green-400' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="glass rounded-xl p-4 flex items-center gap-3">
          <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
          <div>
            <p className="text-lg font-bold text-white leading-none">{value}</p>
            <p className="text-xs text-white/40 mt-0.5">{label}</p>
          </div>
        </div>
      ))}
      {uploading && (
        <div className="col-span-2 lg:col-span-4 glass rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-white/60">Uploading…</span>
            <span className="text-xs text-gold-400 font-semibold">{uploadPct}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gold-500 rounded-full"
              animate={{ width: `${uploadPct}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Upload Zone ───────────────────────────────────────────────────────────────
function UploadZone({ onFiles, uploading }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  const handle = (files) => {
    if (uploading) return;
    const valid = Array.from(files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (!valid.length) { toast.error('Only images and videos are allowed'); return; }
    onFiles(valid);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
        ${drag ? 'border-gold-400 bg-gold-500/10 scale-[1.01]' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}
        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex flex-col items-center gap-3 pointer-events-none">
        {uploading ? (
          <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
        ) : (
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${drag ? 'bg-gold-500/20' : 'bg-white/5'}`}>
            <Upload className={`w-7 h-7 ${drag ? 'text-gold-400' : 'text-white/30'}`} />
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-white/70">
            {uploading ? 'Uploading, please wait…' : drag ? 'Drop files here' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-white/30 mt-1">Images (JPG, PNG, WebP) · Videos (MP4, MOV, WebM) · Max 100 MB</p>
        </div>
      </div>
      <input ref={inputRef} type="file" multiple accept="image/*,video/*" className="hidden"
        onChange={e => handle(e.target.files)} disabled={uploading} />
    </div>
  );
}

// ─── Copy URL button ───────────────────────────────────────────────────────────
function CopyBtn({ url }) {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success('URL copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} title="Copy URL"
      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-gold-500/20 flex items-center justify-center transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white/50 hover:text-gold-400" />}
    </button>
  );
}

// ─── Media Card ────────────────────────────────────────────────────────────────
function MediaCard({ item, onPreview, onDelete }) {
  const [imgErr, setImgErr] = useState(false);
  const thumb = item.type === 'video' ? videoThumb(item.url) : item.url;

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.15 }}
      className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10
                 hover:border-white/25 transition-all cursor-pointer aspect-square"
      onClick={() => onPreview(item)}
    >
      {/* Thumbnail */}
      {item.type === 'image' ? (
        !imgErr ? (
          <img src={item.url} alt={item.filename} loading="lazy" onError={() => setImgErr(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-white/20" />
          </div>
        )
      ) : (
        <div className="relative w-full h-full bg-dark-400">
          <img src={thumb} alt={item.filename} loading="lazy" onError={() => setImgErr(true)}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${imgErr ? 'hidden' : ''}`} />
          {imgErr && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Film className="w-8 h-8 text-white/20" />
            </div>
          )}
          {/* Video play overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <Play className="w-4 h-4 text-white ml-0.5" />
            </div>
          </div>
        </div>
      )}

      {/* Type badge */}
      <div className="absolute top-2 left-2">
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wide
          ${item.type === 'video' ? 'bg-purple-500/80 text-white' : 'bg-blue-500/80 text-white'}`}>
          {item.format || item.type}
        </span>
      </div>

      {/* Hover overlay with actions */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity
                      flex flex-col justify-between p-2.5">
        {/* Top actions */}
        <div className="flex justify-end gap-1.5">
          <CopyBtn url={item.url} />
          <button onClick={e => { e.stopPropagation(); onDelete(item); }} title="Delete"
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500/30 flex items-center justify-center transition-colors">
            <Trash2 className="w-3.5 h-3.5 text-white/50 hover:text-red-400" />
          </button>
        </div>
        {/* Bottom meta */}
        <div>
          <p className="text-[10px] text-white/80 truncate font-medium leading-tight">{item.filename || '—'}</p>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-[9px] text-white/40">{fmt.size(item.size)}</p>
            <p className="text-[9px] text-white/40">{fmt.date(item.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Zoom icon center-on-hover */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none
                      opacity-0 group-hover:opacity-100 transition-opacity">
        <ZoomIn className="w-6 h-6 text-white drop-shadow-lg" />
      </div>
    </motion.div>
  );
}

// ─── Preview Modal ─────────────────────────────────────────────────────────────
function PreviewModal({ item, onClose, onDelete }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative bg-dark-50 border border-white/10 rounded-2xl overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {item.type === 'video'
              ? <Film className="w-4 h-4 text-purple-400 flex-shrink-0" />
              : <ImageIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />}
            <p className="text-sm font-medium text-white truncate">{item.filename || 'Media file'}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors flex-shrink-0 ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Media preview */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-black/40 min-h-0 p-4">
          {item.type === 'video' ? (
            <video controls autoPlay className="max-w-full max-h-full rounded-xl" style={{ maxHeight: '55vh' }}>
              <source src={item.url} type={`video/${item.format || 'mp4'}`} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img src={item.url} alt={item.filename} className="max-w-full max-h-full object-contain rounded-xl"
              style={{ maxHeight: '55vh' }} />
          )}
        </div>

        {/* Footer meta + actions */}
        <div className="px-5 py-4 border-t border-white/10 flex-shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Type', value: item.type },
              { label: 'Format', value: item.format?.toUpperCase() || '—' },
              { label: 'Size', value: fmt.size(item.size) },
              { label: 'Uploaded', value: fmt.date(item.createdAt) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-sm text-white font-medium capitalize">{value}</p>
              </div>
            ))}
          </div>

          {/* URL row */}
          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 mb-4">
            <p className="text-xs text-white/40 flex-shrink-0">URL</p>
            <p className="text-xs text-white/70 flex-1 truncate font-mono">{item.url}</p>
            <CopyBtn url={item.url} />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <a href={item.url} target="_blank" rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10
                         text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">
              <Download className="w-4 h-4" /> Download
            </a>
            <button onClick={() => { onDelete(item); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10
                         border border-red-500/20 text-sm text-red-400 hover:bg-red-500/20 transition-all">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({ item, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const handleConfirm = async () => {
    setDeleting(true);
    await onConfirm(item._id);
    setDeleting(false);
  };
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-dark-50 border border-white/10 rounded-2xl p-6 w-full max-w-sm"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Delete Media</h3>
            <p className="text-xs text-white/40">This removes the file from Cloudinary permanently</p>
          </div>
        </div>
        <p className="text-sm text-white/60 mb-5 truncate">"{item?.filename || 'this file'}"</p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/60
                       hover:text-white hover:bg-white/5 transition-all">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold
                       text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Media Library Page ───────────────────────────────────────────────────
export default function Media() {
  const [media, setMedia]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [uploadPct, setUploadPct]   = useState(0);
  const [filter, setFilter]         = useState('');      // '' | 'image' | 'video'
  const [search, setSearch]         = useState('');
  const [preview, setPreview]       = useState(null);    // item to preview
  const [deleteTarget, setDeleteTarget] = useState(null); // item to delete

  // ── Fetch media ──────────────────────────────────────────────────────────────
  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.type = filter;
      if (search) params.search = search;
      const res = await api.get('/media', { params });
      setMedia(res.data.media || []);
      setTotal(res.data.total || 0);
      setStats(res.data.stats || null);
    } catch {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const t = setTimeout(fetchMedia, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchMedia, search]);

  // ── Upload ───────────────────────────────────────────────────────────────────
  const handleUpload = async (files) => {
    setUploading(true);
    setUploadPct(0);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));

      const res = await api.post('/media/upload', fd, {
        onUploadProgress: (e) => {
          if (e.total) setUploadPct(Math.round((e.loaded / e.total) * 100));
        },
      });

      // Prepend new items instantly
      setMedia(prev => [...(res.data.media || []), ...prev]);
      setTotal(prev => prev + (res.data.count || 0));
      toast.success(`${res.data.count} file${res.data.count > 1 ? 's' : ''} uploaded`);

      // Refresh stats
      fetchMedia();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await api.delete(`/media/${id}`);
      setMedia(prev => prev.filter(m => m._id !== id));
      setTotal(prev => prev - 1);
      toast.success('File deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Delete failed');
    }
  };

  // ── Filter tabs ──────────────────────────────────────────────────────────────
  const FILTERS = [
    { label: 'All', value: '', icon: Filter },
    { label: 'Images', value: 'image', icon: ImageIcon },
    { label: 'Videos', value: 'video', icon: Film },
  ];

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Media Library</h1>
          <p className="text-sm text-white/40 mt-0.5">{total} file{total !== 1 ? 's' : ''} stored</p>
        </div>
        <button
          onClick={() => document.getElementById('media-upload-zone').click()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold-500 hover:bg-gold-400
                     text-black font-semibold text-sm rounded-xl transition-all"
        >
          <Upload className="w-4 h-4" />
          Upload Files
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <StatsBar total={total} stats={stats} uploading={uploading} uploadPct={uploadPct} />

      {/* ── Upload Zone ─────────────────────────────────────────────────────── */}
      <div id="media-upload-zone">
        <UploadZone onFiles={handleUpload} uploading={uploading} />
      </div>

      {/* ── Filters + Search ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Type filter tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 flex-shrink-0">
          {FILTERS.map(({ label, value, icon: Icon }) => (
            <button key={value} onClick={() => setFilter(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === value
                  ? 'bg-gold-500 text-black'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by filename…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm
                       text-white placeholder-white/20 focus:outline-none focus:border-gold-500/40 transition-colors" />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Media Grid ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {Array.from({ length: 21 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center glass rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            {filter === 'video'
              ? <Film className="w-8 h-8 text-white/20" />
              : <ImageIcon className="w-8 h-8 text-white/20" />}
          </div>
          <p className="text-white/40 font-medium">No media found</p>
          <p className="text-sm text-white/20 mt-1">
            {search || filter ? 'Try adjusting your filters' : 'Upload your first file above'}
          </p>
        </div>
      ) : (
        <motion.div layout
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          <AnimatePresence>
            {media.map(item => (
              <MediaCard
                key={item._id}
                item={item}
                onPreview={setPreview}
                onDelete={setDeleteTarget}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {preview && (
          <PreviewModal
            item={preview}
            onClose={() => setPreview(null)}
            onDelete={(item) => { setPreview(null); setDeleteTarget(item); }}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            item={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
