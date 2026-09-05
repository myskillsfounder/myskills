import { useEffect, useRef, useState } from 'react'
import { Bot, Loader2, Pencil, Send, Sparkles, UserRound } from 'lucide-react'
import { SUPPORT_TOPICS } from '@/lib/support'

interface Bubble {
  id: number
  from: 'bot' | 'me'
  text: string
}

type Step = 'topic' | 'details' | 'ready'

/** What a good answer looks like, per topic. Students often stall at "tell me
 *  more" because they don't know how much to write — an example unblocks that. */
const HINTS: Record<string, { ask: string; placeholder: string; example: string }> = {
  'Career guidance': {
    ask: 'Where are you right now — studying, job hunting, or switching fields? And where would you like to be in six months?',
    placeholder: 'e.g. Final-year BCom, want to get into performance marketing…',
    example: 'I’m in my final year of BCom and want a job in performance marketing, but I don’t know what to learn first.',
  },
  'Digital marketing help': {
    ask: 'Which channel or campaign are you working on? Share the context and I’ll pass it along.',
    placeholder: 'e.g. Running Meta ads for my dad’s shop, CPC is high…',
    example: 'I’m running Meta ads for a small clothing store. Reach is fine but nobody clicks.',
  },
  'Assessment / practice doubt': {
    ask: 'Which question or topic tripped you up? Paste it here if you have it.',
    placeholder: 'e.g. Q14 on attribution models — why is last-click wrong?',
    example: 'I got the attribution question wrong and I don’t understand why last-click isn’t the right answer.',
  },
  'Portfolio & resume': {
    ask: 'What roles are you targeting, and what do you have so far? A link works too.',
    placeholder: 'e.g. Applying for SEO intern roles, resume has no projects…',
    example: 'I’m applying for SEO internships. My resume has coursework but no real projects yet.',
  },
  'Something else': {
    ask: 'Tell me what’s on your mind and I’ll find the right mentor for it.',
    placeholder: 'Describe what you need help with…',
    example: 'I want to understand whether a digital marketing certification is worth it.',
  },
}

/**
 * Conversational intake. Instead of a form, a small scripted assistant asks
 * what the learner needs, then hands off to a real mentor on request.
 */
