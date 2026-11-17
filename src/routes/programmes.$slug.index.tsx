import { createFileRoute } from '@tanstack/react-router'
import { requireOnboarded } from '@/lib/guards'
import { ProgrammeFrame, previewSearch, useMyProgramme } from '@/components/programme/shared'
import { ProgrammeView } from '@/components/programme/ProgrammeView'

export const Route = createFileRoute('/programmes/$slug/')({
  beforeLoad: requireOnboarded,
  validateSearch: previewSearch,
  component: ProgrammePage,
})

/** A programme from the student's side: start it, then the steps in order. */
function ProgrammePage() {
  const { slug } = Route.useParams()
  const preview = Boolean(Route.useSearch().preview)
  const { p, error, reload } = useMyProgramme(slug, preview)
  return (
    <ProgrammeFrame slug={slug} preview={preview} back="catalogue" p={p} error={error}>
      {(p) => <ProgrammeView p={p} slug={slug} preview={preview} reload={reload} />}
    </ProgrammeFrame>
  )
}
