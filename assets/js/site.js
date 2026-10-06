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


  /* 5. Year in the footer ------------------------------------------------- */
  var years = document.querySelectorAll('[data-year]');
  for (var y = 0; y < years.length; y++) years[y].textContent = new Date().getFullYear();
})();
