'use client';

import React, { useState, useEffect } from 'react';
import AppLogo from '@/components/ui/AppLogo';

const NAV_ITEMS = [
  { label: 'Snippets', href: '#speed' },
  { label: 'Community', href: '#coverage' },
  { label: 'Projects', href: '#install' },
  { label: 'Join', href: '#go' },
];

const Header: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);

      // Determine active section
      const sections = NAV_ITEMS.map((item) => item.href.replace('#', ''));
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) {
          setActiveSection(id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        scrolled ? 'anchor-nav' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <AppLogo
            size={28}
            iconName="CodeZoneIcon"
            text="CodeZone"
            className="text-hot-white"
          />
        </a>

        {/* Anchor Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.href.replace('#', '');
            return (
              <a
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 text-sm font-medium tracking-wide transition-all duration-300 ${
                  isActive
                    ? 'text-violet-light'
                    : 'text-lilac hover:text-hot-white'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                    style={{
                      background: 'var(--violet)',
                      boxShadow: '0 0 8px var(--violet-glow)',
                    }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* CTA */}
        <a
          href="#"
          className="btn-primary px-5 py-2 rounded-lg text-sm font-semibold tracking-wide hidden sm:block"
        >
          Get Started
        </a>

        {/* Mobile menu icon */}
        <button className="md:hidden text-lilac hover:text-hot-white transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 8h16M4 16h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;