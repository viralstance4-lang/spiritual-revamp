import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Menu, X, User, Search, ChevronDown } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useSiteLogo } from '../../context/SiteLogoContext';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shop All', to: '/collections' },
  {
    label: 'Collections',
    children: [
      { label: '💰 Money & Abundance', to: '/collections/money' },
      { label: '🛡️ Protection', to: '/collections/protection' },
      { label: '💗 Love & Relationships', to: '/collections/love-and-relationships' },
      { label: '⚡ Energy & Motivation', to: '/collections/energy-and-motivation' },
    ],
  },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoImgError, setLogoImgError] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { itemCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { logoUrl, logoWidth, logoAlt } = useSiteLogo();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/collections?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    setLogoImgError(false);
  }, [logoUrl]);

  const showLogo = logoUrl && !logoImgError;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`transition-all duration-500 ${
          scrolled
            ? 'bg-dark-400/95 backdrop-blur-xl border-b border-white/10 shadow-2xl'
            : 'bg-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              {showLogo ? (
                <img
                  src={logoUrl}
                  alt={logoAlt}
                  style={{
                    width: logoWidth || '180px',
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                  onError={() => setLogoImgError(true)}
                />
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-dark-400 font-bold text-sm">
                    SR
                  </div>
                  <span className="font-serif text-xl font-semibold text-white">
                    Spiritual<span className="text-gold-gradient"> Revamp</span>
                  </span>
                </>
              )}
            </Link>

            {/* Desktop Nav */}
            <ul className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <li key={link.label} className="relative">
                  {link.children ? (
                    <div
                      onMouseEnter={() => setDropdownOpen(true)}
                      onMouseLeave={() => setDropdownOpen(false)}
                    >
                      <button className="btn-ghost text-sm flex items-center gap-1">
                        {link.label}
                        <ChevronDown
                          className={`w-3.5 h-3.5 ${
                            dropdownOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {dropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="absolute top-full mt-2 w-56 glass rounded-2xl p-2"
                          >
                            {link.children.map(child => (
                              <NavLink
                                key={child.to}
                                to={child.to}
                                className="block px-4 py-2 text-sm"
                                onClick={() => setDropdownOpen(false)}
                              >
                                {child.label}
                              </NavLink>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <NavLink to={link.to} className="btn-ghost text-sm">
                      {link.label}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>

            {/* Icons */}
            <div className="flex items-center gap-2">

              {/* Search */}
              <div className="relative">
                <button 
                  className="btn-ghost p-2"
                  onClick={() => setSearchOpen(!searchOpen)}
                >
                  <Search className="w-4 h-4" />
                </button>
                {searchOpen && (
                  <form onSubmit={handleSearchSubmit} className="absolute top-full right-0 mt-2 w-64 glass rounded-lg p-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products..."
                        className="input flex-1"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setSearchOpen(false)}
                        className="btn-ghost p-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* User */}
              <Link to={user ? '/account' : '/login'} className="btn-ghost p-2">
                <User className="w-4 h-4" />
              </Link>

              {/* Cart */}
              <Link to="/cart" className="btn-ghost p-2 relative">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold-500 text-xs rounded-full px-1">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* Menu */}
              <button
                className="btn-ghost p-2 md:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-0 bg-dark-400 z-40"
          >

            {/* Close Button */}
            <button
              className="absolute top-5 right-5 text-white"
              onClick={() => setMobileOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>

            <div className="pt-20 px-6">
              {navLinks.map(link => (
                <div key={link.label}>
                  {link.children ? (
                    link.children.map(child => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        onClick={() => setMobileOpen(false)}
                        className="block py-2"
                      >
                        {child.label}
                      </NavLink>
                    ))
                  ) : (
                    <NavLink
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className="block py-2"
                    >
                      {link.label}
                    </NavLink>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}