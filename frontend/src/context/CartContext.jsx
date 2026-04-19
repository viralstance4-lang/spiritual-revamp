import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const CartContext = createContext();

// ─── Shipping calculator (pure function, uses settings object) ─────────────────
export function calcShipping(subtotal, paymentMethod, settings) {
  if (!settings) {
    // hard fallback if API hasn't responded yet
    if (paymentMethod === 'cod') return subtotal >= 499 ? 20 : 79;
    return subtotal >= 499 ? 0 : 79;
  }
  if (paymentMethod === 'cod') {
    return subtotal >= (settings.codThreshold ?? 499)
      ? (settings.codChargeAbove ?? 20)
      : (settings.codChargeBelow ?? 79);
  }
  // prepaid / razorpay / online
  return subtotal >= (settings.prepaidFreeThreshold ?? 499)
    ? 0
    : (settings.prepaidCharge ?? 79);
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i._id === action.payload._id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i._id === action.payload._id
              ? { ...i, quantity: Math.min(i.quantity + (action.payload.quantity || 1), 10) }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.payload, quantity: action.payload.quantity || 1 }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i._id !== action.payload) };
    case 'UPDATE_QTY':
      if (action.payload.qty <= 0) {
        return { ...state, items: state.items.filter(i => i._id !== action.payload.id) };
      }
      return {
        ...state,
        items: state.items.map(i =>
          i._id === action.payload.id ? { ...i, quantity: Math.min(action.payload.qty, 10) } : i
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [], coupon: null, discount: 0 };
    case 'SET_COUPON':
      return { ...state, coupon: action.payload.code, discount: action.payload.discount };
    case 'REMOVE_COUPON':
      return { ...state, coupon: null, discount: 0 };
    case 'LOAD':
      return { ...state, items: action.payload };
    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], coupon: null, discount: 0 });

  // Live shipping settings from DB
  const [shippingSettings, setShippingSettings] = useState(null);

  // Fetch shipping settings once on mount
  useEffect(() => {
    api.get('/settings/shipping')
      .then(res => { if (res.data?.settings) setShippingSettings(res.data.settings); })
      .catch(() => {}); // use hard fallback on error
  }, []);

  // Persist cart items to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('spiritual-revamp_cart');
    if (saved) {
      try { dispatch({ type: 'LOAD', payload: JSON.parse(saved) }); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('spiritual-revamp_cart', JSON.stringify(state.items));
  }, [state.items]);

  // ── Derived values ───────────────────────────────────────────────────────────
  const subtotal     = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount     = state.discount || 0;

  // Default shipping uses prepaid rate (shown in cart sidebar)
  const shippingCharge = calcShipping(subtotal, 'razorpay', shippingSettings);
  const total          = Math.max(0, subtotal + shippingCharge - discount);
  const itemCount      = state.items.reduce((sum, i) => sum + i.quantity, 0);

  // How much more to add for free prepaid shipping
  const freeThreshold      = shippingSettings?.prepaidFreeThreshold ?? 499;
  const amountToFreeShipping = Math.max(0, freeThreshold - subtotal);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const addToCart = useCallback((product, qty = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { ...product, quantity: qty } });
    toast.success(`${product.name} added to cart ✨`);
  }, []);

  const removeFromCart = useCallback((id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  }, []);

  const updateQuantity = useCallback((id, qty) => {
    dispatch({ type: 'UPDATE_QTY', payload: { id, qty } });
  }, []);

  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);

  const applyCoupon = useCallback(async (code) => {
    try {
      const res = await api.post('/coupons/validate', { code, subtotal });
      dispatch({ type: 'SET_COUPON', payload: { code: res.data.coupon.code, discount: res.data.coupon.discount } });
      toast.success(res.data.coupon.description || 'Coupon applied!');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
      return { success: false };
    }
  }, [subtotal]);

  const removeCoupon = useCallback(() => {
    dispatch({ type: 'REMOVE_COUPON' });
  }, []);

  return (
    <CartContext.Provider value={{
      items:               state.items,
      coupon:              state.coupon,
      subtotal,
      shippingCharge,
      discount,
      total,
      itemCount,
      amountToFreeShipping,
      shippingSettings,    // expose so Checkout can compute COD vs prepaid charges
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      applyCoupon,
      removeCoupon,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
};
