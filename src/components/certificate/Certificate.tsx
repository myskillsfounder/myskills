import type { Certificate as Cert } from '@/lib/certificates'
// Inlined (data URIs): the downloaded certificate is the SVG drawn on a
// canvas, where linked images would not load (lib/certificateExport.ts).
import signature from './assets/signature.png?inline'
import dpiit from './assets/dpiit.png?inline'
import ksum from './assets/ksum.png?inline'

/* ------------------------------------------------------------------ *
 * The Foundation certificate (Paul's design, 29 Oct 2026): a white
 * card with cut corners on a deep blue frame, issued by Personal and
 * Professional Development Labs, signed by the director, with the DPIIT
 * and Kerala Startup Mission marks. One fixed-viewBox SVG, so it scales
 * like an image, prints crisply and downloads as a PNG. Only the name,
 * the course, the ID and the date change.
 * ------------------------------------------------------------------ */

const SANS = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
const NAME_SERIF = "'Bodoni 72', Didot, 'Bodoni MT', 'Playfair Display', Georgia, serif"

const NAVY = '#0b1530'
const BLUE = '#1650c8'
const COURSE = '#1236c8'
const GREY = '#4b5263'

const W = 1120
const H = 790
const CX = W / 2

/** The card: inset from the frame, with its four corners cut. */
const X0 = 34
const Y0 = 26
const X1 = W - 34
const Y1 = H - 26
const CUT = 40
const card = (inset: number) => {
  const [a, b, c, d, k] = [X0 - inset, Y0 - inset, X1 + inset, Y1 + inset, CUT + inset * 0.4]
  return `${a + k},${b} ${c - k},${b} ${c},${b + k} ${c},${d - k} ${c - k},${d} ${a + k},${d} ${a},${d - k} ${a},${b + k}`
}

/** Spaced capitals, the design's small type. */
function Caps({
  x,
  y,
  size,
  spacing,
  children,
  anchor = 'middle',
  fill = NAVY,
  weight = 500,
}: {
  x: number
  y: number
  size: number
  spacing: number
  children: string
  anchor?: 'start' | 'middle' | 'end'
  fill?: string
  weight?: number
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={weight} letterSpacing={spacing} fill={fill}>
      {children}
    </text>
  )
}

