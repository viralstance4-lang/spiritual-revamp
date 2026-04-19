import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { SiteLogoProvider } from './context/SiteLogoContext';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SiteLogoProvider>
          <CartProvider>
            <App />
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: '#1a1a1a',
                  color: '#F5E17A',
                  border: '1px solid rgba(212,175,55,0.3)',
                  borderRadius: '12px',
                  fontSize: '14px',
                },
                success: { iconTheme: { primary: '#D4AF37', secondary: '#0a0a0a' } },
                error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
          </CartProvider>
        </SiteLogoProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
