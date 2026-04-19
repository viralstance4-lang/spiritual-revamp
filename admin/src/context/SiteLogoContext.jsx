import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const SiteLogoContext = createContext();

export function SiteLogoProvider({ children }) {
  const [logo, setLogo] = useState({
    logoUrl:    '',
    logoWidth:  '120px',
    logoHeight: 'auto',
    logoAlt:    'spiritual-revamp',
  });
  const [loading, setLoading] = useState(true);

  const fetchLogo = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data?.settings) {
        setLogo({
          logoUrl:    res.data.settings.logoUrl || '',
          logoWidth:  res.data.settings.logoWidth || '120px',
          logoHeight: res.data.settings.logoHeight || 'auto',
          logoAlt:    res.data.settings.logoAlt || 'spiritual-revamp',
        });
      }
    } catch (err) {
      console.error('Failed to fetch logo:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchLogo();
  }, [fetchLogo]);

  return (
    <SiteLogoContext.Provider value={{ ...logo, refetch: fetchLogo, loading }}>
      {children}
    </SiteLogoContext.Provider>
  );
}

export const useSiteLogo = () => {
  const context = useContext(SiteLogoContext);
  if (!context) {
    throw new Error('useSiteLogo must be used within SiteLogoProvider');
  }
  return context;
};
