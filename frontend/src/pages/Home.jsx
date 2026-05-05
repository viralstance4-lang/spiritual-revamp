import { useEffect } from 'react';
import Banner from '../components/home/Banner';
import HeroSection from '../components/home/HeroSection';
import TrustBadges from '../components/home/TrustBadges';
import CategoryGrid from '../components/home/CategoryGrid';
import ProductHighlights from '../components/home/ProductHighlights';
import StorySection from '../components/home/StorySection';
// import UrgencySection from '../components/home/UrgencySection';
import Testimonials from '../components/home/Testimonials';
import InstagramFeed from '../components/home/InstagramFeed';

export default function Home() {
  useEffect(() => {
    document.title = 'spiritual-revamp — Premium Spiritual Bracelets | Money, Protection, Love, Energy';
  }, []);

  return (
    <>
      <Banner/>
      {/* <HeroSection /> */}
      <TrustBadges />
      <CategoryGrid />
      <ProductHighlights />
      <StorySection />
      {/* <UrgencySection /> */}
      <Testimonials />
      <InstagramFeed />
    </>
  );
}
