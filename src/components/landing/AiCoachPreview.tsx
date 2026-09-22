import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowRight, Bot, Sparkles, UserCheck } from 'lucide-react'

type Beat =
  | { kind: 'message'; from: 'ai' | 'you' | 'mentor'; text: string }
  | { kind: 'joined'; name: string }

// The whole loop the product promises, played out: AI coaches, the
// student decides, then a real mentor connects and reviews it — not just
// a caption underneath saying that happens.
const SCRIPT: Beat[] = [
  { kind: 'message', from: 'ai', text: 'What’s one goal you want to hit this month?' },
  { kind: 'message', from: 'you', text: 'Land 3 client meetings.' },
  {
    kind: 'message',
    from: 'ai',
    text: 'Let’s break that into weekly steps — Week 1: reach out to 15 prospects, book 5 discovery calls.',
  },
  { kind: 'joined', name: 'Priya · Mentor' },
  {
    kind: 'message',
    from: 'mentor',
    text: 'Solid plan. I’d add a follow-up email after every call — that’s where most people drop off.',
  },
]

const SENDER = {
  ai: { label: 'AI Coach', icon: Bot, bubble: 'bg-white/[0.07] text-white/90', tag: 'text-brand-200' },
  mentor: {
    label: 'Priya · Mentor',
    icon: UserCheck,
    bubble: 'bg-emerald-400/[0.12] text-white/90 ring-1 ring-emerald-400/20',
    tag: 'text-emerald-300',
  },
} as const

function Bubble({ from, text }: { from: 'ai' | 'you' | 'mentor'; text: string }) {
  if (from === 'you') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-brand-500 to-brand-700 px-3.5 py-2.5 text-sm leading-relaxed text-white">
          {text}
        </div>
      </motion.div>
    )
  }
  const s = SENDER[from]
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex justify-start"
    >
      <div className={`max-w-[85%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm leading-relaxed ${s.bubble}`}>
        <span className={`mb-1 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wide ${s.tag}`}>
          <s.icon size={11} /> {s.label}
        </span>
        {text}
      </div>
    </motion.div>
  )
}

/** "A real mentor is joining" as an event, not just another bubble — the
 *  concrete moment the loop hands off from AI to a person. */
function JoinedNotice({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-center gap-2 py-0.5"
    >
      <span className="h-px flex-1 bg-white/10" />
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
        <UserCheck size={11} /> {name} joined
      </span>
      <span className="h-px flex-1 bg-white/10" />
    </motion.div>
  )
}

function TypingDots() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white/[0.07] px-3.5 py-3"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-white/50"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </motion.div>
  )
}

/**
 * The hero's proof, not an abstraction of it — a real (scripted, but
 * representative) exchange from the Career Readiness programme: AI coaches,
 * the student decides, then a real mentor connects and reviews it. Plays on
 * a loop so a visitor who lingers sees the whole handoff, not a snapshot.
 */
export function AiCoachPreview() {
  const [shown, setShown] = useState(0)
  const [typing, setTyping] = useState(false)
  const mentorHasJoined = SCRIPT.slice(0, shown).some((b) => b.kind === 'joined')

  useEffect(() => {
    let cancelled = false
    async function play() {
      while (!cancelled) {
        for (let i = 0; i < SCRIPT.length; i++) {
          const beat = SCRIPT[i]
          const isTypingBeat = beat.kind === 'message' && beat.from !== 'you'
          setTyping(isTypingBeat)
          await new Promise((r) => setTimeout(r, isTypingBeat ? 900 : beat.kind === 'joined' ? 600 : 500))
          if (cancelled) return
          setTyping(false)
          setShown(i + 1)
          await new Promise((r) => setTimeout(r, beat.kind === 'joined' ? 500 : 1500))
          if (cancelled) return
        }
        await new Promise((r) => setTimeout(r, 2400))
        if (cancelled) return
        setShown(0)
      }
    }
    void play()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="glow-edge rounded-xl bg-white/[0.05] p-5 backdrop-blur sm:p-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-brand-200">
            Goal_Setting · Module_01
          </p>
          <p className="mt-1 text-sm font-semibold text-white">Career Readiness Programme</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-bold transition-colors ${
            mentorHasJoined ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/10 text-white/70'
          }`}
        >
          <span
            className={`live-ping relative flex h-1.5 w-1.5 rounded-full text-emerald-400 ${
              mentorHasJoined ? 'bg-emerald-400' : 'bg-white/40'
            }`}
          />
          {mentorHasJoined ? 'Mentor' : 'AI'}
        </span>
      </div>

      <div className="mt-4 flex min-h-[210px] flex-col justify-end gap-2.5">
        {SCRIPT.slice(0, shown).map((b, i) =>
          b.kind === 'joined' ? (
            <JoinedNotice key={i} name={b.name} />
          ) : (
            <Bubble key={i} from={b.from} text={b.text} />
          ),
        )}
        {typing && <TypingDots />}
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-white/55">
          <Sparkles size={13} className="mt-0.5 shrink-0 text-brand-200" />
          AI coaches you through it, live. A mentor connects to review what you decide.
        </p>
        {/* Not just a demonstration of the idea — a real, working way in,
            regardless of where the loop above happens to be. */}
        <Link
          to="/community/mentors"
          className="group mt-3 flex items-center justify-center gap-2 rounded-lg bg-white/[0.08] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.14]"
        >
          <UserCheck size={15} className="text-emerald-300" />
          Connect with a real mentor
          <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}
