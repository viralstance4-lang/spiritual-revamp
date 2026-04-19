import { useRef, useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import AnnouncementBar from './AnnouncementBar';
import WhatsAppButton from '../ui/WhatsAppButton';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export default function Layout() {
  const location = useLocation();
  const hideFooter = ['/checkout'].includes(location.pathname);

  // Measure combined header height (announcement bar + navbar) for accurate spacer
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(80);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    // Set initial height
    setHeaderHeight(el.offsetHeight);
    // Update whenever the header resizes (e.g. announcement bar dismissed)
    const observer = new ResizeObserver(() => {
      setHeaderHeight(el.offsetHeight);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-dark-400">
      {/* Single fixed wrapper keeps announcement bar + navbar together with no gap */}
      <div ref={headerRef} className="fixed top-0 left-0 right-0 z-50">
        <AnnouncementBar />
        <Navbar />
      </div>

      {/* Dynamic spacer matches exact combined header height */}
      <div style={{ height: headerHeight }} aria-hidden="true" />

      <motion.main
        className="flex-1"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Outlet />
      </motion.main>
      {!hideFooter && <Footer />}
      <WhatsAppButton />
    </div>
  );
}
