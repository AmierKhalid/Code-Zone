import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from './components/HeroSection';
import SpeedSection from './components/SpeedSection';
import CoverageSection from './components/CoverageSection';
import InstallSection from './components/InstallSection';
import GoSection from './components/GoSection';
import StickyBottomBar from './components/StickyBottomBar';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-void text-hot-white overflow-x-hidden">
      {/* Fixed atmospheric layers */}
      <div className="grid-bg" />
      <div className="noise-overlay" />

      {/* Ambient violet orb — top left */}
      <div
        className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(123,47,190,0.12) 0%, transparent 70%)',
        }}
      />
      {/* Ambient violet orb — bottom right */}
      <div
        className="fixed bottom-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(123,47,190,0.08) 0%, transparent 70%)',
        }}
      />

      <Header />

      <main className="relative z-10">
        <HeroSection />
        <div className="section-divider mx-6 lg:mx-10" />
        <SpeedSection />
        <div className="section-divider mx-6 lg:mx-10" />
        <CoverageSection />
        <div className="section-divider mx-6 lg:mx-10" />
        <InstallSection />
        <div className="section-divider mx-6 lg:mx-10" />
        <GoSection />
      </main>

      <Footer />
      <StickyBottomBar />
    </div>
  );
}