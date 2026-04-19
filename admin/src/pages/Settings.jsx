import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Truck, CreditCard, Loader2, RefreshCw, Info, Image, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useSiteLogo } from '../context/SiteLogoContext';

// ─── Reusable field ────────────────────────────────────────────────────────────
function Field({ label, hint, prefix = '₹', value, onChange, min = 0 }) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-1">{label}</label>
      {hint && <p className="text-xs text-white/30 mb-2">{hint}</p>}
      <div className="flex items-center bg-dark-400 border border-white/10 rounded-xl overflow-hidden
                      focus-within:border-gold-500/50 transition-colors">
        {prefix && (
          <span className="px-3 py-2.5 text-sm text-white/30 border-r border-white/10 flex-shrink-0">
            {prefix}
          </span>
        )}
        <input
          type="number"
          min={min}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 px-3 py-2.5 bg-transparent text-sm text-white outline-none"
        />
      </div>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, iconColor, children }) {
  return (
    <div className="glass rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-white/10">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Preview badge ─────────────────────────────────────────────────────────────
function ShippingPreview({ settings }) {
  const rows = [
    {
      label: 'Prepaid — below threshold',
      charge: `₹${settings.prepaidCharge}`,
      note: `when cart < ₹${settings.prepaidFreeThreshold}`,
    },
    {
      label: 'Prepaid — above threshold',
      charge: 'FREE',
      note: `when cart ≥ ₹${settings.prepaidFreeThreshold}`,
      free: true,
    },
    {
      label: 'COD — below threshold',
      charge: `₹${settings.codChargeBelow}`,
      note: `when cart < ₹${settings.codThreshold}`,
    },
    {
      label: 'COD — above threshold',
      charge: `₹${settings.codChargeAbove}`,
      note: `when cart ≥ ₹${settings.codThreshold}`,
    },
  ];

  return (
    <div className="bg-white/5 rounded-xl overflow-hidden border border-white/5">
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-gold-400" />
        <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Live Preview</p>
      </div>
      <div className="divide-y divide-white/5">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm text-white/70">{row.label}</p>
              <p className="text-xs text-white/30 mt-0.5">{row.note}</p>
            </div>
            <span className={`font-semibold text-sm ${row.free ? 'text-green-400' : 'text-white'}`}>
              {row.charge}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Settings() {
  const { refetch } = useSiteLogo();
  const fileInputRef = useRef();
  
  const [form, setForm] = useState({
    prepaidFreeThreshold: 499,
    prepaidCharge:        79,
    codThreshold:         499,
    codChargeBelow:       79,
    codChargeAbove:       20,
  });

  const [logoForm, setLogoForm] = useState({
    logoUrl: '',
    logoWidth: '120px',
    logoHeight: 'auto',
    logoAlt: 'spiritual-revamp',
  });

  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [logoSaving, setLogoSaving] = useState(false);

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  useEffect(() => {
    Promise.all([
      api.get('/settings/shipping'),
      api.get('/settings'),
    ])
      .then(([shippingRes, siteRes]) => {
        if (shippingRes.data?.settings) setForm(shippingRes.data.settings);
        if (siteRes.data?.settings) {
          setLogoForm(siteRes.data.settings);
          setLogoPreview(siteRes.data.settings.logoUrl || '');
        }
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    // Basic validation
    if (form.prepaidFreeThreshold < 0 || form.prepaidCharge < 0 ||
        form.codThreshold < 0 || form.codChargeBelow < 0 || form.codChargeAbove < 0) {
      toast.error('All values must be 0 or greater');
      return;
    }
    setSaving(true);
    try {
      await api.put('/settings/shipping', form);
      toast.success('Shipping settings saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleLogoSave = async () => {
    if (!logoFile && !logoForm.logoUrl) {
      toast.error('Please upload a logo image');
      return;
    }

    setLogoSaving(true);
    try {
      const fd = new FormData();
      if (logoFile) fd.append('logo', logoFile);
      fd.append('logoWidth', logoForm.logoWidth || '120px');
      fd.append('logoHeight', logoForm.logoHeight || 'auto');
      fd.append('logoAlt', logoForm.logoAlt || 'spiritual-revamp');

      await api.put('/settings/logo', fd);
      toast.success('Logo updated! Refreshing globally...');
      
      // Clear preview after save
      setLogoFile(null);
      
      // Refetch logo in global context
      setTimeout(() => refetch(), 500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Logo save failed');
    } finally {
      setLogoSaving(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setLogoForm(f => ({ ...f, logoUrl: '' }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-white/40 mt-0.5">Configure site logo, shipping charges and more</p>
        </div>
      </div>

      {/* Logo Settings */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Section title="Site Logo & Branding" icon={Image} iconColor="bg-purple-500/15 text-purple-400">
          <div className="space-y-5">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-3">Logo Image</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-white/20 hover:border-gold-500/50 rounded-xl p-6 text-center cursor-pointer transition-all"
              >
                {logoPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative bg-dark-400 rounded-lg p-4">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        style={{
                          width: logoForm.logoWidth,
                          height: logoForm.logoHeight,
                          objectFit: 'contain',
                          maxWidth: '200px',
                          maxHeight: '120px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLogo();
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-white/40">Click to replace</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white/30" />
                    </div>
                    <p className="text-sm text-white/60">Click to upload logo</p>
                    <p className="text-xs text-white/30">PNG, JPG, WebP — max 5MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleLogoFileSelect(e.target.files?.[0])}
                />
              </div>
            </div>

            {/* Logo Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">Logo Width</label>
                <input
                  type="text"
                  value={logoForm.logoWidth}
                  onChange={(e) => setLogoForm(f => ({ ...f, logoWidth: e.target.value }))}
                  placeholder="e.g. 120px, 100%, auto"
                  className="w-full px-3 py-2.5 bg-dark-400 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-gold-500/50 transition-colors"
                />
                <p className="text-xs text-white/30 mt-1">Use px, %, or auto</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">Logo Height</label>
                <input
                  type="text"
                  value={logoForm.logoHeight}
                  onChange={(e) => setLogoForm(f => ({ ...f, logoHeight: e.target.value }))}
                  placeholder="e.g. 60px, auto"
                  className="w-full px-3 py-2.5 bg-dark-400 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-gold-500/50 transition-colors"
                />
                <p className="text-xs text-white/30 mt-1">Recommended: auto</p>
              </div>
            </div>

            {/* Logo Alt Text */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Logo Alt Text (SEO)</label>
              <input
                type="text"
                value={logoForm.logoAlt}
                onChange={(e) => setLogoForm(f => ({ ...f, logoAlt: e.target.value }))}
                placeholder="e.g. spiritual-revamp logo"
                className="w-full px-3 py-2.5 bg-dark-400 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-gold-500/50 transition-colors"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleLogoSave}
              disabled={logoSaving}
              className="w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {logoSaving
                ? <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving & Publishing...
                  </>
                : <>
                    <Save className="w-4 h-4" />
                    Save Logo & Apply Globally
                  </>
              }
            </button>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-300">
              ✨ Your logo will update instantly across dashboard, website header & footer
            </div>
          </div>
        </Section>
      </motion.div>

      {/* Prepaid Shipping */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Section title="Prepaid / Online Payment Shipping" icon={CreditCard} iconColor="bg-blue-500/15 text-blue-400">
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Free Shipping Threshold"
              hint="Cart subtotal above this → FREE shipping"
              value={form.prepaidFreeThreshold}
              onChange={set('prepaidFreeThreshold')}
            />
            <Field
              label="Shipping Charge"
              hint="Applied when cart is below threshold"
              value={form.prepaidCharge}
              onChange={set('prepaidCharge')}
            />
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
            Example: Cart ₹600 → Free · Cart ₹300 → ₹{form.prepaidCharge} shipping
          </div>
        </Section>
      </motion.div>

      {/* COD Shipping */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Section title="Cash on Delivery (COD) Shipping" icon={Truck} iconColor="bg-orange-500/15 text-orange-400">
          <div className="grid grid-cols-3 gap-4">
            <Field
              label="COD Threshold"
              hint="Determines which charge tier applies"
              value={form.codThreshold}
              onChange={set('codThreshold')}
            />
            <Field
              label="Charge Below Threshold"
              hint="Higher COD fee for smaller orders"
              value={form.codChargeBelow}
              onChange={set('codChargeBelow')}
            />
            <Field
              label="Charge Above Threshold"
              hint="Lower COD fee for larger orders"
              value={form.codChargeAbove}
              onChange={set('codChargeAbove')}
            />
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-xs text-orange-300">
            Example: Cart ₹600 → ₹{form.codChargeAbove} COD fee · Cart ₹300 → ₹{form.codChargeBelow} COD fee
          </div>
        </Section>
      </motion.div>

      {/* Live Preview */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="glass rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="w-4 h-4 text-gold-400" />
            <h2 className="font-semibold text-white text-sm">Shipping Charge Preview</h2>
          </div>
          <ShippingPreview settings={form} />
        </div>
      </motion.div>

      {/* Save Shipping */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold
                   transition-all disabled:opacity-60 flex items-center justify-center gap-2">
        {saving
          ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
          : <><Save className="w-4 h-4" />Save Shipping Settings</>}
      </button>
    </div>
  );
}
