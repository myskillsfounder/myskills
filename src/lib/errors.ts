/**
 * Supabase rejects with a plain `{ message, details, hint, code }` object, not
 * an `Error` instance, so the common `e instanceof Error ? e.message :
 * String(e)` fallback silently renders the useless literal string
 * "[object Object]" instead of the actual failure reason. This normalises
 * any thrown/rejected value into a readable message.
 */
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e !== null && 'message' in e) {
    const message = (e as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return String(e)
}
