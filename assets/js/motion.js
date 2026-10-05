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
     3. Follow-cursor project index
     ====================================================================== */
  function followIndex() {
    var index = document.querySelector('[data-index]');
    if (!index || !FINE || REDUCE) return;

    var layer = document.createElement('div');
    layer.className = 'idx-float';
    index.appendChild(layer);

    var rows = [].slice.call(index.querySelectorAll('[data-index-img]'));
    var imgs = rows.map(function (row) {
      var im = document.createElement('img');
      im.src = row.getAttribute('data-index-img');
      im.alt = '';
      im.setAttribute('aria-hidden', 'true');
      im.loading = 'lazy';
      layer.appendChild(im);
      return im;
    });

    var tx = 0, ty = 0, cx = 0, cy = 0, active = -1, raf = null;

    function tick() {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      layer.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      raf = requestAnimationFrame(tick);
    }

    index.addEventListener('pointermove', function (ev) {
      var r = index.getBoundingClientRect();
      tx = ev.clientX - r.left;
      ty = ev.clientY - r.top;
      if (!raf) { cx = tx; cy = ty; tick(); }
    }, { passive: true });

    rows.forEach(function (row, n) {
      row.addEventListener('pointerenter', function () {
        if (active > -1) imgs[active].classList.remove('on');
        active = n;
        imgs[n].classList.add('on');
        layer.classList.add('on');
        index.classList.add('has-hover');
        rows.forEach(function (r2) { r2.classList.remove('is-hot'); });
        row.classList.add('is-hot');
      });
    });

    index.addEventListener('pointerleave', function () {
      if (active > -1) imgs[active].classList.remove('on');
      active = -1;
      layer.classList.remove('on');
      index.classList.remove('has-hover');
      rows.forEach(function (r2) { r2.classList.remove('is-hot'); });
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    });
  }

  /* ======================================================================
     4. Custom cursor
     ====================================================================== */
  function cursor() {
    if (!FINE || REDUCE) return;

    var ring = document.createElement('div'); ring.className = 'cur-ring';
    var dot  = document.createElement('div'); dot.className  = 'cur-dot';
    var label = document.createElement('span'); label.className = 'cur-label';
    ring.appendChild(label);
    document.body.appendChild(ring);
    document.body.appendChild(dot);
    document.documentElement.classList.add('has-cursor');

    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;

    document.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
    }, { passive: true });

    var idle = 0;
    (function frame() {
      var dx = mx - rx, dy = my - ry;
      rx += dx * 0.17;
      ry += dy * 0.17;
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      // stop burning frames once the ring has caught up with the pointer
      idle = (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) ? idle + 1 : 0;
      if (idle < 30) requestAnimationFrame(frame);
      else running = false;
    })();
    var running = true;
    document.addEventListener('pointermove', function () {
      if (!running) { running = true; idle = 0; requestAnimationFrame(frame); }
    }, { passive: true });

    // grow over anything clickable; show a word when one is offered
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest('a, button, input, select, textarea, [data-cursor]');
      if (!t) return;
      ring.classList.add('big');
      var word = t.getAttribute('data-cursor');
      if (word) { label.textContent = word; ring.classList.add('worded'); }
    });
    document.addEventListener('pointerout', function (e) {
      var t = e.target.closest('a, button, input, select, textarea, [data-cursor]');
      if (!t) return;
      ring.classList.remove('big', 'worded');
      label.textContent = '';
    });
    document.addEventListener('pointerdown', function () { ring.classList.add('down'); });
    document.addEventListener('pointerup',   function () { ring.classList.remove('down'); });
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
    followIndex();
    cursor();
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
