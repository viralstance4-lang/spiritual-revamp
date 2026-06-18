import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Upload, LayoutGrid, Check, Loader2, Search, ImageOff, UploadCloud } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function MediaLibraryModal({ isOpen, onClose, onSelect, currentCount, maxImages = 5 }) {
  const [tab, setTab]               = useState('library');
  const [media, setMedia]           = useState([]);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected]     = useState([]);
  const [search, setSearch]         = useState('');
  const [uploading, setUploading]   = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Refs keep scroll handler free of stale closures
  const pageRef        = useRef(1);
  const totalPagesRef  = useRef(1);
  const loadingMoreRef = useRef(false);
  const searchRef      = useRef('');

  const remaining = maxImages - currentCount;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchImages = async (searchTerm, pageNum) => {
    const isFirst = pageNum === 1;

    if (!isFirst) {
      if (loadingMoreRef.current) return;
      setLoadingMore(true);
      loadingMoreRef.current = true;
    } else {
      setLoading(true);
    }

    try {
      const params = { page: pageNum, limit: 24 };
      if (searchTerm) params.search = searchTerm;
      const res = await api.get('/media/images', { params });
      const { data = [], totalPages: tp = 1 } = res.data;

      pageRef.current       = pageNum;
      totalPagesRef.current = tp;
      setPage(pageNum);
      setTotalPages(tp);
      setMedia(prev => (isFirst ? data : [...prev, ...data]));
    } catch {
      if (isFirst) toast.error('Failed to load media library');
    } finally {
      if (isFirst) setLoading(false);
      else { setLoadingMore(false); loadingMoreRef.current = false; }
    }
  };

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setSelected([]);
      setMedia([]);
      setSearch('');
      searchRef.current    = '';
      pageRef.current      = 1;
      totalPagesRef.current = 1;
      setPage(1);
      setTotalPages(1);
      setTab('library');
      fetchImages('', 1);
    }
  }, [isOpen]);

  // Debounced search — always resets to page 1
  useEffect(() => {
    if (!isOpen) return;
    searchRef.current = search;
    const t = setTimeout(() => fetchImages(search, 1), 350);
    return () => clearTimeout(t);
  }, [search]);

  // ── Infinite scroll ────────────────────────────────────────────────────────
  const handleGridScroll = (e) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (nearBottom && !loadingMoreRef.current && pageRef.current < totalPagesRef.current) {
      fetchImages(searchRef.current, pageRef.current + 1);
    }
  };

  // ── Selection ──────────────────────────────────────────────────────────────
  const toggleSelect = (img) => {
    setSelected(prev => {
      const exists = prev.some(s => s.url === img.url);
      if (exists) return prev.filter(s => s.url !== img.url);
      const slotsLeft = remaining - prev.length;
      if (slotsLeft <= 0) {
        toast.error(`Only ${remaining} image${remaining === 1 ? '' : 's'} can be added`);
        return prev;
      }
      return [...prev, { url: img.url, publicId: img.publicId }];
    });
  };

  // ── Upload ─────────────────────────────────────────────────────────────────
  const processUpload = async (files) => {
    if (remaining <= 0) { toast.error('Maximum 5 images allowed'); return; }
    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) {
      toast(`Only ${remaining} slot${remaining === 1 ? '' : 's'} left — uploading first ${remaining}.`, { icon: '⚠️' });
    }
    setUploading(true);
    try {
      const fd = new FormData();
      toUpload.forEach(f => fd.append('images', f));
      const res = await api.post('/products/upload/images', fd);
      onSelect(res.data.images);
      toast.success(`${toUpload.length} image${toUpload.length === 1 ? '' : 's'} uploaded`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).filter(f =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
    );
    if (files.length) processUpload(files);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
    );
    if (!files.length) { toast.error('Only JPG, PNG, WebP supported'); return; }
    processUpload(files);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative w-full max-w-3xl bg-dark-100 border border-white/10 rounded-2xl shadow-2xl flex flex-col"
            style={{ maxHeight: '85vh' }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
              <div>
                <h2 className="text-base font-semibold text-white">Add Product Images</h2>
                <p className="text-xs text-white/30 mt-0.5">Global media library · all uploads across the platform</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 px-6 pt-4 shrink-0">
              {[
                { id: 'library', label: 'Media Library', icon: LayoutGrid },
                { id: 'upload',  label: 'Upload',        icon: Upload },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    tab === id
                      ? 'bg-gold-500 text-dark-400'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-hidden px-6 py-4 flex flex-col gap-4 min-h-0">

              {/* ─ Media Library tab ─ */}
              {tab === 'library' && (
                <>
                  <div className="relative shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search by filename…"
                      className="input pl-9 py-2 text-sm w-full"
                    />
                  </div>

                  <div
                    className="flex-1 overflow-y-auto min-h-0"
                    onScroll={handleGridScroll}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center h-52">
                        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                      </div>
                    ) : media.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-52 gap-3 text-white/30">
                        <ImageOff className="w-10 h-10" />
                        <p className="text-sm">
                          {search ? 'No images match your search' : 'No images in the library yet'}
                        </p>
                        {!search && (
                          <button
                            type="button"
                            onClick={() => setTab('upload')}
                            className="text-xs text-gold-400 hover:text-gold-300 transition-colors"
                          >
                            Upload your first image →
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 pb-2">
                        {media.map(img => {
                          const isSelected = selected.some(s => s.url === img.url);
                          return (
                            <button
                              key={img._id}
                              type="button"
                              onClick={() => toggleSelect(img)}
                              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all focus:outline-none group ${
                                isSelected
                                  ? 'border-gold-500 ring-2 ring-gold-500/30'
                                  : 'border-white/10 hover:border-white/30'
                              }`}
                            >
                              <img
                                src={img.url}
                                alt={img.filename || 'media'}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />

                              {/* Source tag (shows 'product', 'settings', etc.) */}
                              {img.source && img.source !== 'media_library' && (
                                <span className="absolute top-1 left-1 bg-black/60 text-white/60 text-[8px] leading-none px-1.5 py-0.5 rounded capitalize">
                                  {img.source}
                                </span>
                              )}

                              {/* Hover overlay */}
                              {!isSelected && (
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
                              )}

                              {/* Selected overlay */}
                              {isSelected && (
                                <div className="absolute inset-0 bg-gold-500/20 flex items-center justify-center">
                                  <div className="w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center shadow-lg">
                                    <Check className="w-3.5 h-3.5 text-dark-400" />
                                  </div>
                                </div>
                              )}
                            </button>
                          );
                        })}

                        {/* Infinite scroll loading indicator */}
                        {loadingMore && (
                          <div className="col-span-full flex justify-center py-4">
                            <Loader2 className="w-5 h-5 text-gold-500/60 animate-spin" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ─ Upload tab ─ */}
              {tab === 'upload' && (
                <div
                  className={`flex-1 flex flex-col items-center justify-center gap-5 rounded-xl border-2 border-dashed transition-all cursor-default ${
                    isDragOver
                      ? 'border-gold-500 bg-gold-500/5'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={e => { e.preventDefault(); setIsDragOver(false); }}
                  onDrop={handleDrop}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                    isDragOver ? 'bg-gold-500/20' : 'bg-white/5'
                  }`}>
                    <UploadCloud className={`w-8 h-8 transition-colors ${
                      isDragOver ? 'text-gold-400' : 'text-white/30'
                    }`} />
                  </div>

                  <div className="text-center pointer-events-none select-none">
                    <p className={`text-sm font-medium transition-colors ${
                      isDragOver ? 'text-gold-400' : 'text-white/70'
                    }`}>
                      {isDragOver ? 'Drop images here' : 'Drag & drop images here'}
                    </p>
                    <p className="text-xs text-white/30 mt-1">or browse from your computer</p>
                    <p className="text-xs text-white/20 mt-1">
                      JPG, PNG, WebP · Max 5 MB each · {remaining} slot{remaining === 1 ? '' : 's'} remaining
                    </p>
                  </div>

                  <label className={`btn-primary cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                      : <><Upload className="w-4 h-4" /> Browse Computer</>
                    }
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={uploading || remaining <= 0}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 shrink-0">
              <p className="text-xs text-white/30">
                {tab === 'library'
                  ? `${selected.length} selected · ${remaining} slot${remaining === 1 ? '' : 's'} remaining`
                  : `${remaining} slot${remaining === 1 ? '' : 's'} remaining`}
              </p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={onClose} className="btn-outline py-2 px-4 text-sm">
                  Cancel
                </button>
                {tab === 'library' && (
                  <button
                    type="button"
                    disabled={!selected.length}
                    onClick={() => { onSelect(selected); onClose(); }}
                    className="btn-primary py-2 px-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add Selected ({selected.length})
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
