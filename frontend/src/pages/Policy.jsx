import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function Policy() {
  const { slug } = useParams();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api.get(`/policies/${slug}`)
      .then(res => setPolicy(res.data.policy))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (policy) document.title = `${policy.title} | spiritual-revamp`;
  }, [policy]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <FileText className="w-16 h-16 text-white/20 mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">Policy not found</h1>
      <p className="text-white/40 mb-6">This page doesn't exist or has been removed.</p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  );

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="glass rounded-2xl p-8 md:p-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-gold-400" />
              </div>
              <p className="text-xs uppercase tracking-widest text-gold-500 font-medium">Legal</p>
            </div>

            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-4 mb-2">{policy.title}</h1>
            <p className="text-sm text-white/30 mb-10">
              Last updated: {new Date(policy.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>

            <div className="policy-content" dangerouslySetInnerHTML={{ __html: policy.content }} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
