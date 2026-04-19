import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Star, Image, HelpCircle, Film,
  Settings, Tag, Menu, LogOut, Bell, Layers, FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSiteLogo } from '../context/SiteLogoContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/',           label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { to: '/products',   label: 'Products',   icon: Package },
  { to: '/categories', label: 'Categories', icon: Layers },
  { to: '/orders',     label: 'Orders',     icon: ShoppingCart },
  { to: '/customers',  label: 'Customers',  icon: Users },
  { to: '/reviews',    label: 'Reviews',    icon: Star },
  { to: '/logos',      label: 'Logos',      icon: Image },
  { to: '/faqs',       label: 'FAQs',       icon: HelpCircle },
  { to: '/media',      label: 'Media',      icon: Film },
  { to: '/coupons',    label: 'Coupons',    icon: Tag },
  { to: '/policies',   label: 'Policies',   icon: FileText },
  { to: '/settings',   label: 'Settings',   icon: Settings },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoImgError, setLogoImgError] = useState(false);
  const { user, logout } = useAuth();
  const { logoUrl, logoWidth, logoAlt } = useSiteLogo();
  const navigate = useNavigate();

  // Reset img error whenever context delivers a fresh URL (after re-upload)
  useEffect(() => { setLogoImgError(false); }, [logoUrl]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const showLogo = logoUrl && !logoImgError;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          {showLogo ? (
            <img
              src={logoUrl}
              alt={logoAlt}
              style={{ width: logoWidth || '120px', height: 'auto', objectFit: 'contain', maxWidth: '140px' }}
              onError={() => setLogoImgError(true)}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-black font-bold text-xs">SS</div>
          )}
          <div>
            <p className="font-semibold text-white text-sm">spiritual-revamp</p>
            <p className="text-[10px] text-white/40">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 px-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-dark-400 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-dark-50/80 border-r border-white/10 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-60 bg-dark-50 border-r border-white/10 z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-white/10 flex-shrink-0 bg-dark-50/50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="lg:hidden font-semibold text-sm text-white">spiritual-revamp Admin</div>
          <div className="flex items-center gap-2 ml-auto">
            <button className="p-2 rounded-xl hover:bg-white/10 transition-colors relative">
              <Bell className="w-4 h-4 text-white/60" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-gold-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
