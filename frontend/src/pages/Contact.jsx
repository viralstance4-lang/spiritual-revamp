import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MessageCircle, Send, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/contact', form);
      toast.success(res.data.message || "Message sent! We'll reply within 24 hours. ✨");
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20 px-4 md:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs uppercase tracking-widest text-gold-500 mb-3 font-medium"
          >
            We're Here for You
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="section-title mb-4"
          >
            Get in <span className="text-gold-gradient">Touch</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="section-subtitle max-w-xl mx-auto"
          >
            Questions about your order, your bracelet, or just need guidance on which one to choose?
            We're here.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Contact info */}
          <div className="md:col-span-2 space-y-5">
            {[
              { icon: Mail, label: 'Email Us', value: 'info@sukhdeyiindia.com', href: 'mailto:info@sukhdeyiindia.com', sub: 'Reply within 24 hours' },
              { icon: MapPin, label: 'Address', value: 'Sector 144 Noida, UP- 201306', sub: 'Shipping pan-India' },
            ].map(({ icon: Icon, label, value, href, sub }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass rounded-2xl p-5 flex gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-gold-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-0.5">{label}</p>
                  {href
                    ? <a href={href} className="font-medium text-white text-sm hover:text-gold-400 transition-colors">{value}</a>
                    : <p className="font-medium text-white text-sm">{value}</p>
                  }
                  <p className="text-xs text-white/40">{sub}</p>
                </div>
              </motion.div>
            ))}

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/919876543210?text=Hi!%20I%20have%20a%20question%20about%20Spiritual%20Revamp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl p-5 hover:border-green-500/40 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="font-medium text-green-400 text-sm">Chat on WhatsApp</p>
                <p className="text-xs text-white/40">Fastest response</p>
              </div>
            </a>
          </div>

          {/* Contact form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-3"
          >
            <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="input" placeholder="Your name" required
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="input" placeholder="your@email.com" required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Subject</label>
                <input
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="input" placeholder="Order query, product question, etc."
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Message *</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="input resize-none h-32" placeholder="How can we help you?" required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-dark-400/30 border-t-dark-400 rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
