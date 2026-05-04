import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Image, Loader2, Save, X, CheckCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useSiteLogo } from '../context/SiteLogoContext';

export default function Logos() {
  const { logoUrl, logoWidth, logoAlt, refetch, loading: ctxLoading } = useSiteLogo();

  const [form, setForm] = useState({
    logoWidth: '180px',
    logoAlt:   'spiritual-revamp',
  });
  const [file,         setFile]         = useState(null);
  const [preview,      setPreview]      = useState('');
  const [savedImgError, setSavedImgError] = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [dragging,     setDragging]     = useState(false);
  const fileRef = useRef();

  // Sync form from context when it loads / refetches
  useEffect(() => {
    if (!ctxLoading) {
      setForm({
        logoWidth: logoWidth || '180px',
        logoAlt:   logoAlt   || 'spiritual-revamp',
      });
      setPreview(logoUrl || '');
      setSavedImgError(false); // reset error flag on fresh data
    }
  }, [ctxLoading, logoUrl, logoWidth, logoAlt]);

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setSavedImgError(false); // new file selected — clear any prior error
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSave = async () => {
    if (!file && !logoUrl) {
      toast.error('Please upload a logo image first');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      if (file) fd.append('logo', file);
      fd.append('logoWidth',  form.logoWidth || '180px');
      fd.append('logoHeight', 'auto');
      fd.append('logoAlt',    form.logoAlt);

      await api.put('/settings/logo', fd);
      toast.success('Logo saved and published globally!');

      setFile(null);
      // Refetch context so sidebar, navbar, footer update instantly
      await refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save logo');
    } finally {
      setSaving(false);
    }
  };

  const handleClearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    // Revert preview to the saved logo (or empty if none)
    setPreview(logoUrl || '');
  };

  // Only show preview when: new file selected OR saved URL loaded OK
  const currentPreview = savedImgError ? (file ? preview : '') : preview;
  const hasUnsavedFile = Boolean(file);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Site Logo</h1>
          <p className="text-sm text-white/40 mt-0.5">
            One global logo — updates everywhere instantly
          </p>
        </div>
        {logoUrl && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-400">
            <CheckCircle className="w-3.5 h-3.5" />
            Active
          </div>
        )}
      </div>

      {/* Current Logo Card */}
      {ctxLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-50/80 border border-white/10 rounded-2xl overflow-hidden"
        >
          {/* Upload Zone */}
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-3">
                Logo Image
              </label>

              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragging
                    ? 'border-gold-400 bg-gold-500/10'
                    : 'border-white/20 hover:border-gold-500/40 hover:bg-white/5'
                }`}
              >
                {currentPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative bg-white/5 rounded-xl p-6 inline-flex items-center justify-center min-w-[120px] min-h-[80px]">
                      <img
                        src={currentPreview}
                        alt={form.logoAlt}
                        style={{
                          width: form.logoWidth || '180px',
                          height: 'auto',
                          objectFit: 'contain',
                          maxWidth: '220px',
                        }}
                        onError={() => {
                          // Saved URL broken — collapse back to upload zone
                          if (!file) setSavedImgError(true);
                        }}
                      />
                      {hasUnsavedFile && (
                        <button
                          type="button"
                          onClick={handleClearFile}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-white/40">
                        {hasUnsavedFile ? (
                          <span className="text-gold-400">New file selected — click Save to publish</span>
                        ) : (
                          'Click or drag to replace'
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                      <Image className="w-7 h-7 text-white/20" />
                    </div>
                    <div>
                      <p className="text-sm text-white/60">
                        Drag & drop or <span className="text-gold-400">browse</span>
                      </p>
                      <p className="text-xs text-white/30 mt-1">PNG, JPG, WebP, SVG — max 5 MB</p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleFile(e.target.files[0])}
                />
              </div>
            </div>

            {/* Width control — height always auto to preserve aspect ratio */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                Width <span className="text-white/25 font-normal">(height scales automatically)</span>
              </label>
              <input
                value={form.logoWidth}
                onChange={e => setForm(f => ({ ...f, logoWidth: e.target.value }))}
                placeholder="e.g. 160px  ·  200px  ·  12rem"
                className="w-full bg-dark-400 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold-500/50 transition-colors"
              />
              <p className="text-xs text-white/25 mt-1">Accepts any CSS value — px, rem, %</p>
            </div>

            {/* Alt Text */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Alt Text (SEO)</label>
              <input
                value={form.logoAlt}
                onChange={e => setForm(f => ({ ...f, logoAlt: e.target.value }))}
                placeholder="e.g. Spiritualrevampse logo"
                className="w-full bg-dark-400 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold-500/50 transition-colors"
              />
            </div>

            {/* Live size preview */}
            {currentPreview && (
              <div className="p-3 bg-dark-400/50 rounded-xl border border-white/5">
                <p className="text-xs text-white/30 mb-2">
                  Live Preview — width: {form.logoWidth || '180px'} · height: auto
                </p>
                <div className="flex items-center justify-center bg-white/5 rounded-lg p-4 min-h-[60px]">
                  <img
                    src={currentPreview}
                    alt="size preview"
                    style={{
                      width: form.logoWidth || '180px',
                      height: 'auto',
                      objectFit: 'contain',
                      maxWidth: '100%',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save & Publish Logo
                </>
              )}
            </button>

            <p className="text-xs text-white/30 text-center flex items-center justify-center gap-1.5">
              <RefreshCw className="w-3 h-3" />
              Updates admin sidebar, website header and footer instantly
            </p>
          </div>

          {/* Where it appears */}
          <div className="px-6 pb-6">
            <div className="bg-white/3 border border-white/5 rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3">
                Appears in
              </p>
              <div className="grid grid-cols-3 gap-2">
                {['Admin Sidebar', 'Website Header', 'Website Footer'].map(place => (
                  <div
                    key={place}
                    className="flex items-center gap-1.5 text-xs text-white/50"
                  >
                    <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                    {place}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
