import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Bot, ChevronDown, Cpu, MapPin } from 'lucide-react'
import { AI_AGENTS, STATUS_LABEL, type AiAgent } from '@/lib/aiAgents'
import { RequireAdmin } from '@/components/admin/AdminSectionGate'
import { Badge, PageHeader } from '@/components/ui'

// Super admins only: what every AI agent does, reads and needs, in one list
// (src/lib/aiAgents.ts).
export const Route = createFileRoute('/admin/_layout/ai-agents')({
  component: () => (
    <RequireAdmin>
      <AiAgentsPage />
    </RequireAdmin>
  ),
})

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">{title}</h3>
      <ul className="mt-1.5 space-y-1 text-sm text-ink-700">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-400" />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AgentCard({ a }: { a: AiAgent }) {
  const [open, setOpen] = useState(false)
  const st = STATUS_LABEL[a.status]
  return (
    <article className="card p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Bot size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-ink-900">{a.name}</h2>
            <Badge tone={st.tone}>{st.label}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-ink-700">{a.purpose}</p>
          <p className="mt-2 text-sm text-ink-600">{a.progress}</p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
            <span className="inline-flex items-center gap-1">
              <Cpu size={12} /> {a.model}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> {a.runs}
            </span>
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
      >
        {open ? 'Hide details' : 'What it reads, produces and needs'}
        <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-4 grid gap-5 border-t border-ink-900/[0.06] pt-4 md:grid-cols-2">
          <List title="Reads" items={a.reads} />
          <List title="Produces, and who sees it" items={a.produces} />
          <List title="Safeguards" items={a.safeguards} />
          <List title="Needs before it can run" items={a.needs} />
        </div>
      )}
    </article>
  )
}

function AiAgentsPage() {
  const counts = AI_AGENTS.reduce<Record<string, number>>((c, a) => ({ ...c, [a.status]: (c[a.status] ?? 0) + 1 }), {})
  return (
    <>
      <PageHeader
        eyebrow="Team & access"
        title="AI agents"
        subtitle={`Every AI agent MySkills uses or plans: what it does, what it reads, who sees what it produces, and what it needs first. ${[
          counts.live && `${counts.live} live`,
          counts.building && `${counts.building} being built`,
          counts.planned && `${counts.planned} planned`,
          counts.parked && `${counts.parked} parked`,
        ]
          .filter(Boolean)
          .join(' · ')}.`}
      />
      <div className="space-y-4">
        {AI_AGENTS.map((a) => (
          <AgentCard key={a.id} a={a} />
        ))}
      </div>
    </>
  )
}
