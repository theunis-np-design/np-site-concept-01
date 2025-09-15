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
