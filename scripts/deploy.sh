#!/usr/bin/env bash
#
# Safe deploy for myskills.org.in. Run it ON THE VPS, from anywhere:
#
#   scripts/deploy.sh             pull main, build, check, switch the live site to it
#   scripts/deploy.sh --check     test this server is ready (changes nothing live)
#   scripts/deploy.sh --dry-run   build the current code into a scratch folder and
#                                 check it, without pulling or switching anything
#   scripts/deploy.sh --rollback  switch back to the previous release
#   scripts/deploy.sh --status    show what's live and which releases are kept
#
# WHY THIS EXISTS
#   `npm run build` used to empty /root/frontend-app/dist and refill it in place,
#   so the site was down for the length of every build — and stayed down (403)
#   if a build was ever interrupted: a dropped SSH session, an out-of-memory kill.
#
# HOW IT WORKS
#   Every build is written to its own folder under releases/. `dist` (the path
#   nginx serves, unchanged) becomes a symlink to one of them. A build only
#   becomes live after it has been checked, and the switch is a single atomic
#   rename, so there is no moment when the site has nothing to serve. If the
#   build fails, is interrupted or fails its checks, the live site is untouched.
#   After the switch the script requests the site from THIS server; if that
#   fails it switches straight back. The last few releases are kept so a bad
#   deploy can be undone in a second with --rollback.
#
# Needs: git, node, npm, curl, flock, and GNU mv/ln (all standard on Ubuntu).

set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
RELEASES="$APP_DIR/releases"
LIVE="$APP_DIR/dist"                 # what nginx serves; a symlink once adopted
KEEP="${KEEP_RELEASES:-5}"           # releases to keep, including the live one
SITE_HOST="${SITE_HOST:-myskills.org.in}"
# Ask THIS machine for the site (bypassing DNS and any CDN), so the check proves
# nginx here is really serving the new build.
SMOKE_RESOLVE="${SMOKE_RESOLVE:-$SITE_HOST:443:127.0.0.1}"

log()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m ok\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m !!\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31mERR\033[0m %s\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------- releases --

# Release folders, newest first. Names start with a timestamp, so a plain sort
# is chronological; the adopted pre-script build is named to sort oldest.
list_releases() {
  [[ -d "$RELEASES" ]] || return 0
  find "$RELEASES" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort -r
}

# The release `dist` currently points at (empty output if it isn't a symlink).
current_release() {
  if [[ -L "$LIVE" ]]; then basename "$(readlink "$LIVE")"; fi
}

# Point `dist` at a release in one atomic step: build the new symlink beside it,
# then rename it over the old one. rename(2) replaces the target atomically, so
# a request always finds either the old release or the new one — never neither.
point_live_at() {
  local id=$1
  ln -sfn "releases/$id" "$APP_DIR/.dist.next"
  mv -Tf "$APP_DIR/.dist.next" "$LIVE"
}

# A release is only allowed to go live if it is complete. This is what stops a
# half-finished build from ever being served.
verify_release() {
  local dir=$1 ref count=0
  [[ -f "$dir/index.html" ]] || { warn "index.html is missing"; return 1; }
  [[ $(wc -c < "$dir/index.html") -gt 500 ]] || { warn "index.html looks empty"; return 1; }
  # robots.txt and sitemap.xml are written by the LAST build step (scripts/
  # generate-seo.mjs), so their presence proves the build ran to the end.
  for f in robots.txt sitemap.xml; do
    [[ -s "$dir/$f" ]] || { warn "$f is missing — the build did not finish"; return 1; }
  done
  while IFS= read -r ref; do
    [[ -s "$dir$ref" ]] || { warn "index.html points at $ref, which isn't there"; return 1; }
    count=$((count + 1))
  done < <(grep -oE '/assets/[A-Za-z0-9_.-]+\.(js|css)' "$dir/index.html" | sort -u)
  (( count > 0 )) || { warn "index.html references no assets"; return 1; }
  return 0
}

# After the switch: request the site from this server and confirm it is serving
# the release we just deployed, including a deep link (proves the SPA fallback).
smoke_test() {
  local dir=$1 asset code path
  asset=$(grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' "$dir/index.html" | head -1)
  for path in / /practice; do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 \
      --resolve "$SMOKE_RESOLVE" "https://$SITE_HOST$path" || true)
    [[ "$code" == 200 ]] || { warn "GET $path returned ${code:-no response}"; return 1; }
  done
  if [[ -n "$asset" ]]; then
    curl -s --max-time 20 --resolve "$SMOKE_RESOLVE" "https://$SITE_HOST/" | grep -qF "$asset" \
      || { warn "the site is serving a different build than the one just deployed"; return 1; }
  fi
  return 0
}

prune() {
  local cur n=0 r
  cur=$(current_release || true)
  while IFS= read -r r; do
    n=$((n + 1))
    (( n <= KEEP )) && continue
    [[ "$r" == "$cur" ]] && continue
    [[ -n "$r" && "$r" != */* ]] || continue     # never remove anything outside releases/
    rm -rf -- "${RELEASES:?}/$r"
    log "removed old release $r"
  done < <(list_releases)
}

# The very first run: `dist` is still a real folder from the old in-place builds.
# Move it into releases/ and put the symlink in its place. Two renames back to
# back, so this is the only moment (microseconds, once ever) that is not atomic.
adopt_legacy_dist() {
  [[ -e "$LIVE" && ! -L "$LIVE" ]] || return 0
  local id="00000000-000000-legacy"
  log "First run: adopting the existing dist/ folder as release $id"
  mkdir -p "$RELEASES"
  [[ ! -e "$RELEASES/$id" ]] || id="00000000-$(date +%H%M%S)-legacy"
  ln -sfn "releases/$id" "$APP_DIR/.dist.next"
  mv "$LIVE" "$RELEASES/$id"
  mv -Tf "$APP_DIR/.dist.next" "$LIVE"
}

# ---------------------------------------------------------------- commands --

acquire_lock() {
  if command -v flock >/dev/null; then
    exec 9>"$APP_DIR/.deploy.lock"
    flock -n 9 || die "Another deploy is already running."
  else
    warn "flock isn't installed, so I can't stop two deploys running at once."
  fi
}

cmd_status() {
  local cur; cur=$(current_release || true)
  if [[ -z "$cur" ]]; then
    warn "dist/ is not managed by this script yet — the first deploy will adopt it."
  else
    ok "live release: $cur"
  fi
  echo "releases (newest first):"
  list_releases | while read -r r; do
    if [[ "$r" == "$cur" ]]; then echo "  * $r   <- live"; else echo "    $r"; fi
  done
}

# Everything that can be checked without touching the live site.
cmd_check() {
  local fail=0 t
  for c in git node npm curl flock; do
    if command -v "$c" >/dev/null; then ok "$c found"; else warn "$c is missing"; fail=1; fi
  done
  [[ -f "$APP_DIR/.env" ]] && ok ".env present" || { warn "no .env in $APP_DIR (the build needs its GA ID etc.)"; fail=1; }
  if grep -RhsE '^\s*root\s' /etc/nginx/sites-enabled/ 2>/dev/null | grep -qF "$LIVE"; then
    ok "nginx serves $LIVE"
  else
    warn "couldn't confirm nginx's root is $LIVE — check /etc/nginx/sites-enabled/"
  fi
  # Prove the two primitives the atomic switch relies on work on THIS filesystem.
  t="$APP_DIR/.swaptest"; rm -rf "$t"; mkdir -p "$t/a" "$t/b"
  ln -sfn a "$t/cur"; ln -sfn b "$t/next"; mv -Tf "$t/next" "$t/cur"
  if [[ "$(readlink "$t/cur")" == b ]]; then ok "atomic symlink switch works here"; else warn "atomic symlink switch FAILED"; fail=1; fi
  rm -rf "$t"
  if [[ -L "$LIVE" ]]; then ok "dist is already a managed symlink"; \
  elif [[ -d "$LIVE" ]]; then ok "dist is a plain folder — the first deploy will adopt it"; \
  else warn "dist does not exist yet"; fi
  df -h "$APP_DIR" | tail -1 | awk '{print "     disk: " $4 " free"}'
  (( fail == 0 )) || die "Not ready — fix the items above first."
  ok "This server is ready. Nothing live was changed."
}

# Build + verify only. Safe to run any time: nothing is pulled or switched.
cmd_dry_run() {
  local id="dryrun-$(date +%Y%m%d-%H%M%S)"
  cd "$APP_DIR"
  trap 'rm -rf -- "${RELEASES:?}/$id"' EXIT
  log "Dry run: building the current code into releases/$id (live site untouched)"
  OUT_DIR="releases/$id" npm run build
  verify_release "$RELEASES/$id" || die "The build did not pass its checks."
  ok "The build is complete and would have been safe to switch to."
}

cmd_rollback() {
  local cur prev
  cur=$(current_release || true)
  [[ -n "$cur" ]] || die "dist/ isn't managed by this script yet — there's nothing to roll back to."
  prev=$(list_releases | awk -v c="$cur" 'f {print; exit} $0 == c {f = 1}')
  [[ -n "$prev" ]] || die "There is no older release to go back to."
  verify_release "$RELEASES/$prev" || die "$prev is incomplete; not switching to it."
  log "Rolling back: $cur -> $prev"
  point_live_at "$prev"
  if smoke_test "$RELEASES/$prev"; then ok "Rolled back. Live: $prev"; else die "Switched to $prev, but the site check failed — look at nginx."; fi
}

cmd_deploy() {
  cd "$APP_DIR"
  local before after id previous swapped=0
  acquire_lock
  adopt_legacy_dist

  log "Pulling main"
  before=$(sha256sum package-lock.json | cut -d' ' -f1)
  git pull --ff-only origin main
  after=$(sha256sum package-lock.json | cut -d' ' -f1)
  if [[ ! -d node_modules || "$before" != "$after" ]]; then
    log "Dependencies changed — running npm ci"
    npm ci
  fi

  id="$(date +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD)"
  # If anything below fails or the session drops, remove the half-built folder.
  # The live site is not affected either way.
  trap '[[ $swapped -eq 1 ]] || { rm -rf -- "${RELEASES:?}/$id"; warn "Deploy stopped — the live site was not touched."; }' EXIT

  log "Building release $id"
  OUT_DIR="releases/$id" npm run build

  log "Checking the build"
  verify_release "$RELEASES/$id" || die "The build did not pass its checks. Nothing was switched."
  ok "build is complete"

  previous=$(current_release || true)
  log "Switching the live site to $id"
  point_live_at "$id"
  swapped=1

  log "Checking the live site"
  if smoke_test "$RELEASES/$id"; then
    ok "the site is serving $id"
  else
    if [[ -n "$previous" ]]; then
      warn "The new build failed the live check — switching back to $previous"
      point_live_at "$previous"
      die "Deploy rolled back to $previous. Nothing changed for visitors."
    fi
    die "The new build failed the live check and there is no previous release to go back to."
  fi

  prune
  echo
  ok "Deployed $id (commit $(git rev-parse --short HEAD))"
  [[ -z "$previous" ]] || echo "     previous release kept: $previous  (scripts/deploy.sh --rollback)"
}

main() {
  case "${1:-}" in
    "")          cmd_deploy ;;
    --check)     cmd_check ;;
    --dry-run)   cmd_dry_run ;;
    --rollback)  acquire_lock; cmd_rollback ;;
    --status)    cmd_status ;;
    -h|--help)   sed -n '2,24p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//' ;;
    *)           die "Unknown option '$1' (try --help)" ;;
  esac
}

# Only run when executed, so the functions above can be sourced and tested.
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then main "$@"; fi
