import { useEffect } from 'react';
import Banner from '../components/home/Banner';
import TrustBadges from '../components/home/TrustBadges';
import CategoryGrid from '../components/home/CategoryGrid';
import ProductHighlights from '../components/home/ProductHighlights';
import StorySection from '../components/home/StorySection';
import Testimonials from '../components/home/Testimonials';
import InstagramFeed from '../components/home/InstagramFeed';

export default function Home() {
  useEffect(() => {
    document.title = 'Spiritual Revamp: Premium Crystal Bracelets | Money, Protection, Love, Energy';
  }, []);

  return (
    <>
      <Banner />
      <TrustBadges />
      <CategoryGrid />
      <ProductHighlights />
      <StorySection />
      <Testimonials />
      <InstagramFeed />
    </>
  );
}
