import { Award } from 'lucide-react'
import {
  tierForCertificate,
  type Certificate as Cert,
  type CertificateKind,
} from '@/lib/certificates'

/* ------------------------------------------------------------------ *
 * MySkills certificate — a single fixed-viewBox SVG that scales like
 * an image on any device and prints crisply. Design mirrors the gold
 * "Foundational Excellence" reference: ivory frame with gold ornaments,
 * a laurel medallion, and a right-hand stats/verify column.
 *
 * Layout constants
 *   left column   is optically centred on LX
 *   right column  is optically centred on RX
 *   footer meta   is a uniform 4-column grid centred on LX
 * ------------------------------------------------------------------ */

const SERIF = "Georgia, 'Times New Roman', serif"
const VERIFY_URL = 'certificate.myskills.org.in/verify'

const LX = 400 // left column centre
const RX = 933 // right column centre
const DIVX = 772 // vertical rule between columns
const HALF = 346 // half-width of the left content block

/**
 * Ink/metal colours per band. The copy that goes with each band (headline,
 * band wording) lives in TIERS in lib/certificates.ts so the profile and
 * practice pages stay in sync with this component.
 */
type Palette = {
  ink: string
  ink2: string
  accent: string
  frame: string
  /** page background gradient + corner wash */
  paper: string
  paperTo: string
  wash: string
  sealFrom: string
  sealMid: string
  sealTo: string
  sealRing: string
  sealText: string
  iconBg: string
}

const PALETTES: Record<CertificateKind, Palette> = {
  gold: {
    ink: '#22262e',
    ink2: '#4a4f57',
    accent: '#b8860b',
    frame: '#c9a227',
    paper: '#fdfbf5',
    paperTo: '#f5efdf',
    wash: '#f0e7cf',
    sealFrom: '#fdf3c8',
    sealMid: '#e6b52e',
    sealTo: '#a9781a',
    sealRing: '#8a6712',
    sealText: '#7a5510',
    iconBg: '#f7edd2',
  },
  silver: {
    ink: '#20242b',
    ink2: '#4b525d',
    accent: '#5f6874',
    frame: '#a3adba',
    paper: '#fcfcfd',
    paperTo: '#eef0f4',
    wash: '#e4e8ee',
    sealFrom: '#ffffff',
    sealMid: '#c8ced7',
    sealTo: '#828b98',
    sealRing: '#5b636f',
    sealText: '#474e59',
    iconBg: '#eef1f5',
  },
  bronze: {
    ink: '#241f1a',
    ink2: '#544a41',
    accent: '#96591f',
    frame: '#bf8347',
    paper: '#fdfaf6',
    paperTo: '#f6ece1',
    wash: '#f0e0cd',
    sealFrom: '#f7ddbf',
    sealMid: '#c9873f',
    sealTo: '#8a5220',
    sealRing: '#6d4218',
    sealText: '#6d4218',
    iconBg: '#f7ead9',
  },
}

/* -- ornaments ------------------------------------------------------ */

function Corner({ x, y, sx, sy, color }: { x: number; y: number; sx: number; sy: number; color: string }) {
  return (
    <g transform={`translate(${x},${y}) scale(${sx},${sy})`} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <path d="M0 40 L0 8 Q0 0 8 0 L40 0" />
      <path d="M9 44 L9 15 Q9 9 15 9 L44 9" strokeWidth={1.2} />
      <circle cx="9" cy="9" r="2.4" fill={color} stroke="none" />
    </g>
  )
}

