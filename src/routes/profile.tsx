import type { ComponentType } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { BookOpen, Briefcase, ClipboardCheck, Lock, MapPin, Phone, Sparkles, Target } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useProfile } from '@/lib/useProfile'
import { useInitialAssessment } from '@/lib/assessmentResults'
import type { Profile } from '@/lib/profile'
import { careerStageStep, goalsStep } from '@/lib/onboardingContent'
import { AppShell } from '@/components/app/AppShell'
import { Section } from '@/components/profile/ui'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { AboutSection } from '@/components/profile/AboutSection'
import { ExperienceSection } from '@/components/profile/ExperienceSection'
import { EducationSection } from '@/components/profile/EducationSection'
import { SkillsSection } from '@/components/profile/SkillsSection'

export const Route = createFileRoute('/profile')({
  beforeLoad: requireOnboarded,
  component: ProfilePage,
})

type IconType = ComponentType<{ size?: number; className?: string }>

const goalLabel = (id: string) => goalsStep.options.find((o) => o.id === id)?.label ?? id
const careerLabel = (id: string) =>
  careerStageStep.options.find((o) => o.id === id)?.title ?? id

function StatTile({
  icon: Icon,
  value,
  label,
  sub,
  cardBg,
  iconClass,
  labelClass,
}: {
  icon: IconType
  value: string | number
  label: string
  sub?: string
  cardBg: string
  iconClass: string
  labelClass: string
}) {
  return (
    <div className={`rounded-2xl p-4 ${cardBg}`}>
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white ${iconClass}`}>
        <Icon size={18} />
      </span>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">{value}</p>
      <p className={`text-xs font-semibold ${labelClass}`}>{label}</p>
      {sub && <p className="text-[11px] text-ink-500">{sub}</p>}
    </div>
  )
}

function LockedAssessmentTile() {
  return (
    <Link
      to="/practice"
      className="group flex flex-col rounded-2xl border border-ink-200 bg-ink-50/60 p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-ink-400 transition-colors group-hover:text-brand-600">
        <Lock size={18} />
      </span>
      <p className="mt-3 text-sm font-semibold text-ink-700">Assessment</p>
      <p className="mt-0.5 text-[11px] leading-snug text-ink-500">
        Complete the initial assessment to see your score.
      </p>
    </Link>
  )
}

function StatsRow({
  profile,
  assessmentPercent,
  assessmentDone,
}: {
  profile: Profile
  assessmentPercent: number
  assessmentDone: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatTile
        icon={BookOpen}
        value={profile.goals.length}
        label="Focus areas"
        sub="from onboarding"
        cardBg="border border-brand-200 bg-brand-50"
        iconClass="text-brand-600"
        labelClass="text-brand-700"
      />
      {assessmentDone ? (
        <StatTile
          icon={ClipboardCheck}
          value={`${assessmentPercent}%`}
          label="Assessment"
          sub="completed"
          cardBg="border border-emerald-200 bg-emerald-50"
          iconClass="text-emerald-600"
          labelClass="text-emerald-700"
        />
      ) : (
        <LockedAssessmentTile />
      )}
      <StatTile
        icon={Sparkles}
        value={profile.skills.length}
        label="Skills"
        sub="on your profile"
        cardBg="border border-amber-200 bg-amber-50"
        iconClass="text-amber-600"
        labelClass="text-amber-700"
      />
      <StatTile
        icon={Briefcase}
        value={profile.experience.length}
        label="Experience"
        sub="positions"
        cardBg="border border-sky-200 bg-sky-50"
        iconClass="text-sky-600"
        labelClass="text-sky-700"
      />
    </div>
  )
}

function DetailRow({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-ink-400">{label}</p>
        <p className="truncate text-sm font-medium text-ink-900">{value || '—'}</p>
      </div>
    </div>
  )
}

function Details({ profile }: { profile: Profile }) {
  const location = [profile.state, profile.country].filter(Boolean).join(', ')
  return (
    <Section title="Details">
      <div className="space-y-4">
        <DetailRow
          icon={Target}
          label="Career stage"
          value={profile.career_stage ? careerLabel(profile.career_stage) : '—'}
        />
        <DetailRow icon={MapPin} label="Location" value={location} />
        <DetailRow icon={Phone} label="Phone" value={profile.phone} />
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <BookOpen size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-ink-400">Focus areas</p>
            {profile.goals.length ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {profile.goals.map((id) => (
                  <span
                    key={id}
                    className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                  >
                    {goalLabel(id)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-ink-900">—</p>
            )}
          </div>
        </div>
      </div>
    </Section>
  )
}

/** Locked — track-by-track learning is a future feature. */
function ActiveLearningLocked() {
  return (
    <Section title="Active learning">
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-ink-200 bg-ink-50/60 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-400">
          <Lock size={18} />
        </span>
        <div>
          <p className="text-sm font-medium text-ink-700">Coming soon</p>
          <p className="text-xs text-ink-400">Track-by-track learning launches soon.</p>
        </div>
      </div>
    </Section>
  )
}

function ProfilePage() {
  const { profile, loading, error, save, upload } = useProfile()
  const { result: assessment } = useInitialAssessment()

  return (
    <AppShell wide>
      {loading && <p className="text-sm text-ink-500">Loading your profile…</p>}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-semibold">Couldn’t load your profile.</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-red-600">
            If this is the first run, apply{' '}
            <code className="rounded bg-red-100 px-1">docs/supabase-schema.sql</code>{' '}
            in your Supabase SQL editor to create the profiles table and storage bucket.
          </p>
        </div>
      )}

      {profile && (
        <div className="space-y-5">
          <ProfileHeader profile={profile} save={save} upload={upload} />
          <StatsRow
            profile={profile}
            assessmentPercent={assessment?.overall.percent ?? 0}
            assessmentDone={assessment != null}
          />

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <AboutSection profile={profile} save={save} />
              <ExperienceSection profile={profile} save={save} />
              <EducationSection profile={profile} save={save} />
            </div>
            <div className="space-y-5">
              <Details profile={profile} />
              <ActiveLearningLocked />
              <SkillsSection profile={profile} save={save} />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
