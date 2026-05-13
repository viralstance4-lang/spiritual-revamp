import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, CreditCard, Truck, Lock, CheckCircle } from 'lucide-react';
import { useCart, calcShipping } from '../context/CartContext';
import { orderApi, paymentApi } from '../services/api';
import toast from 'react-hot-toast';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Chandigarh','Puducherry','Jammu and Kashmir',
];

export default function Checkout() {
  const { items, subtotal, discount, coupon, clearCart, shippingSettings } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=address, 2=payment
  const [loading, setLoading] = useState(false);

  const [address, setAddress] = useState({
    name: '', phone: '', email: '', line1: '', line2: '',
    city: '', state: '', pincode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // Recompute shipping whenever payment method or cart changes
  const shippingCharge = calcShipping(subtotal, paymentMethod, shippingSettings);
  const total = Math.max(0, subtotal + shippingCharge - discount);

  const handleAddressChange = e => {
    setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateAddress = () => {
    const required = ['name', 'phone', 'email', 'line1', 'city', 'state', 'pincode'];
    for (const field of required) {
      if (!address[field]) {
        toast.error(`Please fill in ${field}`);
        return false;
      }
    }
    if (!/^[6-9]\d{9}$/.test(address.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }
    if (!/^\d{6}$/.test(address.pincode)) {
      toast.error('Please enter a valid 6-digit pincode');
      return false;
    }
    return true;
  };

  const placeOrder = async () => {
    if (!validateAddress()) return;
    setLoading(true);
    try {
      // Create order
      const orderData = {
        items: items.map(i => ({ product: i._id, quantity: i.quantity })),
        shippingAddress: {
          name: address.name,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
        guestInfo: { name: address.name, email: address.email, phone: address.phone },
        paymentMethod,
        couponCode: coupon,
      };

      const { data: orderRes } = await orderApi.create(orderData);
      const order = orderRes.order;

      if (paymentMethod === 'cod') {
        clearCart();
        navigate(`/order-confirmation/${order.orderId}`);
        return;
      }

      // Razorpay flow
      const { data: rzpRes } = await paymentApi.createRazorpayOrder(order._id);

      const options = {
        key: rzpRes.key,
        amount: rzpRes.amount,
        currency: rzpRes.currency,
        name: 'spiritual-revamp',
        description: 'Premium Crystal Bracelets',
        order_id: rzpRes.razorpayOrderId,
        prefill: { name: rzpRes.name, email: rzpRes.email, contact: rzpRes.phone },
        theme: { color: '#D4AF37' },
        handler: async (response) => {
          await paymentApi.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId: order._id,
          });
          clearCart();
          navigate(`/order-confirmation/${order.orderId}`);
        },
        modal: { ondismiss: () => toast.error('Payment cancelled') },
      };

      if (!window.Razorpay) {
        toast.error('Payment gateway not loaded. Please refresh and try again.');
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-white/50">Your cart is empty.</p>
        <Link to="/collections" className="btn-primary">Shop Now</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-full bg-gold-gradient flex items-center justify-center text-dark-400 font-bold text-xs">SR</div>
            <span className="font-serif text-lg font-semibold text-white">spiritual-revamp</span>
          </Link>
          {/* Steps */}
          <div className="flex items-center justify-center gap-2">
            {[
              { n: 1, label: 'Address' },
              { n: 2, label: 'Payment' },
            ].map(({ n, label }, i) => (
              <div key={n} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 ${n === step ? 'text-gold-400' : n < step ? 'text-green-400' : 'text-white/30'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                    n < step ? 'bg-green-500 border-green-500 text-white' :
                    n === step ? 'border-gold-500 text-gold-400' : 'border-white/20'
                  }`}>
                    {n < step ? <CheckCircle className="w-4 h-4" /> : n}
                  </div>
                  <span className="text-sm hidden sm:block">{label}</span>
                </div>
                {i < 1 && <ChevronRight className="w-4 h-4 text-white/20 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass rounded-2xl p-6"
              >
                <h2 className="font-serif text-xl font-semibold text-white mb-6">
                  Delivery Address
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-white/50 mb-1.5">Full Name *</label>
                    <input name="name" value={address.name} onChange={handleAddressChange}
                      className="input" placeholder="Your Full Name" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-white/50 mb-1.5">Phone *</label>
                    <input name="phone" value={address.phone} onChange={handleAddressChange}
                      className="input" placeholder="9876543210" maxLength={10} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-white/50 mb-1.5">Email *</label>
                    <input name="email" type="email" value={address.email} onChange={handleAddressChange}
                      className="input" placeholder="Your Email Address" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-white/50 mb-1.5">Address Line 1 *</label>
                    <input name="line1" value={address.line1} onChange={handleAddressChange}
                      className="input" placeholder="House/Flat No., Street Name" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-white/50 mb-1.5">Address Line 2</label>
                    <input name="line2" value={address.line2} onChange={handleAddressChange}
                      className="input" placeholder="Area, Landmark (optional)" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">City *</label>
                    <input name="city" value={address.city} onChange={handleAddressChange}
                      className="input" placeholder="Your City" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">Pincode *</label>
                    <input name="pincode" value={address.pincode} onChange={handleAddressChange}
                      className="input" placeholder="400001" maxLength={6} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-white/50 mb-1.5">State *</label>
                    <select name="state" value={address.state} onChange={handleAddressChange}
                      className="input">
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => (
                        <option key={s} value={s} className="bg-dark-50">{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => validateAddress() && setStep(2)}
                  className="btn-primary w-full justify-center mt-6"
                >
                  Continue to Payment
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass rounded-2xl p-6"
              >
                <h2 className="font-serif text-xl font-semibold text-white mb-6">
                  Payment Method
                </h2>
                <div className="space-y-3 mb-6">
                  {[
                    { value: 'razorpay', label: 'Pay Online', sublabel: 'UPI, Cards, Netbanking, Wallets', icon: CreditCard },
                    { value: 'cod', label: 'Cash on Delivery', sublabel: 'Pay when your order arrives', icon: Truck },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === opt.value
                          ? 'border-gold-500 bg-gold-500/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={opt.value}
                        checked={paymentMethod === opt.value}
                        onChange={e => setPaymentMethod(e.target.value)}
                        className="accent-gold-500"
                      />
                      <opt.icon className="w-5 h-5 text-gold-400" />
                      <div>
                        <p className="font-medium text-white text-sm">{opt.label}</p>
                        <p className="text-xs text-white/40">{opt.sublabel}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn-ghost border border-white/10">
                    ← Back
                  </button>
                  <button
                    onClick={placeOrder}
                    disabled={loading}
                    className="btn-primary flex-1 justify-center"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-dark-400/30 border-t-dark-400 rounded-full animate-spin" />
                        Placing Order... (may take 30–60 sec)
                      </span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        {paymentMethod === 'cod' ? 'Place Order (COD)' : `Pay ₹${total.toLocaleString('en-IN')}`}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-5 sticky top-24">
              <h3 className="font-semibold text-white mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto no-scrollbar">
                {items.map(item => (
                  <div key={item._id} className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                      <img src={item.images?.[0]?.url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{item.name}</p>
                      <p className="text-xs text-white/40">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-white flex-shrink-0">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
              <div className="h-px bg-white/10 my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Shipping</span>
                  <span className={shippingCharge === 0 ? 'text-green-400' : ''}>
                    {shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span><span>-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="h-px bg-white/10" />
                <div className="flex justify-between font-bold text-white text-base">
                  <span>Total</span><span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <p className="text-xs text-center text-white/30 mt-4">
                🔒 256-bit SSL encrypted checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
