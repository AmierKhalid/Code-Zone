'use client';

import React, { useEffect, useState, useRef } from 'react';

const TYPING_PHRASES = [
  'Code-Zone: The first social platform designed for developers to share snippets, hunt errors, and collaborate without limits.',
  'Code-Zone: The first social platform designed for developers to share snippets, hunt errors, and collaborate without limits.',
  'Code-Zone: The first social platform designed for developers to share snippets, hunt errors, and collaborate without limits.',
  'Code-Zone: The first social platform designed for developers to share snippets, hunt errors, and collaborate without limits.',
];

const SpeedGauge: React.FC<{ value: number; max: number; label: string; unit: string; color: string }> = ({
  value, max, label, unit, color
}) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1800;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value * 10) / 10);
      if (progress < 1) requestAnimationFrame(animate);
    };
    const timer = setTimeout(() => requestAnimationFrame(animate), 600);
    return () => clearTimeout(timer);
  }, [value]);

  const percent = (display / max) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(196,177,212,0.1)" strokeWidth="6" />
          <circle
            cx="48" cy="48" r="40"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - percent / 100)}`}
            style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(0.19,1,0.22,1)', filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono-custom text-sm md:text-base font-bold text-hot-white leading-none">
          {value >= 1000 ? (value / 1000).toFixed(1) + ' k' : value}
          </span>
        </div>
      </div>
      <span className="font-mono-custom text-[9px] tracking-widest uppercase text-lilac opacity-50">{label}</span>
    </div>
  );
};

const BrowserMockup: React.FC = () => {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="browser-mockup w-full max-w-lg animate-float-screen">
      {/* Title bar */}
      <div className="browser-titlebar px-4 py-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-void rounded-md px-3 py-1 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-glow-pulse" style={{ background: 'var(--violet)' }} />
            <span className="font-mono-custom text-[10px] text-lilac opacity-60">code-zone.com — dashboard</span>
          </div>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="p-6">
        {/* Status bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px rgba(74,222,128,0.8)' }} />
            <span className="font-mono-custom text-[10px] text-lilac opacity-70">STABLE · MAIN-SERVER · ONLINE</span>
          </div>
          <span className="font-mono-custom text-[10px] text-lilac opacity-40">02/27/2026 23:13</span>
        </div>

        {/* Speed gauges */}
        <div className="flex items-center justify-around mb-6">
          {started && (
            <>
              <SpeedGauge value={1200} max={1500} label="Download" unit="Mbps" color="#7B2FBE" />
              <div className="flex flex-col items-center gap-1">
                <div className="font-mono-custom text-[10px] text-lilac opacity-40 tracking-widest">BUILD TIME</div>
                <div className="font-display text-4xl font-bold text-hot-white text-glow">4</div>
                <div className="font-mono-custom text-[10px] text-lilac opacity-50">ms</div>
              </div>
              <SpeedGauge value={940} max={1000} label="Users" unit="Mbps" color="#9B4FDE" />
            </>
          )}
          {!started && (
            <div className="flex items-center gap-4 py-8">
              <div className="w-2 h-2 rounded-full bg-violet-DEFAULT animate-ping" />
              <span className="font-mono-custom text-xs text-lilac opacity-40">Initializing test...</span>
            </div>
          )}
        </div>

        {/* Progress bars */}
        <div className="space-y-3">
          {[
            { label: 'Download', value: started ? 96 : 0, color: 'var(--violet)' },
            { label: 'Users', value: started ? 88 : 0, color: 'var(--violet-light)' },
          ].map((bar) => (
            <div key={bar.label} className="flex items-center gap-3">
              <span className="font-mono-custom text-[9px] text-lilac opacity-50 w-14">{bar.label}</span>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(196,177,212,0.1)' }}>
                <div
                  className="h-full rounded-full transition-all duration-[1800ms] ease-out"
                  style={{
                    width: `${bar.value}%`,
                    background: `linear-gradient(90deg, ${bar.color}, rgba(191,127,255,0.8))`,
                    boxShadow: `0 0 8px ${bar.color}`,
                  }}
                />
              </div>
              <span className="font-mono-custom text-[9px] text-hot-white opacity-60 w-16 text-right">
                {bar.label === 'Download' ? '1.2 k' : '940 '}
              </span>
            </div>
          ))}
        </div>

        {/* Footer stat */}
        <div className="mt-4 pt-4 border-t border-lilac-border flex justify-between">
          <span className="font-mono-custom text-[9px] text-lilac opacity-40">Efficiency: 99.7%</span>
          <span className="font-mono-custom text-[9px] text-lilac opacity-40">Memory Leak: 0.00%</span>
          <span className="font-mono-custom text-[9px]" style={{ color: 'var(--violet-light)' }}>● SYSTEM READY</span>
        </div>
      </div>
    </div>
  );
};

const TypingSubhead: React.FC = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const current = TYPING_PHRASES[phraseIndex];

    if (!isDeleting && displayed.length < current.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayed(current.slice(0, displayed.length + 1));
      }, 55);
    } else if (!isDeleting && displayed.length === current.length) {
      timeoutRef.current = setTimeout(() => setIsDeleting(true), 2200);
    } else if (isDeleting && displayed.length > 0) {
      timeoutRef.current = setTimeout(() => {
        setDisplayed(current.slice(0, displayed.length - 1));
      }, 28);
    } else if (isDeleting && displayed.length === 0) {
      setIsDeleting(false);
      setPhraseIndex((i) => (i + 1) % TYPING_PHRASES.length);
    }

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [displayed, isDeleting, phraseIndex]);

  return (
  <div className="max-w-[450px]"> 
    <span className="font-mono-custom text-sm md:text-base text-lilac opacity-70 leading-relaxed break-words">
      {displayed}
      {/* الكيرسر بقى جزء من النص دلوقتي */}
      <span 
        className="inline-block ml-1 w-2.5 h-4 md:h-5 animate-blink align-middle" 
        style={{ 
          background: 'var(--violet-light)', 
          boxShadow: '0 0 8px var(--violet-light)' 
        }}
      ></span>
    </span>
  </div>
);
};

const HeroSection: React.FC = () => {
  const [address, setAddress] = useState('');
  const [checked, setChecked] = useState(false);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) setChecked(true);
  };

  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-16 px-6 lg:px-10 overflow-hidden">
      {/* Background concentric rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[800, 600, 400].map((size, i) => (
          <div
            key={size}
            className="absolute rounded-full border"
            style={{
              width: size,
              height: size,
              borderColor: `rgba(123,47,190,${0.04 + i * 0.02})`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-12 gap-8 items-center relative z-10">
        {/* LEFT: Text + CTA */}
        <div className="col-span-12 lg:col-span-5 order-2 lg:order-1">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass-card px-3 py-1.5 rounded-full mb-8">
            <div
              className="w-1.5 h-1.5 rounded-full animate-glow-pulse"
              style={{ background: 'var(--violet-light)', boxShadow: '0 0 6px var(--violet)' }}
            />
            <span className="font-mono-custom text-[10px] tracking-widest uppercase text-lilac opacity-70">
              Fiber · Fixed-Wireless · Rural Coverage
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.88] tracking-tight mb-6 text-hot-white text-glow-white">
            Where Code<br />
            <span className="italic" style={{ color: 'var(--violet-light)' }}>Meets Community..</span>
          </h1>

          {/* Typing subhead */}
          <div className="mb-12 h-14"> {/* الـ mb-20 أقل من 24 وأكثر توازناً */}
          <TypingSubhead />
          </div>

          {/* Address form */}
          {!checked ? (
            <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-3 max-w-md">
              
              <button type="submit" className="btn-primary px-6 py-3 rounded-lg text-sm font-semibold whitespace-nowrap">
                Join Code-Zone
              </button>
            </form>
          ) : (
            <div
              className="glass-card rounded-xl p-5 max-w-md border-violet-DEFAULT/40"
              style={{ borderColor: 'rgba(123,47,190,0.4)', boxShadow: '0 0 30px rgba(123,47,190,0.15)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px rgba(74,222,128,0.8)' }} />
                <span className="font-mono-custom text-[10px] tracking-widest uppercase text-green-400">Code-Zone: The first social platform designed for developers to share snippets, hunt errors, and collaborate without limits.</span>
              </div>
              <p className="text-sm text-hot-white font-medium mb-3">{address}</p>
              <div className="flex flex-wrap gap-2">
                {['Fiber 1 Gbps', 'Fiber 500 Mbps', 'Fixed Wireless 200 Mbps'].map((tier) => (
                  <span key={tier} className="font-mono-custom text-[10px] px-2 py-1 rounded-md" style={{ background: 'rgba(123,47,190,0.2)', color: 'var(--lilac)' }}>
                    {tier}
                  </span>
                ))}
              </div>
              <a href="#pricing" className="inline-block mt-3 text-sm font-semibold text-violet-light hover:text-hot-white transition-colors">
                View plans →
              </a>
            </div>
          )}

          {/* Sub-link */}
          <div className="mt-4">
            <a
              href="#coverage"
              className="text-sm text-lilac opacity-60 hover:opacity-100 hover:text-violet-light transition-all duration-300 underline underline-offset-4"
            >
              Explore the community
            </a>
          </div>

          {/* Stats row */}
          <div className="mt-12 flex gap-8 pt-8 border-t border-lilac-border">
            {[
              { val: '10', unit: 'K+', label: 'Snippets' },
              { val: '24', unit: '/7', label: 'Support' },
              { val: '99.9', unit: '%', label: 'Uptime SLA' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-2xl font-bold text-hot-white">{stat.val}</span>
                  <span className="font-mono-custom text-xs text-violet-light">{stat.unit}</span>
                </div>
                <span className="font-mono-custom text-[9px] text-lilac opacity-50 uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Browser mockup */}
        <div className="col-span-12 lg:col-span-7 order-1 lg:order-2 flex justify-center lg:justify-end">
          <div className="relative w-full max-w-xl">
            {/* Glow behind mockup */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(123,47,190,0.3) 0%, transparent 70%)',
                filter: 'blur(40px)',
                transform: 'scale(0.9) translateY(10%)',
              }}
            />
            <BrowserMockup />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
        <span className="font-mono-custom text-[9px] tracking-widest uppercase text-lilac">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-lilac to-transparent" />
      </div>
    </section>
  );
};

export default HeroSection;