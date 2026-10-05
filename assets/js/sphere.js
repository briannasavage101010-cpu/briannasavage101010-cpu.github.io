/* ==========================================================================
   sphere.js — the hero visual.

   A cloud of work images arranged on a sphere and slowly rotated. Built with
   CSS 3D transforms rather than WebGL: each card is placed with
   `rotateY(theta) rotateX(phi) translateZ(radius)` inside a parent that
   preserves 3D, so the browser's compositor does all the maths on the GPU.

   Points are spread with a Fibonacci lattice (the golden-angle spiral) so
   they're evenly distributed instead of bunching at the poles the way naive
   lat/long spacing does.

   The pointer tilts it; it keeps turning on its own; it stops when offscreen.
   ========================================================================== */
(function () {
  'use strict';

  var host = document.querySelector('[data-sphere]');
  if (!host) return;

  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            || /[?&]still/.test(location.search);

  var SRC = (host.getAttribute('data-sphere') || '').split(',')
              .map(function (s) { return s.trim(); })
              .filter(Boolean);
  if (!SRC.length) return;

  /* how many cards, and how big the sphere is, depends on the viewport */
  function plan() {
    var w = window.innerWidth;
    if (w < 560)  return { n: 13, r: 240, card: 68 };
    if (w < 900)  return { n: 18, r: 330, card: 88 };
    if (w < 1400) return { n: 24, r: 440, card: 106 };
    return { n: 28, r: 540, card: 124 };
  }

  var stage = document.createElement('div');
  stage.className = 'sphere__stage';
  var orb = document.createElement('div');
  orb.className = 'sphere__orb';
  stage.appendChild(orb);
  host.appendChild(stage);

  var cards = [];

  function build() {
    orb.innerHTML = '';
    cards.length = 0;
    var cfg = plan();
    var GOLDEN = Math.PI * (3 - Math.sqrt(5));   // ~2.39996 rad

    for (var i = 0; i < cfg.n; i++) {
      // Fibonacci lattice: even coverage of the sphere
      var y = 1 - (i / (cfg.n - 1)) * 2;          // 1 .. -1
      var radiusAt = Math.sqrt(Math.max(0, 1 - y * y));
      var theta = GOLDEN * i;

      var phiDeg   = Math.asin(y) * 180 / Math.PI;      // latitude
      var thetaDeg = theta * 180 / Math.PI;             // longitude

      var el = document.createElement('figure');
      el.className = 'sphere__card';
      // a little size variation stops it reading as a rigid grid
      var scale = 0.78 + radiusAt * 0.42;
      el.style.width  = Math.round(cfg.card * scale) + 'px';
      // the outer element only ever holds the 3D placement, never the
      // entrance — so the two can't fight each other
      el.style.transform =
        'rotateY(' + thetaDeg.toFixed(2) + 'deg) ' +
        'rotateX(' + phiDeg.toFixed(2) + 'deg) ' +
        'translateZ(' + cfg.r + 'px)';

      var inner = document.createElement('div');
      inner.className = 'sphere__in';

      var im = document.createElement('img');
      im.src = SRC[i % SRC.length];
      im.alt = '';
      im.setAttribute('aria-hidden', 'true');
      im.loading = i < 12 ? 'eager' : 'lazy';
      im.decoding = 'async';
      im.width = 400; im.height = 500;
      inner.appendChild(im);
      el.appendChild(inner);

      orb.appendChild(el);
      cards.push(inner);
    }
    stage.style.setProperty('--persp', (cfg.r * 3.4) + 'px');

    /* Entrance: driven by a class + CSS transition, staggered with timers.
       If the timers never fire the cards are already in their visible
       resting state, so nothing can get stranded half-faded. */
    if (!REDUCE) {
      cards.forEach(function (inner, n) {
        inner.classList.add('is-out');
        setTimeout(function () { inner.classList.remove('is-out'); }, 260 + n * 38);
      });
    }
  }

  /* ---- rotation --------------------------------------------------------- */
  var spin = 0;            // continuous Y rotation
  var tiltX = -8, tiltY = 0;
  var wantX = -8, wantY = 0;
  var raf = null, running = false;

  function frame() {
    spin += REDUCE ? 0 : 0.085;
    tiltX += (wantX - tiltX) * 0.055;
    tiltY += (wantY - tiltY) * 0.055;
    orb.style.transform =
      'rotateX(' + tiltX.toFixed(2) + 'deg) rotateY(' + (spin + tiltY).toFixed(2) + 'deg)';
    raf = requestAnimationFrame(frame);
  }

  function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
  function stop()  { if (running) { running = false; cancelAnimationFrame(raf); } }

  window.addEventListener('pointermove', function (ev) {
    var nx = (ev.clientX / window.innerWidth) * 2 - 1;      // -1 .. 1
    var ny = (ev.clientY / window.innerHeight) * 2 - 1;
    wantY = nx * 26;
    wantX = -8 + ny * -18;
  }, { passive: true });

  lastKeyInit();
  build();
  start();

  function lastKeyInit() {
    var cfg = plan();
    lastKey = cfg.n + ':' + cfg.r + ':' + cfg.card;
  }

  var rt, lastKey = '';
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var cfg = plan();
      var key = cfg.n + ':' + cfg.r + ':' + cfg.card;
      if (key === lastKey) return;      // same bucket — don't reload 26 images
      lastKey = key;
      build();
    }, 220);
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.isIntersecting ? start() : stop(); });
    }, { threshold: 0 }).observe(host);
  }
  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });
})();
