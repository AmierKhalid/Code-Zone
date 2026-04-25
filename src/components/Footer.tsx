import React from 'react';
import AppLogo from '@/components/ui/AppLogo';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-lilac-border py-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Pattern 3: Vercel Horizontal Flow */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <AppLogo
            size={24}
            iconName="SignalIcon"
            text="Signal"
            className="text-hot-white opacity-70"
          />

          {/* Links */}
          <nav className="flex items-center gap-1 text-sm">
            {['Speed', 'Coverage', 'Install', 'Pricing'].map((item, i) => (
              <React.Fragment key={item}>
                {i > 0 && <span className="text-lilac opacity-30 mx-1">·</span>}
                <a
                  href={`#${item.toLowerCase()}`}
                  className="px-2 py-1 text-lilac hover:text-hot-white transition-colors duration-200 font-medium"
                >
                  {item}
                </a>
              </React.Fragment>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-6">
            {/* Social */}
            <div className="flex items-center gap-3">
              {[
                {
                  label: 'Twitter',
                  path: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z',
                },
                {
                  label: 'Facebook',
                  path: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="text-lilac hover:text-violet-light transition-colors duration-200"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>

            <span className="text-lilac opacity-40 text-xs font-medium">
              Privacy · Terms
            </span>
            <span className="text-lilac opacity-30 text-xs">
              © 2026 Signal
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;