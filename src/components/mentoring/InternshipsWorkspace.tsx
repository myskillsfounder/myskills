import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, GraduationCap } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { fetchMyPipeline, type PipelineApplication } from '@/lib/internships'
import { Alert, Skeleton } from '@/components/ui'
import { ApplicantRow, InternshipRoles } from '@/components/mentoring/InternshipRoles'
import { ResourcePanel } from '@/components/mentoring/ResourcePanel'

/**
 * A company's Internships page, in the order the work comes: the interns with
 * them now (each marked complete here, which is what lets MySkills confirm it
 * for the student's score), then their roles and who applied, then anyone
 * else sharing their record with them.
 *
 * Interns who came through a role are left off that last list: ending them
 * there would close the internship without a sign-off.
 */
export function InternshipsWorkspace({ organisation }: { organisation: string | null }) {
  const [pipeline, setPipeline] = useState<PipelineApplication[] | null | undefined>(undefined)
  const [error, setError] = useState<string>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [showDone, setShowDone] = useState(false)

  const load = useCallback(async () => {
    try {
      setPipeline(await fetchMyPipeline())
      setError(undefined)
    } catch (e) {
      setError(errorMessage(e))
      setPipeline(null)
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load, refreshKey])

  const bump = () => setRefreshKey((k) => k + 1)

  const interning = (pipeline ?? []).filter((a) => a.status === 'accepted' || a.status === 'signoff_pending')
  const completed = (pipeline ?? []).filter((a) => a.status === 'completed')
  const throughRoles = new Set(
    (pipeline ?? [])
      .filter((a) => a.status === 'accepted' || a.status === 'signoff_pending' || a.status === 'completed')
      .map((a) => a.student_id),
  )

  return (
    <div className="space-y-10">
      <p className="max-w-2xl text-sm leading-relaxed text-ink-600">
        {organisation && <span className="font-semibold text-ink-900">{organisation}. </span>}
        Post a role, choose from the students who apply, and mark each internship complete when it ends. MySkills
        confirms it with you, and the student’s first confirmed internship adds 20 points to their Global Readiness
        Score.
      </p>

      {/* Before docs/supabase-internships-portal.sql the interns stay inside their role cards. */}
      {pipeline !== null && (
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Your interns{pipeline ? ` · ${interning.length}` : ''}
          </h2>
          {error && (
            <Alert tone="danger" title="Couldn’t load your interns">
              <p>{error}</p>
            </Alert>
          )}
          {pipeline === undefined ? (
            <Skeleton className="h-24 w-full" />
          ) : interning.length === 0 ? (
            <div className="card flex items-center gap-3 p-5 text-sm text-ink-600">
              <GraduationCap size={20} className="shrink-0 text-ink-400" />
              No one is interning with you right now. When a student accepts your offer, they appear here.
            </div>
          ) : (
            <ul className="space-y-3">
              {interning.map((a) => (
                <ApplicantRow key={a.id} a={a} role={{ title: a.role_title, weeks: a.duration_weeks }} onChanged={bump} />
              ))}
            </ul>
          )}
          {completed.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowDone((v) => !v)}
                aria-expanded={showDone}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900"
              >
                Completed · {completed.length}
                <ChevronDown size={15} className={`transition-transform ${showDone ? 'rotate-180' : ''}`} />
              </button>
              {showDone && (
                <ul className="mt-3 space-y-3">
                  {completed.map((a) => (
                    <ApplicantRow key={a.id} a={a} role={{ title: a.role_title, weeks: a.duration_weeks }} onChanged={bump} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      <InternshipRoles refreshKey={refreshKey} onChanged={() => void load()} internsElsewhere={Boolean(pipeline)} />

      <ResourcePanel
        resource="internships"
        organisation={null}
        exclude={pipeline ? throughRoles : undefined}
        heading="Other students sharing with you"
      />
    </div>
  )
}
