# briannasavage.nyc

Your personal site + Savage Studio (the website business). Plain HTML, CSS and
JavaScript — no build step, no npm, no page builder. You can open any file,
change the words, and save.

---

## 1. Look at it on your computer

Paste this into Terminal, then open **http://localhost:5195** in your browser:

```bash
cd ~/brianna-site && python3 -m http.server 5195
```

Press `Control + C` in Terminal to stop it.

> Don't open the `.html` files by double-clicking them — the pages link to each
> other using addresses that start with `/`, which only work through a real
> server. Use the command above.

Two useful URLs while you're looking:

- `http://localhost:5195/?nointro=1` — skips the loading counter
- `http://localhost:5195/?still=1` — turns off every animation, so you can
  study the layout without things moving

---

## 2. Put it on the internet (Netlify, free, ~5 minutes)

1. Go to **app.netlify.com/drop**
2. Drag the whole `brianna-site` folder onto the page.
3. It goes live immediately on a temporary address like `random-name.netlify.app`.
4. In Netlify: **Domain settings → Add a domain** → type `briannasavage.nyc`.
5. Netlify shows you nameservers or DNS records. Put those in wherever you
   bought the domain.
6. Wait up to a few hours for DNS. Netlify adds the HTTPS padlock on its own.

The `CNAME` file in this folder already says `briannasavage.nyc`, so GitHub
Pages also works if you'd rather use that.

**To update later:** change the files, then drag the folder onto Netlify again.

---

## 3. Things you'll want to change

### Your email address
Right now the site says **hello@briannasavage.nyc**. That mailbox doesn't exist
until you create it (most domain registrars sell email, or use Google Workspace
or Fastmail). Until then, swap in an address you actually read:

```bash
cd ~/brianna-site && grep -rl "hello@briannasavage.nyc" . --include="*.html" | xargs sed -i '' 's/hello@briannasavage.nyc/YOUR@EMAIL.COM/g'
```

Replace `YOUR@EMAIL.COM` with your real address before running it.

### The prices
In `websites/index.html`, search for `$800`, `$2,000` and `$3,500`. They appear
twice each — once in the pricing card, once in the enquiry form dropdown.
Change both.

### Colors
Everything is set in one place: the top of `assets/css/site.css`, under
`:root`. Change `--blue`, `--gold`, `--pink` or `--bg` and the whole site
follows.

### The "available for projects" badge
In the bottom-left corner of every page. If you get busy, search for
`Available for projects` and change the wording.

---

## 4. What's in the folder

```
index.html          Home
work/               Everything you've built
websites/           Savage Studio — packages, pricing, enquiry form
about/              Your story
contact/            Email + what to include when writing
404.html            Shown if someone hits a bad link
CNAME               Your domain, for GitHub Pages
robots.txt          Lets search engines in
sitemap.xml         Lists your pages for Google
assets/css/site.css Every style on the site
assets/js/          Four small scripts (see below)
assets/img/         Photos
assets/img/orb/     Small blue-tinted copies, for the rotating sphere
```

### The scripts

| File | What it does |
|---|---|
| `sphere.js` | The rotating ball of work images behind the home headline. CSS 3D, no WebGL. |
| `flowfield.js` | The drifting line artwork behind the page titles on inner pages. |
| `motion.js` | Headline reveals, the custom cursor, magnetic buttons, the hover-image on the work list. |
| `site.js` | Loading counter, the live clock, scroll percentage, and the enquiry form. |

### How the enquiry form works
It doesn't send anything itself — there's no server and nothing to pay for.
When someone hits send, it opens *their* email app with all the answers already
typed into a message addressed to you. They press send; it lands in your inbox.

---

## 5. If you ever need to regenerate the sphere images

The rotating sphere uses small blue-tinted copies so the page stays fast. If you
add new photos to `assets/img/`, re-run:

```bash
cd ~/brianna-site && python3 scripts/build-orb.py
```

Then add the new filenames to the `data-sphere="..."` list in `index.html`.

---

## Accessibility and performance notes

- Every animation is turned off automatically for visitors who have "reduce
  motion" switched on in their system settings.
- Animations only move `transform` and `opacity`, which browsers handle on the
  graphics card — that's why it stays smooth.
- The sphere stops animating when you scroll past it or switch tabs.
- The site works with JavaScript turned off: you lose the motion, not the content.
