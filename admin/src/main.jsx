import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SiteLogoProvider } from './context/SiteLogoContext';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SiteLogoProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '13px' },
              success: { iconTheme: { primary: '#D4AF37', secondary: '#0a0a0a' } },
            }}
          />
        </SiteLogoProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
