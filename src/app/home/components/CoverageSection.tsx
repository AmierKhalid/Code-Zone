'use client';

import React, { useEffect, useRef, useState } from 'react';

const COVERAGE_COUNTIES = [
  { name: 'react', state: 'NE', status: 'live', x: 38, y: 42 },
  { name: 'node', state: 'NE', status: 'live', x: 55, y: 35 },
  { name: 'sql', state: 'NE', status: 'live', x: 30, y: 28 },
  { name: 'java', state: 'NE', status: 'expanding', x: 48, y: 20 },
  { name: 'python', state: 'NE', status: 'expanding', x: 60, y: 48 },
  { name: 'html', state: 'NE', status: 'coming', x: 70, y: 30 },
  { name: 'css', state: 'NE', status: 'coming', x: 75, y: 22 },
];

const STATUS_COLORS: Record<string, string> = {
  live: 'var(--violet)',
  expanding: 'rgba(155,79,222,0.6)',
  coming: 'rgba(196,177,212,0.3)',
};

const STATUS_LABELS: Record<string, string> = {
  live: 'Live',
  expanding: 'Expanding',
  coming: 'Coming 2026',
};

const CoverageSection: React.FC = () => {
  const [animate, setAnimate] = useState(false);
  const [address, setAddress] = useState('');
  const [checked, setChecked] = useState(false);
  const [bloomRings, setBloomRings] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimate(true);
          // Stagger bloom rings
          [0, 800, 1600, 2400].forEach((delay) => {
            setTimeout(() => {
              setBloomRings((prev) => [...prev, delay]);
            }, delay);
          });
        }
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) setChecked(true);
  };

  return (
    <section id="coverage" ref={sectionRef} className="py-28 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-px" style={{ background: 'var(--violet)' }} />
              <span className="font-mono-custom text-[10px] tracking-widest uppercase text-violet-light opacity-70">02 · Community</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl font-bold leading-tight text-hot-white">
              Global Developer<br />
              <span className="italic" style={{ color: 'var(--violet-light)' }}>Network.</span>
            </h2>
          </div>
          <p className="text-base text-lilac opacity-60 max-w-sm leading-relaxed">
            Code-Zone is more than snippets. It's a growing ecosystem of developers sharing logic across every tech stack.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Map visualization */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden" style={{ minHeight: 420 }}>
            {/* Map background */}
            <div className="absolute inset-0 opacity-10">
              <svg viewBox="0 0 100 80" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                {/* Stylized county grid */}
                {Array.from({ length: 8 }).map((_, row) =>
                  Array.from({ length: 10 }).map((_, col) => (
                    <rect
                      key={`${row}-${col}`}
                      x={col * 10 + 1}
                      y={row * 10 + 1}
                      width={9}
                      height={9}
                      fill="none"
                      stroke="rgba(196,177,212,0.3)"
                      strokeWidth="0.2"
                      rx="0.5"
                    />
                  ))
                )}
              </svg>
            </div>

            {/* Bloom rings from center */}
            {animate && (
              <div className="absolute" style={{ top: '42%', left: '38%', transform: 'translate(-50%,-50%)' }}>
                {[80, 120, 160, 220].map((size, i) => (
                  <div
                    key={size}
                    className="absolute rounded-full border"
                    style={{
                      width: size,
                      height: size,
                      top: -size / 2,
                      left: -size / 2,
                      borderColor: `rgba(123,47,190,${0.4 - i * 0.08})`,
                      animation: `bloom-ring ${2 + i * 0.5}s ease-out ${i * 0.4}s infinite`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* County nodes */}
            <svg viewBox="0 0 100 70" className="w-full h-full relative z-10" style={{ minHeight: 320 }}>
              {/* Connection lines */}
              {COVERAGE_COUNTIES.filter((c) => c.status === 'live').map((c, i) => {
                if (i === 0) return null;
                const prev = COVERAGE_COUNTIES.filter((c2) => c2.status === 'live')[0];
                return (
                  <line
                    key={`line-${i}`}
                    x1={prev.x}
                    y1={prev.y}
                    x2={c.x}
                    y2={c.y}
                    stroke="rgba(123,47,190,0.2)"
                    strokeWidth="0.3"
                    strokeDasharray="1 1"
                  />
                );
              })}

              {COVERAGE_COUNTIES.map((county, i) => (
                <g key={county.name}>
                  {/* Outer glow ring */}
                  {county.status === 'live' && animate && (
                    <circle
                      cx={county.x}
                      cy={county.y}
                      r="4"
                      fill="none"
                      stroke="rgba(123,47,190,0.3)"
                      strokeWidth="0.5"
                      style={{
                        animation: `bloom-ring 2.5s ease-out ${i * 0.3}s infinite`,
                      }}
                    />
                  )}
                  {/* Dot */}
                  <circle
                    cx={county.x}
                    cy={county.y}
                    r={county.status === 'live' ? 2.5 : 1.8}
                    fill={STATUS_COLORS[county.status]}
                    style={{
                      filter: county.status === 'live' ? 'drop-shadow(0 0 4px rgba(123,47,190,0.8))' : 'none',
                      opacity: animate ? 1 : 0,
                      transition: `opacity 0.6s ease ${i * 0.15}s`,
                    }}
                  />
                  {/* Label */}
                  <text
                    x={county.x + 3.5}
                    y={county.y + 1}
                    fontSize="3"
                    fill={county.status === 'live' ? 'rgba(240,234,255,0.8)' : 'rgba(196,177,212,0.4)'}
                    fontFamily="JetBrains Mono, monospace"
                    style={{
                      opacity: animate ? 1 : 0,
                      transition: `opacity 0.6s ease ${i * 0.15 + 0.3}s`,
                    }}
                  >
                    {county.name.split(' ')[0]}
                  </text>
                </g>
              ))}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex gap-4">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: STATUS_COLORS[key],
                      boxShadow: key === 'live' ? '0 0 6px rgba(123,47,190,0.8)' : 'none',
                    }}
                  />
                  <span className="font-mono-custom text-[9px] text-lilac opacity-60">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Stats + Testimonials */}
          <div className="flex flex-col gap-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { val: '14', label: 'Expert Mentors', color: 'var(--violet-light)' },
                { val: '8', label: 'Daily Projects', color: 'var(--lilac)' },
                { val: '6', label: 'Tech Stacks', color: 'rgba(196,177,212,0.4)' },
              ].map((stat) => (
                <div key={stat.label} className="glass-card rounded-xl p-5 text-center">
                  <div className="font-display text-3xl font-bold mb-1" style={{ color: stat.color }}>{stat.val}</div>
                  <div className="font-mono-custom text-[9px] text-lilac opacity-50 uppercase tracking-wider leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Testimonials */}
            {[
              {
                quote: "I found a React snippet that saved me 4 hours of debugging. The logic is so clean!",
                name: "Aya Ahmed",
                role: "Frontend Dev",
              },
              {
                quote: "Real-time support from this community is unmatched. Zero friction.",
                name: "Alla Hesham",
                role: "Backend Engineer",
              },
            ].map((t) => (
              <div key={t.name} className="glass-card rounded-xl p-6 border border-white/5">
                <p className="text-sm text-hot-white opacity-80 leading-relaxed mb-4 italic">"{t.quote}"</p>
                <div>
                  <div className="font-display text-sm font-bold text-hot-white">{t.name}</div>
                  <div className="font-mono-custom text-[10px] text-lilac opacity-50">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div> {/* نهاية الـ Grid اللي فوق (الخريطة والكومنتات) */}

        {/* الجزء السفلي: فورم التعليقات (خارج الـ Grid عشان تاخد العرض كله) */}
        <div className="glass-card rounded-2xl p-8 md:p-12 border border-white/5 bg-white/[0.02] mt-12">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h3 className="text-3xl font-bold text-hot-white mb-4 font-display">Share Your Experience</h3>
            <p className="text-lilac opacity-60">Used our snippets? Tell us what you think.</p>
          </div>

          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <textarea 
              placeholder="Write your comment about Code-Zone..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-hot-white outline-none focus:border-violet/50 min-h-[120px] resize-none"
            ></textarea>

            <div className="flex flex-col md:flex-row gap-4">
              <input 
                type="email" 
                placeholder="Enter your email address..." 
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-hot-white outline-none focus:border-violet/50"
              />
              <button className="bg-violet hover:bg-violet-light text-white font-bold py-4 px-12 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.6)] active:scale-95">
                Join & Post
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <input type="checkbox" id="sub_full" className="w-4 h-4 accent-violet cursor-pointer" />
              <label htmlFor="sub_full" className="text-sm text-lilac opacity-60 cursor-pointer">
                I'm not a member, sign me up for the community first!
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoverageSection;