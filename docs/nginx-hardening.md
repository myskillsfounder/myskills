# nginx hardening — canonical host, security headers, asset caching

**HIGH-severity finding, infra side.** `public/.htaccess` is Apache config, but
production serves from `nginx/1.24.0` (confirmed via response headers) — none
of it applies. Live checks on 2026-09-07 showed:

- `www.myskills.org.in` serves full duplicate content instead of redirecting
  to the canonical `myskills.org.in` (both currently sit in the same
  `server_name` line, most likely).
- No `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, or
  `Strict-Transport-Security` header on any response.
- `/assets/*.js` (Vite's fingerprinted, content-hashed bundles — safe to
  cache forever) ship with no `Cache-Control` at all.

This can't be fixed from a frontend PR — it's server config, not app code.
**Only you can apply this** (no SSH access from here). It's presented as a
patch to your *existing* config rather than a drop-in replacement, since I
can't see your actual file (SSL cert paths, document root, etc. will differ
from any guess I'd make) — a wrong path in a full replacement could take the
site down. Applying the pieces below to what you already have is safer.

## 1. Find your config

```bash
sudo nginx -T | grep -A2 "server_name.*myskills"
```

This shows you which file(s) define the `myskills.org.in` server block(s) and
whether `www` currently shares one with the apex domain (it almost certainly
does, since both resolve identically today).

## 2. Split `www` into its own redirect-only block

If you see one block like:

```nginx
server {
    listen 443 ssl;
    server_name myskills.org.in www.myskills.org.in;
    ...
}
```

Change it to two blocks — the `www` one does nothing but redirect:

```nginx
server {
    listen 443 ssl;
    server_name www.myskills.org.in;

    ssl_certificate     /etc/letsencrypt/live/myskills.org.in/fullchain.pem;  # match your existing cert paths
    ssl_certificate_key /etc/letsencrypt/live/myskills.org.in/privkey.pem;

    return 301 https://myskills.org.in$request_uri;
}

server {
    listen 443 ssl;
    server_name myskills.org.in;
    # ... everything else stays exactly as it was ...
}
```

(If your cert is a single multi-domain cert covering both names, keep the
same `ssl_certificate`/`ssl_certificate_key` lines in both blocks — just
don't merge the `server_name`s back together.)

## 3. Add the security headers

Inside the canonical (`myskills.org.in`) server block, alongside your
existing `location /` (or at the server level, so it applies everywhere):

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# HSTS: only add this once you're confident the site will stay on HTTPS
# permanently — it tells browsers to refuse plain HTTP for this domain for
# the next year, which is hard to undo quickly if you ever needed to serve
# HTTP again. Start without `preload` and without `includeSubDomains` until
# you've lived with it a while.
add_header Strict-Transport-Security "max-age=31536000" always;
```

`always` matters — without it, `add_header` is skipped on error responses
(4xx/5xx), which is usually not what you want for security headers.

## 4. Cache the fingerprinted assets

Vite content-hashes everything under `/assets/` (the filename changes when
the content does), so it's safe to cache for a year. Add this as its own
`location` block inside the canonical server block, before your SPA
fallback `location /`:

```nginx
location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
}
```

Leave `index.html` itself uncached (or `no-cache`) — it's what points at the
current asset hashes, so caching it would serve stale bundle references
after a deploy. If you want to be explicit rather than rely on nginx's
default, add near the fallback:

```nginx
location = /index.html {
    add_header Cache-Control "no-cache, must-revalidate";
}
```

## 5. What this deliberately does NOT fix

Every unmatched path currently returns HTTP 200 with the SPA shell (a "soft
404") instead of a real 404 — this is what caused the favicon confusion
earlier, and it's a minor, ongoing SEO cost (Search Console flags soft 404s).
It's not included above because there's no clean fix for a pure client-side
router: nginx has no way to know which paths TanStack Router considers valid
without a route manifest to cross-check against, so a naive attempt (e.g.
`try_files $uri $uri/ /index.html =404;`) would just as happily 404 real,
valid client-routed pages nginx doesn't recognize. Leaving the catch-all as
the standard, working SPA pattern is the right tradeoff for now.

## 6. Apply safely

```bash
sudo nginx -t          # validates syntax before touching the running server
sudo systemctl reload nginx    # reload, not restart — no dropped connections
```

Then re-run the same checks from the audit to confirm:

```bash
curl -I https://www.myskills.org.in/          # expect 301 -> https://myskills.org.in/
curl -I https://myskills.org.in/               # expect the 3 headers present
curl -I https://myskills.org.in/assets/<any-hashed-file>.js   # expect Cache-Control
```
