// Preload hero background image before triggering animations
(function () {
  const heroMedia = document.querySelector('.hero-media');
  if (!heroMedia) return document.body.classList.add('ready');

  // Extract URL from computed style
  const style = getComputedStyle(heroMedia).backgroundImage;
  const match = /url\(["']?(.*?)["']?\)/.exec(style);
  const src = match ? match[1] : null;

  if (!src) {
    document.body.classList.add('ready');
    return;
  }

  const img = new Image();
  img.onload = () => requestAnimationFrame(() => document.body.classList.add('ready'));
  img.onerror = () => document.body.classList.add('ready');
  img.src = src;
})();

// Hero video: respect reduced motion and ensure playback starts when possible
(function () {
  const video = document.querySelector('.hero-video');
  if (!video) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    // Disable motion for users who prefer reduced motion
    video.removeAttribute('autoplay');
    video.removeAttribute('loop');
    try { video.pause(); } catch (_) {}
    return;
  }

  // Try to play when ready
  const tryPlay = () => {
    const p = video.play();
    if (p && typeof p.then === 'function') {
      p.catch(() => {
        // Autoplay might be blocked until user interaction; ignore
      });
    }
  };

  if (video.readyState >= 2) {
    tryPlay();
  } else {
    video.addEventListener('canplay', tryPlay, { once: true });
  }
})();

// Stacked slides scroll interaction using GSAP + ScrollTrigger
(function () {
  if (!(window.gsap && window.ScrollTrigger)) return;
  gsap.registerPlugin(ScrollTrigger);

  const section = document.querySelector('.stacked');
  const pin = section ? section.querySelector('.stacked__pin') : null;
  const slides = section ? gsap.utils.toArray('.stacked .slide') : [];
  if (!section || !pin || !slides.length) return;

  function setup() {
    const count = slides.length;
    // Make the section tall enough to create scroll distance for each transition
    section.style.minHeight = (window.innerHeight * count) + 'px';

    // Layering: upcoming slides should be above previous ones
    gsap.set(slides, { zIndex: (i) => i + 1 });
    // Start all but the first slide below the viewport
    slides.forEach((s, i) => { if (i) gsap.set(s, { yPercent: 100 }); });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=' + (window.innerHeight * (count - 1)),
        scrub: true,
        pin: pin,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        snap: count > 1 ? { snapTo: 1 / (count - 1), duration: { min: 0.2, max: 0.5 }, ease: 'power1.out' } : false,
      },
    });

    for (let i = 1; i < count; i++) {
      // Each step brings the next slide up to cover the previous
      tl.to(slides[i], { yPercent: 0, duration: 1 }, '>' );
    }
  }

  setup();
  // Keep things accurate on resize/rotate
  window.addEventListener('resize', () => ScrollTrigger.refresh());
})();

// Footer: auto year
(function () {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

// CTA cursor-follow glow for pharmacovigilance button(s)
(function () {
  const buttons = document.querySelectorAll('.cta-report');
  if (!buttons.length) return;

  function setPos(el, x, y) {
    el.style.setProperty('--mx', x + 'px');
    el.style.setProperty('--my', y + 'px');
  }

  buttons.forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      setPos(btn, x, y);
    });
    // Touch move support
    btn.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      if (!t) return;
      const r = btn.getBoundingClientRect();
      setPos(btn, t.clientX - r.left, t.clientY - r.top);
    }, { passive: true });
    btn.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      if (!t) return;
      const r = btn.getBoundingClientRect();
      setPos(btn, t.clientX - r.left, t.clientY - r.top);
    }, { passive: true });
  });
})();

// Foundation Intro: static positions handled by CSS only

// Careers cards modal (accessible)
(function () {
  const modal = document.getElementById('cc-modal');
  const cards = document.querySelectorAll('.cc-card');
  if (!modal || !cards.length) return;

  const dialog = modal.querySelector('.modal__dialog');
  const content = modal.querySelector('.modal__content');
  const closeBtn = modal.querySelector('.modal__close');
  let lastFocus = null;

  function openModal(fromCard) {
    lastFocus = document.activeElement;
    const titleEl = fromCard.querySelector('.cc-title');
    const subtitleEl = fromCard.querySelector('.cc-subtitle');
    const textEl = fromCard.querySelector('.cc-text');
    const title = titleEl ? titleEl.textContent.trim() : '';
    const subtitle = subtitleEl ? subtitleEl.textContent.trim() : '';
    const text = textEl ? textEl.textContent.trim() : '';

    content.innerHTML = `
      ${title ? '<h3>' + title + '</h3>' : ''}
      ${subtitle ? '<h4>' + subtitle + '</h4>' : ''}
      ${text ? '<p>' + text + '</p>' : ''}
    `;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => dialog.focus());
    document.addEventListener('keydown', onKeyDown);
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    document.removeEventListener('keydown', onKeyDown);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      return;
    }
    if (e.key === 'Tab') {
      const focusables = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const els = Array.prototype.slice.call(focusables);
      if (!els.length) { e.preventDefault(); dialog.focus(); return; }
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  // Wire up interactions
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  cards.forEach((card) => {
    const activate = () => openModal(card);
    card.addEventListener('click', activate);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });
  });
})();
