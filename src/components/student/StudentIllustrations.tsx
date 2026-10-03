import React from 'react';

/**
 * 3D Isometric Math Numbers Icon Box
 */
export const Math3DIcon: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <div
    className={`${className} rounded-2xl bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#4C1D95] p-2 flex items-center justify-center shadow-md relative overflow-hidden shrink-0 select-none`}
  >
    {/* Ambient radial glow */}
    <div className="absolute -top-3 -right-3 w-10 h-10 bg-purple-300/30 rounded-full blur-xs" />
    <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-indigo-400/20 rounded-full blur-xs" />

    {/* 3D Colorful Numbers Cluster */}
    <div className="relative flex flex-col items-center justify-center font-black leading-none drop-shadow-sm">
      <div className="flex items-baseline gap-1 text-[18px]">
        <span className="text-yellow-300 transform -rotate-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">1</span>
        <span className="text-emerald-300 transform rotate-3 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">2</span>
        <span className="text-cyan-300 transform -rotate-3 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">3</span>
      </div>
      <div className="flex items-baseline gap-1 text-[15px] -mt-1">
        <span className="text-pink-300 transform rotate-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">2</span>
        <span className="text-amber-300 transform -rotate-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">3</span>
      </div>
    </div>
  </div>
);

/**
 * 3D Science Atomic Orbit Icon Box
 */
export const Science3DIcon: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <div
    className={`${className} rounded-2xl bg-gradient-to-br from-[#06B6D4] via-[#0284C7] to-[#0369A1] p-2 flex items-center justify-center shadow-md relative overflow-hidden shrink-0 select-none`}
  >
    <div className="absolute -top-3 -right-3 w-10 h-10 bg-cyan-200/30 rounded-full blur-xs" />
    <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-blue-300/20 rounded-full blur-xs" />

    {/* SVG 3D Atomic Orbit */}
    <svg viewBox="0 0 48 48" className="w-10 h-10 drop-shadow-sm" fill="none">
      {/* Central Glowing Nucleus */}
      <circle cx="24" cy="24" r="5" fill="#FACC15" className="filter drop-shadow" />
      <circle cx="22" cy="22" r="1.5" fill="#FEF08A" />

      {/* Orbit 1 */}
      <ellipse
        cx="24"
        cy="24"
        rx="18"
        ry="7"
        stroke="#E0F2FE"
        strokeWidth="2"
        transform="rotate(-30 24 24)"
        strokeDasharray="100"
        className="opacity-90"
      />
      <circle cx="37" cy="16" r="2.5" fill="#38BDF8" />

      {/* Orbit 2 */}
      <ellipse
        cx="24"
        cy="24"
        rx="18"
        ry="7"
        stroke="#BAE6FD"
        strokeWidth="2"
        transform="rotate(30 24 24)"
        className="opacity-90"
      />
      <circle cx="11" cy="16" r="2.5" fill="#67E8F9" />

      {/* Orbit 3 */}
      <ellipse
        cx="24"
        cy="24"
        rx="18"
        ry="7"
        stroke="#7DD3FC"
        strokeWidth="2"
        transform="rotate(90 24 24)"
        className="opacity-80"
      />
      <circle cx="24" cy="42" r="2.5" fill="#F43F5E" />
    </svg>
  </div>
);

/**
 * 3D English Open Book Icon Box
 */
export const English3DIcon: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <div
    className={`${className} rounded-2xl bg-gradient-to-br from-[#F59E0B] via-[#D97706] to-[#B45309] p-2 flex items-center justify-center shadow-md relative overflow-hidden shrink-0 select-none`}
  >
    <div className="absolute -top-3 -right-3 w-10 h-10 bg-amber-200/30 rounded-full blur-xs" />
    <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-yellow-300/20 rounded-full blur-xs" />

    {/* SVG 3D Book */}
    <svg viewBox="0 0 48 48" className="w-10 h-10 drop-shadow-sm" fill="none">
      {/* Book Cover */}
      <path
        d="M24 14C20 11 10 11 6 13V34C10 32 20 32 24 35C28 32 38 32 42 34V13C38 11 28 11 24 14Z"
        fill="#FEF3C7"
      />
      <path
        d="M24 14V35"
        stroke="#D97706"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Book Spine Edge */}
      <path
        d="M6 34C10 32 20 32 24 35V37C20 34 10 34 6 36V34Z"
        fill="#B45309"
      />
      <path
        d="M42 34C38 32 28 32 24 35V37C28 34 38 34 42 36V34Z"
        fill="#92400E"
      />
      {/* Lines on pages */}
      <line x1="11" y1="18" x2="20" y2="17" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="23" x2="19" y2="22" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="28" x2="18" y2="27" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />

      <line x1="28" y1="17" x2="37" y2="18" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="29" y1="22" x2="37" y2="23" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30" y1="27" x2="37" y2="28" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </div>
);

/**
 * 3D Environment Globe & Leaf Icon Box
 */
export const Environment3DIcon: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <div
    className={`${className} rounded-2xl bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] p-2 flex items-center justify-center shadow-md relative overflow-hidden shrink-0 select-none`}
  >
    <div className="absolute -top-3 -right-3 w-10 h-10 bg-emerald-200/30 rounded-full blur-xs" />
    <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-teal-300/20 rounded-full blur-xs" />

    {/* SVG 3D Globe with Sprout */}
    <svg viewBox="0 0 48 48" className="w-10 h-10 drop-shadow-sm" fill="none">
      {/* Earth Base */}
      <circle cx="24" cy="25" r="14" fill="#0284C7" />
      {/* Continents */}
      <path
        d="M17 19C19 18 21 21 23 20C25 19 27 18 29 20C30 22 28 25 26 27C24 28 20 28 17 26C15 24 15 21 17 19Z"
        fill="#34D399"
      />
      <path
        d="M26 31C28 32 32 30 33 27C34 26 36 29 35 32C33 35 28 36 26 35V31Z"
        fill="#10B981"
      />
      {/* Highlight glow */}
      <circle cx="18" cy="18" r="4" fill="white" className="opacity-25" />

      {/* Fresh Green Sprout leaf emerging */}
      <path
        d="M24 16C24 16 23 9 30 7C30 7 31 14 24 16Z"
        fill="#A7F3D0"
      />
      <path
        d="M24 16C24 16 19 12 21 6C21 6 27 9 24 16Z"
        fill="#6EE7B7"
      />
      <line x1="24" y1="16" x2="24" y2="20" stroke="#065F46" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </div>
);

/**
 * Hero Banner 3D Composition Graphic:
 * Golden Trophy + Star, Book Stack, Checklist with pencil, and Alarm Clock / Stopwatch with sparkles!
 */
export const HeroGraphicComposition: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={`relative w-full shrink-0 select-none flex items-center justify-center ${
        className || 'max-w-[280px] sm:max-w-[340px] h-[190px] sm:h-[220px]'
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-radial from-amber-400/20 via-blue-400/10 to-transparent blur-xl" />

      {/* Sparkles / Confetti Dots */}
      <span className="hidden sm:inline absolute top-2 left-6 text-amber-300 text-lg animate-pulse">✦</span>
      <span className="hidden sm:inline absolute top-8 right-8 text-yellow-200 text-sm animate-ping">★</span>
      <span className="hidden sm:inline absolute bottom-4 left-10 text-cyan-300 text-xs">◆</span>
      <span className="absolute top-1 left-2 sm:top-16 sm:left-12 w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-pink-400 opacity-75" />
      <span className="absolute bottom-2 right-2 sm:bottom-10 sm:right-14 w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-400 opacity-75" />
      <span className="absolute top-1 right-3 sm:top-4 sm:right-20 w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-amber-300/80" />

      {/* Master 3D SVG Composition */}
      <svg
        viewBox="0 0 340 240"
        className="w-full h-full drop-shadow-2xl overflow-visible"
        fill="none"
      >
        <defs>
          {/* Trophy Gold Gradient */}
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF176" />
            <stop offset="40%" stopColor="#FBC02D" />
            <stop offset="80%" stopColor="#F57F17" />
            <stop offset="100%" stopColor="#E65100" />
          </linearGradient>

          {/* Clock Gradient */}
          <linearGradient id="clockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#CFD8DC" />
          </linearGradient>

          {/* Book 1 (Cyan) */}
          <linearGradient id="bookCyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00BCD4" />
            <stop offset="100%" stopColor="#00838F" />
          </linearGradient>

          {/* Book 2 (Purple) */}
          <linearGradient id="bookPurple" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#AB47BC" />
            <stop offset="100%" stopColor="#6A1B9A" />
          </linearGradient>

          {/* Book 3 (Navy) */}
          <linearGradient id="bookNavy" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3F51B5" />
            <stop offset="100%" stopColor="#1A237E" />
          </linearGradient>
        </defs>

        {/* 1. Stack of Books (Bottom Left) */}
        <g transform="translate(45, 125) rotate(-6)">
          {/* Bottom Book (Navy) */}
          <rect x="0" y="32" width="115" height="20" rx="4" fill="url(#bookNavy)" />
          <rect x="8" y="36" width="100" height="12" rx="2" fill="#FFFFFF" opacity="0.9" />
          <line x1="8" y1="42" x2="108" y2="42" stroke="#CFD8DC" strokeWidth="1" />

          {/* Middle Book (Purple) */}
          <rect x="5" y="14" width="110" height="18" rx="4" fill="url(#bookPurple)" />
          <rect x="12" y="17" width="96" height="12" rx="2" fill="#FFF9C4" opacity="0.95" />
          <line x1="12" y1="23" x2="108" y2="23" stroke="#FFE082" strokeWidth="1" />

          {/* Top Book (Cyan) */}
          <rect x="12" y="-2" width="102" height="17" rx="4" fill="url(#bookCyan)" />
          <rect x="18" y="1" width="90" height="11" rx="2" fill="#FFFFFF" />
          <line x1="18" y1="6" x2="108" y2="6" stroke="#B2EBF2" strokeWidth="1" />
        </g>

        {/* 2. Checklist / Quiz Clipboard (Behind Trophy to the right) */}
        <g transform="translate(195, 45) rotate(10)">
          {/* Board */}
          <rect x="0" y="0" width="85" height="115" rx="8" fill="#ECEFF1" stroke="#B0BEC5" strokeWidth="2" />
          {/* Clip */}
          <rect x="25" y="-7" width="35" height="14" rx="4" fill="#78909C" />
          <circle cx="42.5" cy="0" r="3" fill="#37474F" />

          {/* Checklist items */}
          <rect x="12" y="22" width="12" height="12" rx="3" fill="#4CAF50" />
          <path d="M14 28 L17 31 L22 25" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="30" y1="28" x2="72" y2="28" stroke="#90A4AE" strokeWidth="3" strokeLinecap="round" />

          <rect x="12" y="44" width="12" height="12" rx="3" fill="#4CAF50" />
          <path d="M14 50 L17 53 L22 47" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="30" y1="50" x2="70" y2="50" stroke="#90A4AE" strokeWidth="3" strokeLinecap="round" />

          <rect x="12" y="66" width="12" height="12" rx="3" fill="#4CAF50" />
          <path d="M14 72 L17 75 L22 69" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="30" y1="72" x2="65" y2="72" stroke="#90A4AE" strokeWidth="3" strokeLinecap="round" />

          <rect x="12" y="88" width="12" height="12" rx="3" fill="#FFB74D" />
          <line x1="30" y1="94" x2="58" y2="94" stroke="#B0BEC5" strokeWidth="3" strokeLinecap="round" />

          {/* Slanted Pencil */}
          <g transform="translate(62, 75) rotate(-25)">
            <rect x="0" y="0" width="8" height="42" rx="2" fill="#FFC107" />
            <path d="M0 0 L4 -8 L8 0 Z" fill="#FFE082" />
            <path d="M2.5 -5 L4 -8 L5.5 -5 Z" fill="#212121" />
            <rect x="0" y="36" width="8" height="6" rx="1" fill="#E91E63" />
          </g>
        </g>

        {/* 3. Golden Trophy (Prominent Center) */}
        <g transform="translate(110, 20)">
          {/* Trophy Cup Base / Stand */}
          <rect x="35" y="142" width="50" height="18" rx="4" fill="#8D6E63" stroke="#5D4037" strokeWidth="2" />
          <rect x="42" y="132" width="36" height="12" rx="2" fill="url(#goldGrad)" />
          {/* Stem */}
          <path d="M52 108 L68 108 L64 132 L56 132 Z" fill="url(#goldGrad)" />

          {/* Left Handle */}
          <path
            d="M36 32 C12 32 12 78 38 86"
            fill="none"
            stroke="url(#goldGrad)"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Right Handle */}
          <path
            d="M84 32 C108 32 108 78 82 86"
            fill="none"
            stroke="url(#goldGrad)"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Trophy Bowl */}
          <path
            d="M32 20 L88 20 C88 20 90 85 60 108 C30 85 32 20 32 20 Z"
            fill="url(#goldGrad)"
            stroke="#FFE082"
            strokeWidth="2"
          />

          {/* Star on Trophy */}
          <polygon
            points="60,42 63,51 72,52 65,58 67,67 60,62 53,67 55,58 48,52 57,51"
            fill="#FFFDE7"
            stroke="#F57F17"
            strokeWidth="1.5"
            className="filter drop-shadow"
          />

          {/* Specular highlights on Trophy Bowl */}
          <path
            d="M40 28 C40 28 42 70 54 86"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            className="opacity-70"
          />
        </g>

        {/* 4. Analog Stopwatch / Alarm Clock (Bottom Right) */}
        <g transform="translate(235, 130) rotate(-8)">
          {/* Left & Right Bell */}
          <ellipse cx="12" cy="12" rx="9" ry="6" fill="#F44336" transform="rotate(-30 12 12)" />
          <ellipse cx="56" cy="12" rx="9" ry="6" fill="#F44336" transform="rotate(30 56 12)" />
          {/* Bell Hammer */}
          <rect x="31" y="4" width="6" height="8" rx="2" fill="#B0BEC5" />

          {/* Feet */}
          <rect x="14" y="58" width="6" height="12" rx="3" fill="#78909C" transform="rotate(25 14 58)" />
          <rect x="48" y="58" width="6" height="12" rx="3" fill="#78909C" transform="rotate(-25 48 58)" />

          {/* Clock Body */}
          <circle cx="34" cy="36" r="28" fill="#E53935" stroke="#C62828" strokeWidth="2" />
          {/* Clock Dial Face */}
          <circle cx="34" cy="36" r="22" fill="url(#clockGrad)" />

          {/* Tick marks */}
          <line x1="34" y1="17" x2="34" y2="20" stroke="#37474F" strokeWidth="2" />
          <line x1="53" y1="36" x2="50" y2="36" stroke="#37474F" strokeWidth="2" />
          <line x1="34" y1="55" x2="34" y2="52" stroke="#37474F" strokeWidth="2" />
          <line x1="15" y1="36" x2="18" y2="36" stroke="#37474F" strokeWidth="2" />

          {/* Clock Hands pointing to 10:10 */}
          <line x1="34" y1="36" x2="24" y2="26" stroke="#263238" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="34" y1="36" x2="46" y2="28" stroke="#263238" strokeWidth="2" strokeLinecap="round" />
          <circle cx="34" cy="36" r="2.5" fill="#D32F2F" />
        </g>
      </svg>
    </div>
  );
};

/**
 * Bottom Banner Student Celebration Graphic
 */
export const CelebratingStudentGraphic: React.FC = () => {
  return (
    <div className="relative w-28 sm:w-36 h-20 sm:h-24 shrink-0 flex items-center justify-center select-none">
      <svg viewBox="0 0 160 110" className="w-full h-full overflow-visible" fill="none">
        {/* Floating Confetti */}
        <circle cx="25" cy="20" r="3" fill="#F59E0B" />
        <circle cx="140" cy="15" r="2.5" fill="#EC4899" />
        <circle cx="125" cy="40" r="3" fill="#3B82F6" />
        <polygon points="18,50 24,47 21,55" fill="#10B981" />
        <polygon points="135,70 142,72 138,78" fill="#8B5CF6" />

        {/* Small Golden Trophy Held High */}
        <g transform="translate(100, 25)">
          <path d="M10 5 L26 5 C26 5 28 24 18 30 C8 24 10 5 10 5 Z" fill="#F59E0B" />
          <rect x="15" y="30" width="6" height="8" fill="#D97706" />
          <rect x="11" y="38" width="14" height="6" rx="2" fill="#78350F" />
          <path d="M10 9 C4 9 4 18 11 20" stroke="#F59E0B" strokeWidth="2" fill="none" />
          <path d="M26 9 C32 9 32 18 25 20" stroke="#F59E0B" strokeWidth="2" fill="none" />
          <polygon points="18,13 19,16 22,16 20,18 21,21 18,19 15,21 16,18 14,16 17,16" fill="#FEF3C7" />
        </g>

        {/* Cheerful Student Figure */}
        <g transform="translate(45, 15)">
          {/* Head & Hair */}
          <ellipse cx="30" cy="28" rx="14" ry="14" fill="#FDE68A" />
          {/* Hair */}
          <path d="M16 26 C16 12 38 10 44 20 C42 16 34 14 26 18 C20 20 18 24 16 26 Z" fill="#4B5563" />
          {/* Cap */}
          <ellipse cx="30" cy="15" rx="15" ry="4" fill="#2563EB" />
          <polygon points="30,7 48,15 30,19 12,15" fill="#1D4ED8" />
          <circle cx="30" cy="13" r="2" fill="#FBBF24" />
          <line x1="30" y1="13" x2="42" y2="18" stroke="#FBBF24" strokeWidth="1.5" />

          {/* Happy Face */}
          <ellipse cx="25" cy="28" rx="1.5" ry="2" fill="#1F2937" />
          <ellipse cx="35" cy="28" rx="1.5" ry="2" fill="#1F2937" />
          <path d="M26 34 Q30 38 34 34" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="21" cy="32" r="2" fill="#F87171" opacity="0.6" />
          <circle cx="39" cy="32" r="2" fill="#F87171" opacity="0.6" />

          {/* Torso in Bright Blue Shirt */}
          <path d="M16 46 C16 46 22 42 30 42 C38 42 44 46 44 46 L46 80 L14 80 Z" fill="#3B82F6" />
          <path d="M26 42 L30 50 L34 42" stroke="#FFFFFF" strokeWidth="2" fill="none" />

          {/* Raised Arm holding Trophy */}
          <path d="M42 48 Q55 35 60 30" stroke="#FDE68A" strokeWidth="7" strokeLinecap="round" fill="none" />
          {/* Other Arm waving */}
          <path d="M18 48 Q8 38 4 30" stroke="#FDE68A" strokeWidth="7" strokeLinecap="round" fill="none" />
        </g>
      </svg>
    </div>
  );
};
