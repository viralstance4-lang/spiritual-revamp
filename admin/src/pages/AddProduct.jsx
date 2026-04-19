import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, Plus, X, Save, ArrowLeft, Star, GripVertical, Loader2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/quill-dark.css';
import api from '../services/api';
import toast from 'react-hot-toast';

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'clean'],
  ],
};

const emptyProduct = {
  name: '', tagline: '', description: '', category: '', categoryId: '',
  intention: '', price: '', comparePrice: '', costPrice: '',
  discountType: 'none', discountValue: '0',
  affirmation: '', howToUse: '', stock: '50',
  isFeatured: false, isBestseller: false, isActive: true,
  beforeAfter: { before: '', after: '' },
  benefits: [{ title: '', description: '', icon: '✨' }],
  ingredients: [''],
  seoTitle: '', seoDescription: '',
};

function computeDiscountedPrice(comparePrice, discountType, discountValue) {
  const cp = Number(comparePrice);
  const dv = Number(discountValue);
  if (!cp || discountType === 'none' || !dv) return null;
  if (discountType === 'percentage') {
    return Math.round(cp * (1 - Math.min(dv, 99) / 100));
  }
  if (discountType === 'fixed') {
    return Math.max(1, cp - Math.min(dv, cp - 1));
  }
  return null;
}

// ─── Image Manager: upload + cover selection + drag-to-reorder ────────────────
function ImageManager({ images, setImages, uploading, onUpload }) {
  const dragIndex = useRef(null);

  const setCover = (idx) => {
    // Move clicked image to index 0 (cover = first image)
    setImages(prev => {
      const next = [...prev];
      const [picked] = next.splice(idx, 1);
      return [picked, ...next];
    });
  };

  const remove = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Drag-and-drop reorder ──
  const onDragStart = (e, idx) => {
    dragIndex.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e, idx) => {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === idx) return;
    setImages(prev => {
      const next = [...prev];
      const [dragged] = next.splice(dragIndex.current, 1);
      next.splice(idx, 0, dragged);
      dragIndex.current = idx;
      return next;
    });
  };

  const onDragEnd = () => { dragIndex.current = null; };

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Product Images</h2>
        <span className="text-xs text-white/30">{images.length}/5 uploaded · drag to reorder · first = cover</span>
      </div>

      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div
            key={img.url + i}
            draggable
            onDragStart={e => onDragStart(e, i)}
            onDragOver={e => onDragOver(e, i)}
            onDragEnd={onDragEnd}
            className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing
              ${i === 0 ? 'border-gold-500 ring-2 ring-gold-500/30' : 'border-white/10 hover:border-white/30'}`}
          >
            <img src={img.url} alt="" className="w-full h-full object-cover" />

            {/* Cover badge */}
            {i === 0 && (
              <div className="absolute top-1 left-1 flex items-center gap-0.5 bg-gold-500 text-dark-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                <Star className="w-2.5 h-2.5" /> Cover
              </div>
            )}

            {/* Drag handle */}
            <div className="absolute bottom-1 left-1 text-white/40">
              <GripVertical className="w-3.5 h-3.5" />
            </div>

            {/* Actions overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => setCover(i)}
                  className="text-[9px] bg-gold-500 text-dark-400 font-bold px-2 py-0.5 rounded-md hover:bg-gold-400 transition-colors"
                >
                  Set Cover
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        ))}

        {/* Upload button */}
        {images.length < 5 && (
          <label className={`w-24 h-24 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-gold-500/50 hover:bg-white/5 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {uploading
              ? <Loader2 className="w-6 h-6 text-gold-500 animate-spin" />
              : <>
                  <Upload className="w-5 h-5 text-white/30 mb-1" />
                  <span className="text-[10px] text-white/30">Upload</span>
                </>
            }
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onUpload}
              disabled={uploading || images.length >= 5}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-white/30">Max 5 images · JPG/PNG/WebP · 5 MB each · Drag to reorder · First image is the cover</p>
    </div>
  );
}