/** A short rule either side of a centred line. */
function Wings({ y, gap, len }: { y: number; gap: number; len: number }) {
  return (
    <>
      <line x1={CX - gap - len} y1={y} x2={CX - gap} y2={y} stroke={BLUE} strokeWidth={1.2} />
      <line x1={CX + gap} y1={y} x2={CX + gap + len} y2={y} stroke={BLUE} strokeWidth={1.2} />
    </>
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
  // A QR code's look: 21 modules, with the three corner finder squares.
  const N = 21
  const cell = (size - 6) / N
  const cells = []
  const finder = (r: number, c: number) => {
    const at = (r0: number, c0: number) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7
    const corner = at(0, 0) ? [0, 0] : at(0, N - 7) ? [0, N - 7] : at(N - 7, 0) ? [N - 7, 0] : null
    if (!corner) return null
    const d = Math.max(Math.abs(r - corner[0] - 3), Math.abs(c - corner[1] - 3))
    return d === 3 || d <= 1
  }
  const quiet = (r: number, c: number) => (r === 7 && (c < 8 || c > N - 9)) || (c === 7 && (r < 8 || r > N - 9)) || (r === N - 8 && c < 8) || (c === N - 8 && r < 8)
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const f = finder(r, c)
      if (f === null ? !quiet(r, c) && rand() > 0.5 : f) {
        cells.push(<rect key={`${r}-${c}`} x={x + 3 + c * cell} y={y + 3 + r * cell} width={cell + 0.3} height={cell + 0.3} fill="#0b1530" />)
      }
    }
  }
  return (
    <>
      <rect x={x} y={y} width={size} height={size} fill="#ffffff" />
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
  const course = `${cert.title} Foundation`
  const date = new Date(cert.issued_at)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    .toUpperCase()
  // Long names and course titles shrink to stay inside the card.
  const nameSize = Math.min(62, 600 / Math.max(1, cert.recipient_name.length * 0.5))
  const courseSize = Math.min(38, 860 / Math.max(1, course.length * 0.56))

  return (
    <div className="mx-auto w-full max-w-4xl">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${course} certificate for ${cert.recipient_name}`}
        className="w-full"
        style={{ filter: 'drop-shadow(0 12px 34px rgba(10,20,60,0.25))', fontFamily: SANS }}
      >
        <defs>
          <linearGradient id="pc-frame" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#05153f" />
            <stop offset="0.5" stopColor="#0a2f8a" />
            <stop offset="1" stopColor="#061a52" />
          </linearGradient>
          <radialGradient id="pc-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#4f9bff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#4f9bff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pc-card" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f4f8fe" />
            <stop offset="0.45" stopColor="#ffffff" />
            <stop offset="1" stopColor="#f3f7fd" />
          </linearGradient>
          <linearGradient id="pc-beam-l" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#7fb0f5" stopOpacity="0.28" />
            <stop offset="1" stopColor="#7fb0f5" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pc-beam-r" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stopColor="#7fb0f5" stopOpacity="0.25" />
            <stop offset="1" stopColor="#7fb0f5" stopOpacity="0" />
          </linearGradient>
          <clipPath id="pc-card-clip">
            <polygon points={card(0)} />
          </clipPath>
        </defs>

        {/* ---------- FRAME ---------- */}
        <rect width={W} height={H} fill="url(#pc-frame)" />
        <circle cx={W - 120} cy={-20} r={260} fill="url(#pc-glow)" opacity={0.7} />
        <circle cx={-30} cy={H * 0.62} r={220} fill="url(#pc-glow)" opacity={0.6} />
        <circle cx={W + 20} cy={H * 0.45} r={240} fill="url(#pc-glow)" opacity={0.55} />
        <circle cx={CX} cy={H + 60} r={300} fill="url(#pc-glow)" opacity={0.35} />
        <polygon points={card(9)} fill="none" stroke="#8fb6ff" strokeWidth={1} opacity={0.55} />

        {/* ---------- CARD ---------- */}
        <polygon points={card(0)} fill="url(#pc-card)" />
        <g clipPath="url(#pc-card-clip)">
          <polygon points={`${X0},${H * 0.3} ${X0 + 230},${H * 0.62} ${X0},${H * 0.95}`} fill="url(#pc-beam-l)" />
          <polygon points={`${X1},${H * 0.28} ${X1 - 200},${H * 0.55} ${X1},${H * 0.82}`} fill="url(#pc-beam-r)" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <g key={i} fill="none" stroke="#c6d5ee" strokeWidth={0.7} opacity={0.55}>
              <circle cx={X0 - 40} cy={H * 0.55} r={150 + i * 16} />
              <circle cx={X1 + 40} cy={Y0 - 20} r={120 + i * 14} />
            </g>
          ))}
        </g>

        {/* ---------- CORNER WORDS ---------- */}
        <Caps x={86} y={75} size={10} spacing={4} anchor="start" fill="#1d3f8f">SKILLS</Caps>
        <Caps x={86} y={90} size={10} spacing={4} anchor="start" fill="#1d3f8f">PEOPLE</Caps>
        <Caps x={86} y={105} size={10} spacing={4} anchor="start" fill="#1d3f8f">OPPORTUNITIES</Caps>
        <line x1={86} y1={121} x2={123} y2={121} stroke={BLUE} strokeWidth={1.2} />
        <Caps x={1036} y={75} size={10} spacing={4} anchor="end" fill="#1d3f8f">LEARN</Caps>
        <Caps x={1036} y={90} size={10} spacing={4} anchor="end" fill="#1d3f8f">BUILD</Caps>
        <Caps x={1036} y={105} size={10} spacing={4} anchor="end" fill="#1d3f8f">GROW</Caps>
        <line x1={999} y1={121} x2={1036} y2={121} stroke={BLUE} strokeWidth={1.2} />

        {/* ---------- ISSUER ---------- */}
        <Caps x={CX} y={86} size={22} spacing={3.2} weight={600}>PERSONAL AND PROFESSIONAL</Caps>
        <Caps x={CX} y={114} size={22} spacing={3.2} weight={600}>DEVELOPMENT LABS</Caps>
        <Caps x={CX} y={138} size={11} spacing={6.5} fill={BLUE}>PRIVATE LIMITED</Caps>

        {/* ---------- TITLE ---------- */}
        <Caps x={CX} y={217} size={64} spacing={9} weight={800}>CERTIFICATE</Caps>
        <Wings y={249} gap={152} len={80} />
        <Caps x={CX} y={258} size={24} spacing={7} weight={600} fill={BLUE}>OF COMPLETION</Caps>

        <Caps x={CX} y={300} size={12} spacing={4.2} fill="#1a1f2e">THIS CERTIFICATE IS PROUDLY PRESENTED TO</Caps>
        <text x={CX} y={376} textAnchor="middle" fontSize={nameSize} fontFamily={NAME_SERIF} fill={NAVY}>
          {cert.recipient_name}
        </text>
        <line x1={279} y1={392} x2={W - 279} y2={392} stroke={BLUE} strokeWidth={1.2} />

        <Caps x={CX} y={420} size={11.5} spacing={4.2} fill="#1a1f2e">FOR SUCCESSFULLY COMPLETING THE</Caps>
        <text x={CX} y={470} textAnchor="middle" fontSize={courseSize} fontWeight={700} fill={COURSE}>
          {course}
        </text>
        <g fontSize={13.5} letterSpacing={1} fill={GREY} textAnchor="middle">
          <text x={CX} y={503}>The recipient has demonstrated commitment to learning and professional</text>
          <text x={CX} y={523}>development through the successful completion of the prescribed programme</text>
          <text x={CX} y={543}>and its learning requirements.</text>
        </g>

        {/* ---------- SIGNATURE ---------- */}
        <image href={signature} x={100} y={540} width={200} height={88} preserveAspectRatio="xMidYMid meet" />
        <line x1={94} y1={630} x2={313} y2={630} stroke={NAVY} strokeWidth={0.9} />
        <Caps x={204} y={649} size={12.5} spacing={3} weight={700}>PAUL THOMAS</Caps>
        <Caps x={204} y={665} size={8.5} spacing={2.8}>DIRECTOR</Caps>
        <Caps x={204} y={684} size={8} spacing={2.6} fill={BLUE}>PERSONAL AND PROFESSIONAL</Caps>
        <Caps x={204} y={697} size={8} spacing={2.6} fill={BLUE}>DEVELOPMENT LABS PRIVATE LIMITED</Caps>

        {[387, 657, 859].map((x) => (
          <line key={x} x1={x} y1={584} x2={x} y2={696} stroke={BLUE} strokeWidth={1} opacity={0.7} />
        ))}

        {/* ---------- RECOGNITION ---------- */}
        <image href={dpiit} x={434} y={594} width={186} height={76} preserveAspectRatio="xMidYMid meet" />
        <Caps x={522} y={688} size={8} spacing={2.6}>DPIIT RECOGNISED STARTUP</Caps>
        <image href={ksum} x={688} y={572} width={140} height={99} preserveAspectRatio="xMidYMid meet" />
        <Caps x={758} y={688} size={8} spacing={2.6}>KSUM REGISTERED</Caps>

        {/* ---------- ID AND DATE ---------- */}
        <FauxQR x={935} y={561} size={68} seed={cert.code} />
        <Caps x={969} y={649} size={8} spacing={2.6}>CERTIFICATE ID</Caps>
        <Caps x={969} y={663} size={9} spacing={2.2} weight={600}>{cert.code}</Caps>
        <Caps x={969} y={688} size={8} spacing={2.6}>DATE OF ISSUE</Caps>
        <Caps x={969} y={702} size={9} spacing={2.2} weight={600}>{date}</Caps>

        {/* ---------- FOOTER ---------- */}
        <Wings y={735} gap={210} len={66} />
        <Caps x={CX} y={739} size={10.5} spacing={4.5} fill={BLUE}>BUILDING SKILLS FOR A BRIGHTER TOMORROW</Caps>
      </svg>
    </div>
  )
}
