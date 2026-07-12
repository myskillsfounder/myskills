import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client for the self-hosted instance. The URL and anon key are
 * PUBLIC (the anon key is meant to ship in the browser). Never put the
 * service_role key here. Override per environment via VITE_SUPABASE_*.
 */
const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://supabase.myskills.org.in'
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzUxMzI4MDAwLCJleHAiOjIwNjY2ODgwMDB9.Yq4n_d3xjyJVUcBwY3EjF5sf_drqRT7P5avmoQNVqJc'

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
