'use client';

import React from 'react';

const GoSection: React.FC = () => {
  return (
    // id="go-section" عشان اللينك اللي فوق يشتغل
    <section id="go-section" className="relative py-28 px-6 lg:px-10 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="glass-card rounded-[2.5rem] p-8 md:p-20 border border-white/5 bg-white/[0.02] relative overflow-hidden text-center">
          
          {/* Background Glow - لإضافة لمسة جمالية */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet/20 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            {/* الترحيب */}
            <h4 className="font-mono-custom text-violet-light text-xs tracking-[0.4em] uppercase mb-6">
              Welcome to the code-Zone
            </h4>
            
            <h2 className="font-display text-5xl md:text-7xl font-bold text-hot-white mb-8 leading-tight">
              Ready to build <br />
              <span className="italic" style={{ color: 'var(--violet-light)' }}>something epic?</span>
            </h2>
            
            <p className="text-lilac opacity-70 text-lg md:text-xl mb-12 leading-relaxed">
              Don't wait for permission. Jump straight into our ecosystem, explore verified snippets, and join thousands of developers scaling their workflow today.
            </p>
            
            {/* الزرار المباشر */}
            <div className="flex flex-col items-center gap-6">
              <button 
                onClick={() => window.location.href = '/dashboard'} // حطي هنا لينك الأبلكيشن بتاعك
                className="group relative px-12 py-6 bg-violet hover:bg-violet-light text-white font-bold rounded-2xl transition-all hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] active:scale-[0.95] text-xl overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Launch Application 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
              
              <p className="font-mono-custom text-[10px] text-lilac opacity-40 uppercase tracking-[0.2em]">
                No signup required · open source · community driven
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GoSection;