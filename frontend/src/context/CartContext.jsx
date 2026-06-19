import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const CartContext = createContext();

// ─── Shipping calculator (pure function, uses settings object) ─────────────────
export function calcShipping(subtotal, paymentMethod, settings) {
  if (!settings) {
    // hard fallback if API hasn't responded yet
    if (paymentMethod === 'cod') return subtotal > 999 ? 0 : 185;
    return subtotal > 999 ? 0 : 185;
  }
  if (paymentMethod === 'cod') {
    return subtotal > (settings.codThreshold ?? 999)
      ? (settings.codChargeAbove ?? 0)
      : (settings.codChargeBelow ?? 185);
  }
  // prepaid / razorpay / online
  return subtotal > (settings.prepaidFreeThreshold ?? 999)
    ? 0
    : (settings.prepaidCharge ?? 185);
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
      return { ...state, items: [], coupon: null, discount: 0, gift: null, minOrderValue: 0, autoApplied: false };
    case 'SET_COUPON':
      return {
        ...state,
        coupon:        action.payload.code,
        discount:      action.payload.discount,
        gift:          action.payload.gift || null,
        minOrderValue: action.payload.minOrderValue || 0,
        autoApplied:   !!action.payload.autoApplied,
      };
    case 'REMOVE_COUPON':
      return { ...state, coupon: null, discount: 0, gift: null, minOrderValue: 0, autoApplied: false };
    case 'LOAD':
      return { ...state, items: action.payload };
    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [], coupon: null, discount: 0, gift: null, minOrderValue: 0, autoApplied: false,
  });

  // Nearest "Auto Apply" free-gift coupon the cart hasn't reached yet (for the
  // "Spend ₹X more to unlock a FREE [gift]" cart hint)
  const [upcomingGift, setUpcomingGift] = useState(null);

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

  // ── "Auto Apply" coupons: detect, attach, swap or release as the cart changes ──
  // Debounced so rapid qty changes don't spam the API. Never overrides a coupon
  // the customer typed in manually — that one is only checked for its min-value rule.
  useEffect(() => {
    if (state.items.length === 0) { setUpcomingGift(null); return; }

    const t = setTimeout(async () => {
      // Manually-applied coupon: just enforce its minimum order value, don't replace it
      if (state.coupon && !state.autoApplied) {
        if (state.minOrderValue > 0 && subtotal < state.minOrderValue) {
          const hadGift = !!state.gift;
          dispatch({ type: 'REMOVE_COUPON' });
          toast.error(hadGift
            ? 'Free gift removed because minimum order value is no longer met.'
            : `Coupon ${state.coupon} removed — minimum order value is no longer met.`);
        }
        return;
      }

      // No coupon, or an auto-applied one: ask the server for the best qualifying "Auto Apply" coupon
      try {
        const res = await api.post('/coupons/auto-apply', { subtotal });
        const { coupon, upcoming } = res.data;
        setUpcomingGift(upcoming || null);

        if (coupon) {
          if (coupon.code !== state.coupon) {
            dispatch({
              type: 'SET_COUPON',
              payload: {
                code: coupon.code,
                discount: coupon.discount,
                gift: coupon.giftProduct || null,
                minOrderValue: coupon.minOrderValue || 0,
                autoApplied: true,
              },
            });
            if (coupon.giftProduct) {
              toast.success(`🎁 Congratulations! You qualified for a FREE ${coupon.giftProduct.name}.\nCoupon ${coupon.code} applied automatically.`);
            } else {
              toast.success(`Coupon ${coupon.code} applied automatically${coupon.description ? ` — ${coupon.description}` : ''}`);
            }
          }
        } else if (state.coupon && state.autoApplied) {
          const hadGift = !!state.gift;
          dispatch({ type: 'REMOVE_COUPON' });
          toast.error(hadGift
            ? 'Free gift removed because minimum order value is no longer met.'
            : `Coupon ${state.coupon} removed — minimum order value is no longer met.`);
        }
      } catch {
        // Auto-apply is a background convenience — fail silently
      }
    }, 500);

    return () => clearTimeout(t);
  }, [subtotal, state.items.length, state.coupon, state.autoApplied, state.gift, state.minOrderValue]);

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
      const { coupon } = res.data;
      dispatch({
        type: 'SET_COUPON',
        payload: {
          code: coupon.code,
          discount: coupon.discount,
          gift: coupon.giftProduct || null,
          minOrderValue: coupon.minOrderValue || 0,
        },
      });
      if (coupon.giftProduct) {
        toast.success(`🎁 Free Gift Added: ${coupon.giftProduct.name}`);
      } else {
        toast.success(coupon.description || 'Coupon applied!');
      }
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
      gift:                state.gift,
      autoApplied:         state.autoApplied,
      upcomingGift,
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
