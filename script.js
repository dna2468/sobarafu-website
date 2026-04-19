(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = () => window.innerWidth >= 960;
  const enableParallax = () => !prefersReducedMotion && isDesktop();
  const useGSAP = !!(window.gsap && window.ScrollTrigger) && !prefersReducedMotion;

  /* ---------------- Countdown to grand opening (2026-05-07 JST) ---------------- */
  (function initCountdown() {
    const targets = document.querySelectorAll('[data-countdown-days]');
    if (!targets.length) return;
    const OPEN_AT = new Date('2026-05-07T00:00:00+09:00').getTime();
    const update = () => {
      const now = Date.now();
      const diffMs = OPEN_AT - now;
      if (diffMs <= 0) {
        targets.forEach((el) => { el.textContent = '0'; });
        const cd = document.querySelector('.opening-countdown');
        if (cd) cd.classList.add('is-open');
        return false;
      }
      const days = Math.ceil(diffMs / 86400000);
      targets.forEach((el) => { el.textContent = days; });
      return true;
    };
    if (update()) setInterval(update, 60 * 60 * 1000); /* hourly refresh */
  })();

  const header = document.getElementById('siteHeader');
  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');
  const progressBar = document.getElementById('scrollProgress');
  const floatDisc = document.querySelector('.float-disc');
  const backToTop = document.querySelector('.back-to-top');
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  const magnetEls = document.querySelectorAll('[data-magnet]');

  /* ---------------- Scroll: header shadow, progress, float disc ---------------- */
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (y / max) * 100 : 0;

    header.classList.toggle('is-scrolled', y > 8);
    if (progressBar) progressBar.style.width = pct + '%';
    if (floatDisc) floatDisc.classList.toggle('is-visible', y > 400);
    if (backToTop) backToTop.classList.toggle('is-visible', y > 600);

    /* parallax hero photos (fallback when GSAP is absent) — desktop only */
    if (!useGSAP && enableParallax()) {
      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0;
        el.style.setProperty('--py', (y * speed).toFixed(2) + 'px');
        const base = el.classList.contains('hero-photo-main') ? -3 : 4;
        el.style.transform = `translateY(${(y * speed).toFixed(2)}px) rotate(${base}deg)`;
      });
    }
  };

  /* Reset parallax transforms when switching to mobile */
  const resetParallaxOnResize = () => {
    if (!enableParallax()) {
      parallaxEls.forEach((el) => {
        el.style.transform = '';
        el.style.removeProperty('--py');
      });
    }
  };
  window.addEventListener('resize', resetParallaxOnResize);

  let rafId = null;
  const requestScrollUpdate = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      onScroll();
      rafId = null;
    });
  };
  document.addEventListener('scroll', requestScrollUpdate, { passive: true });
  onScroll();

  /* ---------------- Mobile nav ---------------- */
  const setMobileNav = (open) => {
    navToggle.setAttribute('aria-expanded', String(open));
    mobileNav.hidden = !open;
    document.body.classList.toggle('no-scroll', open);
  };
  navToggle.addEventListener('click', () => {
    setMobileNav(navToggle.getAttribute('aria-expanded') !== 'true');
  });
  mobileNav.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') setMobileNav(false);
  });
  /* Close mobile nav when resizing to desktop width */
  window.addEventListener('resize', () => {
    if (window.innerWidth > 960 && navToggle.getAttribute('aria-expanded') === 'true') {
      setMobileNav(false);
    }
  });

  /* ---------------- Reveal on scroll (staggered) ---------------- */
  const revealTargets = document.querySelectorAll(
    '.section-head, .concept-card, .spotlight-feature, .spotlight-thumbs .thumb, .menu-side-block, .faq-item, .access-map, .access-info, .contact-card'
  );
  revealTargets.forEach((el) => {
    const isPop = el.classList.contains('concept-card') ||
                  el.classList.contains('thumb');
    el.classList.add(isPop ? 'reveal-pop' : 'reveal');
  });

  const heroRevealEls = document.querySelectorAll('[data-reveal-line], [data-reveal-pop]');

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const parent = entry.target.parentElement;
            const siblings = parent
              ? Array.from(parent.children).filter((c) =>
                  c.classList.contains('reveal') || c.classList.contains('reveal-pop')
                )
              : [];
            const idx = siblings.indexOf(entry.target);
            entry.target.style.transitionDelay = (idx >= 0 ? idx * 90 : 0) + 'ms';
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -40px 0px' }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------------- Hero entrance (fire ASAP, don't wait for images) ---------------- */
  const triggerHeroReveal = () => {
    heroRevealEls.forEach((el, i) => {
      el.style.setProperty('--d', 40 + i * 90 + 'ms');
      requestAnimationFrame(() => el.classList.add('is-in'));
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', triggerHeroReveal, { once: true });
  } else {
    triggerHeroReveal();
  }

  /* ---------------- Scrollspy: aria-current on nav ---------------- */
  const navLinks = document.querySelectorAll('.site-nav a[href^="#"], .mobile-nav a[href^="#"]');
  const sectionIds = ['concept', 'story', 'menu', 'access', 'faq', 'contact'];
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length && navLinks.length) {
    const setCurrent = (id) => {
      navLinks.forEach((a) => {
        const match = a.getAttribute('href') === '#' + id;
        if (match) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };

    const spyIO = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setCurrent(visible[0].target.id);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.1, 0.4] }
    );
    sections.forEach((s) => spyIO.observe(s));
  }

  /* ---------------- Magnetic buttons ---------------- */
  if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
    magnetEls.forEach((el) => {
      const strength = 18;
      const inner = el.querySelector('span') || el;

      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - r.left - r.width / 2;
        const my = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${(mx / r.width) * strength}px, ${(my / r.height) * strength}px)`;
        inner.style.transform = `translate(${(mx / r.width) * strength * 0.5}px, ${(my / r.height) * strength * 0.5}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        inner.style.transform = '';
      });
    });
  }

  /* ---------------- GSAP ScrollTrigger effects ---------------- */
  if (useGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('gsap-ready');

    /* Effect 1: Hero photos + bg text scrub */
    const heroSection = document.querySelector('.hero');
    const mainPhoto = document.querySelector('.hero-photo-main');
    const subPhoto = document.querySelector('.hero-photo-sub');
    const heroBgText = document.querySelector('.hero-bg-text');

    if (heroSection && enableParallax()) {
      gsap.set(mainPhoto, { rotate: -3, transformOrigin: '50% 50%' });
      gsap.set(subPhoto, { rotate: 4, transformOrigin: '50% 50%' });

      const heroTL = gsap.timeline({
        scrollTrigger: {
          trigger: heroSection,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });

      if (mainPhoto) heroTL.to(mainPhoto, { y: -140, rotate: -9, scale: 0.92, ease: 'none' }, 0);
      if (subPhoto)  heroTL.to(subPhoto,  { y:  110, rotate: 12, scale: 1.06, ease: 'none' }, 0);
      if (heroBgText) heroTL.to(heroBgText, { xPercent: -14, rotate: -8, ease: 'none' }, 0);
    }

  }

  /* ---------------- Dynamic copyright year ---------------- */
  const copy = document.querySelector('.copyright');
  if (copy) {
    copy.textContent = `© ${new Date().getFullYear()} Yakisoba Stand Rafu. All rights reserved.`;
  }

  /* ---------------- Menu spotlight (tab-swap) ---------------- */
  const spotlight = document.querySelector('.spotlight-feature');
  const thumbs = document.querySelectorAll('.spotlight-thumbs .thumb');
  if (spotlight && thumbs.length) {
    const featureImg = spotlight.querySelector('.feature-img');
    const featureSource = spotlight.querySelector('.feature-source');
    const featureName = spotlight.querySelector('.feature-name');
    const featureDesc = spotlight.querySelector('.feature-desc');
    const featurePriceMain = spotlight.querySelector('.feature-price-main');
    const featureBadge = spotlight.querySelector('.feature-badge');

    const priceTax = spotlight.querySelector('.feature-price small');

    const applyFeature = (d) => {
      if (featureSource && d.imgWebp) featureSource.srcset = d.imgWebp;
      featureImg.src = d.img;
      featureImg.alt = d.name;
      featureName.textContent = d.name;
      featureDesc.textContent = d.desc;
      featurePriceMain.textContent = d.price;
      const isPriced = /^¥/.test(d.price || '');
      spotlight.classList.toggle('is-soon', !isPriced);
      if (priceTax) priceTax.style.display = isPriced ? '' : 'none';
      if (d.badge) {
        featureBadge.textContent = d.badge;
        featureBadge.className = 'menu-badge feature-badge ' + (d.badgeClass || '');
      } else {
        featureBadge.textContent = '';
        featureBadge.className = 'menu-badge feature-badge';
      }
    };

    const narrowMQ = window.matchMedia('(max-width: 960px)');

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        if (thumb.classList.contains('is-active')) return;
        thumbs.forEach((t) => {
          const on = t === thumb;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        spotlight.classList.add('is-out');
        setTimeout(() => {
          applyFeature(thumb.dataset);
          spotlight.classList.remove('is-out');
        }, 260);

        /* On stacked (mobile) layout, bring the feature into view */
        if (narrowMQ.matches) {
          spotlight.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }
})();
