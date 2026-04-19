import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Toast({ type, msg }) {
  if (!msg) return null;
  return (
    <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 ${
      type === 'success'
        ? 'bg-green-500/10 border border-green-500/20 text-green-400'
        : 'bg-red-500/10 border border-red-500/20 text-red-400'
    }`}>
      {type === 'success'
        ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
        : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {msg}
    </div>
  );
}

export default function Profile() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

  if (!user) { navigate('/login'); return null; }

  const saveProfile = async e => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const res = await api.put('/auth/profile', profileForm);
      // Update local auth state by refreshing profile
      await api.get('/auth/profile');
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      // patch the displayed user without full reload
      profileForm.name = res.data.user.name;
      profileForm.phone = res.data.user.phone || '';
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async e => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setPwSaving(true);
    setPwMsg({ type: '', text: '' });
    try {
      await api.put('/auth/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Link to="/account" className="w-9 h-9 glass rounded-xl flex items-center justify-center hover:border-gold-500/30 transition-colors">
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-white">Profile Settings</h1>
            <p className="text-sm text-white/40">Manage your account details</p>
          </div>
        </motion.div>

        {/* Avatar / Name display */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-2xl p-6 flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center flex-shrink-0">
            <span className="font-serif text-2xl text-gold-400 font-semibold">
              {(profileForm.name || user.name)?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-white">{profileForm.name || user.name}</p>
            <p className="text-sm text-white/40">{user.email}</p>
          </div>
        </motion.div>

        {/* Personal Info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-5 flex items-center gap-2">
            <User className="w-4 h-4" /> Personal Info
          </h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Full Name</label>
              <input
                className="input w-full"
                value={profileForm.name}
                onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Email</label>
              <input
                className="input w-full opacity-50 cursor-not-allowed"
                value={user.email}
                disabled
              />
              <p className="text-xs text-white/30 mt-1">Email cannot be changed.</p>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Phone
              </label>
              <input
                className="input w-full"
                value={profileForm.phone}
                onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>
            <Toast type={profileMsg.type} msg={profileMsg.text} />
            <button
              type="submit"
              disabled={profileSaving}
              className="btn-primary w-full py-3 text-sm disabled:opacity-60"
            >
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-5 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Change Password
          </h2>
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Current Password</label>
              <input
                type="password"
                className="input w-full"
                value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                placeholder="Enter current password"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">New Password</label>
              <input
                type="password"
                className="input w-full"
                value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="Min. 6 characters"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                className="input w-full"
                value={pwForm.confirmPassword}
                onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Repeat new password"
                required
              />
            </div>
            <Toast type={pwMsg.type} msg={pwMsg.text} />
            <button
              type="submit"
              disabled={pwSaving}
              className="btn-primary w-full py-3 text-sm disabled:opacity-60"
            >
              {pwSaving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </motion.div>

      </div>
    </div>
  );
}
