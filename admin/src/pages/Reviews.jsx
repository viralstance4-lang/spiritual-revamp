import { useState, useEffect, useCallback } from 'react';
import { Search, Star, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status = filter;
      const res = await api.get('/reviews/admin/all', { params });
      setReviews(res.data.reviews || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const approveReview = async (id) => {
    try {
      await api.put(`/reviews/${id}/approve`);
      setReviews(prev => prev.map(r => r._id === id ? { ...r, isApproved: true } : r));
      toast.success('Review approved');
    } catch {
      toast.error('Failed to approve');
    }
  };

  const deleteReview = async (id) => {
    if (!confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      setReviews(prev => prev.filter(r => r._id !== id));
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = reviews.filter(r =>
    !search ||
    r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.comment?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Reviews</h1>
          <p className="text-sm text-white/40 mt-0.5">{reviews.length} total reviews</p>
        </div>
        <button onClick={fetchReviews} className="btn-outline py-2 px-3 text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Search reviews..." />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input w-36">
          <option value="">All Reviews</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton w-1/4" />
                  <div className="h-3 skeleton w-3/4" />
                  <div className="h-3 skeleton w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Star className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-white/30">No reviews found</p>
          </div>
        ) : filtered.map(review => (
          <div key={review._id} className="glass rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400 font-semibold flex-shrink-0">
                {review.user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white text-sm">{review.user?.name || 'Anonymous'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={`text-sm ${s <= review.rating ? 'text-yellow-400' : 'text-white/20'}`}>★</span>
                        ))}
                      </div>
                      <span className="text-xs text-white/40">
                        {new Date(review.createdAt).toLocaleDateString('en-IN')}
                      </span>
                      {review.isApproved ? (
                        <span className="badge text-[10px] bg-green-500/20 text-green-400">✓ Approved</span>
                      ) : (
                        <span className="badge text-[10px] bg-yellow-500/20 text-yellow-400">Pending</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!review.isApproved && (
                      <button onClick={() => approveReview(review._id)}
                        className="p-1.5 rounded-lg hover:bg-green-500/10 text-white/40 hover:text-green-400 transition-colors"
                        title="Approve">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => deleteReview(review._id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                      title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {review.title && (
                  <p className="font-medium text-white/80 text-sm mt-2">"{review.title}"</p>
                )}
                <p className="text-white/60 text-sm mt-1 leading-relaxed">{review.comment}</p>
                {review.product?.name && (
                  <p className="text-xs text-gold-400/60 mt-2">📿 {review.product.name}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
