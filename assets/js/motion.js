/* ==========================================================================
   motion.js — the interaction layer.

   Five things, all hand-written, no libraries:
     1. Line-mask reveals    headings rise out from behind a clipped edge
     2. Image wipes          pictures uncover with a clip-path sweep
     3. Follow-cursor index  hovering a project row floats its image
     4. Custom cursor        a dot + ring that reacts to what's under it
     5. Magnetic buttons     buttons lean toward the pointer

   Every one of these is skipped entirely when the visitor has asked for
   reduced motion, or when they're on a touch device where it makes no sense.
   ========================================================================== */
(function () {
  'use strict';

  var STILL  = /[?&]still/.test(location.search);
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches || STILL;
  if (STILL) document.documentElement.classList.add('is-still');
  var FINE   = window.matchMedia('(pointer: fine)').matches;

  /* ======================================================================
     1. Split headings into lines, each in its own overflow-hidden mask
     ====================================================================== */
  function splitLines(el) {
    if (el.dataset.split === 'done') return;
    // only safe on plain text — anything with nested markup is left alone
    var kids = el.childNodes, i;
    for (i = 0; i < kids.length; i++) {
      if (kids[i].nodeType === 1 && kids[i].tagName !== 'BR') return;
    }
    var text = el.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;

    el.dataset.splitText = text;
    var words = text.split(' ');
    el.textContent = '';
    var spans = [];
    for (i = 0; i < words.length; i++) {
      var w = document.createElement('span');
      w.className = 'w';
      w.textContent = words[i];
      el.appendChild(w);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      spans.push(w);
    }

    // group words that share a baseline — that's a visual line
    var lines = [], last = null, cur = null;
    for (i = 0; i < spans.length; i++) {
      var top = Math.round(spans[i].offsetTop);
      if (last === null || Math.abs(top - last) > 4) { cur = []; lines.push(cur); last = top; }
      cur.push(spans[i].textContent);
    }

    el.textContent = '';
    for (i = 0; i < lines.length; i++) {
      var outer = document.createElement('span');
      outer.className = 'line';
      var inner = document.createElement('span');
      inner.className = 'line__i';
      inner.textContent = lines[i].join(' ');
      inner.style.transitionDelay = (i * 0.085) + 's';
      outer.appendChild(inner);
      el.appendChild(outer);
    }
    el.dataset.split = 'done';
    el.classList.add('is-split');
  }

  function unsplit(el) {
    if (el.dataset.split !== 'done') return;
    el.textContent = el.dataset.splitText || el.textContent;
    el.dataset.split = '';
    el.classList.remove('is-split', 'is-lit');
  }

  var splitTargets = [].slice.call(document.querySelectorAll('[data-split]'));

  function doSplit() {
    if (REDUCE) return;
    splitTargets.forEach(function (el) { unsplit(el); splitLines(el); });
  }

  /* ======================================================================
     2 + 1b. Reveal on scroll — lines, wipes and plain fades share one observer
     ====================================================================== */
  var lit = 'is-lit';
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add(lit);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

    var watch = document.querySelectorAll('[data-split], [data-wipe]');
    for (var i = 0; i < watch.length; i++) io.observe(watch[i]);
  } else {
    document.querySelectorAll('[data-split], [data-wipe]').forEach(function (e) { e.classList.add(lit); });
  }

  /* ======================================================================
     5. Magnetic buttons
     ====================================================================== */
  function magnets() {
    if (!FINE || REDUCE) return;
    var els = document.querySelectorAll('.btn, .nav__cta');
    for (var i = 0; i < els.length; i++) {
      (function (el) {
        var qx = 0, qy = 0, pending = false;
        function apply() {
          pending = false;
          el.style.transform = 'translate(' + qx.toFixed(1) + 'px,' + qy.toFixed(1) + 'px)';
        }
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          qx = ((e.clientX - (r.left + r.width / 2)) / r.width) * 9;
          qy = ((e.clientY - (r.top + r.height / 2)) / r.height) * 7;
          // one style write per frame, never one per mousemove event
          if (!pending) { pending = true; requestAnimationFrame(apply); }
        }, { passive: true });
        el.addEventListener('pointerleave', function () { el.style.transform = ''; });
      })(els[i]);
    }
  }

  /* ======================================================================
     6. Parallax on full-bleed images + scroll progress bar
     ====================================================================== */
  function parallax() {
    var els = [].slice.call(document.querySelectorAll('[data-parallax]'));
    var bar = document.querySelector('.scroll-bar');
    if (!els.length && !bar) return;

    var ticking = false;
    function run() {
      ticking = false;
      if (!REDUCE) {
        for (var i = 0; i < els.length; i++) {
          var el = els[i];
          var r  = el.parentElement.getBoundingClientRect();
          if (r.bottom < -200 || r.top > innerHeight + 200) continue;
          var mid = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
          el.style.transform = 'translate3d(0,' + (mid * -42).toFixed(1) + 'px,0) scale(1.14)';
        }
      }
      if (bar) {
        var max = document.body.scrollHeight - innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? (scrollY / max) : 0).toFixed(4) + ')';
      }
    }
    addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(run); }
    }, { passive: true });
    addEventListener('resize', run);
    run();
  }

  /* ---- go ---------------------------------------------------------------- */
  function boot() {
    doSplit();
    magnets();
    parallax();
    // first screen animates in immediately rather than waiting for a scroll
    requestAnimationFrame(function () {
      document.querySelectorAll('.hero [data-split], .hero [data-wipe]').forEach(function (e) {
        e.classList.add(lit);
      });
      document.documentElement.classList.add('is-ready');
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(boot);          // split after the real font loads
  } else if (document.readyState !== 'loading') {
    boot();
  } else {
    document.addEventListener('DOMContentLoaded', boot);
  }

  var rsz;
  addEventListener('resize', function () {
    clearTimeout(rsz);
    rsz = setTimeout(function () {
      splitTargets.forEach(function (el) {
        var was = el.classList.contains(lit);
        unsplit(el); splitLines(el);
        if (was) el.classList.add(lit);
      });
    }, 220);
  });
})();
