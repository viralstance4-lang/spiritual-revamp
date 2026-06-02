import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Youtube, Facebook, Mail, Phone, MapPin, Heart } from 'lucide-react';
import api from '../../services/api';
import { useSiteLogo } from '../../context/SiteLogoContext';

const footerLinks = {
  shop: [
    { label: 'All Products',         to: '/collections' },
    { label: 'Money Bracelets',      to: '/collections/money' },
    { label: 'Protection Bracelets', to: '/collections/protection' },
    { label: 'Love Bracelets',       to: '/collections/love-and-relationships' },
    { label: 'Energy Bracelets',     to: '/collections/energy-and-motivation' },
  ],
  help: [
    { label: 'About Us',    to: '/about' },
    { label: 'Contact',     to: '/contact' },
    { label: 'Track Order', to: '/track-order' },
  ],
};

export default function Footer() {
  const [policies, setPolicies] = useState([]);
  const [logoImgError, setLogoImgError] = useState(false);
  const { logoUrl, logoWidth, logoAlt } = useSiteLogo();
  const [subEmail, setSubEmail] = useState('');
  const [subStatus, setSubStatus] = useState('idle'); // idle | loading | success | error
  const [subMsg, setSubMsg] = useState('');

  // Reset error flag when context delivers a new URL (after re-upload)
  useEffect(() => { setLogoImgError(false); }, [logoUrl]);

  const showLogo = logoUrl && !logoImgError;

  useEffect(() => {
    api.get('/policies')
      .then(res => setPolicies(res.data.policies || []))
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-dark-50 border-t border-white/5 mt-24">
      {/* Newsletter strip */}
      <div className="bg-gradient-to-r from-gold-500/5 via-gold-500/10 to-gold-500/5 border-b border-gold-500/10 py-12">
        <div className="max-w-2xl mx-auto text-center px-4">
          <p className="text-xs uppercase tracking-widest text-gold-500 mb-2 font-medium">Sacred Newsletter</p>
          <h3 className="font-serif text-2xl md:text-3xl text-white mb-3">Get Weekly Crystal Wisdom</h3>
          <p className="text-white/50 text-sm mb-6">
            Join 12,000+ spiritual seekers. Weekly rituals, moon cycles, and exclusive deals.
          </p>
          <form
            className="flex gap-2 max-w-md mx-auto"
            onSubmit={async e => {
              e.preventDefault();
              if (!subEmail) return;
              setSubStatus('loading');
              try {
                await api.post('/subscribe', { email: subEmail });
                setSubStatus('success');
                setSubMsg('Subscribed successfully');
                setSubEmail('');
              } catch (err) {
                setSubStatus('error');
                setSubMsg(err.response?.data?.message || 'Something went wrong. Try again.');
              }
            }}
          >
            {subStatus === 'success' ? (
              <p className="text-green-400 text-sm text-center w-full py-3">{subMsg}</p>
            ) : (
              <>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="input flex-1 text-sm py-3"
                  value={subEmail}
                  onChange={e => { setSubEmail(e.target.value); setSubStatus('idle'); }}
                  required
                />
                <button
                  type="submit"
                  disabled={subStatus === 'loading'}
                  className="btn-primary py-3 px-6 text-sm whitespace-nowrap disabled:opacity-60"
                >
                  {subStatus === 'loading' ? '...' : 'Subscribe ✨'}
                </button>
              </>
            )}
          </form>
          {subStatus === 'error' && (
            <p className="text-red-400 text-xs text-center mt-2">{subMsg}</p>
          )}
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              {showLogo ? (
                <img
                  src={logoUrl}
                  alt={logoAlt}
                  style={{ width: logoWidth || '180px', height: 'auto', objectFit: 'contain' }}
                  onError={() => setLogoImgError(true)}
                />
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-dark-400 font-bold text-sm">SR</div>
                  <span className="font-serif text-xl font-semibold text-white">Soul<span className="text-gold-gradient">Stone</span></span>
                </>
              )}
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Handcrafted crystal bracelets rooted in ancient Vedic wisdom. Trusted by 50,000+ spiritual seekers across India.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Instagram, href: 'https://www.instagram.com/spiritual.revamp/', label: 'Instagram' },
                { Icon: Youtube,   href: 'https://www.youtube.com/@SpiritualRevamp',   label: 'YouTube'   },
                { Icon: Facebook,  href: 'https://www.facebook.com/people/Spiritual-Revamp/61580764503945/', label: 'Facebook' },
              ].map(({ Icon, href, label }) => (
                <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 glass rounded-full flex items-center justify-center text-white/50 hover:text-gold-400 hover:border-gold-500/40 transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-5">Shop</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-white/60 hover:text-gold-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-5">Support</h4>
            <ul className="space-y-3">
              {footerLinks.help.map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-white/60 hover:text-gold-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-5">Contact</h4>
            <ul className="space-y-4">
              {[
                { Icon: Mail,   text: 'info@sukhdeyiindia.com', href: 'mailto:info@sukhdeyiindia.com' },
                // { Icon: Phone,  text: '+91 98765 43210' },
                { Icon: MapPin, text: 'Sector 144 Noida, UP- 201306' },
              ].map(({ Icon, text, href }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" />
                  {href
                    ? <a href={href} className="text-sm text-white/60 hover:text-gold-400 transition-colors">{text}</a>
                    : <span className="text-sm text-white/60">{text}</span>
                  }
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              {[ 'Secure Payments'].map(badge => (
                <span key={badge} className="badge-gold text-[10px]">✓ {badge}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30 text-center md:text-left">
            © 2025 <span className="text-gold-400">Spiritual Revamp, A unit of Sukhdeyi India Enterprises Pvt. Ltd.</span> All rights reserved. Developed by {' '}
            <Heart className="w-3 h-3 inline text-red-500 mx-0.5" />{' '}
            <a 
              href="https://virallstance.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gold-400 transition-colors"
            >
              Virall Stance
            </a>.
          </p>
          {/* Dynamic policy links in bottom bar too */}
          {policies.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-white/30">
              {policies.map(p => (
                <Link key={p._id} to={`/policy/${p.slug}`} className="hover:text-white/60 transition-colors">
                  {p.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
