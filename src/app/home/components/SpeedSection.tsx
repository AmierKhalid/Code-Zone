'use client';

import React, { useEffect, useRef, useState } from 'react';

interface BarRaceItem {
  label: string;
  sublabel: string;
  download: number; // Mbps
  upload: number;
  latency: number; // ms
  maxBar: number;
  color: string;
  glowColor: string;
}

const COMPARISONS: BarRaceItem[] = [
  {
    label: 'Code-Zone',
    sublabel: 'Verified Snippets',
    download: 1200,
    upload: 99,
    latency: 2,
    maxBar: 100,
    color: 'var(--violet)',
    glowColor: 'rgba(123,47,190,0.5)',
  },
  {
    label: 'Manual Search',
    sublabel: 'Unstructured Data',
    download: 10,
    upload: 15,
    latency: 78,
    maxBar: 100,
    color: 'rgba(196,177,212,0.25)',
    glowColor: 'transparent',
  },
  {
    label: 'AI Drafts',
    sublabel: 'LLM Generation',
    download: 40,
    upload: 45,
    latency: 620,
    maxBar: 100,
    color: 'rgba(196,177,212,0.15)',
    glowColor: 'transparent',
  },
];

const SpeedBar: React.FC<{
  item: BarRaceItem;
  animate: boolean;
  delay: number;
}> = ({ item, animate, delay }) => {
  const pct = Math.max((item.download / 1300) * 100, item.download > 0 ? 2 : 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end justify-between mb-1">
        <div>
          <span className="font-display text-lg font-bold text-hot-white">{item.label}</span>
          <span className="font-mono-custom text-[10px] text-lilac opacity-50 ml-2">{item.sublabel}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-2xl font-bold"
          style={{ color: item.label === 'Code-Zone' ? 'var(--violet-light)' : 'var(--lilac)' }}>
          {/* لو الرقم 10 أو أكتر، هيحط k.. لو أصغر (زي أرقام المنافسين) هيعرض الرقم عادي */}
          {item.download >= 10 ? `${item.download}k Snippets` : `${item.download} Snippets`}
        </span>
        </div>
      </div>

      {/* Bar */}
      <div className="relative h-10 rounded-lg overflow-hidden" style={{ background: 'rgba(196,177,212,0.06)' }}>
        <div
          className="h-full rounded-lg transition-all ease-out"
          style={{
            width: animate ? `${pct}%` : '0%',
            transitionDuration: item.label === 'Code-Zone' ? '1.2s' : item.label === 'Satellite' ? '2.8s' : '3.5s',
            transitionDelay: `${delay}ms`,
            background: item.label === 'Code-Zone' ?'linear-gradient(90deg, var(--violet), var(--violet-light), rgba(191,127,255,0.9))'
              : item.color,
            boxShadow: item.label === 'Code-Zone' ? `0 0 20px ${item.glowColor}` : 'none',
          }}
        />
        {/* Label inside bar */}
        <div className="absolute inset-0 flex items-center px-4">
          <span className="font-mono-custom text-[10px] font-medium" style={{ color: item.label === 'Code-Zone' ? 'var(--hot-white)' : 'rgba(196,177,212,0.4)' }}>
            {item.label === 'Code-Zone' ? '● LIVE' : ''}
          </span>
        </div>
      </div>

      {/* Sub-stats */}
      <div className="flex gap-6 pl-1">
       <div className="flex items-center gap-1.5">
        <span className="font-mono-custom text-[9px] text-lilac opacity-40 uppercase tracking-wider">Accuracy</span>
        <span className="font-mono-custom text-[10px] text-lilac opacity-70">
          {item.upload} %  {/* هنا شيلنا الـ Mbps وحطينا % */}
        </span>
      </div>
        <div className="flex items-center gap-1.5">
        <span className="font-mono-custom text-[9px] text-lilac opacity-40 uppercase tracking-wider">Runtime</span>
        <span className="font-mono-custom text-[10px] text-violet-light">
          {item.latency} ms  {/* لو عايزة تخليها ms زي ما هي تمام، أو تغيريها لـ s */}
        </span>
      </div>
      </div>
    </div>
  );
};

const SpeedSection: React.FC = () => {
  const [animate, setAnimate] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimate(true); },
      { threshold: 0.25 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="speed" ref={sectionRef} className="py-28 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-px" style={{ background: 'var(--violet)' }} />
              <span className="font-mono-custom text-[10px] tracking-widest uppercase text-violet-light opacity-70">01 · Efficiency.</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl font-bold leading-tight text-hot-white">
              No contest.<br />
              <span className="italic" style={{ color: 'var(--violet-light)' }}>No comparison.</span>
            </h2>
          </div>
          <p className="text-base text-lilac opacity-60 max-w-sm leading-relaxed">
            Searching for solutions shouldn't take hours. Code-Zone provides verified snippets in seconds.
          </p>
        </div>

        {/* Bar race */}
        <div className="glass-card rounded-2xl p-8 md:p-10 space-y-10">
          {COMPARISONS.map((item, i) => (
            <SpeedBar key={item.label} item={item} animate={animate} delay={i * 200} />
          ))}
        </div>

        {/* Bottom callouts */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '⚡',
              title: 'Instant Access',
              desc: 'Get your code running immediately.',
            },
            {
              icon: '🛠️',
              title: 'Expert Support',
              desc: 'Connect with senior developers instantly.',
            },
            {
              icon: '</>',
              title: 'Clean Code',
              desc: 'No bloated libraries, just pure efficiency.',
            },
          ].map((item) => (
            <div key={item.title} className="glass-card rounded-xl p-6">
              <div className="text-2xl mb-3">{item.icon}</div>
              <h4 className="font-display text-lg font-bold text-hot-white mb-2">{item.title}</h4>
              <p className="text-sm text-lilac opacity-60 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpeedSection;