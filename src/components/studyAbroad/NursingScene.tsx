import { ArrowRight } from 'lucide-react'
import { Flag } from './Cards'

/**
 * A nursing programme's picture (Paul, 4 Nov 2026: "an indian student in a
 * foreign country studying nursing"): a young Indian nursing student in a
 * white coat over scrubs, a stethoscope and her books, with a tricolour pin,
 * in front of a European campus at sunrise, and the flight from India to the
 * destination. Drawn here, so there is no photo to license.
 */
export function NursingScene({ code, className = '' }: { code?: string | null; className?: string }) {
  return (
    <div aria-hidden className={`relative overflow-hidden ${className}`}>
      <svg viewBox="0 0 360 180" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="ns-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1e3a8a" />
            <stop offset="0.55" stopColor="#7c3aed" />
            <stop offset="1" stopColor="#fbbf77" />
          </linearGradient>
          <linearGradient id="ns-coat" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#dfe6ef" />
          </linearGradient>
        </defs>

        {/* sky, sun and a flight from home */}
        <rect width="360" height="180" fill="url(#ns-sky)" />
        <circle cx="282" cy="96" r="30" fill="#fde68a" opacity="0.9" />
        <path d="M18 70 Q120 6 250 30" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.5" strokeDasharray="4 5" />
        <g transform="translate(250 30) rotate(12)">
          <path d="M-9 0 L9 0 L12 -1.5 L9 -3 L-9 -3 Z" fill="#fff" />
          <path d="M-1 -1.5 L-6 -9 L-3 -9 L4 -1.5 Z M-1 -1.5 L-6 6 L-3 6 L4 -1.5 Z" fill="#fff" />
        </g>

        {/* the old city behind the campus: a dome, a bell tower, rooftops */}
        <g fill="#4c3a78" opacity="0.75">
          <rect x="196" y="92" width="46" height="60" />
          <path d="M196 92 Q219 62 242 92 Z" />
          <rect x="216" y="56" width="6" height="12" />
          <rect x="300" y="60" width="16" height="92" />
          <path d="M300 60 L308 40 L316 60 Z" />
          <rect x="250" y="104" width="44" height="48" />
          <path d="M248 104 L272 90 L296 104 Z" />
          <rect x="322" y="110" width="40" height="42" />
        </g>

        {/* the campus: a columned faculty building with the nursing cross */}
        <g>
          <rect x="176" y="112" width="150" height="50" fill="#f6ead7" />
          <path d="M168 112 L251 88 L334 112 Z" fill="#e9d3b3" />
          <rect x="168" y="110" width="166" height="5" fill="#d9bf97" />
          {[188, 210, 232, 270, 292, 314].map((x) => (
            <rect key={x} x={x - 3} y="118" width="6" height="40" fill="#e6d2b2" />
          ))}
          <rect x="240" y="122" width="22" height="36" rx="11" fill="#7c5a3a" />
          <rect x="237" y="94" width="28" height="13" rx="2" fill="#fff" />
          <rect x="248.5" y="96" width="5" height="9" fill="#e11d48" />
          <rect x="246" y="98.5" width="10" height="4" fill="#e11d48" />
        </g>

        {/* trees and the path */}
        <circle cx="160" cy="140" r="16" fill="#15803d" />
        <circle cx="344" cy="138" r="18" fill="#166534" />
        <rect x="0" y="158" width="360" height="22" fill="#e7d3b5" />
        <path d="M0 158 H360" stroke="#d4b98f" strokeWidth="2" />

        {/* the student */}
        <g transform="translate(96 0)">
          {/* braid down her back, over her shoulder */}
          <path d="M-14 66 C-30 88 -26 118 -16 140" stroke="#17110d" strokeWidth="9" strokeLinecap="round" fill="none" />
          {[96, 108, 120, 132].map((y) => (
            <ellipse key={y} cx={-24 + (y - 96) * 0.18} cy={y} rx="6" ry="4.5" fill="#241913" />
          ))}

          {/* coat, scrubs and shoulders */}
          <path d="M-36 180 L-34 122 Q-30 104 -12 100 L12 100 Q30 104 34 122 L36 180 Z" fill="url(#ns-coat)" />
          <path d="M-12 100 L0 124 L12 100 Z" fill="#0f766e" />
          <path d="M-9 180 L-9 124 L0 132 L9 124 L9 180 Z" fill="#0f766e" />
          <path d="M-12 100 L-4 128 L-9 180" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
          <path d="M12 100 L4 128 L9 180" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />

          {/* neck and face */}
          <rect x="-6" y="88" width="12" height="14" rx="4" fill="#8d5a36" />
          <ellipse cx="0" cy="70" rx="17" ry="20" fill="#a86b43" />
          <ellipse cx="-17" cy="72" rx="3" ry="4.5" fill="#9a603b" />
          <ellipse cx="17" cy="72" rx="3" ry="4.5" fill="#9a603b" />
          <circle cx="-17" cy="77" r="1.6" fill="#fbbf24" />
          <circle cx="17" cy="77" r="1.6" fill="#fbbf24" />

          {/* hair, parted in the middle */}
          <path d="M-18 70 C-20 46 -6 42 0 46 C6 42 20 46 18 70 C14 58 8 54 0 52 C-8 54 -14 58 -18 70 Z" fill="#1b130e" />
          <path d="M0 46 L0 53" stroke="#3b2a20" strokeWidth="1" />

          {/* eyes, brows, smile */}
          <path d="M-10 64 Q-6 61.5 -2.5 63.5" stroke="#1b130e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M2.5 63.5 Q6 61.5 10 64" stroke="#1b130e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <ellipse cx="-6" cy="69" rx="1.9" ry="2.3" fill="#1b130e" />
          <ellipse cx="6" cy="69" rx="1.9" ry="2.3" fill="#1b130e" />
          <path d="M-1 72 Q0 76 1.5 74.5" stroke="#7a4a2c" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M-6 79 Q0 84 6 79" stroke="#5b2a1c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <circle cx="-10" cy="76" r="3" fill="#e0866a" opacity="0.35" />
          <circle cx="10" cy="76" r="3" fill="#e0866a" opacity="0.35" />

          {/* stethoscope */}
          <path d="M-11 101 C-14 120 -6 132 2 134 C10 132 14 122 11 101" fill="none" stroke="#334155" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="2" cy="136" r="4.5" fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />

          {/* a tricolour pin and a name badge */}
          <g transform="translate(17 122)">
            <rect width="10" height="2.4" fill="#ff9933" />
            <rect y="2.4" width="10" height="2.4" fill="#ffffff" />
            <rect y="4.8" width="10" height="2.4" fill="#138808" />
            <circle cx="5" cy="3.6" r="0.9" fill="#1e3a8a" />
          </g>
          <rect x="-28" y="124" width="14" height="9" rx="1.5" fill="#fff" stroke="#cbd5e1" />
          <rect x="-26" y="127" width="10" height="1.5" fill="#94a3b8" />

          {/* her books, held against her */}
          <g transform="translate(14 140) rotate(-8)">
            <rect x="-4" y="0" width="28" height="7" rx="1.5" fill="#2563eb" />
            <rect x="-2" y="7" width="26" height="7" rx="1.5" fill="#e11d48" />
            <rect x="0" y="14" width="24" height="6" rx="1.5" fill="#f59e0b" />
          </g>
          <path d="M34 128 Q38 146 24 156 L14 154" fill="url(#ns-coat)" stroke="#cbd5e1" strokeWidth="1" />
          <ellipse cx="16" cy="154" rx="5" ry="4" fill="#a86b43" />
        </g>
      </svg>

      {/* the journey: from India to the destination */}
      <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-ink-800 shadow-sm">
        <Flag code="in" className="h-3.5 w-5" />
        <ArrowRight size={11} className="text-ink-500" />
        {code ? <Flag code={code} className="h-3.5 w-5" /> : <span>Abroad</span>}
      </span>
    </div>
  )
}
