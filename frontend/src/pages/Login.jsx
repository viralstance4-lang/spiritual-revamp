import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Sparkles, Phone, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

// ─── OTP Input — 6 individual boxes ──────────────────────────────────────────
function OtpInput({ value, onChange }) {
  const refs = Array.from({ length: 6 }, () => useRef(null));

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !e.target.value && i > 0) {
      refs[i - 1].current?.focus();
    }
  };

  const handleChange = (i, e) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);
    const arr = value.split('');
    arr[i] = digit;
    const next = arr.join('').padEnd(6, ' ').slice(0, 6);
    onChange(next.trimEnd());
    if (digit && i < 5) refs[i + 1].current?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      onChange(pasted);
      refs[5].current?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          className="w-11 h-12 text-center text-lg font-bold bg-white/5 border border-white/20
                     rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors"
        />
      ))}
    </div>
  );
}

// ─── OTP Flow ─────────────────────────────────────────────────────────────────
function OtpFlow({ onBack }) {
  const { loginWithOtp } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'name'
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpChannel, setOtpChannel] = useState(''); // 'sms' | 'email' | 'none'
  const [emailHint, setEmailHint] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const startCooldown = () => {
    setResendCooldown(30);
    const t = setInterval(() => setResendCooldown(c => {
      if (c <= 1) { clearInterval(t); return 0; }
      return c - 1;
    }), 1000);
  };

  const sendOtp = async (e) => {
    e?.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/otp/send', { phone });
      const { channel, emailHint: hint, devOtp: dev } = res.data;
      setOtpChannel(channel || 'none');
      setEmailHint(hint || '');
      if (dev) {
        setDevOtp(dev);
        setOtp(dev); // auto-fill in dev mode
      }
      toast.success(res.data.message);
      setStep('otp');
      startCooldown();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e?.preventDefault();
    if (otp.length < 6) { toast.error('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      await loginWithOtp(phone, otp, name || undefined);
      toast.success('Welcome! ✨');
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresName) {
        // Backend says this is a new account — ask for name first
        setStep('name');
      } else {
        toast.error(data?.message || 'Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const submitWithName = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Please enter your name'); return; }
    await verifyOtp();
  };

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <AnimatePresence mode="wait">
        {step === 'phone' && (
          <motion.form key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            onSubmit={sendOtp} className="space-y-4">
            <div>
              <p className="text-sm text-white/60 mb-4">Enter your mobile number to receive a one-time password.</p>
              <label className="block text-xs text-white/50 mb-1.5">Mobile Number *</label>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/50 flex-shrink-0">
                  <Phone className="w-3.5 h-3.5" /> +91
                </span>
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="input flex-1" placeholder="9876543210" required maxLength={10}
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading
                ? <div className="w-4 h-4 border-2 border-dark-400/30 border-t-dark-400 rounded-full animate-spin" />
                : <><Phone className="w-4 h-4" /> Send OTP</>}
            </button>
          </motion.form>
        )}

        {step === 'otp' && (
          <motion.form key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            onSubmit={verifyOtp} className="space-y-5">
            <div>
              <p className="text-sm text-white/60 mb-1">
                OTP sent to <span className="text-white font-medium">+91 {phone}</span>
              </p>
              {otpChannel === 'email' && emailHint && (
                <p className="text-xs text-gold-400 mt-1">
                  📧 Check your email: <strong>{emailHint}</strong>
                </p>
              )}
              {otpChannel === 'none' && !devOtp && (
                <p className="text-xs text-white/30 mt-1">Check server console for the OTP code</p>
              )}
              {devOtp && (
                <div className="mt-2 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
                  <span className="text-xs text-yellow-400">🛠 Dev mode — OTP auto-filled:</span>
                  <span className="text-xs font-mono font-bold text-yellow-300">{devOtp}</span>
                </div>
              )}
              {!devOtp && <p className="text-xs text-white/30 mt-1">Enter the 6-digit code below</p>}
            </div>
            <OtpInput value={otp} onChange={setOtp} />
            <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full justify-center">
              {loading
                ? <div className="w-4 h-4 border-2 border-dark-400/30 border-t-dark-400 rounded-full animate-spin" />
                : <><Sparkles className="w-4 h-4" /> Verify OTP</>}
            </button>
            <div className="text-center">
              {resendCooldown > 0 ? (
                <p className="text-xs text-white/30">Resend OTP in {resendCooldown}s</p>
              ) : (
                <button type="button" onClick={sendOtp} className="text-xs text-gold-400 hover:text-gold-300 transition-colors">
                  Didn't receive it? Resend OTP
                </button>
              )}
            </div>
          </motion.form>
        )}

        {step === 'name' && (
          <motion.form key="name" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            onSubmit={submitWithName} className="space-y-4">
            <p className="text-sm text-white/60">Welcome! This is your first visit. What should we call you?</p>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Your Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Priya Sharma" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading
                ? <div className="w-4 h-4 border-2 border-dark-400/30 border-t-dark-400 rounded-full animate-spin" />
                : <><Sparkles className="w-4 h-4" /> Complete Sign In</>}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
export default function Login() {
  const [authMode, setAuthMode] = useState('email'); // 'email' | 'otp'
  const [mode, setMode] = useState('login');          // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back! ✨');
      } else {
        await register(form.name, form.email, form.phone, form.password);
        toast.success('Account created! Welcome to Spiritual Revamp ✨');
      }
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center text-dark-400 font-bold">SR</div>
          </Link>
          <h1 className="font-serif text-2xl font-semibold text-white mb-1">
            {authMode === 'otp' ? 'OTP Login' : mode === 'login' ? 'Welcome Back' : 'Join Spiritual Revamp'}
          </h1>
          <p className="text-white/50 text-sm">
            {authMode === 'otp' ? 'Sign in with your mobile number' : mode === 'login' ? 'Sign in to your spiritual journey' : 'Begin your transformation today'}
          </p>
        </div>

        <div className="glass rounded-2xl p-8">
          {authMode === 'otp' ? (
            <OtpFlow onBack={() => setAuthMode('email')} />
          ) : (
            <>
              {/* Mode toggle */}
              <div className="flex bg-white/5 rounded-xl p-1 mb-6">
                {['login', 'register'].map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                      mode === m ? 'bg-gold-500 text-dark-400' : 'text-white/50 hover:text-white'
                    }`}>
                    {m === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">Full Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="input" placeholder="Your full name" required />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="input" placeholder="your@email.com" required />
                </div>
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">Phone</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="input" placeholder="9876543210" maxLength={10} />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Password *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="input pr-10" placeholder="••••••••" required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
                  {loading
                    ? <div className="w-4 h-4 border-2 border-dark-400/30 border-t-dark-400 rounded-full animate-spin" />
                    : <><Sparkles className="w-4 h-4" />{mode === 'login' ? 'Sign In' : 'Create Account'}</>}
                </button>
              </form>

              {/* OTP login option */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center"><span className="px-3 bg-transparent text-xs text-white/30">or</span></div>
              </div>
              <button onClick={() => setAuthMode('otp')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10
                           text-sm text-white/60 hover:text-white hover:border-white/25 transition-all">
                <Phone className="w-4 h-4" /> Login with Mobile OTP
              </button>

              {mode === 'register' && (
                <p className="text-xs text-white/30 text-center mt-4">
                  By creating an account, you agree to our{' '}
                  <Link to="/terms" className="text-gold-500 hover:underline">Terms of Service</Link>
                </p>
              )}
            </>
          )}
        </div>

        <p className="text-center text-sm text-white/40 mt-6">
          <Link to="/collections" className="text-gold-400 hover:text-gold-300 transition-colors">
            ← Continue as guest
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
