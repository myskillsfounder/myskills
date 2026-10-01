# nginx speed — turn on HTTP/2

**Server config, not app code. Only you can apply this** (no SSH access from
here). It is the largest single speed win left, and it is one word.

## What was measured (2026-10-01)

Loading `https://myskills.org.in/` in a browser, every request to our own
server reported `http/1.1` — the page itself and every file under `/assets/`.
(Google Fonts, on the same page, came over `h2`/`h3`.)

Why it matters: the app is split into many small files so each page only loads
what it needs — the LaunchPad pulls in about 25 of them. Over HTTP/1.1 a
browser fetches at most six at a time from one host, so they queue in rounds.
Over HTTP/2 they all travel together on one connection. On a slow or mobile
connection that is the difference between one round trip and four or five.

Already good, nothing to do: gzip is on (the main script goes from 71 KB to
21 KB), and `/assets/*` is cached for a year (`immutable`).

## 1. Find the listen line

```bash
sudo nginx -T | grep -n "listen.*443"
```

You should see something like `listen 443 ssl;` (and maybe `listen [::]:443 ssl;`)
in the `myskills.org.in` server block(s).

## 2. Add `http2`

nginx here is 1.24, where HTTP/2 is switched on in the `listen` line:

```nginx
listen 443 ssl http2;
listen [::]:443 ssl http2;   # only if this line already exists
```

Do it in every `server` block that listens on 443 for this site (the `www`
redirect block too, if there is one). Certbot-managed lines can be edited in
place; keep the `# managed by Certbot` comment.

(From nginx 1.25.1 the spelling changes to a separate `http2 on;` line. Not
needed on 1.24 — it would be rejected.)

## 3. Test, then reload

```bash
sudo nginx -t && sudo systemctl reload nginx
```

`nginx -t` must say `syntax is ok` and `test is successful` before the reload
runs; if it doesn't, nothing changes and the site keeps serving as before.

## 4. Check it

```bash
curl -sI --http2 https://myskills.org.in/ | head -1
```

Expect `HTTP/2 200`. Or in Chrome: DevTools → Network → right-click the column
header → tick **Protocol** → reload; the rows for `myskills.org.in` should say
`h2`.

## To undo

Remove the word `http2` from the same lines, then `sudo nginx -t && sudo systemctl reload nginx`.

## Not worth doing now

- **Brotli**: slightly smaller files than gzip, but it needs an extra nginx
  module on Ubuntu's 1.24 package. Small gain for the trouble.
- **A CDN**: the server answers in about 0.1 s already; worth revisiting if
  students outside India become a large share.