/** Rule with a centred diamond and dotted end caps. */
function HDiv({ cx, y, hw, color, paper }: { cx: number; y: number; hw: number; color: string; paper: string }) {
  return (
    <g stroke={color} fill={color}>
      <line x1={cx - hw} y1={y} x2={cx - 14} y2={y} strokeWidth={1.4} />
      <line x1={cx + 14} y1={y} x2={cx + hw} y2={y} strokeWidth={1.4} />
      <rect x={cx - 6} y={y - 6} width={12} height={12} transform={`rotate(45 ${cx} ${y})`} />
      <rect x={cx - 3} y={y - 3} width={6} height={6} transform={`rotate(45 ${cx} ${y})`} fill={paper} />
      <circle cx={cx - hw} cy={y} r={2.2} />
      <circle cx={cx + hw} cy={y} r={2.2} />
    </g>
  )
}

/* -- footer meta icons (24×24 line icons, drawn in a rounded tile) --- */

const ICON_PATHS = {
  calendar: ['M8 2v4', 'M16 2v4', 'M3 10h18', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'M9 12l2 2 4-4'],
  clipboard: [
    'M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z',
    'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
    'M9 12l2 2 4-4',
  ],
  landmark: ['M3 21h18', 'M5 21V10', 'M19 21V10', 'M9 21v-6h6v6', 'M2 10h20L12 3 2 10z'],
} as const

type IconName = keyof typeof ICON_PATHS

function MetaIcon({ name, x, y, p, size = 28 }: { name: IconName; x: number; y: number; p: Palette; size?: number }) {
  const s = (size / 24) * 0.78
  const pad = (size - 24 * s) / 2
  return (
    <>
      <rect x={x} y={y} width={size} height={size} rx={7} fill={p.iconBg} stroke={p.frame} strokeWidth={1} />
      <g
        transform={`translate(${x + pad},${y + pad}) scale(${s})`}
        fill="none"
        stroke={p.accent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ICON_PATHS[name].map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </>
  )
}

/** One footer cell: icon tile + label + value, all on a shared baseline. */
function MetaCell({
  name,
  x,
  label,
  value,
  p,
}: {
  name: IconName
  x: number
  label: string
  value: string
  p: Palette
}) {
  return (
    <>
      <MetaIcon name={name} x={x} y={664} p={p} />
      <text x={x + 36} y={676} fontSize={10} fontWeight={700} letterSpacing={1.1} fill={p.accent}>
        {label}
      </text>
      <text x={x + 36} y={696} fontSize={11.5} fill={p.ink}>
        {value}
      </text>
    </>
  )
}

/** One laurel sprig; rendered twice (mirrored) to form the wreath. */
function Laurel({ cx, cy, mirror, color }: { cx: number; cy: number; mirror: boolean; color: string }) {
  const A0 = 106
  const A1 = 202
  const RR = 86
  const stem = Array.from({ length: 40 }, (_, i) => {
    const ang = ((A0 + (i / 39) * (A1 - A0)) * Math.PI) / 180
    return `${(RR * Math.cos(ang)).toFixed(1)} ${(RR * Math.sin(ang)).toFixed(1)}`
  }).join(' L ')
  const leaves = Array.from({ length: 9 }, (_, i) => {
    const ang = ((A0 + (i / 8) * (A1 - A0)) * Math.PI) / 180
    const rr = RR + 6
    const lx = rr * Math.cos(ang)
    const ly = rr * Math.sin(ang)
    const rot = (ang * 180) / Math.PI + 118
    return <ellipse key={i} cx={lx} cy={ly} rx={9.5} ry={3.9} transform={`rotate(${rot} ${lx} ${ly})`} fill={color} />
  })
  return (
    <g transform={`translate(${cx},${cy}) scale(${mirror ? -1 : 1},1)`}>
      <path d={`M ${stem}`} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {leaves}
    </g>
  )
}

/** Decorative (non-scannable) QR-style glyph, deterministic from the code. */
function FauxQR({ x, y, size, seed }: { x: number; y: number; size: number; seed: string }) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const rand = () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return ((h >>> 0) % 1000) / 1000
  }
  const N = 9
  const cell = (size - 8) / N
  const cells = []
  const isFinder = (r: number, c: number) => (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3)
  const finderOn = (r: number, c: number) => {
    const rr = r > 5 ? r - 6 : r
    const cc = c > 5 ? c - 6 : c
    return rr === 0 || rr === 2 || cc === 0 || cc === 2 || (rr === 1 && cc === 1)
  }
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (isFinder(r, c) ? finderOn(r, c) : rand() > 0.5) {
        cells.push(
          <rect key={`${r}-${c}`} x={x + 4 + c * cell} y={y + 4 + r * cell} width={cell + 0.5} height={cell + 0.5} fill="#f5f0e0" />,
        )
      }
    }
  }
  return (
    <>
      <rect x={x} y={y} width={size} height={size} rx={7} fill="#1b1b1b" />
      {cells}
    </>
  )
}

