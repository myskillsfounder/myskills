import { createFileRoute, redirect } from '@tanstack/react-router'

// Demo requests became Institution leads (docs/supabase-institution-leads.sql
// copied every request across); this keeps old links and bookmarks working.
export const Route = createFileRoute('/admin/_layout/demo-requests')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/institution-leads', replace: true })
  },
})