export function BotIntake({
  firstName,
  mentorName,
  onConnect,
  connecting,
}: {
  firstName: string
  /** First name of a currently-online mentor, if any — used to make the
   *  handoff feel like meeting a person, not a queue. */
  mentorName?: string | null
  onConnect: (topic: string, details: string) => void
  connecting: boolean
}) {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [step, setStep] = useState<Step>('topic')
  const [topic, setTopic] = useState('')
  const [details, setDetails] = useState('')
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const idRef = useRef(0)

  const say = (from: Bubble['from'], t: string, delay = 0) => {
    if (delay === 0) {
      setBubbles((p) => [...p, { id: ++idRef.current, from, text: t }])
      return
    }
    setTyping(true)
    window.setTimeout(() => {
      setBubbles((p) => [...p, { id: ++idRef.current, from, text: t }])
      setTyping(false)
    }, delay)
  }

  // Opening lines. Naming a mentor who is actually online turns an abstract
  // "submit a request" into "you're about to meet someone".
  useEffect(() => {
    const t1 = window.setTimeout(() => {
      setBubbles([
        {
          id: ++idRef.current,
          from: 'bot',
          text: `Hi ${firstName} 👋 I’m the MySkills assistant. I’ll take two quick details, then hand you to a real mentor.`,
        },
      ])
      setTyping(true)
    }, 350)
    const t2 = window.setTimeout(() => {
      setBubbles((p) => [
        ...p,
        { id: ++idRef.current, from: 'bot', text: 'What do you need help with today?' },
      ])
      setTyping(false)
    }, 1250)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [firstName])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [bubbles, typing, step])

  // Focus the composer the moment it becomes usable, so the student can just type.
  useEffect(() => {
    if (step === 'details' && !typing) inputRef.current?.focus()
  }, [step, typing])

  function pickTopic(t: string) {
    setTopic(t)
    say('me', t)
    setStep('details')
    say('bot', HINTS[t]?.ask ?? HINTS['Something else'].ask, 700)
  }

  function commitDetails(v: string) {
    setDetails(v)
    setText('')
    say('me', v)
    setStep('ready')
    say(
      'bot',
      mentorName
        ? `Perfect — ${mentorName} is online right now. Here’s what I’ll send them:`
        : 'Perfect. Here’s what I’ll send to the first available mentor:',
      700,
    )
  }

  function submitDetails(e: React.FormEvent) {
    e.preventDefault()
    const v = text.trim()
    if (!v) return
    commitDetails(v)
  }

  function editDetails() {
    setStep('details')
    setText(details)
    say('bot', 'Sure — update it below and send again.', 400)
  }

  const hint = HINTS[topic] ?? HINTS['Something else']

  return (
    <div className="flex h-[62vh] flex-col card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-ink-200 px-4 py-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <Bot size={15} />
        </span>
        <span className="text-sm font-medium text-ink-900">MySkills assistant</span>
        <span className="text-xs text-ink-500">always online</span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto bg-ink-100 p-4">
        {bubbles.map((b) => (
          <div key={b.id} className={`flex items-end gap-2 ${b.from === 'me' ? 'justify-end' : 'justify-start'}`}>
            {b.from === 'bot' && (
              <span className="mb-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <Bot size={13} />
              </span>
            )}
            <div
              className={`max-w-[76%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                b.from === 'me' ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md bg-white text-ink-900'
              }`}
            >
              {b.text}
            </div>
            {b.from === 'me' && (
              <span className="mb-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-200 text-ink-600">
                <UserRound size={13} />
              </span>
            )}
          </div>
        ))}

        {typing && (
          <div className="flex justify-start">
            <div className="ml-8 flex gap-1 rounded-2xl rounded-bl-md bg-white px-3 py-2.5 shadow-sm">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300" />
            </div>
          </div>
        )}

        {/* quick replies */}
        {step === 'topic' && !typing && (
          <div className="flex flex-wrap gap-2 pl-8 pt-2">
            {SUPPORT_TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => pickTopic(t)}
                className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50"
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* a concrete example, so "tell me more" isn't a blank wall */}
        {step === 'details' && !typing && !text.trim() && (
          <button
            type="button"
            onClick={() => {
              setText(hint.example)
              inputRef.current?.focus()
            }}
            className="ml-8 flex max-w-[76%] items-start gap-2 rounded-2xl border border-dashed border-brand-200 bg-white/70 px-3 py-2 text-left text-xs text-ink-600 transition-colors hover:bg-white"
          >
            <Sparkles size={13} className="mt-0.5 shrink-0 text-brand-500" />
            <span>
              <span className="font-medium text-ink-800">Not sure what to write?</span> Tap to use:
              “{hint.example}”
            </span>
          </button>
        )}

        {/* the promised summary, actually shown */}
        {step === 'ready' && !typing && (
          <div className="ml-8 space-y-2.5 pt-1">
            <div className="max-w-[76%] rounded-2xl border border-ink-200 bg-white p-3.5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Topic</p>
              <p className="mt-0.5 text-sm font-medium text-brand-700">{topic}</p>
              <p className="mt-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                Your question
              </p>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink-800">{details}</p>
              <button
                type="button"
                onClick={editDetails}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink-600 hover:text-ink-900"
              >
                <Pencil size={12} /> Edit
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onConnect(topic, details)}
                disabled={connecting}
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-60"
              >
                {connecting ? <Loader2 size={15} className="animate-spin" /> : <UserRound size={15} />}
                {connecting ? 'Connecting…' : mentorName ? `Connect me with ${mentorName}` : 'Connect me with a mentor'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('topic')
                  setDetails('')
                  setText('')
                  say('bot', 'No problem — what would you like help with instead?', 400)
                }}
                className="rounded-full border border-ink-300 bg-white px-4 py-2.5 text-xs font-medium text-ink-600 hover:bg-ink-100"
              >
                Change topic
              </button>
            </div>

            <p className="max-w-[76%] text-[11px] leading-relaxed text-ink-500">
              {mentorName
                ? 'Mentors are volunteers, so give them a moment to reply once you’re connected.'
                : 'No mentor is online this moment — you’ll join the queue and we’ll connect you as soon as one is free.'}
            </p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submitDetails} className="flex items-center gap-2 border-t border-ink-200 p-3">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={step !== 'details'}
          placeholder={
            step === 'topic' ? 'Pick a topic above…' : step === 'ready' ? 'Ready to connect' : hint.placeholder
          }
          className="min-w-0 flex-1 rounded-full border border-ink-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:bg-ink-100"
        />
        <button
          type="submit"
          disabled={step !== 'details' || !text.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