/**
 * Certificate as a single fixed-viewBox SVG.
 *
 * `svgRef` exposes the <svg> element so the page can export just the
 * certificate (see lib/certificateExport.ts) instead of printing the page.
 */
export function Certificate({ cert, svgRef }: { cert: Cert; svgRef?: React.Ref<SVGSVGElement> }) {
  const t = tierForCertificate(cert)
  const p = PALETTES[t.kind]
  const subject = cert.title // e.g. "Digital Marketing"
  const date = new Date(cert.issued_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const score = `${Number.isInteger(cert.percent) ? cert.percent : cert.percent.toFixed(1)}%`
  const nameLong = cert.recipient_name.length > 15

  const scx = RX
  const scy = 218
  const R = 118

  const dots = Array.from({ length: 60 }, (_, i) => {
    const a = (2 * Math.PI * i) / 60
    return <circle key={i} cx={scx + (R - 20) * Math.cos(a)} cy={scy + (R - 20) * Math.sin(a)} r={0.9} fill={p.sealRing} />
  })
  const starPts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 === 0 ? 12 : 5
    return `${scx + rr * Math.cos(a)},${scy - 72 + rr * Math.sin(a)}`
  }).join(' ')

  const by = 456 // body paragraph first baseline
  const ry = by + 142 // recognition paragraph
  const colW = (HALF * 2) / 4
  const col = (i: number) => LX - HALF + i * colW

  return (
    <div className="mx-auto w-full max-w-4xl">
      <svg
        ref={svgRef}
        viewBox="0 0 1120 790"
        role="img"
        aria-label={`Certificate for ${cert.recipient_name}`}
        className="w-full"
        style={{ filter: 'drop-shadow(0 12px 34px rgba(20,20,40,0.16))', fontFamily: SERIF }}
      >
        <defs>
          <linearGradient id="ms-seal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={p.sealFrom} />
            <stop offset="45%" stopColor={p.sealMid} />
            <stop offset="100%" stopColor={p.sealTo} />
          </linearGradient>
          <radialGradient id="ms-seal-glow" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor={p.sealMid} stopOpacity={0} />
            <stop offset="100%" stopColor={p.sealMid} stopOpacity={0.45} />
          </radialGradient>
          <radialGradient id="ms-seal-hl" cx="34%" cy="28%" r="52%">
            <stop offset="0%" stopColor="#fffdf0" stopOpacity={0.85} />
            <stop offset="100%" stopColor="#fffdf0" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="ms-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={p.paper} />
            <stop offset="100%" stopColor={p.paperTo} />
          </linearGradient>
        </defs>

        {/* background + soft corner washes */}
        <rect width="1120" height="790" fill="url(#ms-bg)" />
        <path d="M0 0 Q 320 90 0 300 Z" fill={p.wash} opacity={0.45} />
        <path d="M1120 790 Q 800 700 1120 490 Z" fill={p.wash} opacity={0.45} />

        {/* frame */}
        <rect x="16" y="16" width="1088" height="758" fill="none" stroke={p.frame} strokeWidth={2.5} />
        <rect x="26" y="26" width="1068" height="738" fill="none" stroke={p.frame} strokeWidth={1} />
        <Corner x={30} y={30} sx={1} sy={1} color={p.frame} />
        <Corner x={1090} y={30} sx={-1} sy={1} color={p.frame} />
        <Corner x={30} y={760} sx={1} sy={-1} color={p.frame} />
        <Corner x={1090} y={760} sx={-1} sy={-1} color={p.frame} />

        {/* column rule */}
        <line x1={DIVX} y1={70} x2={DIVX} y2={720} stroke={p.frame} strokeWidth={1.4} />
        <line x1={DIVX + 4} y1={120} x2={DIVX + 4} y2={670} stroke={p.frame} strokeWidth={0.7} opacity={0.6} />

        {/* ---------- LEFT COLUMN ---------- */}
        <text
          x={LX}
          y={152}
          textAnchor="middle"
          fontSize={40}
          fontWeight={700}
          letterSpacing={1}
          textLength={640}
          lengthAdjust="spacingAndGlyphs"
          fill={p.accent}
        >
          {t.headline}
        </text>

        <text x={LX} y={200} textAnchor="middle" fontSize={22} letterSpacing={2} fill={p.accent}>
          C E R T I F I C A T E
        </text>
        <HDiv cx={LX - 212} y={193} hw={52} color={p.frame} paper={p.paper} />
        <HDiv cx={LX + 212} y={193} hw={52} color={p.frame} paper={p.paper} />

        <text x={LX} y={248} textAnchor="middle" fontSize={15} fontWeight={700} letterSpacing={2} fill={p.ink}>
          {`INITIAL ${subject.toUpperCase()} SKILLS ASSESSMENT`}
        </text>

        <g fill={p.frame}>
          <rect x={LX - 7} y={271} width={14} height={14} transform={`rotate(45 ${LX} 278)`} />
          <rect x={LX - 3} y={275} width={6} height={6} transform={`rotate(45 ${LX} 278)`} fill={p.paper} />
        </g>

        <text x={LX} y={315} textAnchor="middle" fontSize={17} fontStyle="italic" letterSpacing={0.5} fill={p.ink2}>
          This certifies that
        </text>
        <text
          x={LX}
          y={380}
          textAnchor="middle"
          fontSize={58}
          letterSpacing={0.5}
          fill={p.ink}
          {...(nameLong ? { textLength: 620, lengthAdjust: 'spacingAndGlyphs' as const } : {})}
        >
          {cert.recipient_name}
        </text>
        <HDiv cx={LX} y={420} hw={180} color={p.frame} paper={p.paper} />

        {/* body */}
        <text x={LX} y={by} textAnchor="middle" fontSize={15.5} fill={p.ink2}>
          {`has successfully demonstrated ${t.understanding} of`}
        </text>
        <text x={LX} y={by + 24} textAnchor="middle" fontSize={15.5} fill={p.ink2}>
          {`foundational ${subject} concepts by achieving a score within the`}
        </text>
        <text x={LX} y={by + 48} textAnchor="middle" fontSize={15.5} fill={p.ink2}>
          <tspan fontWeight={700} fill={p.accent}>
            {t.bandWord}
          </tspan>
          {' in the MySkills Initial'}
        </text>
        <text x={LX} y={by + 72} textAnchor="middle" fontSize={15.5} fill={p.ink2}>
          Assessment.
        </text>
        <HDiv cx={LX} y={by + 108} hw={180} color={p.frame} paper={p.paper} />

        {/* recognition */}
        <text x={LX} y={ry} textAnchor="middle" fontSize={15.5} fill={p.ink2}>
          This certificate recognizes demonstrated{' '}
          <tspan fontWeight={700} fill={p.accent}>
            foundational competency
          </tspan>
        </text>
        <text x={LX} y={ry + 22} textAnchor="middle" fontSize={15.5} fill={p.ink2}>
          and encourages continued learning, practical application, and growth.
        </text>

        {/* ---------- FOOTER META (uniform 4-col grid) ---------- */}
        <line x1={LX - HALF} y1={646} x2={LX + HALF} y2={646} stroke={p.frame} strokeWidth={0.9} opacity={0.55} />
        <MetaCell name="calendar" x={col(0)} label="ISSUE DATE" value={date} p={p} />
        <MetaCell name="shield" x={col(1)} label="CERTIFICATE ID" value={cert.code} p={p} />
        <MetaCell name="clipboard" x={col(2)} label="ASSESSMENT" value={subject} p={p} />
        <MetaCell name="landmark" x={col(3)} label="ISSUED BY" value="MySkills" p={p} />

        {/* ---------- RIGHT COLUMN ---------- */}
        <circle cx={scx} cy={scy} r={R + 16} fill="url(#ms-seal-glow)" />
        <circle cx={scx} cy={scy} r={R} fill="url(#ms-seal)" stroke={p.accent} strokeWidth={2.5} />
        <circle cx={scx} cy={scy} r={R} fill="url(#ms-seal-hl)" />
        <circle cx={scx} cy={scy} r={R - 9} fill="none" stroke={p.sealRing} strokeWidth={1.2} />
        <circle cx={scx} cy={scy} r={R - 14} fill="none" stroke="#ffffff" strokeWidth={1} opacity={0.5} />
        {dots}
        <Laurel cx={scx} cy={scy} mirror={false} color={p.sealRing} />
        <Laurel cx={scx} cy={scy} mirror color={p.sealRing} />
        <polygon points={starPts} fill={p.sealRing} />
        <text x={scx} y={scy - 14} textAnchor="middle" fontSize={34} fontWeight={700} letterSpacing={1} fill={p.sealText}>
          {t.label.toUpperCase()}
        </text>
        <text x={scx} y={scy + 16} textAnchor="middle" fontSize={14.5} letterSpacing={1} fill={p.ink}>
          PERFORMANCE
        </text>
        <text x={scx} y={scy + 34} textAnchor="middle" fontSize={14.5} letterSpacing={1} fill={p.ink}>
          BAND
        </text>
        {/* word labels ("COMPLETED") need to step down to clear the wreath */}
        <text
          x={scx}
          y={scy + 68}
          textAnchor="middle"
          fontSize={t.bandMin.length > 5 ? 17 : 25}
          letterSpacing={0.5}
          fill={p.sealText}
        >
          {t.bandMin}
        </text>

        <text x={RX} y={404} textAnchor="middle" fontSize={12.5} fontWeight={700} letterSpacing={2.2} fill={p.ink}>
          ASSESSMENT SCORE
        </text>
        <text x={RX} y={454} textAnchor="middle" fontSize={46} letterSpacing={0.5} fill={p.accent}>
          {score}
        </text>
        <HDiv cx={RX} y={486} hw={92} color={p.frame} paper={p.paper} />

        <text x={RX} y={520} textAnchor="middle" fontSize={12.5} fontWeight={700} letterSpacing={2.2} fill={p.ink}>
          PERFORMANCE LEVEL
        </text>
        <text x={RX} y={562} textAnchor="middle" fontSize={38} fontWeight={700} letterSpacing={2} fill={p.accent}>
          {t.label.toUpperCase()}
        </text>

        {/* verify + QR */}
        <FauxQR x={793} y={620} size={76} seed={cert.code} />
        <text x={883} y={636} fontSize={11.5} fontWeight={700} letterSpacing={0.6} fill={p.accent}>
          VERIFY CERTIFICATE
        </text>
        <text x={883} y={654} fontSize={11} fill={p.ink2}>
          {VERIFY_URL}
        </text>
        <text x={883} y={676} fontSize={10.5} fill={p.ink2}>
          Scan the QR code to verify the
        </text>
        <text x={883} y={691} fontSize={10.5} fill={p.ink2}>
          authenticity of this certificate.
        </text>

        <HDiv cx={LX} y={740} hw={150} color={p.frame} paper={p.paper} />
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
