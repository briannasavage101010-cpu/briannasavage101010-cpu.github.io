/* ==========================================================================
   site.js — small bits of behaviour. No dependencies.
   ========================================================================== */
(function () {
  'use strict';

  /* 1. Header gets a hairline border once you've scrolled off the top ------ */
  var head = document.querySelector('.site-head');
  if (head) {
    var onScroll = function () {
      head.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* 2. Fade sections in as they arrive ------------------------------------ */
  var targets = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && targets.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    for (var i = 0; i < targets.length; i++) io.observe(targets[i]);
  } else {
    for (var j = 0; j < targets.length; j++) targets[j].classList.add('is-in');
  }

  /* 3. Mark the current page in the nav ----------------------------------- */
  var here = location.pathname.replace(/index\.html$/, '').replace(/\/+$/, '') || '/';
  var links = document.querySelectorAll('.nav a[href], .site-foot a[href]');
  for (var k = 0; k < links.length; k++) {
    var a = links[k];
    var path = a.getAttribute('href');
    if (!path || path.charAt(0) === '#' || /^(https?:|mailto:|tel:)/.test(path)) continue;
    var resolved = new URL(path, location.href).pathname
      .replace(/index\.html$/, '').replace(/\/+$/, '') || '/';
    if (resolved === here && a.closest('.nav')) a.setAttribute('aria-current', 'page');
  }

  /* 4. Project-enquiry form -> opens a pre-filled email ------------------- */
  /*    No server, no third-party form service, nothing to break or pay for. */
  var form = document.querySelector('[data-mail-form]');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var to = form.getAttribute('data-mail-to') || '';
      var get = function (n) {
        var f = form.elements[n];
        return f ? String(f.value || '').trim() : '';
      };
      var subject = 'Website project — ' + (get('name') || 'new enquiry');
      var body = [
        'Name: '      + get('name'),
        'Business: '  + get('business'),
        'Email: '     + get('email'),
        'Current site: ' + (get('site') || '(none yet)'),
        'Package: '   + get('package'),
        'Timeline: '  + get('timeline'),
        '',
        'What they need:',
        get('details'),
        '',
        '— sent from the website enquiry form'
      ].join('\n');

      var note = form.querySelector('[data-mail-status]');
      if (!to || to.indexOf('@') === -1) {
        if (note) note.textContent = 'This form still needs an email address set. See README.md, step 4.';
        return;
      }
      window.location.href = 'mailto:' + to
        + '?subject=' + encodeURIComponent(subject)
        + '&body='    + encodeURIComponent(body);
      if (note) note.textContent = 'Opening your email app with the details filled in…';
    });
  }


  /* 6. Intro loader — counts up, then wipes away --------------------------- */
  (function loader() {
    var box = document.querySelector('.loader');
    if (!box) return;
    var out = box.querySelector('[data-count]');
    var bar = box.querySelector('[data-count-bar]');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
              || /[?&](nointro|still)/.test(location.search);

    function done() {
      document.documentElement.classList.add('is-loaded');
      setTimeout(function () { box.remove(); }, 1100);
    }
    if (reduce) { document.documentElement.classList.add('is-loaded'); box.remove(); return; }

    var n = 0, t0 = null;
    // ~1.5s, eased so it slows near the end like a real progress bar
    function tick(ts) {
      if (t0 === null) t0 = ts;
      var k = Math.min(1, (ts - t0) / 1500);
      n = Math.round((1 - Math.pow(1 - k, 2.2)) * 100);
      out.textContent = n < 10 ? '0' + n : String(n);
      if (bar) bar.style.transform = 'scaleX(' + (n / 100) + ')';
      if (k < 1) requestAnimationFrame(tick);
      else setTimeout(done, 180);
    }
    requestAnimationFrame(tick);
  })();

  /* 7. HUD: live local clock + scroll percentage --------------------------- */
  (function hud() {
    var clock = document.querySelector('[data-clock]');
    if (clock) {
      var tickClock = function () {
        var d = new Date();
        var pad = function (v) { return v < 10 ? '0' + v : String(v); };
        clock.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
      };
      tickClock();
      setInterval(tickClock, 1000);
    }

    var pct = document.querySelector('[data-progress]');
    if (pct) {
      var run = function () {
        var max = document.body.scrollHeight - window.innerHeight;
        var v = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
        pct.textContent = v < 10 ? '00' + v : v < 100 ? '0' + v : '100';
      };
      run();
      window.addEventListener('scroll', run, { passive: true });
      window.addEventListener('resize', run);
    }
  })();

  /* 5. Year in the footer ------------------------------------------------- */
  var years = document.querySelectorAll('[data-year]');
  for (var y = 0; y < years.length; y++) years[y].textContent = new Date().getFullYear();
})();
