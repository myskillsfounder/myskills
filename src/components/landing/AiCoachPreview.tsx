import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, Sparkles } from 'lucide-react'

interface Message {
  from: 'ai' | 'you'
  text: string
}

const CONVERSATION: Message[] = [
  { from: 'ai', text: 'What’s one goal you want to hit this month?' },
  { from: 'you', text: 'Land 3 client meetings.' },
  {
    from: 'ai',
    text: 'Let’s break that into weekly steps — Week 1: reach out to 15 prospects, book 5 discovery calls.',
  },
]

function Bubble({ from, text }: Message) {
  const isAi = from === 'ai'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isAi
            ? 'rounded-tl-sm bg-white/[0.07] text-white/90'
            : 'rounded-tr-sm bg-gradient-to-br from-brand-500 to-brand-700 text-white'
        }`}
      >
        {isAi && (
          <span className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-brand-200">
            <Bot size={11} /> AI Coach
          </span>
        )}
        {text}
      </div>
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
 * representative) AI coaching exchange from the Career Readiness
 * programme, the way "AI does the coaching, a mentor reviews it" actually
 * looks. Replays on a loop so a visitor who lingers sees the whole thing.
 */
export function AiCoachPreview() {
  const [shown, setShown] = useState(0)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function play() {
      while (!cancelled) {
        for (let i = 0; i < CONVERSATION.length; i++) {
          setTyping(CONVERSATION[i].from === 'ai')
          await new Promise((r) => setTimeout(r, CONVERSATION[i].from === 'ai' ? 900 : 500))
          if (cancelled) return
          setTyping(false)
          setShown(i + 1)
          await new Promise((r) => setTimeout(r, 1600))
          if (cancelled) return
        }
        await new Promise((r) => setTimeout(r, 2200))
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-mono text-[11px] font-bold text-white/70">
          <span className="live-ping relative flex h-1.5 w-1.5 rounded-full bg-emerald-400 text-emerald-400" />
          AI
        </span>
      </div>

      <div className="mt-4 flex min-h-[168px] flex-col justify-end gap-2.5">
        {CONVERSATION.slice(0, shown).map((m, i) => (
          <Bubble key={i} {...m} />
        ))}
        {typing && <TypingDots />}
      </div>

      <p className="mt-4 flex items-start gap-2 border-t border-white/10 pt-4 text-xs leading-relaxed text-white/55">
        <Sparkles size={13} className="mt-0.5 shrink-0 text-brand-200" />
        AI coaches you through it, live. A mentor reviews what you decide.
      </p>
    </div>
  )
}
