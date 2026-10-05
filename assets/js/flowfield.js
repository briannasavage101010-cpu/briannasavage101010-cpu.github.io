/* ==========================================================================
   flowfield.js — the hero background.

   What it is: a few hundred invisible particles are pushed through a slowly
   evolving "curl noise" field. Each one leaves a hairline stroke behind it.
   Because curl noise has no sources or sinks, the streamlines never collide
   or pile up — they braid. The accumulated result looks like marbled silk,
   or the engraved line-work on a banknote.

   No libraries. ~4KB. Degrades to a still frame if the visitor has
   "reduce motion" turned on, and skips itself entirely on tiny screens.
   ========================================================================== */
(function () {
  'use strict';

  var host = document.querySelector('[data-flowfield]');
  if (!host) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 2D gradient (Perlin-style) noise --------------------------------- */
  var PERM = new Uint8Array(512);
  (function seed() {
    var p = [], i;
    for (i = 0; i < 256; i++) p[i] = i;
    // deterministic shuffle so the artwork is the same on every visit
    var s = 1337;
    for (i = 255; i > 0; i--) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      var j = s % (i + 1), t = p[i]; p[i] = p[j]; p[j] = t;
    }
    for (i = 0; i < 512; i++) PERM[i] = p[i & 255];
  })();

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function grad(h, x, y) {
    switch (h & 7) {
      case 0: return  x + y;  case 1: return  x - y;
      case 2: return -x + y;  case 3: return -x - y;
      case 4: return  x;      case 5: return -x;
      case 6: return  y;      default: return -y;
    }
  }
  function noise2(x, y) {
    var X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    var u = fade(x), v = fade(y);
    var a = PERM[X] + Y, b = PERM[X + 1] + Y;
    var n00 = grad(PERM[a], x, y),       n10 = grad(PERM[b], x - 1, y);
    var n01 = grad(PERM[a + 1], x, y-1), n11 = grad(PERM[b + 1], x - 1, y - 1);
    var nx0 = n00 + u * (n10 - n00);
    var nx1 = n01 + u * (n11 - n01);
    return nx0 + v * (nx1 - nx0);           // roughly -1..1
  }
  /* two octaves is enough: the big one gives the sweep, the small one the
     hand-drawn wobble */
  function field(x, y, z) {
    return noise2(x + z, y - z * 0.6) + 0.45 * noise2(x * 2.3 - z * 0.4, y * 2.3);
  }

  /* ---- canvas ----------------------------------------------------------- */
  var cv  = document.createElement('canvas');
  var ctx = cv.getContext('2d', { alpha: true });
  // strokes are light on a dark page, so they add rather than cover
  host.appendChild(cv);

  var W = 0, H = 0, dpr = 1;
  var P = [];                      // particles
  var COUNT = 0;
  var z = 0;                       // field evolution
  var mx = -1, my = -1, mStrength = 0;
  var raf = null, frames = 0;

  // champagne -> rose, sampled per particle so the drawing has tonal variety
  var RAMP = [
    [ 77, 141, 255],   // blue
    [143, 186, 255],   // pale blue
    [227, 181, 103],   // gold
    [255,  95, 168]    // pink (rare, used sparingly)
  ];
  function pickColor() {
    var r = Math.random();
    var i = r < 0.42 ? 0 : r < 0.76 ? 1 : r < 0.96 ? 2 : 3;
    var c = RAMP[i];
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',';
  }

  function spawn(p) {
    p.x = Math.random() * W;
    p.y = Math.random() * H;
    p.life = 0;
    p.max = 180 + Math.random() * 520;
    p.w = 0.4 + Math.random() * 1.15;
    p.col = pickColor();
    p.a = 0.042 + Math.random() * 0.100;
    return p;
  }

  function resize() {
    var r = host.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    cv.width  = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width  = W + 'px';
    cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';

    // particle budget scales with area so phones don't cook
    COUNT = Math.round(Math.min(620, Math.max(140, (W * H) / 2100)));
    P.length = 0;
    for (var i = 0; i < COUNT; i++) P.push(spawn({}));
    frames = 0;
  }

  var SCALE = 0.0016;   // smaller = broader, calmer sweeps
  var SPEED = 1.15;

  function step() {
    // very slow wash so old strokes recede instead of turning to mud
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.0030)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

    for (var i = 0; i < P.length; i++) {
      var p = P[i];
      var e = 0.9;
      // curl of the scalar field => divergence-free velocity
      var n1 = field((p.x + e) * SCALE, p.y * SCALE, z);
      var n2 = field((p.x - e) * SCALE, p.y * SCALE, z);
      var n3 = field(p.x * SCALE, (p.y + e) * SCALE, z);
      var n4 = field(p.x * SCALE, (p.y - e) * SCALE, z);
      var vx =  (n3 - n4);
      var vy = -(n1 - n2);
      var m  = Math.sqrt(vx * vx + vy * vy) || 1;
      vx = vx / m * SPEED;
      vy = vy / m * SPEED;

      // pointer adds a soft swirl, never a hard shove
      if (mStrength > 0.001) {
        var dx = p.x - mx, dy = p.y - my;
        var d2 = dx * dx + dy * dy;
        if (d2 < 52900) {                       // 230px radius
          var f = (1 - Math.sqrt(d2) / 230) * mStrength * 1.6;
          vx += -dy / (Math.sqrt(d2) + 12) * f * 9;
          vy +=  dx / (Math.sqrt(d2) + 12) * f * 9;
        }
      }

      var nx = p.x + vx, ny = p.y + vy;

      // fade each stroke in and out over its lifetime -> no hard ends
      var t = p.life / p.max;
      var env = Math.sin(Math.PI * Math.min(1, t));
      ctx.strokeStyle = p.col + (p.a * env).toFixed(4) + ')';
      ctx.lineWidth = p.w;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      p.x = nx; p.y = ny; p.life++;
      if (p.life > p.max || nx < -40 || nx > W + 40 || ny < -40 || ny > H + 40) spawn(p);
    }

    z += 0.00055;
    mStrength *= 0.955;
    frames++;
  }

  function loop() { step(); raf = requestAnimationFrame(loop); }

  function start() {
    if (raf) return;
    if (reduce) { for (var i = 0; i < 260; i++) step(); return; }  // one still frame
    raf = requestAnimationFrame(loop);
  }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  /* ---- wiring ----------------------------------------------------------- */
  resize();
  // pre-roll so the art is already formed on first paint instead of empty
  for (var k = 0; k < (reduce ? 420 : 380); k++) step();
  if (!reduce) start();

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { stop(); resize(); for (var k = 0; k < 380; k++) step(); start(); }, 180);
  });

  window.addEventListener('pointermove', function (ev) {
    var r = host.getBoundingClientRect();
    mx = ev.clientX - r.left;
    my = ev.clientY - r.top;
    if (mx > -60 && my > -60 && mx < W + 60 && my < H + 60) mStrength = 1;
  }, { passive: true });

  // stop drawing when the hero is scrolled away or the tab is hidden
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.isIntersecting ? start() : stop(); });
    }, { threshold: 0 }).observe(host);
  }
  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });
})();
