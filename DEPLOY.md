# briannasavage.nyc — deployment status

## Done ✅

- Repo created: **https://github.com/briannasavage101010-cpu/brianna-site** (public)
- Site pushed to `main`
- **GitHub Pages is switched on**, serving `main` / root
- Custom domain registered with GitHub as `briannasavage.nyc` (from the `CNAME` file)
- GitHub confirms it is serving: the github.io address already redirects to
  `briannasavage.nyc`

## Left to do ⬜

Only one thing: **point the domain at GitHub**. This needs your GoDaddy login,
which is why I stopped — I won't type your password.

### Step 1 — sign in at GoDaddy

Go to **https://dcc.godaddy.com/control/briannasavage.nyc/dns** and sign in.
(It's already open in your browser.)

### Step 2 — add these records

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `185.199.108.153` | 1 hour |
| A | `@` | `185.199.109.153` | 1 hour |
| A | `@` | `185.199.110.153` | 1 hour |
| A | `@` | `185.199.111.153` | 1 hour |
| CNAME | `www` | `briannasavage101010-cpu.github.io` | 1 hour |

GoDaddy starts you with one parked `A` record on `@`. **Edit that one** to
`185.199.108.153`, then **Add** the other three. Same for `www` — edit the
existing CNAME rather than adding a second one.

### ⚠️ Do not touch these

**Leave every `MX`, `TXT`, and `SRV` record exactly as it is.** Those are your
Microsoft 365 email. Deleting or editing them will stop
`hello@briannasavage.nyc` from working before it has even started.

You are only changing the `A` record on `@` and the `CNAME` on `www`. Nothing else.

### Step 3 — wait, then turn on HTTPS

- The domain was registered today, so it may take a few hours to start
  resolving anywhere. That's normal and not something either of us can speed up.
- Once it resolves, go back to
  **https://github.com/briannasavage101010-cpu/brianna-site/settings/pages**
  and tick **Enforce HTTPS**. It only becomes available after GitHub's DNS
  check passes, which can take another hour or so after that.

---

## Updating the site later

```bash
cd ~/brianna-site && git add -A && git commit -m "update" && git push
```

Changes go live about a minute after pushing.

## Previewing locally before you push

```bash
cd ~/brianna-site && python3 -m http.server 5195
```

Then open http://localhost:5195

## Your email

You bought Microsoft 365 Email Essentials with the domain, so
`hello@briannasavage.nyc` can be real. Create it at GoDaddy under
**My Products → Email**. The site already uses that address on the contact page
and in the enquiry form.

To use a different address instead:

```bash
cd ~/brianna-site && grep -rl "hello@briannasavage.nyc" . --include="*.html" | xargs sed -i '' 's/hello@briannasavage.nyc/NEW@briannasavage.nyc/g'
```

## Checklist

- [x] Repo created and site pushed
- [x] GitHub Pages enabled
- [x] Custom domain set on GitHub
- [ ] A records + www CNAME added at GoDaddy
- [ ] Domain resolving (give it a few hours)
- [ ] Enforce HTTPS ticked
- [ ] `hello@briannasavage.nyc` mailbox created
- [ ] Test enquiry sent through the form on /websites/
