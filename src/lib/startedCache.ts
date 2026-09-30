/**
 * A version number for "has this student started?" (see firstRun.ts). Bumped
 * whenever an aptitude or Foundation assessment is saved, so the cached answer
 * is dropped at once instead of waiting out its timer. A separate module with
 * no imports: the assessment code calls it, and firstRun.ts imports the
 * assessment code, so it can't live in firstRun.ts without a cycle.
 */
let version = 0

export const startedVersion = () => version

export function forgetStarted(): void {
  version++
}
