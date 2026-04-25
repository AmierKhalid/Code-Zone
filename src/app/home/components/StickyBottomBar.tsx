'use client';

import React, { useEffect, useState } from 'react';

const StickyBottomBar: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [address, setAddress] = useState('');
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past the hero (~100vh)
      const heroHeight = window.innerHeight;
      setVisible(window.scrollY > heroHeight * 0.8);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) setChecked(true);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 w-full z-40 sticky-bottom-bar transition-all duration-500 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {!checked ? (
            <>
              <span className="font-display text-sm font-bold text-hot-white whitespace-nowrap hidden md:block">
                Check Membership Status
              </span>
              <form onSubmit={handleCheck} className="flex flex-1 gap-2 max-w-xl">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your GitHub username or Email"
                  className="address-input flex-1 px-4 py-2.5 rounded-lg text-sm"
                />
                <button type="submit" className="btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap">
                  Verify Me
                </button>
              </form>
              <a href="#coverage" className="text-sm text-lilac opacity-60 hover:opacity-100 hover:text-violet-light transition-all duration-200 whitespace-nowrap hidden sm:block">
                See coverage map
              </a>
            </>
          ) : (
            <div className="flex items-center gap-4 flex-1 justify-center">
              <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px rgba(74,222,128,0.8)' }} />
              <span className="text-sm text-hot-white font-medium">Service available at your address</span>
              <a href="#pricing" className="btn-primary px-5 py-2 rounded-lg text-sm font-semibold">
                View Plans
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StickyBottomBar;