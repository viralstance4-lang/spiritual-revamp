import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, User, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen py-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-20 h-20 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gold-400" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-white">{user.name}</h1>
          <p className="text-white/50 text-sm">{user.email}</p>
        </motion.div>

        <div className="space-y-3">
          {[
            { icon: Package, label: 'My Orders', to: '/orders', desc: 'Track & manage your orders' },
            { icon: User, label: 'Profile Settings', to: '/profile', desc: 'Update your name, phone, addresses' },
          ].map(({ icon: Icon, label, to, desc }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-4 glass rounded-2xl p-5 hover:border-gold-500/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-gold-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{label}</p>
                <p className="text-xs text-white/40">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </Link>
          ))}

          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-4 w-full glass rounded-2xl p-5 hover:border-red-500/20 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="font-medium text-white">Log Out</p>
              <p className="text-xs text-white/40">Sign out of your account</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
