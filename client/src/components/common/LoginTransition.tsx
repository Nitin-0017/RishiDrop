import React, { useEffect, useState } from 'react';
import rishihoodImage from '../../assets/rishihood.png';
import rishihoodMark from '../../assets/rishihood-mark.svg';

interface LoginTransitionProps {
  onComplete: () => void;
  role?: string;
}

const BRAND_CHARS = [
  { char: 'R', color: 'text-white' },
  { char: 'i', color: 'text-white' },
  { char: 's', color: 'text-white' },
  { char: 'h', color: 'text-white' },
  { char: 'i', color: 'text-white' },
  { char: 'D', color: 'text-[#F43F5E]' },
  { char: 'r', color: 'text-[#F43F5E]' },
  { char: 'o', color: 'text-[#F43F5E]' },
  { char: 'p', color: 'text-[#F43F5E]' },
];

export const LoginTransition: React.FC<LoginTransitionProps> = ({
  onComplete,
  role = 'portal',
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Start exit fade at 2.1s
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2100);

    // Complete transition and invoke callback at 2.45s
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2450);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      role="status"
      aria-label="Preparing your portal..."
      className={`fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center transition-all duration-400 ease-out select-none cursor-wait ${
        isExiting ? 'opacity-0 scale-[1.02]' : 'opacity-100 scale-100'
      }`}
    >
      <style>{`
        @keyframes campusZoom {
          0% { transform: scale(1.08); opacity: 0; }
          100% { transform: scale(1.0); opacity: 1; }
        }
        @keyframes floatDrift1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes floatDrift2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(8px) rotate(-4deg); }
        }
        @keyframes brandReveal {
          0% {
            opacity: 0;
            transform: scale(0.9);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: scale(1.0);
            filter: blur(0px);
          }
        }
        @keyframes charStaggerReveal {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.92);
            filter: blur(8px);
          }
          65% {
            opacity: 0.95;
            transform: translateY(-2px) scale(1.04);
            filter: blur(1px);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1.0);
            filter: blur(0px);
          }
        }
        @keyframes wordGlowSettle {
          0% {
            filter: drop-shadow(0 0 10px rgba(166, 25, 46, 0.2));
          }
          60% {
            filter: drop-shadow(0 0 32px rgba(244, 63, 94, 0.6));
          }
          100% {
            filter: drop-shadow(0 0 25px rgba(166, 25, 46, 0.45));
          }
        }
        @keyframes subtitleReveal {
          0% {
            opacity: 0;
            transform: translateY(6px);
            letter-spacing: 0.15em;
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            letter-spacing: 0.28em;
          }
        }
        @keyframes statusReveal {
          0% {
            opacity: 0;
            transform: translateY(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulseDot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes beaconGlow {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.4); opacity: 0.8; }
        }

        .anim-campus-bg {
          animation: campusZoom 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-crest-focus {
          animation: brandReveal 0.65s 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .anim-char-reveal {
          animation: charStaggerReveal 0.36s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .anim-word-settle {
          animation: wordGlowSettle 0.8s 1.22s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .anim-subtitle-fade {
          animation: subtitleReveal 0.6s 1.28s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .anim-status-fade {
          animation: statusReveal 0.55s 1.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .anim-float-1 {
          animation: floatDrift1 4s ease-in-out infinite;
        }
        .anim-float-2 {
          animation: floatDrift2 4.5s ease-in-out infinite;
        }
        .anim-pulse-dot-1 {
          animation: pulseDot 1.4s infinite ease-in-out both;
        }
        .anim-pulse-dot-2 {
          animation: pulseDot 1.4s 0.2s infinite ease-in-out both;
        }
        .anim-pulse-dot-3 {
          animation: pulseDot 1.4s 0.4s infinite ease-in-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .anim-campus-bg,
          .anim-crest-focus,
          .anim-char-reveal,
          .anim-word-settle,
          .anim-subtitle-fade,
          .anim-status-fade,
          .anim-float-1,
          .anim-float-2,
          .anim-pulse-dot-1,
          .anim-pulse-dot-2,
          .anim-pulse-dot-3 {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }
        }
      `}</style>

      {/* 1. BACKGROUND: Rishihood University Campus Image */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#060A14]">
        <img
          src={rishihoodImage}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-center anim-campus-bg filter brightness-[0.95] contrast-[1.02]"
        />

        {/* Deep navy/black 65-70% overlay for optimal branding contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070D1E]/70 via-[#0A1429]/68 to-[#050914]/72 backdrop-blur-[1px]" />

        {/* Subtle radial vignette around screen edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,20,41,0.65)_0%,rgba(5,9,20,0.72)_100%)] pointer-events-none" />
      </div>

      {/* 2. FLOATING LOGISTICS ELEMENTS: Subtle parcels, beacons, and grid coordinates */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Subtle glowing beacon dots */}
        <div className="absolute top-[18%] left-[14%] flex items-center space-x-2 opacity-50">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A6192E] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#A6192E]" />
          </span>
          <span className="text-[10px] font-mono text-slate-400/80 tracking-widest uppercase">
            CAMPUS • NORTH GATE
          </span>
        </div>

        <div className="absolute bottom-[20%] right-[12%] flex items-center space-x-2 opacity-50">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[10px] font-mono text-slate-400/80 tracking-widest uppercase">
            HUB • RACK MATRIX
          </span>
        </div>

        {/* Floating Minimalist Box Outlines */}
        <div className="absolute top-[28%] right-[20%] opacity-25 anim-float-1">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="1">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
        </div>

        <div className="absolute bottom-[28%] left-[18%] opacity-20 anim-float-2">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
        </div>

        {/* Thin geometric logistics line */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <line x1="10%" y1="50%" x2="90%" y2="50%" stroke="white" strokeWidth="1" strokeDasharray="4 8" />
        </svg>
      </div>

      {/* 3. CENTER BRANDING ANIMATION */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-lg">
        {/* Authentic Rishihood Mark */}
        <div className="anim-crest-focus mb-5 relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_0_35px_rgba(166,25,46,0.35)] flex items-center justify-center p-3.5 sm:p-4">
            <img
              src={rishihoodMark}
              alt="Rishihood University"
              className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
            />
          </div>
          {/* Subtle Ambient Red Pulse Ring */}
          <div className="absolute inset-0 rounded-3xl border border-[#A6192E]/40 animate-ping pointer-events-none opacity-40" />
        </div>

        {/* Product Title: RishiDrop (Staggered Character Reveal) */}
        <h1 className="anim-word-settle text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none drop-shadow-[0_0_30px_rgba(166,25,46,0.45)] inline-flex items-center justify-center">
          {BRAND_CHARS.map((item, index) => (
            <span
              key={index}
              style={{ animationDelay: `${0.42 + index * 0.09}s` }}
              className={`inline-block anim-char-reveal ${item.color}`}
            >
              {item.char}
            </span>
          ))}
        </h1>

        {/* Subtitle: University Parcel Hub */}
        <div className="anim-subtitle-fade mt-3 flex items-center justify-center space-x-2">
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.28em] text-[#FDA4AF] drop-shadow-sm">
            University Parcel Hub
          </span>
        </div>

        {/* Subtle Status Line: Preparing your portal... */}
        <div className="anim-status-fade mt-8 flex items-center justify-center space-x-2.5 text-xs text-slate-400 font-medium tracking-wide">
          <span>Preparing your {role === 'ADMIN' ? 'Admin' : role === 'GUARD' ? 'Guard' : ''} portal</span>
          <span className="flex space-x-1 items-center pt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E] anim-pulse-dot-1" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E] anim-pulse-dot-2" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E] anim-pulse-dot-3" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginTransition;
