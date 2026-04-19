import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Package, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PRODUCTS } from '../data/products';

const CATEGORY_BADGE = {
  money: 'bg-green-500/20 text-green-400',
  protection: 'bg-blue-500/20 text-blue-400',
  love: 'bg-pink-500/20 text-pink-400',
  energy: 'bg-orange-500/20 text-orange-400',
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products?limit=50')
      .then(res => setProducts(res.data.products))
      .catch(() => setProducts(PRODUCTS))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      toast.success('Product deactivated');
    } catch {
      toast.error('Failed to deactivate');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Products</h1>
          <p className="text-sm text-white/40 mt-0.5">{products.length} total products</p>
        </div>
        <Link to="/products/add" className="btn-primary">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-9"
          placeholder="Search products..."
        />
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Product', 'Category', 'Price', 'Stock', 'Sold', 'Rating', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded skeleton" style={{ width: `${60 + j * 10}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.map(product => (
                <tr key={product._id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                        {product.images?.[0]?.url && (
                          <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm line-clamp-1">{product.name}</p>
                        <p className="text-xs text-white/40 truncate max-w-[160px]">{product.tagline}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-[10px] capitalize ${CATEGORY_BADGE[product.category] || 'bg-white/10 text-white/50'}`}>
                      {product.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white">₹{product.price.toLocaleString('en-IN')}</p>
                    {product.comparePrice && (
                      <p className="text-xs text-white/30 line-through">₹{product.comparePrice.toLocaleString('en-IN')}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold text-sm ${product.stock <= 5 ? 'text-red-400' : product.stock <= 15 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/60">{product.sold || 0}</td>
                  <td className="px-4 py-3">
                    <span className="text-white/70 text-sm">
                      {product.ratings?.average || 0} ⭐ ({product.ratings?.count || 0})
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-[10px] ${product.isActive !== false ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {product.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/products/edit/${product._id}`}
                        className="p-1.5 rounded-lg hover:bg-blue-500/10 text-white/40 hover:text-blue-400 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
