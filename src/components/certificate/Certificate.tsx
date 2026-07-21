import { Award } from 'lucide-react'
import type { Certificate as Cert } from '@/lib/certificates'

const PALETTES = {
  standard: { main: '#1e3a8a', line: '#4664c8', title: 'Certificate of Completion' },
  gold: { main: '#8a6712', line: '#c19a2e', title: 'Certificate of Excellence' },
} as const

const SERIF = 'Georgia, "Times New Roman", serif'

function Flourish({ transform, color }: { transform: string; color: string }) {
  return (
    <g transform={transform} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
      <path d="M4 66 C4 30 30 4 66 4" />
      <path d="M4 66 C4 42 22 24 46 22" strokeWidth={1.1} />
      <path d="M4 66 C26 66 34 46 24 34 C18 27 8 30 10 38 C11 43 18 42 18 37" strokeWidth={1.3} />
      <path d="M66 4 C48 4 40 14 44 26" strokeWidth={1.1} />
      <path d="M66 4 h16 M4 66 v16" strokeWidth={1} />
      <circle cx="11" cy="11" r="2.2" fill={color} stroke="none" />
    </g>
  )
}

/** Certificate as a single fixed-viewBox SVG (scales like an image on any device). */
export function Certificate({ cert }: { cert: Cert }) {
  const gold = cert.kind === 'gold'
  const p = PALETTES[cert.kind]
  const date = new Date(cert.issued_at)
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    .toUpperCase()
  const line2 = `${cert.title.toUpperCase()}${gold ? '  —  WITH DISTINCTION' : ''}`
  const nameLong = cert.recipient_name.length > 16
  const line2Long = line2.length > 22

  return (
    <div className="mx-auto w-full max-w-4xl">
      <svg
        viewBox="0 0 1000 707"
        role="img"
        aria-label={`Certificate for ${cert.recipient_name}`}
        className="w-full"
        style={{ filter: 'drop-shadow(0 12px 34px rgba(20,20,40,0.16))', fontFamily: SERIF }}
      >
        <defs>
          <radialGradient id="cert-seal" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#f6dc86" />
            <stop offset="55%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#a9821e" />
          </radialGradient>
          <pattern id="cert-motif" width="20" height="20" patternUnits="userSpaceOnUse">
            <g fill="none" stroke={p.line} strokeWidth="0.7">
              <path d="M10 1 L19 10 L10 19 L1 10 Z" />
              <path d="M10 5 L15 10 L10 15 L5 10 Z" />
            </g>
            <circle cx="10" cy="10" r="1.05" fill={p.line} />
            <circle cx="0" cy="10" r="0.8" fill={p.line} />
            <circle cx="10" cy="0" r="0.8" fill={p.line} />
          </pattern>
        </defs>

        {/* Frame: outer line, patterned band, inner lines */}
        <rect x="14" y="14" width="972" height="679" fill="#ffffff" stroke={p.main} strokeWidth="5" />
        <rect x="22" y="22" width="956" height="663" fill="url(#cert-motif)" />
        <rect x="22" y="22" width="956" height="663" fill="none" stroke={p.main} strokeWidth="1.3" />
        <rect x="52" y="52" width="896" height="603" fill="#ffffff" stroke={p.main} strokeWidth="2" />
        <rect x="58" y="58" width="884" height="591" fill="none" stroke={p.line} strokeWidth="0.7" opacity="0.7" />

        {/* Corner flourishes (inside the inner frame) */}
        <Flourish transform="translate(58,58)" color={p.main} />
        <Flourish transform="translate(942,58) scale(-1,1)" color={p.main} />
        <Flourish transform="translate(942,649) scale(-1,-1)" color={p.main} />
        <Flourish transform="translate(58,649) scale(1,-1)" color={p.main} />

        {/* Header — title width is fixed so it always clears the frame */}
        <text x="500" y="142" textAnchor="middle" fontSize="18" fontWeight="600" letterSpacing="8" fill={p.line}>
          MYSKILLS
        </text>
        <text
          x="500"
          y="214"
          textAnchor="middle"
          textLength="680"
          lengthAdjust="spacingAndGlyphs"
          fontSize="50"
          fontWeight="700"
          fill={p.main}
        >
          {p.title.toUpperCase()}
        </text>

        <text x="500" y="268" textAnchor="middle" fontSize="15" letterSpacing="6" fill={p.line}>
          THIS CERTIFIES THAT
        </text>
        <text
          x="500"
          y="328"
          textAnchor="middle"
          fontSize="46"
          fontWeight="700"
          letterSpacing="1"
          fill={p.main}
          {...(nameLong ? { textLength: 640, lengthAdjust: 'spacingAndGlyphs' as const } : {})}
        >
          {cert.recipient_name.toUpperCase()}
        </text>

        {/* Ornamental divider */}
        <g fill={p.main} stroke={p.main}>
          <line x1="352" y1="356" x2="452" y2="356" strokeWidth="1.3" />
          <rect x="464" y="352" width="8" height="8" transform="rotate(45 468 356)" />
          <rect x="492" y="348" width="16" height="16" transform="rotate(45 500 356)" />
          <rect x="497" y="353" width="6" height="6" transform="rotate(45 500 356)" fill="#ffffff" stroke="none" />
          <rect x="528" y="352" width="8" height="8" transform="rotate(45 532 356)" />
          <line x1="548" y1="356" x2="648" y2="356" strokeWidth="1.3" />
        </g>

        <text x="500" y="412" textAnchor="middle" fontSize="15" letterSpacing="3" fill={p.line}>
          HAS COMPLETED THE INITIAL ASSESSMENT OF
        </text>
        <text
          x="500"
          y="448"
          textAnchor="middle"
          fontSize="26"
          fontWeight="700"
          letterSpacing="1.5"
          fill={p.main}
          {...(line2Long ? { textLength: 700, lengthAdjust: 'spacingAndGlyphs' as const } : {})}
        >
          {line2}
        </text>

        <text x="500" y="500" textAnchor="middle" fontSize="18" letterSpacing="3" fill={p.line}>
          {date}
        </text>

        {/* Gold seal */}
        {gold && (
          <g>
            <circle cx="798" cy="504" r="44" fill="url(#cert-seal)" />
            <circle cx="798" cy="504" r="44" fill="none" stroke="#8a6712" strokeWidth="2" />
            <circle cx="798" cy="504" r="37" fill="none" stroke="#fff6d8" strokeWidth="1" opacity="0.7" />
            <text x="798" y="516" textAnchor="middle" fontSize="32" fill="#fff8e1">★</text>
            <path d="M780 542 L780 574 L798 561 L816 574 L816 542 Z" fill="#b8860b" />
          </g>
        )}

        {/* Signature */}
        <path
          d="M436 560 C454 538 464 572 482 553 C498 537 508 566 524 553 C542 537 556 564 576 549"
          fill="none"
          stroke={p.main}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <line x1="412" y1="580" x2="588" y2="580" stroke={p.line} strokeWidth="1" />
        <text x="500" y="602" textAnchor="middle" fontSize="13" letterSpacing="2" fill={p.line}>
          BOARD OF ACADEMICS AT MYSKILLS
        </text>

        {/* Footer meta — clear of the corner flourishes */}
        <text x="140" y="638" fontSize="12" letterSpacing="0.5" fill={p.line}>
          CERTIFICATE ID: {cert.code}
        </text>
        <text x="860" y="638" textAnchor="end" fontSize="12" letterSpacing="0.5" fill={p.line}>
          SCORE: {cert.percent}%
        </text>
      </svg>
    </div>
  )
}

/** Compact achievement badge for high scorers (gold). */
export function DistinctionBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
      <Award size={13} />
      Top Performer
    </span>
  )
}
