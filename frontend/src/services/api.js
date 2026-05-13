import axios from 'axios';

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const baseURL = import.meta.env.VITE_API_URL
  || (isLocalhost ? '/api' : 'https://spiritual-revamp.onrender.com/api');

const api = axios.create({
  baseURL,
  timeout: 60000,
});

// Pre-warm Render backend on app load (prevents cold start delay on first order)
if (!isLocalhost) {
  axios.get(`${baseURL.replace('/api', '')}/api/health`, { timeout: 10000 }).catch(() => {});
}

// Request interceptor — attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('spiritual-revamp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('spiritual-revamp_token');
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Product API ───────────────────────────────
export const productApi = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (slug) => api.get(`/products/${slug}`),
  getFeatured: () => api.get('/products/featured'),
  getRelated: (id) => api.get(`/products/${id}/related`),
};

// ─── Order API ─────────────────────────────────
export const orderApi = {
  create: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my'),
  getOne: (id) => api.get(`/orders/${id}`),
  track: (orderId) => api.get(`/orders/track/${orderId}`),
};

// ─── Payment API ───────────────────────────────
export const paymentApi = {
  createRazorpayOrder: (orderId) => api.post('/payments/razorpay/create', { orderId }),
  verifyPayment: (data) => api.post('/payments/razorpay/verify', data),
};

// ─── Review API ────────────────────────────────
export const reviewApi = {
  create: (data) => api.post('/reviews', data),
  getForProduct: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
};

// ─── Coupon API ─────────────────────────────────
export const couponApi = {
  validate: (code, subtotal) => api.post('/coupons/validate', { code, subtotal }),
};

// ─── Tracking API ────────────────────────────────
export const trackingApi = {
  getByOrderId: (orderId) => api.get(`/orders/track/${orderId}`),
};
