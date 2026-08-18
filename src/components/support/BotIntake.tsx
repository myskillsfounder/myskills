import { useEffect, useRef, useState } from 'react'
import { Bot, Loader2, Send, UserRound } from 'lucide-react'
import { SUPPORT_TOPICS } from '@/lib/support'

interface Bubble {
  id: number
  from: 'bot' | 'me'
  text: string
}

type Step = 'topic' | 'details' | 'ready'

/**
 * Conversational intake. Instead of a form, a small scripted assistant asks
 * what the learner needs, then hands off to a real mentor on request.
 */
export function BotIntake({
  firstName,
  onConnect,
  connecting,
}: {
  firstName: string
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

  // opening lines
  useEffect(() => {
    const t1 = window.setTimeout(() => {
      setBubbles([{ id: ++idRef.current, from: 'bot', text: `Hi ${firstName} 👋 I’m the MySkills assistant.` }])
      setTyping(true)
    }, 350)
    const t2 = window.setTimeout(() => {
      setBubbles((p) => [
        ...p,
        { id: ++idRef.current, from: 'bot', text: 'What do you need help with today?' },
      ])
      setTyping(false)
    }, 1100)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [firstName])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [bubbles, typing, step])

  function pickTopic(t: string) {
    setTopic(t)
    say('me', t)
    setStep('details')
    say('bot', `Got it — ${t.toLowerCase()}. Tell me a bit more so the mentor can help you faster.`, 700)
  }

  function submitDetails(e: React.FormEvent) {
    e.preventDefault()
    const v = text.trim()
    if (!v) return
    setDetails(v)
    setText('')
    say('me', v)
    setStep('ready')
    say('bot', 'Thanks! I’ve summarised this for the mentor. Ready to connect?', 700)
  }

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
              className={`max-w-[76%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
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
          <div className="flex flex-wrap gap-2 pt-2">
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

        {step === 'ready' && !typing && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onConnect(topic, details)}
              disabled={connecting}
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {connecting ? <Loader2 size={15} className="animate-spin" /> : <UserRound size={15} />}
              {connecting ? 'Connecting…' : 'Connect me with a mentor'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('topic')
                setDetails('')
                say('bot', 'No problem — what would you like help with instead?', 400)
              }}
              className="ml-2 rounded-full border border-ink-300 px-4 py-2.5 text-xs font-medium text-ink-600 hover:bg-ink-100"
            >
              Change topic
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submitDetails} className="flex items-center gap-2 border-t border-ink-200 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={step !== 'details'}
          placeholder={
            step === 'topic' ? 'Pick a topic above…' : step === 'ready' ? 'Ready to connect' : 'Describe your question…'
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
