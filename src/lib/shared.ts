/**
 * Callers that ask for the same thing at the same moment share one request.
 *
 * A page and the sidebar around it both need to know a student's aptitude
 * result, practice and so on, and they mount together, so each of those used
 * to be fetched twice. This joins a call to one already on its way. Nothing is
 * kept once the request finishes: the next call always goes to the server, so
 * a result can't go stale and one student's data can't be handed to the next
 * person to sign in.
 *
 * Callers share the same resolved value, so treat it as read-only.
 */
const pending = new Map<string, Promise<unknown>>()

export function shared<T>(key: string, load: () => Promise<T>): Promise<T> {
  const running = pending.get(key)
  if (running) return running as Promise<T>
  const request = load().finally(() => pending.delete(key))
  pending.set(key, request)
  return request
}