export default function AddProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState(emptyProduct);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  // Fetch published categories for the dropdown
  useEffect(() => {
    api.get('/categories')
      .then(res => setCategories(res.data.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit) {
      api.get(`/products/${id}`)
        .then(res => {
          const p = res.data.product;
          setForm({
            ...emptyProduct, ...p,
            price:         String(p.price),
            comparePrice:  String(p.comparePrice || ''),
            stock:         String(p.stock),
            discountType:  p.discountType  || 'none',
            discountValue: String(p.discountValue ?? 0),
            categoryId:    p.categoryId?._id || p.categoryId || '',
          });
          setImages(p.images || []);
        })
        .catch(() => toast.error('Failed to load product'));
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleBenefitChange = (i, field, value) => {
    setForm(f => {
      const benefits = [...f.benefits];
      benefits[i] = { ...benefits[i], [field]: value };
      return { ...f, benefits };
    });
  };

  const handleIngredientChange = (i, value) => {
    setForm(f => {
      const ingredients = [...f.ingredients];
      ingredients[i] = value;
      return { ...f, ingredients };
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      // Do NOT set Content-Type manually — axios sets it with the correct multipart boundary
      const res = await api.post('/products/upload/images', formData);
      setImages(prev => [...prev, ...res.data.images]);
      toast.success(`${files.length} image(s) uploaded`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploading(false);
      // Reset the input so the same file can be re-selected after an error
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) { toast.error('Name and price required'); return; }
    if (!form.category) { toast.error('Please select a category'); return; }
    setSaving(true);
    try {
      const computedPrice = computeDiscountedPrice(form.comparePrice, form.discountType, form.discountValue);
      const payload = {
        ...form,
        price:         computedPrice ?? Number(form.price),
        comparePrice:  form.comparePrice ? Number(form.comparePrice) : undefined,
        discountType:  form.discountType,
        discountValue: Number(form.discountValue),
        stock:         Number(form.stock),
        images,
        ingredients:   form.ingredients.filter(Boolean),
        benefits:      form.benefits.filter(b => b.title),
        categoryId:    form.categoryId || undefined,
      };
      if (isEdit) {
        await api.put(`/products/${id}`, payload);
        toast.success('Product updated!');
      } else {
        await api.post('/products', payload);
        toast.success('Product created!');
      }
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/products')} className="btn-outline py-2 px-3">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
            <p className="text-sm text-white/40">{isEdit ? 'Update product details' : 'Create a new bracelet'}</p>
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? 'Update' : 'Create'}
        </button>
      </div>

      {/* Basic Info */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Basic Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-white/40 mb-1.5">Product Name *</label>
            <input name="name" value={form.name} onChange={handleChange} className="input" placeholder="Golden Abundance Bracelet" required />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-white/40 mb-1.5">Tagline</label>
            <input name="tagline" value={form.tagline} onChange={handleChange} className="input" placeholder="Magnetize wealth. Rewire your money mindset." />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Category</label>
            <select
              value={form.categoryId || ''}
              onChange={e => {
                const cat = categories.find(c => c._id === e.target.value);
                setForm(f => ({
                  ...f,
                  categoryId: cat?._id || '',
                  category:   cat?.slug || cat?.name?.toLowerCase() || '',
                }));
              }}
              className="input"
            >
              <option value="" className="bg-dark-50">— Select category —</option>
              {categories.length > 0
                ? categories.map(c => (
                    <option key={c._id} value={c._id} className="bg-dark-50">
                      {c.emoji} {c.name}
                    </option>
                  ))
                : ['money', 'protection', 'love', 'energy'].map(c => (
                    <option key={c} value={c} className="bg-dark-50 capitalize">{c}</option>
                  ))
              }
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Intention</label>
            <input name="intention" value={form.intention} onChange={handleChange} className="input" placeholder="Attract Wealth & Prosperity" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-white/40 mb-1.5">Description</label>
            <ReactQuill
              theme="snow"
              value={form.description}
              onChange={value => setForm(f => ({ ...f, description: value }))}
              modules={QUILL_MODULES}
              placeholder="Full product description…"
            />
          </div>
        </div>
      </div>

      {/* Pricing & Inventory */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Pricing & Inventory</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">MRP / Compare Price (₹)</label>
            <input name="comparePrice" type="number" value={form.comparePrice} onChange={handleChange} className="input" placeholder="1999" />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Discount Type</label>
            <select name="discountType" value={form.discountType} onChange={handleChange} className="input">
              <option value="none" className="bg-dark-50">No discount</option>
              <option value="percentage" className="bg-dark-50">Percentage (%)</option>
              <option value="fixed" className="bg-dark-50">Fixed amount (₹)</option>
            </select>
          </div>
          {form.discountType !== 'none' ? (
            <div>
              <label className="block text-xs text-white/40 mb-1.5">
                Discount Value ({form.discountType === 'percentage' ? '%' : '₹'})
              </label>
              <input name="discountValue" type="number" min="0" value={form.discountValue} onChange={handleChange} className="input" placeholder={form.discountType === 'percentage' ? '10' : '200'} />
            </div>
          ) : (
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Selling Price (₹) *</label>
              <input name="price" type="number" value={form.price} onChange={handleChange} className="input" placeholder="999" required={form.discountType === 'none'} />
            </div>
          )}
        </div>

        {/* Computed price preview */}
        {form.discountType !== 'none' && (() => {
          const computed = computeDiscountedPrice(form.comparePrice, form.discountType, form.discountValue);
          return computed !== null ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-gold-500/10 border border-gold-500/20 rounded-xl">
              <span className="text-xs text-white/50">Computed selling price:</span>
              <span className="text-lg font-bold text-gold-400">₹{computed.toLocaleString('en-IN')}</span>
              {form.comparePrice && (
                <span className="text-xs text-white/30 line-through">₹{Number(form.comparePrice).toLocaleString('en-IN')}</span>
              )}
              {form.discountType === 'percentage' && (
                <span className="text-xs text-green-400 ml-auto">{form.discountValue}% off</span>
              )}
              {form.discountType === 'fixed' && (
                <span className="text-xs text-green-400 ml-auto">₹{form.discountValue} off</span>
              )}
            </div>
          ) : null;
        })()}

        <div className="w-1/3">
          <label className="block text-xs text-white/40 mb-1.5">Stock</label>
          <input name="stock" type="number" value={form.stock} onChange={handleChange} className="input" placeholder="50" />
        </div>
        <div className="flex flex-wrap gap-4">
          {[
            { key: 'isFeatured', label: 'Featured on Homepage' },
            { key: 'isBestseller', label: 'Mark as Bestseller' },
            { key: 'isActive', label: 'Active (visible)' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name={key} checked={form[key]} onChange={handleChange} className="accent-gold-500 w-4 h-4" />
              <span className="text-sm text-white/70">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Images */}
      <ImageManager images={images} setImages={setImages} uploading={uploading} onUpload={handleImageUpload} />

      {/* Benefits */}
      <div className="glass rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Benefits</h2>
          <button type="button" onClick={() => setForm(f => ({ ...f, benefits: [...f.benefits, { title: '', description: '', icon: '✨' }] }))}
            className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
        {form.benefits.map((b, i) => (
          <div key={i} className="grid grid-cols-6 gap-2 items-start">
            <input value={b.icon} onChange={e => handleBenefitChange(i, 'icon', e.target.value)} className="input col-span-1 text-center text-lg" placeholder="✨" />
            <input value={b.title} onChange={e => handleBenefitChange(i, 'title', e.target.value)} className="input col-span-2" placeholder="Benefit title" />
            <input value={b.description} onChange={e => handleBenefitChange(i, 'description', e.target.value)} className="input col-span-2" placeholder="Short description" />
            <button type="button" onClick={() => setForm(f => ({ ...f, benefits: f.benefits.filter((_, j) => j !== i) }))} className="btn-danger py-2 px-2 col-span-1 justify-center">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Affirmation & Before/After */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Copywriting</h2>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Daily Affirmation</label>
          <input name="affirmation" value={form.affirmation} onChange={handleChange} className="input" placeholder="I am a magnet for abundance..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Before (Pain state)</label>
            <textarea name="" value={form.beforeAfter.before} onChange={e => setForm(f => ({ ...f, beforeAfter: { ...f.beforeAfter, before: e.target.value } }))} className="input resize-none h-20" placeholder="Struggling with..." />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">After (Desired state)</label>
            <textarea value={form.beforeAfter.after} onChange={e => setForm(f => ({ ...f, beforeAfter: { ...f.beforeAfter, after: e.target.value } }))} className="input resize-none h-20" placeholder="New opportunities appear..." />
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">How to Use</label>
          <textarea name="howToUse" value={form.howToUse} onChange={handleChange} className="input resize-none h-20" placeholder="Wear on your..." />
        </div>
      </div>

      {/* SEO */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">SEO</h2>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">SEO Title</label>
          <input name="seoTitle" value={form.seoTitle} onChange={handleChange} className="input" placeholder="Golden Abundance Bracelet - Attract Wealth | spiritual-revamp" />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">SEO Description</label>
          <textarea name="seoDescription" value={form.seoDescription} onChange={handleChange} className="input resize-none h-16" placeholder="Meta description..." />
        </div>
      </div>
    </form>
  );
}
