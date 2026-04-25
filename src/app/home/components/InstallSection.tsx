'use client';

import React, { useEffect, useRef, useState } from 'react';


const STEPS = [
  {
    num: '01',
    title: 'Pick a Stack',
    duration: '24 hrs',
    desc: 'Choose your preferred framework and language. Our library supports everything from React to Python.',
    icon: (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-violet">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
),
  },
  {
    num: '02',
    title: 'Copy & Refactor',
    duration: 'In Minutes',
    desc: 'Grab verified, high-performance snippets. Built-in clean code principles ensure your project stays maintainable.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-violet">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
    ),
  },
  {
    num: '03',
    title: 'Scale & Ship',
    duration: 'Live Now',
    desc: 'Deploy your logic with confidence. Our snippets are battle-tested for production environments.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-violet">
    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
    ),
  },
];

const InstallSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(-1);
  const [lineWidths, setLineWidths] = useState([0, 0]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Animate steps in sequence
          STEPS.forEach((_, i) => {
            setTimeout(() => {
              setActiveStep(i);
              if (i < 2) {
                setTimeout(() => {
                  setLineWidths((prev) => {
                    const next = [...prev];
                    next[i] = 100;
                    return next;
                  });
                }, 400);
              }
            }, i * 900);
          });
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="install" ref={sectionRef} className="py-28 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-20">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-px" style={{ background: 'var(--violet)' }} />
              <span className="font-mono-custom text-[10px] tracking-widest uppercase text-violet-light opacity-70">03 · Projects</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl font-bold leading-tight text-hot-white">
              From Idea to<br />
              <span className="italic" style={{ color: 'var(--violet-light)' }}>Deployment in Minutese.</span>
            </h2>
          </div>
          <p className="text-base text-lilac opacity-60 max-w-sm leading-relaxed">
            We’ve optimized the workflow for 4,000+ developers. No complex setups, no 'it works on my machine' excuses.
          </p>
        </div>

        {/* Steps — horizontal on desktop */}
        <div className="relative">
          {/* Desktop: horizontal steps */}
          <div className="hidden lg:grid grid-cols-3 gap-0 relative">
            {STEPS.map((step, i) => (
              <React.Fragment key={step.num}>
                <div
                  className={`relative transition-all duration-700 ${
                    activeStep >= i ? 'opacity-100' : 'opacity-30'
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  {/* Step card */}
                  <div
                    className={`glass-card rounded-2xl p-8 mr-0 transition-all duration-500 ${
                      activeStep >= i ? 'border-violet-DEFAULT/30' : ''
                    }`}
                    style={activeStep >= i ? { borderColor: 'rgba(123,47,190,0.3)', boxShadow: '0 0 30px rgba(123,47,190,0.08)' } : {}}
                  >
                    {/* Icon + number */}
                    <div className="flex items-center justify-between mb-6">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500"
                        style={{
                          background: activeStep >= i ? 'rgba(123,47,190,0.2)' : 'rgba(196,177,212,0.05)',
                          border: `1px solid ${activeStep >= i ? 'rgba(123,47,190,0.4)' : 'rgba(196,177,212,0.1)'}`,
                          color: activeStep >= i ? 'var(--violet-light)' : 'rgba(196,177,212,0.4)',
                        }}
                      >
                        {step.icon}
                      </div>
                      <span
                        className="font-mono-custom text-3xl font-bold transition-colors duration-500"
                        style={{ color: activeStep >= i ? 'rgba(123,47,190,0.4)' : 'rgba(196,177,212,0.1)' }}
                      >
                        {step.num}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="font-display text-2xl font-bold text-hot-white mb-2">{step.title}</h4>

                    {/* Duration badge */}
                    <div
                      className="inline-block px-3 py-1 rounded-full mb-4 font-mono-custom text-[10px] tracking-wider uppercase transition-all duration-500"
                      style={{
                        background: activeStep >= i ? 'rgba(123,47,190,0.15)' : 'rgba(196,177,212,0.05)',
                        color: activeStep >= i ? 'var(--violet-light)' : 'rgba(196,177,212,0.3)',
                        border: `1px solid ${activeStep >= i ? 'rgba(123,47,190,0.3)' : 'rgba(196,177,212,0.1)'}`,
                      }}
                    >
                      {step.duration}
                    </div>

                    <p className="text-sm text-lilac opacity-60 leading-relaxed mb-4">{step.desc}</p>
                    <p className="text-xs text-lilac opacity-40 leading-relaxed">{step.detail}</p>
                  </div>

                  {/* Connector line — between steps */}
                  {i < 2 && (
                    <div className="absolute top-[3.5rem] left-full z-10 w-8 -translate-x-4">
                      <div className="step-line w-full">
                        <div
                          className="step-line-fill"
                          style={{
                            width: `${lineWidths[i]}%`,
                            transition: `width 0.8s cubic-bezier(0.19,1,0.22,1) ${i * 0.1}s`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Mobile: vertical steps */}
          <div className="lg:hidden space-y-6">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className={`glass-card rounded-2xl p-6 transition-all duration-700 ${
                  activeStep >= i ? 'opacity-100' : 'opacity-30'
                }`}
                style={activeStep >= i ? { borderColor: 'rgba(123,47,190,0.3)', boxShadow: '0 0 20px rgba(123,47,190,0.08)' } : {}}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{
                      background: activeStep >= i ? 'rgba(123,47,190,0.2)' : 'rgba(196,177,212,0.05)',
                      border: `1px solid ${activeStep >= i ? 'rgba(123,47,190,0.4)' : 'rgba(196,177,212,0.1)'}`,
                      color: activeStep >= i ? 'var(--violet-light)' : 'rgba(196,177,212,0.4)',
                    }}
                  >
                    {step.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-display text-xl font-bold text-hot-white">{step.title}</h4>
                      <span
                        className="font-mono-custom text-[9px] px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(123,47,190,0.15)', color: 'var(--violet-light)' }}
                      >
                        {step.duration}
                      </span>
                    </div>
                    <p className="text-sm text-lilac opacity-60 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

       
        
      </div>
    </section>
  );
};

export default InstallSection;